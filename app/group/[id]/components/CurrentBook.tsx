import Link from "next/link";
import type { ReadingSession, Member } from "../types";

type CurrentBookProps = {
  groupId: string;
  members: Member[];
  currentSession: ReadingSession | undefined;
  myProgress: number;
  message: string;
  getMemberProgress: (userId: string) => number;
  onCompleteChapter: () => void;
  onUndoChapter: () => void;
  onDeleteBook: () => void;
};

export default function CurrentBook({
  groupId,
  members,
  currentSession,
  myProgress,
  message,
  getMemberProgress,
  onCompleteChapter,
  onUndoChapter,
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

  const isFinished = myProgress >= currentSession.total_chapters;
  const canUndo = myProgress > 0;

  const everyoneFinished = members.every(
    (member) =>
      getMemberProgress(member.user_id) >= currentSession.total_chapters
  );

  const percent = (myProgress / currentSession.total_chapters) * 100;

  const nextChapter = Math.min(
    myProgress + 1,
    currentSession.total_chapters
  );

  const readyMembers = members.filter(
    (member) => getMemberProgress(member.user_id) >= nextChapter
  );

  const waitingMembers = members.filter(
    (member) => getMemberProgress(member.user_id) < nextChapter
  );

  return (
    <section className="border-b py-8">
      <div className="flex gap-4">
        {currentSession.cover_url && (
          <img
            src={currentSession.cover_url}
            alt={currentSession.book_title}
            className="h-28 w-20 rounded object-cover"
          />
        )}

        <div>
          <p className="text-sm text-gray-500">Current Book</p>
          <h2 className="mt-1 text-2xl font-semibold">
            {currentSession.book_title}
          </h2>
        </div>
      </div>

      {everyoneFinished ? (
        <div className="mt-6">
          <p className="text-lg font-semibold">
            🎉 Everyone finished this book.
          </p>
          <p className="mt-2 text-gray-600">Ready to start the next one.</p>

          <button
            onClick={onDeleteBook}
            className="mt-5 w-full rounded-lg bg-black py-3 text-white"
          >
            Start New Book
          </button>
        </div>
      ) : (
        <>
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

          <div className="mt-4 rounded-xl border p-4">
            <p className="text-sm font-semibold">
              Ready for Chapter {nextChapter}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {readyMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="rounded-full bg-black px-3 py-1 text-sm text-white"
                >
                  ● {member.display_name}
                </div>
              ))}

              {waitingMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="rounded-full border px-3 py-1 text-sm text-gray-500"
                >
                  ○ {member.display_name}
                </div>
              ))}
            </div>

            {waitingMembers.length === 0 ? (
              <p className="mt-3 text-sm text-green-600">
                🎉 Everyone is ready!
              </p>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Waiting on {waitingMembers.length}{" "}
                {waitingMembers.length === 1 ? "reader" : "readers"}.
              </p>
            )}
          </div>

          <button
            onClick={onCompleteChapter}
            disabled={isFinished}
            className="mt-6 w-full rounded-lg bg-black py-3 text-white disabled:bg-gray-300"
          >
            {isFinished ? "Waiting for everyone else" : "Complete Next Chapter"}
          </button>

          <button
            onClick={onUndoChapter}
            disabled={!canUndo}
            className="mt-3 w-full rounded-lg border py-3 text-sm disabled:text-gray-300"
          >
            Undo Last Chapter
          </button>

          <button
            onClick={onDeleteBook}
            className="mt-3 text-sm text-gray-500 underline"
          >
            Delete / Replace Book
          </button>
        </>
      )}

      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
    </section>
  );
}