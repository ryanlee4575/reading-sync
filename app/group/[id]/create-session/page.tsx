"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Member = {
  user_id: string;
};

export default function CreateSessionPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();

  const groupId = params.id as string;

  const [bookTitle, setBookTitle] = useState("");
  const [totalChapters, setTotalChapters] = useState("");
  const [message, setMessage] = useState("");

  async function createSession() {
    if (!bookTitle.trim() || !totalChapters) {
      setMessage("Please enter a book title and chapter count.");
      return;
    }

    const chapterCount = Number(totalChapters);

    if (!Number.isInteger(chapterCount) || chapterCount <= 0) {
      setMessage("Chapter count must be a positive whole number.");
      return;
    }

    setMessage("Creating reading session...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You must be logged in.");
      return;
    }

    const { data: session, error: sessionError } = await supabase
      .from("reading_sessions")
      .insert({
        group_id: groupId,
        book_title: bookTitle.trim(),
        total_chapters: chapterCount,
        created_by: user.id,
        is_active: true,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      console.error(sessionError);
      setMessage(sessionError?.message || "Could not create session.");
      return;
    }

    const { data: members, error: membersError } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", groupId);

    if (membersError || !members) {
      console.error(membersError);
      setMessage(membersError?.message || "Could not load group members.");
      return;
    }

    const progressRows = (members as Member[]).map((member) => ({
      reading_session_id: session.id,
      user_id: member.user_id,
      chapter_completed: 0,
    }));

    const { error: progressError } = await supabase
      .from("progress")
      .insert(progressRows);

    if (progressError) {
      console.error(progressError);
      setMessage(progressError.message);
      return;
    }

    router.push(`/group/${groupId}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link
          href={`/group/${groupId}`}
          className="mb-6 inline-flex text-sm text-gray-500 hover:text-black"
        >
          ← Back to Group
        </Link>

        <div className="rounded-xl border p-6">
          <h1 className="mb-6 text-3xl font-bold">Start Reading</h1>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Book title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <input
              type="number"
              placeholder="Number of chapters"
              value={totalChapters}
              onChange={(e) => setTotalChapters(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <button
              onClick={createSession}
              className="w-full rounded-lg bg-black p-3 text-white"
            >
              Create Reading Session
            </button>

            {message && (
              <p className="text-center text-sm text-red-600">{message}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}