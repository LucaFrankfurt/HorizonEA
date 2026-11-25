"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { api, RequestError } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string; group?: string };

export interface FieldDef {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "date" | "number";
  options?: Option[];
  required?: boolean;
  placeholder?: string;
  /** Spans the full row in the two-column grid. */
  full?: boolean;
  help?: string;
  /** Free-text suggestions (datalist). */
  suggestions?: string[];
  /** Allow an empty choice for selects. */
  allowEmpty?: boolean;
  /** Only show this field when the predicate is true. */
  visible?: (values: Record<string, string>) => boolean;
}

type Values = Record<string, string>;

function toValues(fields: FieldDef[], initialObj?: object): Values {
  const initial = initialObj as Record<string, unknown> | undefined;
  const values: Values = {};
  for (const f of fields) {
    const v = initial?.[f.name];
    values[f.name] = v === null || v === undefined ? (f.type === "select" && !f.allowEmpty && f.options?.[0] ? f.options[0].value : "") : String(v);
  }
  return values;
}

function groupOptions(options: Option[]) {
  const groups = new Map<string, Option[]>();
  for (const o of options) {
    const g = o.group ?? "";
    groups.set(g, [...(groups.get(g) ?? []), o]);
  }
  return groups;
}

export function FormFields({
  fields,
  values,
  errors,
  onChange,
}: {
  fields: FieldDef[];
  values: Values;
  errors: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  const uid = useId();
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
      {fields
        .filter((f) => !f.visible || f.visible(values))
        .map((f) => {
          const id = `${uid}-${f.name}`;
          const error = errors[f.name];
          const common = {
            id,
            name: f.name,
            value: values[f.name] ?? "",
            "aria-invalid": error ? true : undefined,
            required: f.required,
            placeholder: f.placeholder,
          };
          return (
            <div key={f.name} className={cn("flex flex-col gap-1.5", (f.full || f.type === "textarea") && "sm:col-span-2")}>
              <Label htmlFor={id}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              {f.type === "textarea" ? (
                <Textarea {...common} rows={3} onChange={(e) => onChange(f.name, e.target.value)} />
              ) : f.type === "select" ? (
                <NativeSelect {...common} onChange={(e) => onChange(f.name, e.target.value)}>
                  {f.allowEmpty && <option value="">—</option>}
                  {[...groupOptions(f.options ?? [])].map(([group, opts]) =>
                    group ? (
                      <optgroup key={group} label={group}>
                        {opts.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </optgroup>
                    ) : (
                      opts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))
                    ),
                  )}
                </NativeSelect>
              ) : (
                <>
                  <Input
                    {...common}
                    type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                    min={f.type === "number" ? 0 : undefined}
                    list={f.suggestions ? `${id}-list` : undefined}
                    onChange={(e) => onChange(f.name, e.target.value)}
                  />
                  {f.suggestions && (
                    <datalist id={`${id}-list`}>
                      {f.suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </>
              )}
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : f.help ? (
                <p className="text-xs text-muted-foreground">{f.help}</p>
              ) : null}
            </div>
          );
        })}
    </div>
  );
}

/**
 * Create / edit dialog driven by a field configuration. Posts to `endpoint`
 * (POST for create, PATCH when `recordId` is set) and refreshes the page.
 */
export function EntityFormDialog({
  trigger,
  title,
  description,
  fields,
  endpoint,
  recordId,
  initial,
  extra,
  onSaved,
  wide,
  submitLabel,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  fields: FieldDef[];
  endpoint: string;
  recordId?: string;
  initial?: object;
  /** Fixed values merged into the payload (e.g. a parent id). */
  extra?: Record<string, unknown>;
  onSaved?: (record: { id: string }) => void;
  wide?: boolean;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Values>(() => toValues(fields, initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function onOpenChange(next: boolean) {
    if (next) {
      setValues(toValues(fields, initial));
      setErrors({});
    }
    setOpen(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload: Record<string, unknown> = { ...extra };
      for (const f of fields) {
        if (f.visible && !f.visible(values)) {
          payload[f.name] = null;
          continue;
        }
        payload[f.name] = values[f.name] === "" ? null : values[f.name];
      }
      const record = recordId
        ? await api<{ id: string }>("PATCH", `${endpoint}/${recordId}`, payload)
        : await api<{ id: string }>("POST", endpoint, payload);
      toast.success(recordId ? "Changes saved" : `${title.replace(/^(New|Add) /, "")} created`);
      setOpen(false);
      onSaved?.(record);
      router.refresh();
    } catch (error) {
      if (error instanceof RequestError && error.issues) setErrors(error.issues);
      toast.error(error instanceof Error ? error.message : "Saving failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent wide={wide}>
        <form onSubmit={submit} className="flex min-h-0 flex-col" noValidate>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <DialogBody>
            <FormFields
              fields={fields}
              values={values}
              errors={errors}
              onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
            />
            {errors._ && <p className="mt-3 text-sm text-destructive">{errors._}</p>}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              {submitLabel ?? (recordId ? "Save changes" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
