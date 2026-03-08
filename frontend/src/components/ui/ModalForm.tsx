import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

export interface ModalFormProps {
  /** Modal title */
  title: string;
  /** Icon shown in header (Lucide icon component or element) */
  icon: React.ReactNode;
  /** Close handler (backdrop click, X button, Cancel) */
  onClose: () => void;
  /** Form content (fields) */
  children: React.ReactNode;
  /** Error message to display */
  error?: string;
  /** Submit button label */
  submitLabel: string;
  /** Label when loading */
  loadingLabel?: string;
  /** Whether submit is in progress */
  loading?: boolean;
  /** Disable submit button */
  submitDisabled?: boolean;
  /** Submit handler */
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  /** Icon for submit button */
  submitIcon?: React.ReactNode;
}

/**
 * Reusable modal form shell with consistent styling.
 * Use for Create Alert, Create User, Create Organization, etc.
 */
export default function ModalForm({
  title,
  icon,
  onClose,
  children,
  error,
  submitLabel,
  loadingLabel = "Saving...",
  loading = false,
  submitDisabled = false,
  onSubmit,
  submitIcon,
}: ModalFormProps) {
  const modal = (
    <div className="fixed inset-0 z-[50] flex items-center justify-center min-h-[100vh] p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-700/60 backdrop-blur-sm -z-10"
        onClick={onClose}
      />

      {/* Modal - top-aligned, scrollable when tall */}
      <div className="relative w-full max-w-lg rounded-2xl border border-ink-200 bg-gradient-to-br from-[#edcba5] to-[#ebeae5] p-6 max-h-[calc(100vh-2rem)] overflow-y-auto animate-slide-up shadow-[0_20px_20px_-8px_rgb(148_134_113_/_55%),0_24px_24px_-16px_rgba(0,0,0,0.4),0_0_0_1px_rgba(0,0,0,0.08)] shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-signal-orange/20 border border-signal-orange/40 flex items-center justify-center">
              {icon}
            </div>
            <h2 className="text-lg font-semibold text-ink-700">{title}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {children}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-signal-red text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={14} /> {error}
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
              disabled={loading || submitDisabled}
            >
              {submitIcon}
              {loading ? loadingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
