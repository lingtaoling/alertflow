export type FormFieldType = "text" | "textarea" | "password" | "email" | "select";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange(e.target.value);

  if (type === "textarea") {
    return (
      <div>
        <label className="label" htmlFor={name}>
          {labelContent}
        </label>
        <textarea
          className="input resize-none"
          id={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          autoFocus={autoFocus}
        />
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
