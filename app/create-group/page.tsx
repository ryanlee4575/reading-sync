"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CreateGroupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");

  async function createGroup() {
    if (!groupName.trim() || !displayName.trim()) {
      setMessage("Enter a group name and your display name.");
      return;
    }

    setMessage("Creating group...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You need to be logged in first.");
      return;
    }

    const inviteCode = generateInviteCode();

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: groupName.trim(),
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError || !group) {
      setMessage(groupError?.message || "Could not create group.");
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        display_name: displayName.trim(),
      });

    if (memberError) {
      setMessage(memberError.message);
      return;
    }

    router.push(`/group/${group.id}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex text-sm text-gray-500 hover:text-black"
        >
          ← Dashboard
        </Link>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Create Group</h1>

          <input
            placeholder="Group name"
            className="w-full rounded-lg border p-3"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <input
            placeholder="Your display name"
            className="w-full rounded-lg border p-3"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <button
            onClick={createGroup}
            className="w-full rounded-lg bg-black p-3 text-white"
          >
            Create Group
          </button>

          {message && (
            <p className="text-center text-sm text-red-600">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}