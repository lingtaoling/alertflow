import { useEffect, useState } from "react";
import { usersApi } from "../../services/users.service";
import { User } from "../../types";
import CreateUserForm from "./components/CreateUserForm";
import UsersPageHeader from "./components/UsersPageHeader";
import UsersListContent from "./components/UsersListContent";

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
      <UsersPageHeader onCreateUser={() => setShowCreateForm(true)} />

      <UsersListContent
        loading={loading}
        error={error}
        users={users}
        offset={offset}
        onRetry={load}
        onPageChange={setOffset}
      />

      {showCreateForm && (
        <CreateUserForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
