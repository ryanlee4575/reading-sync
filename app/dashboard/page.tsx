import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <section className="rounded-xl border p-4 mb-4">
        <h2 className="text-xl font-semibold">Your Groups</h2>
        <p className="text-gray-600 mt-2">No groups yet.</p>
      </section>

      <div className="flex gap-3">
        <button className="rounded-lg bg-black px-4 py-2 text-white">
          Create Group
        </button>

        <Link href="/group/demo" className="rounded-lg border px-4 py-2">
          View Demo Group
        </Link>
      </div>
    </main>
  );
}