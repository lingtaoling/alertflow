import { useEffect, useState } from "react";
import { orgsApi } from "../../services/organizations.service";
import { Organization } from "../../types";
import { formatDateTime } from "../../utils/format";
import CreateOrgForm from "./components/CreateOrgForm";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import { Building2, Loader2, Plus, RefreshCw } from "lucide-react";

const ORGS_PER_PAGE = 10;

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [offset, setOffset] = useState(0);

  function load() {
    setLoading(true);
    setError("");
    setOffset(0);
    orgsApi
      .list()
      .then(setOrgs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink-700">Organizations</h2>
        <div className="flex items-center gap-2">
          <button
            className="btn-signin btn-create"
            onClick={() => setShowCreateForm(true)}
            title="Create organization"
          >
            Create organization
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading organizations...</span>
        </div>
      ) : error ? (
        <div className="card p-6 text-center">
          <Building2 size={24} className="text-signal-red mx-auto mb-2" />
          <p className="text-signal-red text-sm">{error}</p>
          <button className="btn-ghost mt-3 mx-auto" onClick={load}>
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      ) : orgs.length === 0 ? (
        <div className="card p-12 text-center">
          <Building2 size={24} className="text-ink-400 mx-auto mb-4" />
          <p className="text-ink-700 font-medium mb-1">
            No organizations found
          </p>
          <p className="text-ink-500 text-sm mb-4">
            Organizations are created during setup
          </p>
          <button
            className="btn-primary mx-auto"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={14} /> Create organization
          </button>
        </div>
      ) : (
        <>
          <Table<Organization>
            columns={[
              {
                key: "name",
                header: "Organization name",
                render: (org) => (
                  <span className="font-medium text-ink-700">{org.name}</span>
                ),
              },
              {
                key: "createdAt",
                header: "Created at",
                render: (org) => (
                  <span className="text-ink-600">
                    {formatDateTime(org.createdAt)}
                  </span>
                ),
              },
            ]}
            data={orgs.slice(offset, offset + ORGS_PER_PAGE)}
            keyExtractor={(org) => org.id}
          />
          <Pagination
            total={orgs.length}
            limit={ORGS_PER_PAGE}
            offset={offset}
            onPageChange={setOffset}
            itemLabel="organization"
          />
        </>
      )}

      {showCreateForm && (
        <CreateOrgForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
