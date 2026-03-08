interface Props {
  onCreateOrganization: () => void;
}

export default function OrganizationsPageHeader({
  onCreateOrganization,
}: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-ink-700">Organizations</h2>
      <div className="flex items-center gap-2">
        <button
          className="btn-signin btn-create"
          onClick={onCreateOrganization}
          title="Create organization"
        >
          Create organization
        </button>
      </div>
    </div>
  );
}
