import { User } from "../../../types";
import Table from "../../../components/ui/Table";
import Pagination from "../../../components/ui/Pagination";
import { Users, Loader2, RefreshCw } from "lucide-react";

const USERS_PER_PAGE = 10;

interface Props {
  loading: boolean;
  error: string;
  users: User[];
  offset: number;
  onRetry: () => void;
  onPageChange: (offset: number) => void;
}

export default function UsersListContent({
  loading,
  error,
  users,
  offset,
  onRetry,
  onPageChange,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span>Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <Users size={24} className="text-signal-red mx-auto mb-2" />
        <p className="text-signal-red text-sm">{error}</p>
        <button className="btn-ghost mt-3 mx-auto" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Users size={24} className="text-ink-400 mx-auto mb-4" />
        <p className="text-ink-700 font-medium mb-1">No users found</p>
        <p className="text-ink-500 text-sm">
          Users are created during organization setup
        </p>
      </div>
    );
  }

  return (
    <>
      <Table<User>
        columns={[
          {
            key: "name",
            header: "Name",
            render: (u) => (
              <span className="font-medium text-ink-700">{u.name || "—"}</span>
            ),
          },
          {
            key: "email",
            header: "Email",
            render: (u) => <span className="text-ink-600">{u.email}</span>,
          },
          {
            key: "role",
            header: "Role",
            render: (u) => (
              <span className="text-ink-600 capitalize">{u.role ?? "—"}</span>
            ),
          },
          {
            key: "org",
            header: "Organization",
            render: (u) => (
              <span className="text-ink-600">
                {u.organization?.name ?? "—"}
              </span>
            ),
          },
        ]}
        data={users.slice(offset, offset + USERS_PER_PAGE)}
        keyExtractor={(u) => u.id}
      />
      <Pagination
        total={users.length}
        limit={USERS_PER_PAGE}
        offset={offset}
        onPageChange={onPageChange}
        itemLabel="user"
      />
    </>
  );
}
