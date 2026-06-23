"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

import type { Group } from "./types";
import GroupHeader from "./components/GroupHeader";
import CurrentBook from "./components/CurrentBook";
import ProgressList from "./components/ProgressList";
import ReadingGoal from "./components/ReadingGoal";

export default function GroupPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadGroup() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        invite_code,
        group_members (
          user_id,
          display_name
        ),
        reading_sessions (
          id,
          book_title,
          total_chapters,
          progress_type,
          created_at,
          is_active,
          cover_url,
          goal_type,
          goal_amount,
          goal_unit,
          progress (
            user_id,
            chapter_completed
          )
        )
      `)
      .eq("id", groupId)
      .single();

    if (error) {
      console.error(error);
      setGroup(null);
    } else {
      setGroup(data as Group);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadGroup();

    const progressChannel = supabase
      .channel(`progress-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "progress" },
        () => loadGroup()
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`session-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reading_sessions" },
        () => loadGroup()
      )
      .subscribe();

    const memberChannel = supabase
      .channel(`members-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        () => loadGroup()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(memberChannel);
    };
  }, [groupId, router]);

  const currentSession = group?.reading_sessions.find(
    (session) => session.is_active
  );

  function getMemberProgress(userId: string) {
    if (!currentSession) return 0;

    const row = currentSession.progress.find(
      (progress) => progress.user_id === userId
    );

    return row?.chapter_completed ?? 0;
  }

  async function setProgress(value: number) {
    if (!currentSession || !currentUserId) return;

    const currentProgress = getMemberProgress(currentUserId);
    const safeValue = Math.max(
      0,
      Math.min(value, currentSession.total_chapters)
    );

    const { error } = await supabase.from("progress").upsert(
      {
        reading_session_id: currentSession.id,
        user_id: currentUserId,
        chapter_completed: safeValue,
        last_completed_at: new Date().toISOString(),
      },
      {
        onConflict: "reading_session_id,user_id",
      }
    );

    if (error) {
      console.error(error);
      setMessage(error.message);
      return;
    }

    if (safeValue !== currentProgress) {
      const { error: eventError } = await supabase
        .from("progress_events")
        .insert({
          reading_session_id: currentSession.id,
          user_id: currentUserId,
          previous_progress: currentProgress,
          new_progress: safeValue,
          delta: safeValue - currentProgress,
        });

      if (eventError) {
        console.error(eventError);
        setMessage(eventError.message);
        return;
      }

      if (safeValue > currentProgress) {
        void fetch("/api/notifications/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readingSessionId: currentSession.id }),
        }).then((response) => {
          if (!response.ok) {
            console.error("Could not send push notifications.");
          }
        });
      }
    }

    setMessage("");
    await loadGroup();
  }

  async function updateGoal(
    goalType: string,
    goalAmount: number | null,
    goalUnit: string | null
  ) {
    if (!currentSession) return;

    const { error } = await supabase
      .from("reading_sessions")
      .update({
        goal_type: goalType,
        goal_amount: goalAmount,
        goal_unit: goalUnit,
      })
      .eq("id", currentSession.id);

    if (error) {
      console.error(error);
      setMessage(error.message);
      return;
    }

    setMessage("");
    await loadGroup();
  }

  async function completeNextChapter() {
    if (!currentSession || !currentUserId) return;

    const currentProgress = getMemberProgress(currentUserId);

    if (currentProgress >= currentSession.total_chapters) {
      setMessage("You already finished the book.");
      return;
    }

    await setProgress(currentProgress + 1);
  }

  async function undoLastChapter() {
    if (!currentSession || !currentUserId) return;

    const currentProgress = getMemberProgress(currentUserId);

    if (currentProgress <= 0) {
      setMessage("You are already at 0.");
      return;
    }

    await setProgress(currentProgress - 1);
  }

  async function deleteCurrentBook() {
    if (!currentSession) return;

    const confirmed = window.confirm(
      "Delete this book and all progress? This cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("reading_sessions")
      .delete()
      .eq("id", currentSession.id);

    if (error) {
      console.error(error);
      setMessage(error.message);
      return;
    }

    setMessage("");
    await loadGroup();
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-xl">Loading...</div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-xl">Group not found.</div>
      </main>
    );
  }

  const myProgress = currentUserId ? getMemberProgress(currentUserId) : 0;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex text-sm text-gray-500 hover:text-black"
          >
            ← All Groups
          </Link>

          <LogoutButton />
        </div>

        <GroupHeader
          name={group.name}
          inviteCode={group.invite_code}
          onCopyInvite={() => {
            navigator.clipboard.writeText(group.invite_code);
          }}
        />

        <CurrentBook
          groupId={group.id}
          members={group.group_members}
          currentSession={currentSession}
          myProgress={myProgress}
          message={message}
          getMemberProgress={getMemberProgress}
          onCompleteChapter={completeNextChapter}
          onUndoChapter={undoLastChapter}
          onSetProgress={setProgress}
          onDeleteBook={deleteCurrentBook}
        />

        <ReadingGoal
          currentSession={currentSession}
          myProgress={myProgress}
          onUpdateGoal={updateGoal}
        />

        <ProgressList
          members={group.group_members}
          currentSession={currentSession}
          getMemberProgress={getMemberProgress}
        />
      </div>
    </main>
  );
}
