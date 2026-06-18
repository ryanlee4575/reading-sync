type GroupPageProps = {
  params: {
    id: string;
  };
};

export default function GroupPage({ params }: GroupPageProps) {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-2">Group</h1>
      <p className="text-gray-600 mb-6">Group ID: {params.id}</p>

      <section className="rounded-xl border p-4 mb-4">
        <h2 className="text-xl font-semibold">Current Book</h2>
        <p className="text-gray-600 mt-2">No reading session yet.</p>
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