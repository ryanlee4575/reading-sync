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
  if (!currentSession) {
    return (
      <section className="border-b py-8">
        <p className="text-gray-600">No active book.</p>

        <Link
          href={`/group/${groupId}/create-session`}
          className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
        >
          Start Reading
        </Link>
      </section>
    );
  }

  const percent = (myProgress / currentSession.total_chapters) * 100;
  const isFinished = myProgress >= currentSession.total_chapters;

  return (
    <section className="border-b py-8">
      <p className="text-sm text-gray-500">Current Book</p>

      <h2 className="mt-1 text-2xl font-semibold">
        📖 {currentSession.book_title}
      </h2>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span>Your progress</span>
          <span>
            {myProgress} / {currentSession.total_chapters}
          </span>
        </div>

        <div className="h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-black"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <button
        onClick={onCompleteChapter}
        disabled={isFinished}
        className="mt-6 w-full rounded-lg bg-black py-3 text-white disabled:bg-gray-300"
      >
        {isFinished ? "Book Finished" : "Complete Next Chapter"}
      </button>

      <button
        onClick={onDeleteBook}
        className="mt-3 text-sm text-gray-500 underline"
      >
        Delete / Replace Book
      </button>

      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
    </section>
  );
}