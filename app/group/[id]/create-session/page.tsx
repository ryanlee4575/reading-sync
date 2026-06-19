"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";

type Member = {
  user_id: string;
};

type BookResult = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
};

export default function CreateSessionPage() {
  const supabase = createClient();
  const params = useParams();
  const router = useRouter();

  const groupId = params.id as string;

  const [bookTitle, setBookTitle] = useState("");
  const [totalChapters, setTotalChapters] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [results, setResults] = useState<BookResult[]>([]);
  const [message, setMessage] = useState("");

  async function searchBooks() {
    if (!bookTitle.trim()) {
      setMessage("Enter a book title first.");
      return;
    }

    setMessage("Searching books...");

    const response = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(
        bookTitle.trim()
      )}&limit=5`
    );

    const data = await response.json();
    setResults(data.docs ?? []);
    setMessage("");
  }

  function selectBook(book: BookResult) {
    setBookTitle(book.title);

    if (book.cover_i) {
      setCoverUrl(`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`);
    } else {
      setCoverUrl(null);
    }

    setResults([]);
  }

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
        cover_url: coverUrl,
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
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Book title"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full rounded-lg border p-3"
              />

              <button
                onClick={searchBooks}
                className="rounded-lg border px-3 text-sm"
              >
                Search
              </button>
            </div>

            {results.length > 0 && (
              <div className="space-y-2 rounded-lg border p-2">
                {results.map((book) => {
                  const bookCoverUrl = book.cover_i
                    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
                    : null;

                  return (
                    <button
                      key={book.key}
                      onClick={() => selectBook(book)}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-100"
                    >
                      {bookCoverUrl ? (
                        <img
                          src={bookCoverUrl}
                          alt={book.title}
                          className="h-14 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-10 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
                          No cover
                        </div>
                      )}

                      <div>
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-gray-500">
                          {book.author_name?.[0] ?? "Unknown author"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {coverUrl && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <img
                  src={coverUrl}
                  alt={bookTitle}
                  className="h-20 w-14 rounded object-cover"
                />
                <p className="text-sm text-gray-600">Cover selected</p>
              </div>
            )}

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