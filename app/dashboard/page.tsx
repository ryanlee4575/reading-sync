"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Membership = {
  group_id: string;
  groups: {
    id: string;
    name: string;
    invite_code: string;
  };
};

export default function DashboardPage() {
  const supabase = createClient();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("group_members")
        .select(`
          group_id,
          groups (
            id,
            name,
            invite_code
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
      } else {
        setMemberships((data as Membership[]) ?? []);
      }

      setLoading(false);
    }

    loadGroups();
  }, []);

  async function deleteGroup(groupId: string) {
    const confirmed = window.confirm("Delete this group?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setMemberships((prev) =>
      prev.filter((membership) => membership.groups.id !== groupId)
    );
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <section className="mb-6 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Your Groups</h2>

        <div className="mt-4 space-y-3">
          {loading ? (
            <p className="text-gray-600">Loading groups...</p>
          ) : memberships.length > 0 ? (
            memberships.map((membership) => (
              <div
                key={membership.group_id}
                className="rounded-lg border p-3"
              >
                <Link
                  href={`/group/${membership.groups.id}`}
                  className="block"
                >
                  <p className="font-semibold">
                    {membership.groups.name}
                  </p>

                  <p className="text-sm text-gray-600">
                    Invite Code: {membership.groups.invite_code}
                  </p>
                </Link>

                <button
                  onClick={() => deleteGroup(membership.groups.id)}
                  className="mt-3 rounded-lg border px-3 py-1 text-sm hover:bg-gray-100"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No groups yet.</p>
          )}
        </div>
      </section>

      <div className="flex gap-3">
        <Link
          href="/create-group"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Create Group
        </Link>

        <Link
          href="/join-group"
          className="rounded-lg border px-4 py-2"
        >
          Join Group
        </Link>
      </div>
    </main>
  );
}