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
    <section className="py-8">
      <h2 className="text-xl font-semibold">Everyone</h2>

      <div className="mt-6 divide-y">
        {members.map((member) => {
          const progress = getMemberProgress(member.user_id);
          const total = currentSession?.total_chapters ?? 0;
          const percent = total > 0 ? (progress / total) * 100 : 0;

          return (
            <div key={member.user_id} className="py-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{member.display_name}</span>

                {currentSession ? (
                  <span className="text-gray-500">
                    {progress} / {total}
                  </span>
                ) : (
                  <span className="text-gray-500">No book</span>
                )}
              </div>

              {currentSession && (
                <div className="mt-3 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-black"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}