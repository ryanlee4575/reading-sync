"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

type Member = {
  user_id: string;
  display_name: string;
};

type ProgressRow = {
  user_id: string;
  chapter_completed: number;
};

type ReadingSession = {
  id: string;
  book_title: string;
  total_chapters: number;
  created_at: string;
  is_active: boolean;
  progress: ProgressRow[];
};

type Group = {
  id: string;
  name: string;
  invite_code: string;
  group_members: Member[];
  reading_sessions: ReadingSession[];
};

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
      <h1 className="text-3xl font-bold">{group.name}</h1>

      <p className="mt-2 text-gray-600">
        Invite Code:{" "}
        <span className="font-mono font-bold">{group.invite_code}</span>
      </p>

      <section className="mt-8 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Current Book</h2>

        {currentSession ? (
          <div className="mt-2">
            <p className="font-semibold">{currentSession.book_title}</p>
            <p className="text-gray-600">
              {currentSession.total_chapters} chapters total
            </p>

            <button
              onClick={completeNextChapter}
              className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
            >
              Complete Next Chapter
            </button>

            <button
              onClick={deleteCurrentBook}
              className="mt-3 block rounded-lg border px-4 py-2 text-sm text-red-600"
            >
              Delete / Replace Book
            </button>

            <p className="mt-2 text-sm text-gray-600">
              Your progress: {myProgress} / {currentSession.total_chapters}
            </p>

            {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-gray-600">No reading session yet.</p>

            <Link
              href={`/group/${group.id}/create-session`}
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
            >
              Start Reading
            </Link>

            {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Progress</h2>

        <div className="mt-4 space-y-2">
          {group.group_members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span>{member.display_name}</span>

              {currentSession ? (
                <span className="text-gray-600">
                  {getMemberProgress(member.user_id)} /{" "}
                  {currentSession.total_chapters}
                </span>
              ) : (
                <span className="text-gray-600">No book</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}