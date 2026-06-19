"use client";

import { useEffect, useState } from "react";
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
  onSetProgress: (value: number) => void;
  onDeleteBook: () => void;
};

function getProgressNoun(progressType: string | undefined) {
  if (progressType === "pages") return "page";
  if (progressType === "milestones") return "milestone";
  if (progressType === "sections") return "section";
  return "chapter";
}

function getProgressNounPlural(progressType: string | undefined) {
  if (progressType === "pages") return "pages";
  if (progressType === "milestones") return "milestones";
  if (progressType === "sections") return "sections";
  return "chapters";
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export default function CurrentBook({
  groupId,
  members,
  currentSession,
  myProgress,
  message,
  getMemberProgress,
  onCompleteChapter,
  onUndoChapter,
  onSetProgress,
  onDeleteBook,
}: CurrentBookProps) {
  const [sliderValue, setSliderValue] = useState(myProgress);

  useEffect(() => {
    setSliderValue(myProgress);
  }, [myProgress]);

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

  const noun = getProgressNoun(currentSession.progress_type);
  const pluralNoun = getProgressNounPlural(currentSession.progress_type);
  const isPageMode = currentSession.progress_type === "pages";

  const isFinished = myProgress >= currentSession.total_chapters;
  const canUndo = myProgress > 0;

  const everyoneFinished = members.every(
    (member) =>
      getMemberProgress(member.user_id) >= currentSession.total_chapters
  );

  const percent = (myProgress / currentSession.total_chapters) * 100;

  const lowestProgress =
    members.length > 0
      ? Math.min(...members.map((member) => getMemberProgress(member.user_id)))
      : 0;

  const groupNextProgress = Math.min(
    lowestProgress + 1,
    currentSession.total_chapters
  );

  const readyThreshold = groupNextProgress - 1;

  const readyMembers = members.filter(
    (member) => getMemberProgress(member.user_id) >= readyThreshold
  );

  const waitingMembers = members.filter(
    (member) => getMemberProgress(member.user_id) < readyThreshold
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
                {myProgress} / {currentSession.total_chapters} {pluralNoun}
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
              Ready for {capitalize(noun)} {groupNextProgress}
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

          {isPageMode ? (
            <div className="mt-6 rounded-xl border p-4">
              <p className="text-sm font-semibold">Update your page</p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setSliderValue(Math.max(0, sliderValue - 1))}
                  className="rounded-lg border px-4 py-3 text-lg"
                >
                  -
                </button>

                <input
                  type="number"
                  min="0"
                  max={currentSession.total_chapters}
                  value={sliderValue}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setSliderValue(value);
                  }}
                  className="w-full rounded-lg border p-3 text-center text-lg font-semibold"
                />

                <button
                  onClick={() =>
                    setSliderValue(
                      Math.min(currentSession.total_chapters, sliderValue + 1)
                    )
                  }
                  className="rounded-lg border px-4 py-3 text-lg"
                >
                  +
                </button>
              </div>

              <p className="mt-2 text-center text-sm text-gray-500">
                Page {sliderValue} / {currentSession.total_chapters}
              </p>

              <button
                onClick={() => onSetProgress(sliderValue)}
                className="mt-4 w-full rounded-lg bg-black py-3 text-white"
              >
                Save Progress
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onCompleteChapter}
                disabled={isFinished}
                className="mt-6 w-full rounded-lg bg-black py-3 text-white disabled:bg-gray-300"
              >
                {isFinished
                  ? "Waiting for everyone else"
                  : `Complete Next ${capitalize(noun)}`}
              </button>

              <button
                onClick={onUndoChapter}
                disabled={!canUndo}
                className="mt-3 w-full rounded-lg border py-3 text-sm disabled:text-gray-300"
              >
                Undo Last {capitalize(noun)}
              </button>
            </>
          )}

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
