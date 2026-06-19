"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

import type { Group } from "./types";
import GroupHeader from "./components/GroupHeader";
import CurrentBook from "./components/CurrentBook";
import ProgressList from "./components/ProgressList";

export default function GroupPage() {
  const supabase = createClient();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadGroup() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id ?? null);

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
          created_at,
          is_active,
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
  }, [groupId]);

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

  async function completeNextChapter() {
    if (!currentSession || !currentUserId) return;

    const currentProgress = getMemberProgress(currentUserId);

    if (currentProgress >= currentSession.total_chapters) {
      setMessage("You already finished the book.");
      return;
    }

    const { data, error } = await supabase
      .from("progress")
      .upsert(
        {
          reading_session_id: currentSession.id,
          user_id: currentUserId,
          chapter_completed: currentProgress + 1,
          last_completed_at: new Date().toISOString(),
        },
        {
          onConflict: "reading_session_id,user_id",
        }
      )
      .select();

    if (error) {
      console.error(error);
      setMessage(error.message);
      return;
    }

    console.log("Progress updated:", data);
    setMessage("");
    await loadGroup();
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
        <Link
          href="/dashboard"
          className="inline-flex text-sm text-gray-500 hover:text-black"
        >
          ← All Groups
        </Link>

        <GroupHeader
          name={group.name}
          inviteCode={group.invite_code}
          onCopyInvite={() => {
            navigator.clipboard.writeText(group.invite_code);
            setMessage("Invite code copied.");
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
          onDeleteBook={deleteCurrentBook}
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