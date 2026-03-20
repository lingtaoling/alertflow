import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  createAlert,
  fetchAlerts,
  setFilterStatus,
  setOffset,
  setSearchQuery,
} from "../../../store/slices/alertsSlice";
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
      dispatch(setFilterStatus(""));
      dispatch(setSearchQuery(""));
      dispatch(setOffset(0));
      dispatch(fetchAlerts({ limit, offset: 0 }));
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
      <div>
        <div className="flex items-end justify-between gap-3 mb-1.5">
          <label className="label mb-0" htmlFor="title">
            Alert title *
          </label>
          <button
            type="button"
            className="group shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold normal-case tracking-normal
              transition-all duration-300 ease-out
              hover:scale-[1.04] hover:bg-gradient-to-r hover:from-violet-500/10 hover:via-fuchsia-500/10 hover:to-sky-500/10
              active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-1"
            onClick={() => {}}
          >
            <span
              className="inline-block bg-gradient-to-r from-violet-600 via-fuchsia-500 to-sky-500 bg-[length:220%_auto] bg-clip-text text-transparent animate-gradient-flow drop-shadow-[0_0_10px_rgba(192,132,252,0.45)]"
            >
              AI Assistant
            </span>
          </button>
        </div>
        <input
          className="input"
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="..."
          maxLength={200}
          autoFocus={!isAdmin}
        />
      </div>
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
