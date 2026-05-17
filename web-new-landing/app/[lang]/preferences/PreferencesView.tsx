"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../_lib/supabase";
import { Button } from "../../_components/primitives/Button";
import { Checkbox } from "../../_components/primitives/Checkbox";
import { Spinner } from "../../_components/primitives/Spinner";
import type { ProductDict } from "../../_dictionaries/product";
import type { Locale } from "../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

type Status = "loading" | "ready" | "saved" | "error";
type Prefs = { product_updates: boolean; training_tips: boolean; promotions: boolean };

const CATEGORY_KEYS: (keyof Prefs)[] = [
  "product_updates",
  "training_tips",
  "promotions",
];

export function PreferencesView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.preferences;
  const search = useSearchParams();
  const token = search?.get("token") ?? null;

  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [kind, setKind] = useState<"user" | "waitlist" | string>("user");
  const [prefs, setPrefs] = useState<Prefs>({
    product_updates: true,
    training_tips: true,
    promotions: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t.errors.missingToken);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_preferences_by_token", {
        p_token: token,
      });
      if (cancelled) return;
      if (error) {
        setStatus("error");
        setErrorMessage(error.message || t.errors.loadFailed);
        return;
      }
      const payload = data as {
        ok?: boolean;
        error?: string;
        email?: string;
        kind?: string;
        preferences?: Partial<Prefs>;
        unsubscribed?: boolean;
      } | null;
      if (!payload?.ok) {
        setStatus("error");
        setErrorMessage(
          payload?.error === "token_not_found"
            ? t.errors.invalidToken
            : t.errors.loadFailed,
        );
        return;
      }
      setEmail(payload.email ?? null);
      setKind(payload.kind ?? "user");
      if (payload.kind === "user" && payload.preferences) {
        setPrefs({
          product_updates: payload.preferences.product_updates !== false,
          training_tips: payload.preferences.training_tips !== false,
          promotions: payload.preferences.promotions !== false,
        });
      }
      if (payload.unsubscribed) {
        setPrefs({ product_updates: false, training_tips: false, promotions: false });
      }
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t.errors.invalidToken, t.errors.loadFailed, t.errors.missingToken]);

  const save = async (next: Prefs) => {
    setSaving(true);
    setErrorMessage("");
    const { data, error } = await supabase.rpc("update_preferences_by_token", {
      p_token: token,
      p_prefs: next,
    });
    setSaving(false);
    const payload = data as { ok?: boolean; error?: string } | null;
    if (error || !payload?.ok) {
      setErrorMessage(error?.message || payload?.error || t.errors.saveFailed);
      return;
    }
    setStatus("saved");
  };

  const toggle = (key: keyof Prefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setStatus("ready");
  };

  const handleUnsubAll = async () => {
    const next: Prefs = {
      product_updates: false,
      training_tips: false,
      promotions: false,
    };
    setPrefs(next);
    await save(next);
  };

  return (
    <div className="relative z-10 w-full max-w-xl rounded-3xl border border-cream/15 bg-accent-dark/70 p-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md md:p-10">
      <p className="font-display uppercase label-xs text-glyph-gold/80">Versa Footy</p>

      {status === "loading" && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <Spinner size={28} />
          <p className="font-sans text-body-m text-cream/75">{t.loadingTitle}</p>
        </div>
      )}

      {status === "error" && (
        <>
          <h1 className="mt-3 font-display font-black uppercase leading-[1.05] text-[clamp(24px,3.6vw,32px)] text-cream">
            {t.title}
          </h1>
          <p className="mt-4 font-sans text-body-m text-cream/80">{errorMessage}</p>
          <p className="mt-4 font-sans text-body-s text-cream/55">
            {t.supportFallback}
          </p>
        </>
      )}

      {(status === "ready" || status === "saved") && (
        <>
          <h1 className="mt-3 font-display font-black uppercase leading-[1.05] text-[clamp(26px,4vw,36px)] text-cream">
            {t.title}
          </h1>
          <p className="mt-4 font-sans text-body-m text-cream/80">
            {kind === "user"
              ? email
                ? fmt(t.introUser, { email })
                : t.introUserNoEmail
              : t.introWaitlist}
          </p>

          {kind === "user" && (
            <div className="mt-7 flex flex-col gap-3 text-start">
              {CATEGORY_KEYS.map((key) => {
                const cat = t.categories[key];
                return (
                  <label
                    key={key}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-cream/10 bg-cream/[0.05] p-4 transition-colors hover:bg-cream/10"
                  >
                    <Checkbox
                      checked={prefs[key]}
                      onChange={() => toggle(key)}
                      disabled={saving}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-display uppercase label-sm font-bold text-cream">
                        {cat.label}
                      </span>
                      <span className="mt-1 block font-sans text-body-s text-cream/65">
                        {cat.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              onClick={() => save(prefs)}
              disabled={saving}
            >
              {saving ? t.saving : t.save}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleUnsubAll}
              disabled={saving}
              className="!border-cream/30 !text-cream hover:!bg-cream/10 hover:!text-cream"
            >
              {t.unsubAll}
            </Button>
          </div>

          {status === "saved" && (
            <p className="mt-5 font-sans text-body-s text-success">
              ✓ {t.saved}
            </p>
          )}
          {errorMessage && (
            <p className="mt-3 font-sans text-body-s text-error">{errorMessage}</p>
          )}

          <p className="mt-6 font-sans text-body-s text-cream/55">
            {t.transactionalNote}
          </p>
        </>
      )}

      <p className="mt-8 font-sans text-body-s text-cream/55">
        <Link
          href={`/${lang}`}
          className="transition-colors hover:text-glyph-gold focus:outline-none focus-visible:text-glyph-gold"
        >
          ← {t.backToHome}
        </Link>
      </p>
    </div>
  );
}
