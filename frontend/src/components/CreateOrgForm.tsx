import { useState } from "react";
import { orgsApi } from "../api";
import ModalForm from "./ModalForm";
import FormField from "./FormField";
import { Building2, Zap } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateOrgForm({ onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);

    try {
      await orgsApi.create(name.trim());
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalForm
      title="Create Organization"
      icon={<Building2 size={16} className="text-signal-orange" />}
      onClose={onClose}
      error={error || undefined}
      submitLabel="Create Organization"
      loadingLabel="Creating..."
      loading={loading}
      submitDisabled={!name.trim()}
      onSubmit={handleSubmit}
      submitIcon={<Zap size={14} />}
    >
      <FormField
        name="name"
        label="Organization name"
        type="text"
        required
        placeholder="e.g. Acme Corp"
        value={name}
        onChange={setName}
        autoFocus
      />
    </ModalForm>
  );
}
