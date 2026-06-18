"use client";

import { useEffect, useState } from "react";
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

    const { error } = await supabase
      .from("progress")
      .update({
        chapter_completed: currentProgress + 1,
        last_completed_at: new Date().toISOString(),
      })
      .eq("reading_session_id", currentSession.id)
      .eq("user_id", currentUserId);

    if (error) {
      console.error(error);
      setMessage(error.message);
      return;
    }

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
    return <main className="min-h-screen p-6">Loading...</main>;
  }

  if (!group) {
    return <main className="min-h-screen p-6">Group not found.</main>;
  }

  const myProgress = currentUserId ? getMemberProgress(currentUserId) : 0;

  return (
    <main className="min-h-screen p-6">
      <GroupHeader name={group.name} inviteCode={group.invite_code} />

      <CurrentBook
        groupId={group.id}
        currentSession={currentSession}
        myProgress={myProgress}
        message={message}
        onCompleteChapter={completeNextChapter}
        onDeleteBook={deleteCurrentBook}
      />

      <ProgressList
        members={group.group_members}
        currentSession={currentSession}
        getMemberProgress={getMemberProgress}
      />
    </main>
  );
}