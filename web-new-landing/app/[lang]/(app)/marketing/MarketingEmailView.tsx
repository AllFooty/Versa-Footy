"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../_lib/supabase";
import { useAuth } from "../../../_lib/auth/AuthProvider";
import { ConfirmDialog } from "../../../_components/primitives/ConfirmDialog";
import { Input } from "../../../_components/primitives/Input";
import { Select } from "../../../_components/primitives/Select";
import { Textarea } from "../../../_components/primitives/Textarea";
import { Field } from "../../../_components/primitives/Field";
import { toast } from "../../../_components/primitives/Toast";
import { BlockComposer } from "./_components/BlockComposer";
import { RecentCampaignsPanel } from "./_components/RecentCampaignsPanel";
import { ScheduledCampaignsPanel } from "./_components/ScheduledCampaignsPanel";
import { TemplatesPanel, type EditorMode } from "./_components/TemplatesPanel";
import { SuppressionsPanel } from "./_components/SuppressionsPanel";
import {
  defaultBlocks,
  validateBlocks,
  type Block,
} from "./_lib/blocks";
import { renderEmailHtml } from "./_lib/renderEmail";
import type { SegmentFilter } from "./_lib/segments";
import {
  applyMergeTags,
  recipientToVars,
  findUnknownTags,
  MERGE_TAGS,
  type RecipientSample,
} from "./_lib/mergeTags";
import type { ProductDict } from "../../../_dictionaries/product";
import type { Locale } from "../../../_dictionaries";

type EmailT = ProductDict["marketing"]["email"];
type Audience = "test" | "subscribers" | "opted_in_users" | "all_users" | "segment";
type CategoryKey = "product_updates" | "training_tips" | "promotions";
type Counts = {
  subscribers: number;
  opted_in_users: number;
  all_users: number;
};

const FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-marketing-email`;
const TEST_ADDR_KEY = "versa_marketing_saved_test_addresses";

const TEMPLATE_LAUNCH = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
        <tr><td style="padding:32px 32px 16px 32px">
          <h1 style="margin:0 0 8px 0;font-size:24px;color:#111827">We're launching!</h1>
          <p style="margin:0;font-size:14px;color:#6b7280">Versa Footy is here</p>
        </td></tr>
        <tr><td style="padding:0 32px 24px 32px;color:#374151;font-size:16px;line-height:1.6">
          <p>Hey there,</p>
          <p>The wait is over. Versa Footy is officially live — your kid's personalized football training app.</p>
          <p>Tap below to start training:</p>
          <p style="text-align:center;margin:32px 0">
            <a href="https://versafooty.com" style="background:#E63946;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">Open Versa Footy</a>
          </p>
          <p>If you have feedback, just hit reply — we read every message.</p>
          <p>— The Versa Footy team</p>
        </td></tr>
      </table>
      <p style="font-size:12px;color:#9ca3af;margin-top:24px">
        You're receiving this because you signed up at versafooty.com.<br/>
        <a href="{{unsubscribe_url}}" style="color:#9ca3af;text-decoration:underline">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function loadSavedTestAddresses(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(TEST_ADDR_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}
function saveTestAddresses(arr: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TEST_ADDR_KEY, JSON.stringify(arr.slice(0, 20)));
  } catch {
    /* quota / private mode */
  }
}

function isBlocksDirty(blocks: Block[]): boolean {
  const fresh = defaultBlocks();
  if (!Array.isArray(blocks) || blocks.length !== fresh.length) return true;
  for (let i = 0; i < fresh.length; i++) {
    const a = blocks[i] as Record<string, unknown>;
    const b = fresh[i] as Record<string, unknown>;
    if (!a || a.type !== b.type) return true;
    if (a.text !== b.text) return true;
    if (b.type === "button" && a.href !== b.href) return true;
    if (b.type === "image" && (a.src !== b.src || a.alt !== b.alt)) return true;
    if (b.type === "spacer" && a.height !== b.height) return true;
    if (b.type === "heading" && (a.level !== b.level || a.align !== b.align)) return true;
  }
  return false;
}

type SegmentRow = { id: string; name: string; filter: SegmentFilter; is_active: boolean };

type ConfirmSendState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  scheduledISO: string | null;
  isLargeSend: boolean;
};

const inputCls =
  "w-full rounded-xl border border-accent-dark/15 bg-cream px-3 py-2 font-sans text-body-s text-accent-dark placeholder:text-warm-shadow/60 focus:border-glyph-gold focus:outline-none";

export function MarketingEmailView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.marketing.email;
  const { user } = useAuth();

  const [mode, setMode] = useState<EditorMode>("blocks");
  const [subject, setSubject] = useState("Versa Footy is launching today");
  const [html, setHtml] = useState(TEMPLATE_LAUNCH);
  const [blocks, setBlocks] = useState<Block[]>(() => defaultBlocks());
  const [audience, setAudience] = useState<Audience>("test");
  const [category, setCategory] = useState<CategoryKey>("product_updates");
  const [segmentId, setSegmentId] = useState("");
  const [segments, setSegments] = useState<SegmentRow[]>([]);
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});
  const [testRecipient, setTestRecipient] = useState(user?.email ?? "");
  const [counts, setCounts] = useState<Counts | null>(null);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState("");
  const [sampleRecipient, setSampleRecipient] = useState<RecipientSample | null>(null);
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [scheduledFor, setScheduledFor] = useState("");
  const [scheduleRefresh, setScheduleRefresh] = useState(0);
  const [recentRefresh, setRecentRefresh] = useState(0);

  // Arabic variant
  const [enableAr, setEnableAr] = useState(false);
  const [langTab, setLangTab] = useState<"en" | "ar">("en");
  const [subjectAr, setSubjectAr] = useState("");
  const [blocksAr, setBlocksAr] = useState<Block[]>(() => defaultBlocks());
  const [htmlAr, setHtmlAr] = useState("");
  const [renderedHtmlAr, setRenderedHtmlAr] = useState("");
  const [testLocale, setTestLocale] = useState<"en" | "ar">("en");
  const [savedTestAddresses, setSavedTestAddresses] = useState<string[]>([]);

  // Mode-switch confirm
  const [modeSwitchTarget, setModeSwitchTarget] = useState<EditorMode | null>(null);
  // Send confirm
  const [sendConfirm, setSendConfirm] = useState<ConfirmSendState | null>(null);

  useEffect(() => {
    setSavedTestAddresses(loadSavedTestAddresses());
  }, []);

  useEffect(() => {
    if (user?.email && !testRecipient) setTestRecipient(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase.rpc("marketing_audience_counts");
      if (!error && data) setCounts(data as Counts);
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("marketing_segments")
        .select("id, name, filter, is_active")
        .eq("is_active", true)
        .order("name");
      if (cancelled || !data) return;
      const rows = data as SegmentRow[];
      setSegments(rows);
      if (rows[0] && !segmentId) setSegmentId(rows[0].id);
      const next: Record<string, number> = {};
      for (const s of rows) {
        const { data: c } = await supabase.rpc("marketing_segment_count", {
          p_filter: s.filter,
        });
        if (cancelled) return;
        if (typeof c === "number") next[s.id] = c;
      }
      setSegmentCounts(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "blocks") return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await renderEmailHtml(blocks);
        if (!cancelled) setRenderedHtml(result);
      } catch (e) {
        if (!cancelled)
          toast.error(fmt(t.errors.renderFailed, { error: e instanceof Error ? e.message : String(e) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blocks, mode, t.errors.renderFailed]);

  useEffect(() => {
    if (mode !== "blocks" || !enableAr) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await renderEmailHtml(blocksAr);
        if (!cancelled) setRenderedHtmlAr(result);
      } catch (e) {
        if (!cancelled)
          toast.error(fmt(t.errors.renderFailedAr, { error: e instanceof Error ? e.message : String(e) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blocksAr, mode, enableAr, t.errors.renderFailedAr]);

  useEffect(() => {
    if (audience === "test") {
      setSampleRecipient(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.rpc("marketing_sample_recipient", {
        p_audience: audience,
        p_segment_id: audience === "segment" ? segmentId || null : null,
      });
      if (cancelled) return;
      if (error) setSampleRecipient(null);
      else setSampleRecipient((data as RecipientSample) || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [audience, segmentId]);

  const isAr = enableAr && langTab === "ar";
  const activeSubject = isAr ? subjectAr : subject;
  const setActiveSubject = isAr ? setSubjectAr : setSubject;
  const activeBlocks = isAr ? blocksAr : blocks;
  const setActiveBlocks = isAr ? setBlocksAr : setBlocks;
  const activeRawHtml = isAr ? htmlAr : html;
  const setActiveRawHtml = isAr ? setHtmlAr : setHtml;

  const outgoingHtml = mode === "blocks" ? renderedHtml : html;
  const outgoingHtmlAr = mode === "blocks" ? renderedHtmlAr : htmlAr;
  const activeOutgoingHtml = isAr ? outgoingHtmlAr : outgoingHtml;

  const previewVars = useMemo(() => recipientToVars(sampleRecipient), [sampleRecipient]);
  const previewSubject = applyMergeTags(activeSubject, previewVars);
  const previewHtml = applyMergeTags(activeOutgoingHtml, previewVars, { encode: "html" }).replaceAll(
    "{{unsubscribe_url}}",
    "#preview-unsubscribe",
  );
  const unknownTags = useMemo(
    () =>
      Array.from(
        new Set([
          ...findUnknownTags(subject),
          ...findUnknownTags(outgoingHtml),
          ...(enableAr
            ? [...findUnknownTags(subjectAr), ...findUnknownTags(outgoingHtmlAr)]
            : []),
        ]),
      ),
    [subject, outgoingHtml, enableAr, subjectAr, outgoingHtmlAr],
  );

  const recipientCount = useCallback((): number => {
    if (audience === "test") return 1;
    if (audience === "subscribers") return counts?.subscribers ?? 0;
    if (audience === "segment") return segmentCounts[segmentId] ?? 0;
    if (audience === "all_users") return counts?.all_users ?? 0;
    return counts?.opted_in_users ?? 0;
  }, [audience, counts, segmentCounts, segmentId]);

  const sendIssues = useMemo(() => {
    const issues: string[] = [];
    if (!subject.trim()) issues.push(t.validation.subjectMissing);
    if (!outgoingHtml) issues.push(t.validation.bodyMissing);
    if (audience === "test" && !testRecipient) issues.push(t.validation.testRecipientMissing);
    if (sendMode === "schedule" && audience !== "test" && !scheduledFor)
      issues.push(t.errors.pickDateTime);
    if (enableAr) {
      if (!subjectAr.trim()) issues.push(t.validation.arSubjectMissing);
      if (!outgoingHtmlAr) issues.push(t.validation.arBodyMissing);
    }
    if (mode === "blocks") {
      issues.push(...validateBlocks(blocks));
      if (enableAr) {
        for (const issue of validateBlocks(blocksAr)) {
          issues.push(fmt(t.errors.arPrefix, { issues: issue }));
        }
      }
    }
    if (audience !== "test" && counts) {
      if (recipientCount() === 0) issues.push(t.errors.noRecipients);
    }
    return issues;
  }, [
    subject,
    outgoingHtml,
    audience,
    testRecipient,
    sendMode,
    scheduledFor,
    enableAr,
    subjectAr,
    outgoingHtmlAr,
    mode,
    blocks,
    blocksAr,
    counts,
    recipientCount,
    t,
  ]);

  const handleModeToggle = (targetMode: EditorMode) => {
    if (mode === targetMode) return;
    const activeDirty =
      mode === "blocks"
        ? isBlocksDirty(blocks) || (enableAr && isBlocksDirty(blocksAr))
        : (html.trim() !== "" && html !== TEMPLATE_LAUNCH) ||
          (enableAr && htmlAr.trim() !== "");
    if (activeDirty) setModeSwitchTarget(targetMode);
    else setMode(targetMode);
  };

  const handleSendClick = () => {
    const count = recipientCount();
    if (count === 0) {
      toast.error(t.errors.noRecipients);
      return;
    }
    const isSchedule = sendMode === "schedule" && audience !== "test";
    let scheduledISO: string | null = null;
    if (isSchedule) {
      if (!scheduledFor) {
        toast.error(t.errors.pickDateTime);
        return;
      }
      const dt = new Date(scheduledFor);
      if (Number.isNaN(dt.getTime())) {
        toast.error(t.errors.invalidDate);
        return;
      }
      if (dt <= new Date()) {
        toast.error(t.errors.futureDate);
        return;
      }
      scheduledISO = dt.toISOString();
    }

    const isLargeSend = audience !== "test" && count > 100 && !isSchedule;
    const costEst = (count * 0.0004).toFixed(2);
    const title =
      audience === "test"
        ? t.confirm.testTitle
        : isSchedule
          ? t.confirm.scheduleTitle
          : t.confirm.campaignTitle;
    const message =
      audience === "test"
        ? fmt(t.confirm.testMessage, { email: testRecipient })
        : isSchedule && scheduledISO
          ? fmt(t.confirm.scheduleMessage, {
              count,
              when: new Date(scheduledISO).toLocaleString(),
            })
          : isLargeSend
            ? fmt(t.confirm.campaignMessageLargeSend, { count, cost: costEst })
            : audience === "subscribers"
              ? fmt(t.confirm.campaignMessageSubscribers, { count })
              : fmt(t.confirm.campaignMessageOptedIn, { count });

    setSendConfirm({
      open: true,
      title,
      message,
      confirmLabel: isSchedule ? t.confirm.schedule : t.confirm.send,
      destructive: !isSchedule && audience !== "test",
      scheduledISO,
      isLargeSend,
    });
  };

  const performSend = async (state: ConfirmSendState) => {
    setSendConfirm(null);

    if (state.isLargeSend) {
      const typed = window.prompt(t.largeSendPrompt);
      if (typed !== "SEND") {
        if (typed != null) toast.error(t.largeSendTypoError);
        return;
      }
    }

    if (mode === "blocks") {
      const issues = validateBlocks(blocks);
      if (issues.length > 0) {
        toast.error(issues.join(" "));
        return;
      }
      if (enableAr) {
        const issuesAr = validateBlocks(blocksAr);
        if (issuesAr.length > 0) {
          toast.error(fmt(t.errors.arPrefix, { issues: issuesAr.join(" ") }));
          return;
        }
      }
    }
    if (enableAr && (!subjectAr || (mode === "html" && !htmlAr))) {
      toast.error(t.errors.missingArVariant);
      return;
    }

    setSending(true);
    try {
      const sendHtml = mode === "blocks" ? await renderEmailHtml(blocks) : html;
      const sendHtmlAr = enableAr
        ? mode === "blocks"
          ? await renderEmailHtml(blocksAr)
          : htmlAr
        : null;
      const sendSubjectAr = enableAr ? subjectAr : null;

      if (state.scheduledISO) {
        const { data, error: rpcErr } = await supabase.rpc("marketing_schedule_campaign", {
          p_subject: subject,
          p_html: sendHtml,
          p_audience: audience,
          p_scheduled_for: state.scheduledISO,
          p_segment_id: audience === "segment" ? segmentId : null,
          p_category:
            audience === "opted_in_users" ||
            audience === "all_users" ||
            audience === "segment"
              ? category
              : null,
          p_test_recipient: null,
          p_subject_ar: sendSubjectAr,
          p_html_ar: sendHtmlAr,
        });
        if (rpcErr) toast.error(rpcErr.message);
        else {
          toast.success(
            fmt(t.scheduledToast, {
              when: new Date(state.scheduledISO).toLocaleString(),
              id: String(data ?? ""),
            }),
          );
          setScheduleRefresh((n) => n + 1);
        }
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error(t.errors.notAuthenticated);
        return;
      }

      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject,
          html: sendHtml,
          audience,
          testRecipient: audience === "test" ? testRecipient : undefined,
          testLocale: audience === "test" && enableAr ? testLocale : undefined,
          category:
            audience === "opted_in_users" ||
            audience === "all_users" ||
            audience === "segment"
              ? category
              : undefined,
          segmentId: audience === "segment" ? segmentId : undefined,
          subject_ar: sendSubjectAr ?? undefined,
          html_ar: sendHtmlAr ?? undefined,
        }),
      });

      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        successful?: number;
        failed?: number;
        totalRecipients?: number;
        campaignId?: string;
      };
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? `HTTP ${res.status}`);
      } else {
        toast.success(
          fmt(t.sentToast, {
            success: body.successful ?? 0,
            failed: body.failed ?? 0,
            total: body.totalRecipients ?? 0,
            id: body.campaignId ?? "",
          }),
        );
        setRecentRefresh((n) => n + 1);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  const targetModeLabel = (m: EditorMode) => (m === "blocks" ? t.modeBlocks : t.modeHtml);

  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/library`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">←</span>
        {dict.marketing.common.library}
      </Link>

      <header className="mt-6">
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {dict.marketing.common.eyebrow}
        </p>
        <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
          {t.title}
        </h1>
        <p className="mt-2 max-w-prose font-sans text-body-s text-warm-shadow">
          {t.subtitle}{" "}
          <Link href={`/${lang}/marketing/segments`} className="text-glyph-gold underline-offset-2 hover:underline">
            {t.subtitleSegments}
          </Link>
          {" · "}
          <Link
            href={`/${lang}/marketing/automations`}
            className="text-glyph-gold underline-offset-2 hover:underline"
          >
            {t.subtitleAutomations}
          </Link>
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        {/* Templates */}
        <Field label={t.templatesLabel} hint={t.templatesHint}>
          <TemplatesPanel
            currentSubject={subject}
            currentMode={mode}
            currentBlocks={blocks}
            currentHtml={html}
            dict={dict}
            onLoad={({ subject: s, mode: m, blocks: b, html: h }) => {
              setSubject(s);
              setMode(m);
              if (m === "blocks") setBlocks(b ?? defaultBlocks());
              else setHtml(h ?? "");
            }}
          />
        </Field>

        {/* Audience */}
        <div className="mt-6">
          <p className="mb-2 font-display label-sm uppercase text-accent-dark/80">{t.audienceLabel}</p>
          <div className="grid gap-2">
            <AudienceOption
              value="test"
              audience={audience}
              setAudience={setAudience}
              label={t.audience.test}
              count={fmt(dict.marketing.common.recipients, { count: 1 })}
            />
            <AudienceOption
              value="subscribers"
              audience={audience}
              setAudience={setAudience}
              label={t.audience.subscribers}
              count={counts ? fmt(dict.marketing.common.recipients, { count: counts.subscribers }) : "..."}
            />
            <AudienceOption
              value="opted_in_users"
              audience={audience}
              setAudience={setAudience}
              label={t.audience.opted_in_users}
              count={counts ? fmt(dict.marketing.common.recipients, { count: counts.opted_in_users }) : "..."}
            />
            <AudienceOption
              value="all_users"
              audience={audience}
              setAudience={setAudience}
              label={t.audience.all_users}
              count={counts ? fmt(dict.marketing.common.recipients, { count: counts.all_users }) : "..."}
              warn
              warnText={t.audienceWarning}
            />
            <AudienceOption
              value="segment"
              audience={audience}
              setAudience={setAudience}
              label={t.audience.segment}
              count={segments.length === 0 ? t.noSegments : fmt(t.segmentsAvailable, { count: segments.length })}
            />
          </div>
          {audience === "segment" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select value={segmentId} onChange={(e) => setSegmentId(e.target.value)} className="flex-1">
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {segmentCounts[s.id] != null
                      ? ` ${fmt(t.segmentRecipients, { count: segmentCounts[s.id] })}`
                      : ""}
                  </option>
                ))}
              </Select>
              <Link
                href={`/${lang}/marketing/segments`}
                className="font-display label-xs uppercase text-glyph-gold hover:underline"
              >
                {t.manageSegments}
              </Link>
            </div>
          )}
        </div>

        {/* Category */}
        {(audience === "opted_in_users" || audience === "all_users" || audience === "segment") && (
          <div className="mt-6">
            <Field
              label={t.categoryLabel}
              hint={`${t.categoryHint}${audience === "all_users" ? " " + t.categoryAllUsersWarn : ""}`}
            >
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
              >
                <option value="product_updates">{dict.marketing.categories.product_updates}</option>
                <option value="training_tips">{dict.marketing.categories.training_tips}</option>
                <option value="promotions">{dict.marketing.categories.promotions}</option>
              </Select>
            </Field>
          </div>
        )}

        {/* Test recipient */}
        {audience === "test" && (
          <div className="mt-6">
            <Field label={t.testRecipientLabel}>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder={t.testRecipientPlaceholder}
                  className="min-w-[200px] flex-1"
                />
                {savedTestAddresses.length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setTestRecipient(e.target.value);
                    }}
                    className="h-11 rounded-xl border border-accent-dark/15 bg-cream px-3 font-sans text-body-s text-accent-dark"
                  >
                    <option value="">{t.savedAddresses}</option>
                    {savedTestAddresses.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  title={t.saveAddressTitle}
                  onClick={() => {
                    if (!testRecipient) return;
                    const next = [testRecipient, ...savedTestAddresses.filter((a) => a !== testRecipient)];
                    setSavedTestAddresses(next);
                    saveTestAddresses(next);
                  }}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-accent-dark/15 bg-cream px-3 py-2 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
                >
                  {t.saveAddress}
                </button>
                {savedTestAddresses.includes(testRecipient) && (
                  <button
                    type="button"
                    title={t.forgetAddressTitle}
                    onClick={() => {
                      const next = savedTestAddresses.filter((a) => a !== testRecipient);
                      setSavedTestAddresses(next);
                      saveTestAddresses(next);
                    }}
                    className="inline-flex min-h-[40px] items-center rounded-full border border-error/40 bg-error/10 px-3 py-2 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white"
                  >
                    {t.forgetAddress}
                  </button>
                )}
              </div>
              {enableAr && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-sans text-body-xs text-warm-shadow">{t.testAsLocale}</span>
                  <select
                    value={testLocale}
                    onChange={(e) => setTestLocale(e.target.value as "en" | "ar")}
                    className="h-9 rounded-md border border-accent-dark/15 bg-cream px-2 font-sans text-body-xs text-accent-dark"
                  >
                    <option value="en">{t.localeEn}</option>
                    <option value="ar">{t.localeAr}</option>
                  </select>
                </div>
              )}
            </Field>
          </div>
        )}

        {/* AR variant + lang tab */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-body-s text-accent-dark">
            <input
              type="checkbox"
              checked={enableAr}
              onChange={(e) => {
                setEnableAr(e.target.checked);
                if (!e.target.checked) setLangTab("en");
              }}
              className="h-4 w-4 accent-glyph-gold"
            />
            {t.addArVariant}
          </label>
          {enableAr && (
            <div className="flex gap-1">
              {(["en", "ar"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLangTab(l)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 font-display label-xs uppercase ${
                    langTab === l
                      ? "border-glyph-gold/60 bg-glyph-gold/15 text-accent-dark"
                      : "border-accent-dark/15 bg-cream text-accent-dark/70"
                  }`}
                >
                  {l === "en" ? t.tabEnglish : t.tabArabic}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="mt-4">
          <Field
            label={`${t.subjectLabel}${enableAr ? " " + fmt(t.subjectVariantSuffix, { lang: langTab.toUpperCase() }) : ""}`}
          >
            <Input
              type="text"
              value={activeSubject}
              onChange={(e) => setActiveSubject(e.target.value)}
              placeholder={t.subjectPlaceholder}
              dir={isAr ? "rtl" : "ltr"}
              className={isAr ? "text-right" : ""}
            />
          </Field>
        </div>

        {/* Merge tags hint */}
        <div className="mt-4">
          <p className="font-sans text-body-xs text-warm-shadow">
            {t.mergeTagsHintPre}
            <code className="rounded bg-accent-dark/8 px-1.5 py-0.5 font-mono text-[11px]">{`{{tag|"fallback"}}`}</code>
            {t.mergeTagsHintPost}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MERGE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => navigator.clipboard?.writeText(`{{${tag}}}`)}
                title={fmt(t.copyTag, { tag: `{{${tag}}}` })}
                className="rounded-md border border-glyph-gold/40 bg-glyph-gold/10 px-2 py-1 font-mono text-[11px] text-accent-dark transition-colors hover:bg-glyph-gold/20"
              >
                {`{{${tag}}}`}
              </button>
            ))}
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText('{{first_name|"there"}}')}
              className="rounded-md border border-glyph-gold/40 bg-glyph-gold/10 px-2 py-1 font-mono text-[11px] text-accent-dark transition-colors hover:bg-glyph-gold/20"
            >
              {`{{first_name|"there"}}`}
            </button>
          </div>
          {unknownTags.length > 0 && (
            <p className="mt-1 font-sans text-body-xs text-warning">
              {fmt(t.unknownTags, {
                count: unknownTags.length,
                tags: unknownTags.map((tag) => `{{${tag}}}`).join(", "),
              })}
            </p>
          )}
        </div>

        {/* Mode toggle + composer/raw */}
        <div className="mt-6">
          <div className="mb-3 inline-flex rounded-full bg-accent-dark/8 p-1">
            {(["blocks", "html"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeToggle(m)}
                className={`rounded-full px-4 py-1.5 font-display label-xs uppercase transition-colors ${
                  mode === m ? "bg-glyph-gold text-accent-dark" : "text-accent-dark/70"
                }`}
              >
                {m === "blocks" ? t.modeBlocks : t.modeHtml}
              </button>
            ))}
          </div>
          {mode === "blocks" ? (
            <BlockComposer blocks={activeBlocks} onChange={setActiveBlocks} dict={dict} />
          ) : (
            <>
              <p className="mb-2 font-sans text-body-xs text-warm-shadow">
                {t.rawHtmlHintPre}
                <code className="rounded bg-accent-dark/8 px-1.5 py-0.5 font-mono text-[11px]">
                  {"{{unsubscribe_url}}"}
                </code>
                {t.rawHtmlHintPost}
              </p>
              <Textarea
                value={activeRawHtml}
                onChange={(e) => setActiveRawHtml(e.target.value)}
                dir={isAr ? "rtl" : "ltr"}
                rows={16}
                className="font-mono text-[12px]"
              />
            </>
          )}
        </div>

        {/* Schedule */}
        {audience !== "test" && (
          <div className="mt-4 rounded-xl border border-accent-dark/10 bg-cream/40 p-3">
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-body-s text-accent-dark">
                <input
                  type="radio"
                  name="sendMode"
                  checked={sendMode === "now"}
                  onChange={() => setSendMode("now")}
                  className="h-4 w-4 accent-glyph-gold"
                />
                {t.sendNow}
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 font-sans text-body-s text-accent-dark">
                <input
                  type="radio"
                  name="sendMode"
                  checked={sendMode === "schedule"}
                  onChange={() => setSendMode("schedule")}
                  className="h-4 w-4 accent-glyph-gold"
                />
                {t.scheduleFor}
              </label>
              {sendMode === "schedule" && (
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className={inputCls + " w-auto"}
                />
              )}
            </div>
            {sendMode === "schedule" && (
              <p className="mt-2 font-sans text-body-xs text-warm-shadow">{t.scheduleHint}</p>
            )}
          </div>
        )}

        {/* Estimate */}
        {audience !== "test" &&
          (() => {
            const c = recipientCount();
            return (
              <p className="mt-3 font-sans text-body-xs text-warm-shadow">
                {fmt(t.estimateRecipients, { count: c.toLocaleString() })}
                {c > 0 && (
                  <>
                    {" · "}
                    {fmt(t.estimateCost, { cost: (c * 0.0004).toFixed(2) })}
                  </>
                )}
                {c > 100 && (
                  <span className="text-warning">
                    {" "}
                    · {t.estimateLargeSend}
                  </span>
                )}
              </p>
            );
          })()}

        {/* Issues */}
        {sendIssues.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 font-sans text-body-s text-accent-dark"
          >
            <strong className="block font-display label-xs uppercase text-warning">
              {t.validation.heading}
            </strong>
            <ul className="ml-5 mt-1 list-disc">
              {sendIssues.map((issue, i) => (
                <li key={`${i}-${issue}`}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Send + Preview */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSendClick}
            disabled={sending || sendIssues.length > 0}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending
              ? sendMode === "schedule" && audience !== "test"
                ? t.schedulingButton
                : t.sendingButton
              : audience === "test"
                ? t.sendTest
                : sendMode === "schedule"
                  ? t.scheduleCampaign
                  : t.sendCampaign}
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent-dark/15 bg-cream px-5 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
          >
            {showPreview ? t.hidePreview : t.showPreview}
          </button>
        </div>
      </section>

      {/* Preview */}
      {showPreview && (
        <section className="mt-4 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
          <h3 className="m-0 font-display label-md uppercase text-accent-dark">{t.previewLabel}</h3>
          <div className="mt-3 rounded-md bg-accent-dark/8 px-3 py-2 font-sans text-body-s text-accent-dark">
            <strong>{t.previewSubject}</strong>{" "}
            {previewSubject || <em className="text-warm-shadow">{t.previewEmpty}</em>}
          </div>
          {sampleRecipient ? (
            <p className="mt-2 font-sans text-body-xs text-glyph-gold">
              {fmt(t.previewPersonalized, { email: sampleRecipient.email ?? "" })}
              {sampleRecipient.first_name ? ` (${sampleRecipient.first_name})` : ""}
              {sampleRecipient.current_level != null
                ? ` · ${fmt(t.previewLevel, { level: sampleRecipient.current_level })}`
                : ""}
            </p>
          ) : audience !== "test" && audience !== "subscribers" ? (
            <p className="mt-2 font-sans text-body-xs text-warning">{t.previewNoSample}</p>
          ) : null}
          <iframe
            srcDoc={
              isAr
                ? `<html dir="rtl" lang="ar"><body style="margin:0">${previewHtml}</body></html>`
                : previewHtml
            }
            title={t.previewIframeTitle}
            sandbox=""
            className="mt-3 h-[600px] w-full rounded-md border border-accent-dark/15 bg-white"
          />
          {enableAr && (
            <p className="mt-2 font-sans text-body-xs text-warm-shadow">
              {langTab === "ar" ? t.previewVariantArabic : t.previewVariantEnglish}
            </p>
          )}
        </section>
      )}

      {/* Scheduled */}
      <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <h2 className="font-display label-md uppercase text-accent-dark">{t.scheduledTitle}</h2>
        <p className="mt-1 font-sans text-body-xs text-warm-shadow">{t.scheduledSubtitle}</p>
        <div className="mt-3">
          <ScheduledCampaignsPanel refreshKey={scheduleRefresh} dict={dict} />
        </div>
      </section>

      {/* Recent */}
      <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <h2 className="font-display label-md uppercase text-accent-dark">{t.recentTitle}</h2>
        <p className="mt-1 font-sans text-body-xs text-warm-shadow">{t.recentSubtitle}</p>
        <div className="mt-3">
          <RecentCampaignsPanel refreshKey={recentRefresh} dict={dict} />
        </div>
      </section>

      {/* Suppressions */}
      <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <h2 className="font-display label-md uppercase text-accent-dark">{t.suppressionsTitle}</h2>
        <p className="mt-1 font-sans text-body-xs text-warm-shadow">{t.suppressionsSubtitle}</p>
        <div className="mt-3">
          <SuppressionsPanel dict={dict} />
        </div>
      </section>

      {/* Reminders */}
      <aside className="mt-6 rounded-2xl border border-glyph-gold/30 bg-glyph-gold/10 p-5 font-sans text-body-s text-accent-dark">
        <strong>{t.remindersTitle}</strong>
        <ul className="ml-5 mt-2 list-disc space-y-1">
          <li>
            {t.reminderSenderPre}
            <code className="rounded bg-accent-dark/10 px-1.5 py-0.5 font-mono text-[11px]">
              {t.reminderSenderCode}
            </code>
            {t.reminderSenderPost}
          </li>
          <li>{t.reminderRouting}</li>
          <li>{t.reminderTest}</li>
        </ul>
      </aside>

      {/* Mode switch confirm */}
      <ConfirmDialog
        open={modeSwitchTarget != null}
        title={
          modeSwitchTarget
            ? fmt(t.modeSwitch.title, { target: targetModeLabel(modeSwitchTarget) })
            : ""
        }
        description={fmt(t.modeSwitch.message, { current: targetModeLabel(mode) })}
        confirmLabel={
          modeSwitchTarget
            ? fmt(t.modeSwitch.confirm, { target: targetModeLabel(modeSwitchTarget) })
            : ""
        }
        cancelLabel={dict.common.cancel}
        onConfirm={() => {
          if (modeSwitchTarget) setMode(modeSwitchTarget);
          setModeSwitchTarget(null);
        }}
        onCancel={() => setModeSwitchTarget(null)}
      />

      {/* Send confirm */}
      <ConfirmDialog
        open={sendConfirm?.open ?? false}
        title={sendConfirm?.title ?? ""}
        description={sendConfirm?.message ?? ""}
        confirmLabel={sendConfirm?.confirmLabel ?? ""}
        cancelLabel={dict.common.cancel}
        destructive={sendConfirm?.destructive}
        onConfirm={() => sendConfirm && void performSend(sendConfirm)}
        onCancel={() => setSendConfirm(null)}
      />
    </div>
  );
}

function AudienceOption({
  value,
  audience,
  setAudience,
  label,
  count,
  warn,
  warnText,
}: {
  value: Audience;
  audience: Audience;
  setAudience: (a: Audience) => void;
  label: string;
  count: string;
  warn?: boolean;
  warnText?: string;
}) {
  const checked = audience === value;
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        checked
          ? warn
            ? "border-warning/60 bg-warning/10"
            : "border-glyph-gold/60 bg-glyph-gold/10"
          : "border-accent-dark/10 bg-cream/40"
      }`}
    >
      <input
        type="radio"
        name="audience"
        value={value}
        checked={checked}
        onChange={() => setAudience(value)}
        className="h-4 w-4 accent-glyph-gold"
      />
      <span className="flex-1">
        <span className="block font-sans text-body-s font-semibold text-accent-dark">{label}</span>
        <span className="mt-0.5 block font-sans text-body-xs text-warm-shadow">{count}</span>
        {warn && checked && warnText && (
          <span className="mt-1 block font-sans text-body-xs text-warning">{warnText}</span>
        )}
      </span>
    </label>
  );
}
