interface Props {
  onCreateUser: () => void;
}

export default function UsersPageHeader({ onCreateUser }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-ink-700">Users</h2>
      <div className="flex items-center gap-2">
        <button
          className="btn-signin btn-create"
          onClick={onCreateUser}
          title="Create user"
        >
          Create user
        </button>
      </div>
    </div>
  );
}
