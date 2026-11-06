"use client";
import { useActionState, useRef, useState, useTransition } from "react";
import { Bookmark, Check, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ActionResult, Field, RecordRow } from "@/lib/types";
import { toggleSave } from "@/lib/actions";
const initial: ActionResult = { ok: false, message: "" };
export function Form({
  action,
  fields,
  values = {},
  submit = "Save changes",
  children,
}: {
  action: (state: ActionResult, form: FormData) => Promise<ActionResult>;
  fields: Field[];
  values?: Partial<RecordRow>;
  submit?: string;
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  return (
    <form action={formAction} className="form-grid">
      {fields.map((field) => {
        const value = values[field.name];
        const error = state.fields?.[field.name];
        const inputId = `field-${field.name}`;
        return (
          <div
            key={field.name}
            className={`field ${["textarea", "multi", "checkbox"].includes(field.type || "") ? "wide" : ""}`}
          >
            {field.type === "multi" && field.options ? (
              <fieldset>
                <legend>
                  {field.label}
                  {field.required ? " *" : ""}
                </legend>
                <div className="checkboxes">
                  {field.options.map((option) => (
                    <label key={option}>
                      <input
                        name={field.name}
                        type="checkbox"
                        value={option}
                        defaultChecked={
                          Array.isArray(value) && value.includes(option)
                        }
                      />
                      {option}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : field.type === "checkbox" ? (
              <label className="row">
                <input
                  type="checkbox"
                  name={field.name}
                  defaultChecked={Boolean(value)}
                />
                {field.label}
              </label>
            ) : (
              <>
                <label htmlFor={inputId}>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={inputId}
                    name={field.name}
                    defaultValue={String(value || "")}
                    required={field.required}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={inputId}
                    name={field.name}
                    defaultValue={String(
                      value || field.options?.[0]?.split("|")[0] || "",
                    )}
                    required={field.required}
                    aria-invalid={Boolean(error)}
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option.split("|")[0]}>
                        {option.split("|")[1] || option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={inputId}
                    name={field.name}
                    type={
                      field.type === "multi" ? "text" : field.type || "text"
                    }
                    defaultValue={
                      Array.isArray(value)
                        ? value.join(", ")
                        : String(value ?? "")
                    }
                    required={field.required}
                    min={field.type === "number" ? (field.min ?? 0) : undefined}
                    max={field.max}
                    step={field.type === "number" ? "any" : undefined}
                    autoComplete={
                      field.type === "password"
                        ? "new-password"
                        : field.type === "email"
                          ? "email"
                          : undefined
                    }
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                  />
                )}
              </>
            )}
            {field.hint && <small>{field.hint}</small>}
            {error && (
              <span id={`${inputId}-error`} className="field-error">
                {error.join(" ")}
              </span>
            )}
          </div>
        );
      })}
      {children}
      <div className="form-actions">
        <button className="button" disabled={pending}>
          {pending ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Check size={15} />
          )}{" "}
          {pending ? "Saving…" : submit}
        </button>
      </div>
      {state.message && (
        <div
          className={`notice field wide ${state.ok ? "success" : "error"}`}
          role="status"
        >
          {state.message}
          {state.url && (
            <a className="link" href={state.url}>
              {" "}
              Open development invitation
            </a>
          )}
        </div>
      )}
    </form>
  );
}
export function SaveButton({
  kind,
  id,
  saved,
}: {
  kind: "opportunity" | "creator" | "brand";
  id: string;
  saved: boolean;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return (
    <span className="row">
      <button
        className={`icon-button ${saved ? "saved" : ""}`}
        aria-label={saved ? `Unsave ${kind}` : `Save ${kind}`}
        aria-pressed={saved}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await toggleSave(kind, id);
            setMessage(result.message);
          })
        }
      >
        {pending ? (
          <LoaderCircle size={16} />
        ) : (
          <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        )}
      </button>
      <span className="sr-only" role="status">
        {message}
      </span>
    </span>
  );
}
export function ActionButton({
  action,
  label,
  confirm,
  danger = false,
  disabled = false,
  className = "",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  confirm?: string;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult>();
  const dialog = useRef<HTMLDialogElement>(null);
  const run = () =>
    start(async () => {
      const res = await action();
      setResult(res);
      dialog.current?.close();
    });
  return (
    <>
      <button
        className={`button small ${danger ? "danger" : "secondary"} ${className}`}
        disabled={pending || disabled}
        onClick={() => (confirm ? dialog.current?.showModal() : run())}
      >
        {pending ? "Working…" : label}
      </button>
      {confirm && (
        <dialog ref={dialog} className="dialog">
          <div className="spread">
            <h2>{label}</h2>
            <button
              className="icon-button"
              aria-label="Close confirmation"
              onClick={() => dialog.current?.close()}
            >
              <X size={17} />
            </button>
          </div>
          <p>{confirm}</p>
          <div className="row">
            <button
              className="button secondary"
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button
              className={`button ${danger ? "danger" : ""}`}
              onClick={run}
              disabled={pending}
            >
              {pending ? "Working…" : label}
            </button>
          </div>
        </dialog>
      )}
      {result && (
        <span
          className={`notice ${result.ok ? "success" : "error"}`}
          role="status"
        >
          {result.message}
          {result.url && (
            <a href={result.url} className="link">
              {" "}
              Open invitation
            </a>
          )}
        </span>
      )}
    </>
  );
}
export function UploadForm({
  bucket,
  recordId,
  slot = 0,
}: {
  bucket: "avatars" | "brand-logos" | "portfolio-images" | "opportunity-images";
  slot?: number;
  recordId?: string;
}) {
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      action={(form) =>
        start(async () => {
          setMessage("");
          form.set("bucket", bucket);
          form.set("slot", String(slot));
          if (recordId) form.set("recordId", recordId);
          try {
            const res = await fetch("/api/upload", {
              method: "POST",
              body: form,
            });
            const data: ActionResult = await res.json();
            setMessage(data.message);
            if (data.ok) router.refresh();
          } catch {
            setMessage("Upload failed. Please try again.");
          }
        })
      }
      className="stack"
    >
      <div className="field">
        <label htmlFor={`upload-${bucket}-${slot}`}>
          Upload{" "}
          {bucket === "avatars"
            ? "profile photo"
            : bucket === "brand-logos"
              ? "brand logo"
              : bucket === "opportunity-images"
                ? slot === 0
                  ? "cover photo"
                  : "attachment " + slot
                : "portfolio image"}
        </label>
        <input
          id={`upload-${bucket}-${slot}`}
          name="file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          required
        />
        <small>JPG, PNG or WebP · maximum 5 MB · private storage</small>
      </div>
      <button className="button secondary" disabled={pending}>
        {pending ? "Uploading…" : "Upload image"}
      </button>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </form>
  );
}
