import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>

      <section className="mb-4 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Your Groups</h2>
        <p className="mt-2 text-gray-600">No groups yet.</p>
      </section>

      <div className="flex gap-3">
        <Link
          href="/create-group"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Create Group
        </Link>

        <Link href="/group/demo" className="rounded-lg border px-4 py-2">
          View Demo Group
        </Link>
      </div>
    </main>
  );
}