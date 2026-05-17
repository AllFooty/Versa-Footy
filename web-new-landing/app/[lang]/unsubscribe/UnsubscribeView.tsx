"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../_lib/supabase";
import { Spinner } from "../../_components/primitives/Spinner";
import type { ProductDict } from "../../_dictionaries/product";
import type { Locale } from "../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

type Status = "loading" | "success" | "already" | "error";

export function UnsubscribeView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.unsubscribe;
  const search = useSearchParams();
  const token = search?.get("token") ?? null;

  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t.errors.missingToken);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("unsubscribe_by_token", {
        p_token: token,
      });
      if (cancelled) return;
      if (error) {
        setStatus("error");
        setErrorMessage(error.message || t.errors.generic);
        return;
      }
      const payload = data as {
        ok?: boolean;
        error?: string;
        email?: string;
        already_unsubscribed?: boolean;
      } | null;
      if (!payload?.ok) {
        setStatus("error");
        setErrorMessage(
          payload?.error === "token_not_found"
            ? t.errors.invalidToken
            : t.errors.generic,
        );
        return;
      }
      if (payload.already_unsubscribed) {
        setStatus("already");
        return;
      }
      setEmail(payload.email ?? null);
      setStatus("success");
    })();
    return () => {
      cancelled = true;
    };
  }, [token, t.errors.generic, t.errors.invalidToken, t.errors.missingToken]);

  return (
    <div className="relative z-10 w-full max-w-md rounded-3xl border border-cream/15 bg-accent-dark/70 p-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md md:p-10">
      <p className="font-display uppercase label-xs text-glyph-gold/80">Versa Footy</p>

      {status === "loading" && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <Spinner size={28} />
          <p className="font-sans text-body-m text-cream/75">{t.processing}</p>
        </div>
      )}

      {status === "success" && (
        <>
          <h1 className="mt-3 font-display font-black uppercase leading-[1.05] text-[clamp(24px,3.6vw,32px)] text-cream">
            {t.successHeading}
          </h1>
          <p className="mt-4 font-sans text-body-m text-cream/80">
            {email
              ? fmt(t.successWithEmail, { email })
              : t.successNoEmail}
          </p>
          <p className="mt-5 font-sans text-body-s text-cream/55">
            {t.transactionalNote}
          </p>
        </>
      )}

      {status === "already" && (
        <>
          <h1 className="mt-3 font-display font-black uppercase leading-[1.05] text-[clamp(24px,3.6vw,32px)] text-cream">
            {t.alreadyHeading}
          </h1>
          <p className="mt-4 font-sans text-body-m text-cream/80">{t.alreadyBody}</p>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="mt-3 font-display font-black uppercase leading-[1.05] text-[clamp(24px,3.6vw,32px)] text-cream">
            {t.errorHeading}
          </h1>
          <p className="mt-4 font-sans text-body-m text-cream/80">{errorMessage}</p>
          <p className="mt-4 font-sans text-body-s text-cream/55">
            {t.supportFallback}
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
