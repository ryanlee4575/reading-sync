export default function LoginPage() {
  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Log in</h1>

      <input
        type="email"
        placeholder="Email"
        className="w-full max-w-sm rounded-lg border p-3"
      />

      <button className="w-full max-w-sm rounded-lg bg-black p-3 text-white">
        Continue
      </button>
    </main>
  );
}