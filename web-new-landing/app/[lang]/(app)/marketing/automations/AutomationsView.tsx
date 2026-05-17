"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../_lib/supabase";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { Input } from "../../../../_components/primitives/Input";
import { Select } from "../../../../_components/primitives/Select";
import { Textarea } from "../../../../_components/primitives/Textarea";
import { Field } from "../../../../_components/primitives/Field";
import { toast } from "../../../../_components/primitives/Toast";
import {
  useAutomations,
  toggleAutomationActive,
  deleteAutomation,
  loadAutomation,
  type AutomationListItem,
  type StepRow,
  type TriggerType,
} from "./_hooks/useAutomations";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

type T = ProductDict["marketing"]["automations"];
type EditorT = T["editor"];

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

type EditorState =
  | { kind: "closed" }
  | { kind: "new" }
  | { kind: "edit"; id: string };

export function AutomationsView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.marketing.automations;
  const { list, error, reload } = useAutomations();
  const [editor, setEditor] = useState<EditorState>({ kind: "closed" });
  const [pendingDelete, setPendingDelete] = useState<AutomationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (error) toast.error(fmt(dict.marketing.common.failedToLoad, { error }));
  }, [error, dict.marketing.common.failedToLoad]);

  const handleToggle = async (a: AutomationListItem) => {
    const { error: e } = await toggleAutomationActive(a.id, !a.is_active);
    if (e) toast.error(fmt(t.toggleFailed, { error: e.message }));
    void reload();
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error: e } = await deleteAutomation(pendingDelete.id);
    setDeleting(false);
    if (e) {
      toast.error(fmt(t.deleteFailed, { error: e.message }));
    } else {
      toast.success(t.deletedToast);
    }
    setPendingDelete(null);
    void reload();
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/marketing`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">←</span>
        {t.backToMarketing}
      </Link>

      <header className="mt-6">
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {dict.marketing.common.eyebrow}
        </p>
        <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
          {t.title}
        </h1>
        <p className="mt-2 max-w-prose font-sans text-body-s text-warm-shadow">
          {t.subtitle}
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display label-md uppercase text-accent-dark">
            {t.allTitle}
          </h2>
          <button
            type="button"
            onClick={() => setEditor({ kind: "new" })}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-5 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90"
          >
            {t.newButton}
          </button>
        </div>

        {!list ? (
          <p className="mt-4 font-sans text-body-s italic text-warm-shadow">
            {dict.marketing.common.loading}
          </p>
        ) : list.length === 0 ? (
          <p className="mt-4 font-sans text-body-s italic text-warm-shadow">
            {t.empty}
          </p>
        ) : (
          <ul className="mt-4 list-none p-0">
            {list.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 border-b border-accent-dark/8 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2 font-sans text-body-m text-accent-dark">
                    <span className="font-semibold">{a.name}</span>
                    <span
                      className={`font-display label-xs uppercase ${
                        a.is_active ? "text-success" : "text-warm-shadow"
                      }`}
                    >
                      · {a.is_active ? t.active : t.paused}
                    </span>
                  </div>
                  <div className="mt-1 font-sans text-body-xs text-warm-shadow">
                    {t.triggers[a.trigger_type] ?? a.trigger_type} ·{" "}
                    {fmt(t.stepCount, { count: a.step_count })} ·{" "}
                    {fmt(t.runsPending, { count: a.runs_pending })} ·{" "}
                    {fmt(t.runsSent, { count: a.runs_sent })}
                    {a.runs_failed > 0 && (
                      <span className="text-error">
                        {" "}
                        · {fmt(t.runsFailed, { count: a.runs_failed })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggle(a)}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-accent-dark/15 bg-cream px-4 py-2 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
                  >
                    {a.is_active ? t.pause : t.activate}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditor({ kind: "edit", id: a.id })}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-accent-dark/15 bg-cream px-4 py-2 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(a)}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-error/40 bg-error/10 px-4 py-2 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white"
                  >
                    {t.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editor.kind !== "closed" && (
        <AutomationEditor
          key={editor.kind === "edit" ? editor.id : "new"}
          automationId={editor.kind === "edit" ? editor.id : null}
          t={t}
          dict={dict}
          onClose={() => {
            setEditor({ kind: "closed" });
            void reload();
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete != null}
        title={t.deleteTitle}
        description={fmt(t.deleteMessage, { name: pendingDelete?.name ?? "" })}
        confirmLabel={deleting ? dict.common.loading : t.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => !deleting && setPendingDelete(null)}
      />
    </div>
  );
}

type DraftStep = StepRow & { _persisted: boolean };

function makeDraftStep(order: number): DraftStep {
  return {
    id: `tmp_${Date.now()}_${order}`,
    automation_id: "",
    step_order: order,
    delay_days: 0,
    subject: "",
    html: '<p>Hello {{first_name|"there"}}!</p>\n<p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
    subject_ar: null,
    html_ar: null,
    category: "product_updates",
    _persisted: false,
  };
}

function AutomationEditor({
  automationId,
  t,
  dict,
  onClose,
}: {
  automationId: string | null;
  t: T;
  dict: ProductDict;
  onClose: () => void;
}) {
  const e: EditorT = t.editor;
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("signup_welcome");
  const [daysInactive, setDaysInactive] = useState<number>(14);
  const [level, setLevel] = useState<number>(5);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [loaded, setLoaded] = useState(automationId == null);
  const [busy, setBusy] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<number | null>(null);

  useEffect(() => {
    if (automationId == null) return;
    let cancelled = false;
    void (async () => {
      const { automation, steps: ss } = await loadAutomation(automationId);
      if (cancelled) return;
      if (automation) {
        setName(automation.name);
        setTriggerType(automation.trigger_type);
        setIsActive(automation.is_active);
        const cfg = (automation.trigger_config ?? {}) as Record<string, unknown>;
        if (automation.trigger_type === "inactivity")
          setDaysInactive(Number(cfg.days_inactive ?? 14));
        if (automation.trigger_type === "level_reached")
          setLevel(Number(cfg.level ?? 5));
      }
      setSteps(ss.map((s) => ({ ...s, _persisted: true })));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [automationId]);

  const addStep = () =>
    setSteps((prev) => [...prev, makeDraftStep(prev.length)]);
  const updateStep = (idx: number, patch: Partial<StepRow>) =>
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );

  const confirmDeleteStep = async () => {
    if (stepToDelete == null) return;
    const idx = stepToDelete;
    const s = steps[idx];
    if (s._persisted) {
      const { error: er } = await supabase
        .from("marketing_automation_steps")
        .delete()
        .eq("id", s.id);
      if (er) {
        toast.error(er.message);
        setStepToDelete(null);
        return;
      }
    }
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((step, i) => ({ ...step, step_order: i })),
    );
    setStepToDelete(null);
  };

  const requestDeleteStep = (idx: number) => {
    if (steps[idx]._persisted) setStepToDelete(idx);
    else
      setSteps((prev) =>
        prev
          .filter((_, i) => i !== idx)
          .map((step, i) => ({ ...step, step_order: i })),
      );
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error(e.nameRequired);
      return;
    }
    if (steps.length === 0) {
      toast.error(e.atLeastOneStep);
      return;
    }
    for (const s of steps) {
      if (!s.subject || !s.html) {
        toast.error(e.stepNeedsBody);
        return;
      }
    }
    const trigger_config =
      triggerType === "inactivity"
        ? { days_inactive: Number(daysInactive) || 14 }
        : triggerType === "level_reached"
          ? { level: Number(level) || 5 }
          : {};

    setBusy(true);
    let aid = automationId;
    if (!aid) {
      const { data, error: er } = await supabase
        .from("marketing_automations")
        .insert({
          name: name.trim(),
          trigger_type: triggerType,
          trigger_config,
          is_active: isActive,
        })
        .select("id")
        .single();
      if (er || !data) {
        setBusy(false);
        toast.error(er?.message ?? "Insert failed");
        return;
      }
      aid = data.id as string;
    } else {
      const { error: er } = await supabase
        .from("marketing_automations")
        .update({
          name: name.trim(),
          trigger_type: triggerType,
          trigger_config,
          is_active: isActive,
        })
        .eq("id", aid);
      if (er) {
        setBusy(false);
        toast.error(er.message);
        return;
      }
    }

    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const payload = {
        automation_id: aid,
        step_order: i,
        delay_days: Number(s.delay_days) || 0,
        subject: s.subject,
        html: s.html,
        subject_ar: s.subject_ar || null,
        html_ar: s.html_ar || null,
        category: s.category || null,
      };
      const { error: er } = s._persisted
        ? await supabase
            .from("marketing_automation_steps")
            .update(payload)
            .eq("id", s.id)
        : await supabase.from("marketing_automation_steps").insert(payload);
      if (er) {
        setBusy(false);
        toast.error(fmt(e.stepError, { n: i + 1, error: er.message }));
        return;
      }
    }
    setBusy(false);
    toast.success(e.savedToast);
    onClose();
  };

  if (!loaded) {
    return (
      <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm">
        <p className="font-sans text-body-s italic text-warm-shadow">
          {dict.marketing.common.loading}
        </p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
      <h2 className="mb-4 font-display label-md uppercase text-accent-dark">
        {automationId ? e.editTitle : e.newTitle}
      </h2>

      <Field label={e.nameLabel}>
        <Input
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          placeholder={e.namePlaceholder}
        />
      </Field>

      <div className="mt-4">
        <Field label={e.triggerLabel}>
          <Select
            value={triggerType}
            onChange={(ev) => setTriggerType(ev.target.value as TriggerType)}
          >
            <option value="signup_welcome">{t.triggers.signup_welcome}</option>
            <option value="inactivity">{t.triggers.inactivity}</option>
            <option value="level_reached">{t.triggers.level_reached}</option>
          </Select>
        </Field>
      </div>

      {triggerType === "inactivity" && (
        <div className="mt-4">
          <Field label={e.daysInactiveLabel}>
            <Input
              type="number"
              min={1}
              value={daysInactive}
              onChange={(ev) => setDaysInactive(Number(ev.target.value))}
            />
          </Field>
        </div>
      )}
      {triggerType === "level_reached" && (
        <div className="mt-4">
          <Field label={e.levelThresholdLabel}>
            <Input
              type="number"
              min={1}
              value={level}
              onChange={(ev) => setLevel(Number(ev.target.value))}
            />
          </Field>
        </div>
      )}

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 font-sans text-body-s text-accent-dark">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(ev) => setIsActive(ev.target.checked)}
          className="h-4 w-4 accent-glyph-gold"
        />
        {e.activeLabel}
      </label>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="font-display label-s uppercase text-accent-dark">
          {e.stepsTitle}
        </h3>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center rounded-full border border-accent-dark/15 bg-cream px-4 py-2 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
        >
          {e.addStep}
        </button>
      </div>

      {steps.length === 0 && (
        <p className="mt-3 font-sans text-body-s italic text-warm-shadow">
          {e.noStepsYet}
        </p>
      )}

      {steps.map((s, i) => (
        <div
          key={s.id}
          className="mt-4 rounded-2xl border border-accent-dark/10 bg-cream/60 p-4"
        >
          <div className="mb-3 flex items-center gap-2">
            <strong className="font-display label-xs uppercase text-glyph-gold">
              {fmt(e.stepNumber, { n: i + 1 })}
            </strong>
            <span className="font-sans text-body-xs text-warm-shadow">
              {e.stepFires}
            </span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={() => requestDeleteStep(i)}
              className="inline-flex items-center rounded-full border border-error/40 bg-error/10 px-3 py-1.5 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white"
            >
              {e.remove}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Field label={e.delayLabel}>
              <Input
                type="number"
                min={0}
                value={s.delay_days}
                onChange={(ev) =>
                  updateStep(i, { delay_days: Number(ev.target.value) || 0 })
                }
              />
            </Field>
            <Field label={e.categoryLabel}>
              <Select
                value={s.category ?? ""}
                onChange={(ev) =>
                  updateStep(i, { category: ev.target.value || null })
                }
              >
                <option value="">{e.categoryNone}</option>
                <option value="product_updates">
                  {dict.marketing.categories.product_updates}
                </option>
                <option value="training_tips">
                  {dict.marketing.categories.training_tips}
                </option>
                <option value="promotions">
                  {dict.marketing.categories.promotions}
                </option>
              </Select>
            </Field>
          </div>

          <div className="mt-3">
            <Field label={e.subjectEn}>
              <Input
                value={s.subject}
                onChange={(ev) => updateStep(i, { subject: ev.target.value })}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label={e.htmlEn}>
              <Textarea
                rows={8}
                value={s.html}
                onChange={(ev) => updateStep(i, { html: ev.target.value })}
                className="font-mono text-[12px]"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label={e.subjectAr}>
              <Input
                value={s.subject_ar ?? ""}
                onChange={(ev) =>
                  updateStep(i, { subject_ar: ev.target.value || null })
                }
                dir="rtl"
                className="text-right"
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label={e.htmlAr}>
              <Textarea
                rows={8}
                value={s.html_ar ?? ""}
                onChange={(ev) =>
                  updateStep(i, { html_ar: ev.target.value || null })
                }
                dir="rtl"
                className="font-mono text-[12px]"
              />
            </Field>
          </div>
        </div>
      ))}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90 disabled:opacity-60"
        >
          {busy ? e.savingButton : e.saveButton}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent-dark/15 bg-cream px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream disabled:opacity-60"
        >
          {dict.common.cancel}
        </button>
      </div>

      <ConfirmDialog
        open={stepToDelete != null}
        title={e.deleteStepTitle}
        description={e.deleteStepMessage}
        confirmLabel={t.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void confirmDeleteStep()}
        onCancel={() => setStepToDelete(null)}
      />
    </section>
  );
}
