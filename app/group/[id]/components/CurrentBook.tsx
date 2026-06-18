import Link from "next/link";
import type { ReadingSession } from "../types";

type CurrentBookProps = {
  groupId: string;
  currentSession: ReadingSession | undefined;
  myProgress: number;
  message: string;
  onCompleteChapter: () => void;
  onDeleteBook: () => void;
};

export default function CurrentBook({
  groupId,
  currentSession,
  myProgress,
  message,
  onCompleteChapter,
  onDeleteBook,
}: CurrentBookProps) {
  return (
    <section className="mt-8 rounded-xl border p-4">
      <h2 className="text-xl font-semibold">Current Book</h2>

      {currentSession ? (
        <div className="mt-2">
          <p className="font-semibold">{currentSession.book_title}</p>

          <p className="text-gray-600">
            {currentSession.total_chapters} chapters total
          </p>

          <button
            onClick={onCompleteChapter}
            className="mt-4 rounded-lg bg-black px-4 py-2 text-white"
          >
            Complete Next Chapter
          </button>

          <button
            onClick={onDeleteBook}
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
            href={`/group/${groupId}/create-session`}
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
          >
            Start Reading
          </Link>

          {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
        </div>
      )}
    </section>
  );
}