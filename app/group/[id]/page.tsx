"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

type Member = {
  display_name: string;
};

type Group = {
  id: string;
  name: string;
  invite_code: string;
  group_members: Member[];
};

export default function GroupPage() {
  const supabase = createClient();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroup() {
      setLoading(true);

      const { data, error } = await supabase
        .from("groups")
        .select(`
          id,
          name,
          invite_code,
          group_members (
            display_name
          )
        `)
        .eq("id", groupId)
        .single();

      if (error) {
        console.error(error);
        setGroup(null);
      } else {
        setGroup(data as Group);
      }

      setLoading(false);
    }

    loadGroup();
  }, [groupId, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-3xl font-bold">Loading...</h1>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="min-h-screen p-6">
        <h1 className="text-3xl font-bold">Group not found</h1>
        <p className="mt-2 text-gray-600">
          You may not have access to this group.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">{group.name}</h1>

      <p className="mt-2 text-gray-600">
        Invite Code:{" "}
        <span className="font-mono font-bold">{group.invite_code}</span>
      </p>

      <section className="mt-8 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Members</h2>

        <div className="mt-4 space-y-2">
          {group.group_members.length > 0 ? (
            group.group_members.map((member) => (
              <p key={member.display_name}>{member.display_name}</p>
            ))
          ) : (
            <p className="text-gray-600">No members yet.</p>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Current Book</h2>
        <p className="mt-2 text-gray-600">No reading session yet.</p>
      </section>
    </main>
  );
}