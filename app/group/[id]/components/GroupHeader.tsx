type GroupHeaderProps = {
  name: string;
  inviteCode: string;
};

export default function GroupHeader({ name, inviteCode }: GroupHeaderProps) {
  return (
    <>
      <h1 className="text-3xl font-bold">{name}</h1>

      <p className="mt-2 text-gray-600">
        Invite Code:{" "}
        <span className="font-mono font-bold">{inviteCode}</span>
      </p>
    </>
  );
}