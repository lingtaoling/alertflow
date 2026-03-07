import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createAlert, fetchAlerts } from "../store/slices/alertsSlice";
import { X, Plus, AlertTriangle, Zap } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function CreateAlertForm({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const { createLoading, error, filterStatus, limit, offset } = useAppSelector(
    (s) => s.alerts,
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [localError, setLocalError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLocalError("");

    const result = await dispatch(
      createAlert({
        title: title.trim(),
        description: description.trim() || undefined,
      }),
    );
    if (createAlert.fulfilled.match(result)) {
      dispatch(
        fetchAlerts({ status: filterStatus || undefined, limit, offset }),
      );
      onClose();
    } else {
      setLocalError(result.payload as string);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-700/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-ink-200 bg-gradient-to-br from-[#edcba5] to-[#ebeae5] p-6 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-signal-orange/20 border border-signal-orange/40 flex items-center justify-center">
              <Plus size={16} className="text-signal-orange" />
            </div>
            <h2 className="text-lg font-semibold text-ink-700">New Alert</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="label">Alert title *</label>
            <input
              className="input"
              placeholder="e.g. Database CPU spike above threshold"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Description{" "}
              <span className="text-ink-500 normal-case font-normal">
                optional
              </span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Provide additional context about this alert..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
            />
          </div>

          {/* Error */}
          {(localError || error) && (
            <div className="flex items-center gap-2 text-signal-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={14} /> {localError || error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              className="btn-secondary flex-1 justify-center"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center"
              disabled={createLoading || !title.trim()}
            >
              <Zap size={14} />
              {createLoading ? "Creating..." : "Create Alert"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
