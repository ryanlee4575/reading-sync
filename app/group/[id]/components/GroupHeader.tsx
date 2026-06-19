"use client";

import { useEffect, useState } from "react";

type GroupHeaderProps = {
  name: string;
  inviteCode: string;
  onCopyInvite: () => void;
};

export default function GroupHeader({
  name,
  inviteCode,
  onCopyInvite,
}: GroupHeaderProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [copied]);

  function handleCopy() {
    onCopyInvite();
    setCopied(true);
  }

  return (
    <section className="border-b pb-8">
      <h1 className="text-4xl font-bold">{name}</h1>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Invite Code
        </p>

        <div className="mt-2 flex items-center justify-between rounded-xl border p-4">
          <span className="font-mono text-3xl font-bold tracking-[0.25em]">
            {inviteCode}
          </span>

          <button
            onClick={handleCopy}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              copied ? "bg-green-600" : "bg-black hover:bg-gray-800"
            }`}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        <p className="mt-3 text-sm text-gray-500">
          Share this code with anyone you'd like to invite to this group.
        </p>
      </div>
    </section>
  );
}