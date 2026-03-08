import { Organization } from "../../../types";
import { formatDateTime } from "../../../utils/format";
import Table from "../../../components/ui/Table";
import Pagination from "../../../components/ui/Pagination";
import { Building2, Loader2, Plus, RefreshCw } from "lucide-react";

const ORGS_PER_PAGE = 10;

interface Props {
  loading: boolean;
  error: string;
  orgs: Organization[];
  offset: number;
  onRetry: () => void;
  onCreateOrganization: () => void;
  onPageChange: (offset: number) => void;
}

export default function OrganizationsListContent({
  loading,
  error,
  orgs,
  offset,
  onRetry,
  onCreateOrganization,
  onPageChange,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-ink-500">
        <Loader2 size={18} className="animate-spin" />
        <span>Loading organizations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center">
        <Building2 size={24} className="text-signal-red mx-auto mb-2" />
        <p className="text-signal-red text-sm">{error}</p>
        <button className="btn-ghost mt-3 mx-auto" onClick={onRetry}>
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    );
  }

  if (orgs.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Building2 size={24} className="text-ink-400 mx-auto mb-4" />
        <p className="text-ink-700 font-medium mb-1">No organizations found</p>
        <p className="text-ink-500 text-sm mb-4">
          Organizations are created during setup
        </p>
        <button
          className="btn-primary mx-auto"
          onClick={onCreateOrganization}
        >
          <Plus size={14} /> Create organization
        </button>
      </div>
    );
  }

  return (
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
        onPageChange={onPageChange}
        itemLabel="organization"
      />
    </>
  );
}
