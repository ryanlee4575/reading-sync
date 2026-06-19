import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold">Reading Sync</h1>

      <p className="mt-4 max-w-sm text-gray-600">
        Stay on the same chapter as your friends.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-black px-4 py-3 text-white"
        >
          Log In
        </Link>

        <Link
          href="/create-account"
          className="rounded-lg border px-4 py-3"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}