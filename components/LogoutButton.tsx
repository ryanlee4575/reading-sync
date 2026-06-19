"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function logOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <button
      onClick={logOut}
      className="text-sm text-gray-500 hover:text-black"
    >
      Log Out
    </button>
  );
}