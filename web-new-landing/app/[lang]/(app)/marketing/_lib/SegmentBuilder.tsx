"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../_lib/supabase";
import {
  FIELDS,
  OPERATORS,
  getField,
  emptyRule,
  coerceValue,
  type FieldDef,
  type OperatorKey,
  type Rule,
  type SegmentFilter,
} from "./segments";
import type { ProductDict } from "../../../../_dictionaries/product";

type SegT = ProductDict["marketing"]["segments"];

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function SegmentBuilder({
  value,
  onChange,
  dict,
}: {
  value: SegmentFilter | null | undefined;
  onChange: (next: SegmentFilter) => void;
  dict: ProductDict;
}) {
  const t = dict.marketing.segments;
  const filter: SegmentFilter = value ?? { match: "all", rules: [emptyRule()] };
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  const filterKey = JSON.stringify(filter);
  useEffect(() => {
    let cancelled = false;
    setCounting(true);
    const id = setTimeout(async () => {
      const { data, error } = await supabase.rpc("marketing_segment_count", {
        p_filter: filter,
      });
      if (cancelled) return;
      setCounting(false);
      if (error) setCount(null);
      else setCount(data as number);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const setMatch = (m: "all" | "any") => onChange({ ...filter, match: m });
  const setRule = (idx: number, rule: Rule) =>
    onChange({
      ...filter,
      rules: filter.rules.map((r, i) => (i === idx ? rule : r)),
    });
  const addRule = () =>
    onChange({ ...filter, rules: [...filter.rules, emptyRule()] });
  const removeRule = (idx: number) =>
    onChange({ ...filter, rules: filter.rules.filter((_, i) => i !== idx) });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-accent-dark/10 bg-cream/50 px-3 py-2">
        <span className="font-sans text-body-xs text-warm-shadow">
          {t.builder.match}
        </span>
        <select
          value={filter.match}
          onChange={(e) => setMatch(e.target.value as "all" | "any")}
          className="rounded-md border border-accent-dark/15 bg-white px-2 py-1 font-sans text-body-xs text-accent-dark"
        >
          <option value="all">{t.builder.matchAll}</option>
          <option value="any">{t.builder.matchAny}</option>
        </select>
        <span className="flex-1" />
        <span
          className={`font-display label-xs uppercase ${
            counting ? "text-warm-shadow" : "text-glyph-gold"
          }`}
        >
          {counting
            ? "…"
            : count != null
              ? fmt(dict.marketing.common.recipients, { count })
              : t.builder.countAvailable}
        </span>
      </div>

      <div>
        {filter.rules.map((rule, idx) => (
          <RuleRow
            key={idx}
            rule={rule}
            onChange={(r) => setRule(idx, r)}
            onRemove={() => removeRule(idx)}
            canRemove={filter.rules.length > 1}
            t={t}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addRule}
        className="mt-2 w-full rounded-xl border border-dashed border-glyph-gold/50 bg-glyph-gold/8 px-3 py-2 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-glyph-gold/15"
      >
        {t.builder.addRule}
      </button>
    </div>
  );
}

function RuleRow({
  rule,
  onChange,
  onRemove,
  canRemove,
  t,
}: {
  rule: Rule;
  onChange: (r: Rule) => void;
  onRemove: () => void;
  canRemove: boolean;
  t: SegT;
}) {
  const field = getField(rule.field) ?? FIELDS[0];
  const op = rule.op;
  const opMeta = OPERATORS[op] ?? {};
  const valueless = opMeta.valueless;

  const onFieldChange = (newKey: string) => {
    const next = getField(newKey)!;
    const newOp: OperatorKey = next.ops.includes(op) ? op : next.ops[0];
    onChange({ field: newKey, op: newOp, value: undefined });
  };
  const onOpChange = (newOp: OperatorKey) =>
    onChange({
      ...rule,
      op: newOp,
      value: OPERATORS[newOp]?.valueless ? undefined : rule.value,
    });
  const onValueChange = (raw: unknown) =>
    onChange({ ...rule, value: coerceValue(field, op, raw) });

  const selectCls =
    "min-w-0 rounded-md border border-accent-dark/15 bg-white px-2 py-1.5 font-sans text-body-s text-accent-dark";

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-accent-dark/8 bg-cream/30 p-2">
      <select
        value={rule.field}
        onChange={(e) => onFieldChange(e.target.value)}
        className={`${selectCls} flex-[1_1_200px]`}
      >
        {FIELDS.map((f) => (
          <option key={f.key} value={f.key}>
            {t.fields[f.key as keyof SegT["fields"]]}
          </option>
        ))}
      </select>
      <select
        value={op}
        onChange={(e) => onOpChange(e.target.value as OperatorKey)}
        className={`${selectCls} flex-[0_0_160px]`}
      >
        {field.ops.map((o) => (
          <option key={o} value={o}>
            {t.operators[o]}
          </option>
        ))}
      </select>
      {!valueless && (
        <ValueInput field={field} op={op} value={rule.value} onChange={onValueChange} t={t} />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        title={t.builder.removeRule}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-accent-dark/15 bg-white font-mono text-accent-dark transition-colors hover:border-error/50 hover:text-error disabled:cursor-not-allowed disabled:opacity-30"
      >
        ✕
      </button>
    </div>
  );
}

function ValueInput({
  field,
  op,
  value,
  onChange,
  t,
}: {
  field: FieldDef;
  op: OperatorKey;
  value: unknown;
  onChange: (raw: unknown) => void;
  t: SegT;
}) {
  const inputCls =
    "min-w-0 flex-[1_1_140px] rounded-md border border-accent-dark/15 bg-white px-2 py-1.5 font-sans text-body-s text-accent-dark placeholder:text-warm-shadow/60";

  if (field.type === "bool") {
    return (
      <select
        value={String(value ?? true)}
        onChange={(e) => onChange(e.target.value === "true")}
        className={inputCls}
      >
        <option value="true">{t.builder.boolTrue}</option>
        <option value="false">{t.builder.boolFalse}</option>
      </select>
    );
  }
  if (field.type === "enum") {
    if (op === "in") {
      return (
        <input
          type="text"
          value={Array.isArray(value) ? (value as string[]).join(",") : (value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t.builder.csvPlaceholder}
          className={inputCls}
        />
      );
    }
    const options = field.options ?? [];
    return (
      <select
        value={(value as string) ?? options[0]?.value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {t.fieldEnums[`${field.key}_${o.value}` as keyof SegT["fieldEnums"]] ?? o.value}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "int" || op === "within_last_days" || op === "older_than_days") {
    return (
      <input
        type="number"
        value={(value as number | string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    );
  }
  if (field.type === "date" || field.type === "timestamp") {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value.slice(0, 10) : ""}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    );
  }
  return (
    <input
      type="text"
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  );
}
