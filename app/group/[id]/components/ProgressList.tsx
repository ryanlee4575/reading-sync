import type { Member, ReadingSession } from "../types";

type ProgressListProps = {
  members: Member[];
  currentSession: ReadingSession | undefined;
  getMemberProgress: (userId: string) => number;
};

export default function ProgressList({
  members,
  currentSession,
  getMemberProgress,
}: ProgressListProps) {
  return (
    <section className="mt-8 rounded-xl border p-4">
      <h2 className="text-xl font-semibold">Progress</h2>

      <div className="mt-4 space-y-2">
        {members.map((member) => (
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
  );
}