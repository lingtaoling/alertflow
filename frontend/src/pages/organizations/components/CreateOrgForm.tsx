import { useState } from "react";
import { orgsApi } from "../../../services/organizations.service";
import { validateText } from "../../../utils/formValidation";
import ModalForm from "../../../components/ui/ModalForm";
import FormField from "../../../components/ui/FormField";
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
    setError("");

    const nameResult = validateText(name, {
      minLength: 1,
      maxLength: 30,
      fieldName: "Organization name",
      required: true,
    });
    if (!nameResult.valid) {
      setError(nameResult.error ?? "Invalid input");
      return;
    }

    setLoading(true);
    try {
      await orgsApi.create(nameResult.sanitized!);
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
        placeholder="maximum 30 characters"
        value={name}
        onChange={setName}
        autoFocus
      />
    </ModalForm>
  );
}
