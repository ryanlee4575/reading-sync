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
  return (
    <header className="border-b pb-6">
      <p className="text-sm text-gray-500">Book Club</p>

      <h1 className="mt-1 text-3xl font-semibold">{name}</h1>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="font-mono">{inviteCode}</span>

        <button onClick={onCopyInvite} className="underline">
          Copy
        </button>
      </div>
    </header>
  );
}