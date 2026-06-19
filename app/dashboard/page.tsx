"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";

type ProgressRow = {
  user_id: string;
  chapter_completed: number;
};

type ReadingSession = {
  id: string;
  book_title: string;
  total_chapters: number;
  is_active: boolean;
  progress: ProgressRow[];
};

type Membership = {
  group_id: string;
  groups: {
    id: string;
    name: string;
    invite_code: string;
    created_by: string;
    reading_sessions: ReadingSession[];
  };
};

export default function DashboardPage() {
  const supabase = createClient();
  const router = useRouter();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data, error } = await supabase
        .from("group_members")
        .select(`
          group_id,
          groups (
            id,
            name,
            invite_code,
            created_by,
            reading_sessions (
              id,
              book_title,
              total_chapters,
              is_active,
              progress (
                user_id,
                chapter_completed
              )
            )
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
      } else {
        setMemberships((data as unknown as Membership[]) ?? []);
      }

      setLoading(false);
    }

    loadGroups();
  }, [router, supabase]);

  async function deleteGroup(groupId: string) {
    const confirmed = window.confirm(
      "Delete this group permanently? This will remove the book, all members, and everyone's progress. This cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase.from("groups").delete().eq("id", groupId);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMemberships((prev) =>
      prev.filter((membership) => membership.groups.id !== groupId)
    );
  }

  async function leaveGroup(groupId: string) {
    if (!currentUserId) return;

    const confirmed = window.confirm("Leave this group?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", currentUserId);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMemberships((prev) =>
      prev.filter((membership) => membership.group_id !== groupId)
    );
  }

  function getActiveSession(membership: Membership) {
    return membership.groups.reading_sessions.find(
      (session) => session.is_active
    );
  }

  function getMyProgress(session: ReadingSession | undefined) {
    if (!session || !currentUserId) return 0;

    return (
      session.progress.find((row) => row.user_id === currentUserId)
        ?.chapter_completed ?? 0
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">All Groups</h1>
          <LogoutButton />
        </div>

        <div className="mb-6 flex gap-3">
          <Link
            href="/create-group"
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Create Group
          </Link>

          <Link href="/join-group" className="rounded-lg border px-4 py-2">
            Join Group
          </Link>
        </div>

        <section>
          {loading ? (
            <p className="text-gray-600">Loading groups...</p>
          ) : memberships.length > 0 ? (
            <div className="divide-y">
              {memberships.map((membership) => {
                const session = getActiveSession(membership);
                const myProgress = getMyProgress(session);
                const percent = session
                  ? (myProgress / session.total_chapters) * 100
                  : 0;

                const isOwner =
                  membership.groups.created_by === currentUserId;

                return (
                  <div key={membership.group_id} className="py-5">
                    <Link
                      href={`/group/${membership.groups.id}`}
                      className="block"
                    >
                      <h2 className="text-xl font-semibold">
                        {membership.groups.name}
                      </h2>

                      {session ? (
                        <div className="mt-3">
                          <p className="font-medium">📖 {session.book_title}</p>

                          <div className="mt-3 h-2 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-black"
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <p className="mt-2 text-sm text-gray-600">
                            Your progress: {myProgress} /{" "}
                            {session.total_chapters}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-gray-600">
                          No active book
                        </p>
                      )}
                    </Link>

                    {isOwner ? (
                      <button
                        onClick={() => deleteGroup(membership.groups.id)}
                        className="mt-3 text-sm text-red-600 underline"
                      >
                        Delete Group
                      </button>
                    ) : (
                      <button
                        onClick={() => leaveGroup(membership.groups.id)}
                        className="mt-3 text-sm text-gray-500 underline"
                      >
                        Leave Group
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">No groups yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}