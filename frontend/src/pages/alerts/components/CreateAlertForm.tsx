import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { createAlert, fetchAlerts } from "../../../store/slices/alertsSlice";
import { orgsApi } from "../../../services/organizations.service";
import ModalForm from "../../../components/ui/ModalForm";
import FormField from "../../../components/ui/FormField";
import { validateText, validateUuid } from "../../../utils/formValidation";
import { Plus, Zap } from "lucide-react";
import { Organization } from "../../../types";

interface Props {
  onClose: () => void;
}

export default function CreateAlertForm({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const { createLoading, error, filterStatus, limit, offset, searchQuery } =
    useAppSelector((s) => s.alerts);
  const { orgId } = useAppSelector((s) => s.auth);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [orgIdVal, setOrgIdVal] = useState(orgId ?? "");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [localError, setLocalError] = useState("");

  const isAdmin = !orgId;

  useEffect(() => {
    if (isAdmin) {
      orgsApi
        .list()
        .then(setOrgs)
        .catch(() => setOrgs([]));
    }
  }, [isAdmin]);

  useEffect(() => {
    if (orgs.length > 0 && !orgIdVal) setOrgIdVal(orgs[0].id);
  }, [orgs, orgIdVal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError("");

    const titleResult = validateText(title, {
      minLength: 3,
      maxLength: 200,
      fieldName: "Alert title",
      required: true,
    });
    if (!titleResult.valid) {
      setLocalError(titleResult.error ?? "Invalid input");
      return;
    }

    const descResult = validateText(description, {
      maxLength: 2000,
      fieldName: "Description",
      required: false,
      allowExtendedChars: true,
    });
    if (!descResult.valid) {
      setLocalError(descResult.error ?? "Invalid input");
      return;
    }

    if (isAdmin) {
      const orgResult = validateUuid(orgIdVal);
      if (!orgResult.valid) {
        setLocalError(orgResult.error ?? "Invalid organization");
        return;
      }
    }

    const payload = {
      title: titleResult.sanitized!,
      description: (descResult.sanitized ?? "").trim() || undefined,
      ...(isAdmin && orgIdVal ? { orgId: orgIdVal } : {}),
    };
    const result = await dispatch(createAlert(payload));
    if (createAlert.fulfilled.match(result)) {
      dispatch(
        fetchAlerts({
          status: filterStatus || undefined,
          search: (searchQuery ?? "").trim() || undefined,
          limit,
          offset,
        }),
      );
      onClose();
    } else {
      setLocalError(result.payload as string);
    }
  }

  return (
    <ModalForm
      title="New Alert"
      icon={<Plus size={16} className="text-signal-orange" />}
      onClose={onClose}
      error={localError || error || undefined}
      submitLabel="Create Alert"
      loadingLabel="Creating..."
      loading={createLoading}
      submitDisabled={!title.trim() || (isAdmin && !orgIdVal)}
      onSubmit={handleSubmit}
      submitIcon={<Zap size={14} />}
    >
      {isAdmin && (
        <FormField
          name="orgId"
          label="Organization"
          type="select"
          required
          value={orgIdVal}
          onChange={setOrgIdVal}
          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
          autoFocus
        />
      )}
      <FormField
        name="title"
        label="Alert title"
        type="text"
        required
        placeholder="..."
        value={title}
        onChange={setTitle}
        autoFocus={!isAdmin}
        maxLength={200}
      />
      <FormField
        name="description"
        label="Description"
        type="textarea"
        optional
        placeholder="..."
        value={description}
        onChange={setDescription}
        rows={3}
        maxLength={2000}
      />
    </ModalForm>
  );
}
