import { useEffect, useState } from "react";
import { usersApi } from "../../services/users.service";
import { User } from "../../types";
import CreateUserForm from "./components/CreateUserForm";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import { Users, Loader2, RefreshCw, UserPlus } from "lucide-react";

const USERS_PER_PAGE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [offset, setOffset] = useState(0);

  function load() {
    setLoading(true);
    setError("");
    setOffset(0);
    usersApi
      .listByOrg()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink-700">Users</h2>
        <div className="flex items-center gap-2">
          <button
            className="btn-primary"
            onClick={() => setShowCreateForm(true)}
            title="Create user"
          >
            <UserPlus size={14} />
            Create user
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading users...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <Users size={24} className="text-signal-red mx-auto mb-2" />
          <p className="text-signal-red text-sm">{error}</p>
          <button className="btn-ghost mt-3 mx-auto" onClick={load}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={24} className="text-ink-400 mx-auto mb-4" />
          <p className="text-ink-700 font-medium mb-1">No users found</p>
          <p className="text-ink-500 text-sm">
            Users are created during organization setup
          </p>
        </div>
      ) : (
        <>
          <Table<User>
            columns={[
              {
                key: "name",
                header: "Name",
                render: (u) => (
                  <span className="font-medium text-ink-700">
                    {u.name || "—"}
                  </span>
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
            onPageChange={setOffset}
            itemLabel="user"
          />
        </>
      )}

      {showCreateForm && (
        <CreateUserForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
