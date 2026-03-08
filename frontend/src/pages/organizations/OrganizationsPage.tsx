import { useEffect, useState } from "react";
import { orgsApi } from "../../services/organizations.service";
import { Organization } from "../../types";
import CreateOrgForm from "./components/CreateOrgForm";
import OrganizationsPageHeader from "./components/OrganizationsPageHeader";
import OrganizationsListContent from "./components/OrganizationsListContent";

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
      <OrganizationsPageHeader
        onCreateOrganization={() => setShowCreateForm(true)}
      />

      <OrganizationsListContent
        loading={loading}
        error={error}
        orgs={orgs}
        offset={offset}
        onRetry={load}
        onCreateOrganization={() => setShowCreateForm(true)}
        onPageChange={setOffset}
      />

      {showCreateForm && (
        <CreateOrgForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
