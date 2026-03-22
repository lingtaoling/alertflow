import aiLoadingSvg from "../../assets/images/aI-loading.svg";

export type FormFieldType =
  | "text"
  | "textarea"
  | "password"
  | "email"
  | "select";

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  maxLength?: number;
  rows?: number;
  minLength?: number;
  options?: { value: string; label: string }[];
  /** Disables the control (e.g. while a dependent action is in progress). */
  disabled?: boolean;
  /** Shows a loading overlay on the field (implies disabled while true). */
  loading?: boolean;
}

export interface FormFieldProps extends FormFieldConfig {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

/**
 * Reusable form field with consistent styling.
 * Renders label + input/textarea/select based on type.
 */
export default function FormField({
  name,
  label,
  type,
  placeholder,
  required,
  optional,
  maxLength,
  rows = 3,
  minLength,
  options = [],
  value,
  onChange,
  autoFocus,
  disabled = false,
  loading = false,
}: FormFieldProps) {
  const labelContent = (
    <>
      {label}
      {required && " *"}
      {optional && (
        <span className="text-ink-500 normal-case font-normal"> optional</span>
      )}
    </>
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => onChange(e.target.value);

  if (type === "textarea") {
    const fieldBusy = loading;
    return (
      <div>
        <label className="label" htmlFor={name}>
          {labelContent}
        </label>
        <div className="relative">
          <textarea
            className="input resize-none"
            id={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            autoFocus={autoFocus}
            disabled={disabled || loading}
            aria-busy={fieldBusy}
          />
          {loading && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/75 backdrop-blur-[1px] pointer-events-none"
              aria-hidden
            >
              <img
                src={aiLoadingSvg}
                alt=""
                className="h-16 w-auto max-w-[min(100%,18rem)] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === "select") {
    return (
      <div>
        <label className="label" htmlFor={name}>
          {labelContent}
        </label>
        <select
          className="input"
          id={name}
          value={value}
          onChange={handleChange}
          autoFocus={autoFocus}
        >
          <option value="">Select...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="label" htmlFor={name}>
        {labelContent}
      </label>
      <input
        className="input"
        id={name}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        minLength={minLength}
        autoFocus={autoFocus}
      />
    </div>
  );
}
