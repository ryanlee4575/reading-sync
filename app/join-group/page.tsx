"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type ActiveSession = {
  id: string;
};

export default function JoinGroupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState("");

  async function joinGroup() {
    if (!inviteCode.trim() || !displayName.trim()) {
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
      .eq("invite_code", inviteCode.trim().toUpperCase())
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
        display_name: displayName.trim(),
      });

    if (memberError) {
      setMessage(memberError.message);
      return;
    }

    const { data: activeSession, error: sessionError } = await supabase
      .from("reading_sessions")
      .select("id")
      .eq("group_id", group.id)
      .eq("is_active", true)
      .maybeSingle();

    if (sessionError) {
      setMessage(sessionError.message);
      return;
    }

    if (activeSession) {
      const { error: progressError } = await supabase
        .from("progress")
        .insert({
          reading_session_id: (activeSession as ActiveSession).id,
          user_id: user.id,
          chapter_completed: 0,
        });

      if (progressError) {
        setMessage(progressError.message);
        return;
      }
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
          <h1 className="text-3xl font-bold">Join Group</h1>

          <input
            placeholder="Invite code"
            className="w-full rounded-lg border p-3 uppercase"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />

          <input
            placeholder="Your display name"
            className="w-full rounded-lg border p-3"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <button
            onClick={joinGroup}
            className="w-full rounded-lg bg-black p-3 text-white"
          >
            Join Group
          </button>

          {message && (
            <p className="text-center text-sm text-red-600">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}