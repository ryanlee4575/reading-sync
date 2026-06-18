"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";

type Member = {
  display_name: string;
};

type ReadingSession = {
  id: string;
  book_title: string;
  total_chapters: number;
  created_at: string;
};

type Group = {
  id: string;
  name: string;
  invite_code: string;
  group_members: Member[];
  reading_sessions: ReadingSession[];
};

export default function GroupPage() {
  const supabase = createClient();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroup() {
      const { data, error } = await supabase
        .from("groups")
        .select(`
          id,
          name,
          invite_code,
          group_members (
            display_name
          ),
          reading_sessions (
            id,
            book_title,
            total_chapters,
            created_at
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
  }, [groupId]);

  if (loading) {
    return <main className="min-h-screen p-6">Loading...</main>;
  }

  if (!group) {
    return <main className="min-h-screen p-6">Group not found.</main>;
  }

  const currentSession = group.reading_sessions[0];

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold">{group.name}</h1>

      <p className="mt-2 text-gray-600">
        Invite Code: <span className="font-mono font-bold">{group.invite_code}</span>
      </p>

      <section className="mt-8 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Current Book</h2>

        {currentSession ? (
          <div className="mt-2">
            <p className="font-semibold">{currentSession.book_title}</p>
            <p className="text-gray-600">
              0 / {currentSession.total_chapters} chapters
            </p>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-gray-600">No reading session yet.</p>

            <Link
              href={`/group/${group.id}/create-session`}
              className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white"
            >
              Start Reading
            </Link>
          </div>
        )}
      </section>

      <section className="mt-8 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Members</h2>

        <div className="mt-4 space-y-2">
          {group.group_members.map((member) => (
            <p key={member.display_name}>{member.display_name}</p>
          ))}
        </div>
      </section>
    </main>
  );
}