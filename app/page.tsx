import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Reading Sync</h1>
      <p className="text-center text-gray-600 max-w-sm">
        Stay on the same chapter as your friends.
      </p>

      <div className="flex gap-3">
        <Link href="/login" className="rounded-lg bg-black px-4 py-2 text-white">
          Log in
        </Link>
        <Link href="/dashboard" className="rounded-lg border px-4 py-2">
          Dashboard
        </Link>
      </div>
    </main>
  );
}