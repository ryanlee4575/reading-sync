import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type AdminClient = SupabaseClient;

type ProgressRow = {
  user_id: string;
  chapter_completed: number;
};

type ProgressEvent = {
  previous_progress: number;
  new_progress: number;
};

function getProgressNoun(progressType: string) {
  if (progressType === "pages") return "page";
  if (progressType === "milestones") return "milestone";
  if (progressType === "sections") return "section";
  return "chapter";
}

function getGoalLabel(
  progressType: string,
  amount: number,
  readingUnits: { label: string; order_index: number }[] | undefined
) {
  if (progressType === "pages") return `Page ${amount}`;

  if (progressType === "milestones" || progressType === "sections") {
    const unit = readingUnits?.find(
      (readingUnit) => readingUnit.order_index === amount
    );

    if (unit) return unit.label;

    const fallback = progressType === "sections" ? "Section" : "Milestone";
    return `${fallback} ${amount}`;
  }

  return `Chapter ${amount}`;
}

async function sendPush(
  userIds: string[],
  contents: string,
  groupId: string
) {
  if (userIds.length === 0) return;

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      target_channel: "push",
      include_aliases: { external_id: userIds },
      headings: { en: "Reading Sync" },
      contents: { en: contents },
      url: `/group/${groupId}`,
    }),
  });

  if (!response.ok) {
    throw new Error(`OneSignal notification failed: ${await response.text()}`);
  }

  const result = (await response.json()) as {
    id?: string;
    recipients?: number;
    errors?: unknown;
  };

  if (result.errors) {
    throw new Error(`OneSignal notification failed: ${JSON.stringify(result.errors)}`);
  }

  console.info("OneSignal notification queued:", result);
}

async function claimNotification(
  supabase: AdminClient,
  readingSessionId: string,
  eventType: "weekly_goal" | "group_ready",
  eventKey: string
) {
  const { error } = await supabase.from("notification_events").insert({
    reading_session_id: readingSessionId,
    event_type: eventType,
    event_key: eventKey,
  });

  if (!error) return true;
  if (error.code === "23505") return false;

  throw error;
}

async function getNotificationUserIds(
  supabase: AdminClient,
  userIds: string[]
) {
  if (userIds.length === 0) return [];

  const { data, error } = await supabase
    .from("notification_subscriptions")
    .select("user_id")
    .in("user_id", userIds);

  if (error) throw error;

  return [...new Set((data ?? []).map((row) => row.user_id as string))];
}

async function sendClaimedPush(
  supabase: AdminClient,
  readingSessionId: string,
  eventType: "weekly_goal" | "group_ready",
  eventKey: string,
  userIds: string[],
  contents: string,
  groupId: string
) {
  try {
    await sendPush(userIds, contents, groupId);
  } catch (error) {
    const { error: releaseError } = await supabase
      .from("notification_events")
      .delete()
      .eq("reading_session_id", readingSessionId)
      .eq("event_type", eventType)
      .eq("event_key", eventKey);

    if (releaseError) {
      console.error("Could not release failed notification event:", releaseError);
    }

    throw error;
  }
}

export async function POST(request: Request) {
  if (
    !process.env.SUPABASE_SECRET_KEY ||
    !process.env.ONESIGNAL_REST_API_KEY
  ) {
    return NextResponse.json(
      { error: "Push notifications are not configured." },
      { status: 503 }
    );
  }

  const { readingSessionId } = (await request.json()) as {
    readingSessionId?: string;
  };

  if (!readingSessionId) {
    return NextResponse.json({ error: "Missing reading session." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const userClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { data: session, error: sessionError } = await supabase
      .from("reading_sessions")
      .select(`
        id,
        group_id,
        book_title,
        progress_type,
        goal_type,
        goal_amount,
        goal_unit,
        reading_units (
          label,
          order_index
        )
      `)
      .eq("id", readingSessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Reading session not found." }, { status: 404 });
    }

    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("user_id, display_name")
      .eq("group_id", session.group_id);

    if (membersError || !members) throw membersError;

    const actor = members.find((member) => member.user_id === user.id);
    if (!actor) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: latestEvents, error: latestEventError } = await supabase
      .from("progress_events")
      .select("previous_progress, new_progress")
      .eq("reading_session_id", readingSessionId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestEventError) throw latestEventError;

    const latestEvent = latestEvents?.[0] as ProgressEvent | undefined;
    if (!latestEvent || latestEvent.new_progress <= latestEvent.previous_progress) {
      return NextResponse.json({ sent: [] });
    }

    const { data: progress, error: progressError } = await supabase
      .from("progress")
      .select("user_id, chapter_completed")
      .eq("reading_session_id", readingSessionId);

    if (progressError) throw progressError;

    const memberIds = [...new Set(members.map((member) => member.user_id))];
    const notificationUserIds = await getNotificationUserIds(
      supabase,
      memberIds
    );
    const noun = getProgressNoun(session.progress_type);
    const sent: string[] = [];

    if (session.goal_type === "target" && session.goal_amount) {
      if (
        latestEvent.previous_progress < session.goal_amount &&
        latestEvent.new_progress >= session.goal_amount
      ) {
        const eventKey = `${session.goal_amount}:${user.id}`;
        const claimed = await claimNotification(
          supabase,
          readingSessionId,
          "weekly_goal",
          eventKey
        );

        if (claimed) {
          const goalLabel = getGoalLabel(
            session.progress_type,
            session.goal_amount,
            session.reading_units
          );

          await sendClaimedPush(
            supabase,
            readingSessionId,
            "weekly_goal",
            eventKey,
            notificationUserIds,
            `${actor.display_name} reached the goal: ${goalLabel}.`,
            session.group_id
          );
          sent.push("weekly_goal");
        }
      }
    }

    const progressByUser = new Map(
      ((progress ?? []) as ProgressRow[]).map((row) => [
        row.user_id,
        row.chapter_completed,
      ])
    );
    const otherProgress = memberIds
      .filter((memberId) => memberId !== user.id)
      .map((memberId) => progressByUser.get(memberId) ?? 0);
    const previousGroupProgress = Math.min(
      latestEvent.previous_progress,
      ...otherProgress
    );
    const currentGroupProgress = Math.min(
      latestEvent.new_progress,
      ...otherProgress
    );

    if (currentGroupProgress > previousGroupProgress) {
      const nextGoal = currentGroupProgress + 1;
      const eventKey = String(nextGoal);
      const claimed = await claimNotification(
        supabase,
        readingSessionId,
        "group_ready",
        eventKey
      );

      if (claimed) {
        await sendClaimedPush(
          supabase,
          readingSessionId,
          "group_ready",
          eventKey,
          notificationUserIds,
          `Everyone is ready for ${noun} ${nextGoal} in ${session.book_title}.`,
          session.group_id
        );
        sent.push("group_ready");
      }
    }

    return NextResponse.json({ sent });
  } catch (error) {
    console.error("Push notification failed:", error);
    return NextResponse.json(
      { error: "Could not send push notification." },
      { status: 500 }
    );
  }
}
