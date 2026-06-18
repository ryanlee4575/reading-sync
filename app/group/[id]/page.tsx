type GroupPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-6">
      <h1 className="mb-2 text-3xl font-bold">Group</h1>
      <p className="mb-6 text-gray-600">Group ID: {id}</p>

      <section className="mb-4 rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Current Book</h2>
        <p className="mt-2 text-gray-600">No reading session yet.</p>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="text-xl font-semibold">Progress</h2>

        <div className="mt-4 space-y-2">
          <p>Ryan — Chapter 0</p>
          <p>Jeremy — Chapter 0</p>
          <p>Kai — Chapter 0</p>
        </div>
      </section>
    </main>
  );
}