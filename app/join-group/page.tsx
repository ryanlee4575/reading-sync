"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function JoinGroupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");

  async function joinGroup() {
    if (!inviteCode || !displayName) {
      setMessage("Enter an invite code and display name.");
      return;
    }

    setMessage("Joining group...");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("You need to be logged in first.");
      return;
    }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (groupError || !group) {
      setMessage("No group found with that invite code.");
      return;
    }

    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        display_name: displayName,
      });

    if (memberError) {
      setMessage(memberError.message);
      return;
    }

    router.push(`/group/${group.id}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">Join Group</h1>

      <input
        placeholder="Invite code"
        className="w-full max-w-sm rounded-lg border p-3 uppercase"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
      />

      <input
        placeholder="Your display name"
        className="w-full max-w-sm rounded-lg border p-3"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <button
        onClick={joinGroup}
        className="w-full max-w-sm rounded-lg bg-black p-3 text-white"
      >
        Join Group
      </button>

      {message && <p className="max-w-sm text-center text-sm">{message}</p>}
    </main>
  );
}