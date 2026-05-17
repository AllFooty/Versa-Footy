"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "../../_lib/supabase";
import { useAuth } from "../../_lib/auth/AuthProvider";
import { Button } from "../../_components/primitives/Button";
import { Input } from "../../_components/primitives/Input";
import { Field } from "../../_components/primitives/Field";
import { Spinner } from "../../_components/primitives/Spinner";
import { toast } from "../../_components/primitives/Toast";
import type { ProductDict } from "../../_dictionaries/product";
import type { Locale } from "../../_dictionaries";

type Step = "email" | "otp" | "success";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function safeNext(raw: string | null, lang: Locale): string {
  if (!raw) return `/${lang}/home`;
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  } catch {}
  return `/${lang}/home`;
}

export function LoginForm({ dict, lang }: { dict: ProductDict; lang: Locale }) {
  const t = dict.login;
  const router = useRouter();
  const search = useSearchParams();
  const nextHref = safeNext(search?.get("next") ?? null, lang);

  const { isAuthenticated, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showDev, setShowDev] = useState(false);
  const [devPassword, setDevPassword] = useState("");

  useEffect(() => () => {
    if (resendTimer.current) clearInterval(resendTimer.current);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const id = setTimeout(() => router.replace(nextHref), 80);
      return () => clearTimeout(id);
    }
  }, [isAuthenticated, authLoading, router, nextHref]);

  const startResendCooldown = () => {
    setResendCooldown(30);
    if (resendTimer.current) clearInterval(resendTimer.current);
    resendTimer.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (resendTimer.current) clearInterval(resendTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t.errors.enterEmail);
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setEmailError(t.errors.invalidEmail);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: { shouldCreateUser: true },
      });
      if (error) {
        toast.error(error.message);
      } else {
        setEmail(trimmed);
        setStep("otp");
        toast.success(t.codeSent);
      }
    } catch {
      toast.error(t.errors.generic);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    const code = otp.trim();
    if (!code) {
      setOtpError(t.errors.enterOtp);
      return;
    }
    if (code.length !== 6) {
      setOtpError(t.errors.enterOtp6Digit);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "email",
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else if (data.session) {
        setStep("success");
      }
    } catch {
      toast.error(t.errors.generic);
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t.newCodeSent);
        startResendCooldown();
      }
    } catch {
      toast.error(t.errors.resendFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setOtpError("");
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: devPassword,
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      } else if (data.session) {
        setStep("success");
      }
    } catch {
      toast.error(t.errors.generic);
      setLoading(false);
    }
  };

  const showDevToggle =
    typeof window !== "undefined" &&
    !/\.versafooty\.com$/.test(window.location.hostname);

  return (
    <div className="relative w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-3xl border border-cream/15 bg-accent-dark/70 p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] backdrop-blur-md md:p-10"
      >
        {step !== "success" && (
          <>
            <p className="font-display uppercase label-xs text-glyph-gold/80">
              {step === "email" ? t.eyebrowEmail : t.eyebrowOtp}
            </p>
            <h1 className="mt-3 font-display font-black uppercase leading-[1.02] tracking-[-0.01em] text-[clamp(28px,4.5vw,40px)] text-cream">
              {step === "email" ? t.titleEmail : t.titleOtp}
            </h1>
            <p className="mt-3 font-sans text-body-m leading-relaxed text-cream/70">
              {step === "email"
                ? t.subtitleEmail
                : fmt(t.subtitleOtp, { email })}
            </p>
          </>
        )}

        {step === "success" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Spinner size={32} />
            <p className="mt-4 font-sans text-body-m text-cream/80">{t.success}</p>
          </div>
        ) : step === "email" ? (
          <form onSubmit={handleSendOtp} className="mt-7 flex flex-col gap-5">
            <Field label={t.emailLabel} htmlFor="email" error={emailError}>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t.emailPlaceholder}
                autoComplete="email"
                autoFocus
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={!!emailError}
                className="!bg-cream/10 !border-cream/15 !text-cream placeholder:!text-cream/40 focus:!border-glyph-gold"
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t.sendingCode : t.sendCode}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-7 flex flex-col gap-5">
            <Field label={t.codeLabel} htmlFor="otp" error={otpError}>
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                disabled={loading}
                placeholder={t.codePlaceholder}
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                invalid={!!otpError}
                className="!bg-cream/10 !border-cream/15 !text-cream text-center !text-[24px] tracking-[0.5em] font-display placeholder:!text-cream/30 focus:!border-glyph-gold"
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" disabled={loading}>
              {loading ? t.verifying : t.verify}
            </Button>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendCooldown > 0}
                className="font-sans text-body-s text-cream/70 transition-colors hover:text-glyph-gold disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:text-glyph-gold"
              >
                {resendCooldown > 0
                  ? fmt(t.resendCooldown, { seconds: resendCooldown })
                  : t.resend}
              </button>
              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={loading}
                className="font-sans text-body-s text-cream/55 transition-colors hover:text-cream disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:text-cream"
              >
                {t.useDifferentEmail}
              </button>
            </div>
          </form>
        )}

        {step !== "success" && showDevToggle && (
          <div className="mt-8 border-t border-cream/10 pt-5">
            <button
              type="button"
              onClick={() => setShowDev((v) => !v)}
              className="w-full font-display uppercase label-xs text-glyph-gold/70 transition-colors hover:text-glyph-gold focus:outline-none"
            >
              {showDev ? `▾ ${t.devToggleHide}` : `▸ ${t.devToggleShow}`}
            </button>
            {showDev && (
              <form onSubmit={handleDevLogin} className="mt-4 flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="!bg-cream/10 !border-cream/15 !text-cream placeholder:!text-cream/40 focus:!border-glyph-gold"
                />
                <Input
                  type="password"
                  placeholder={t.devPasswordPlaceholder}
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="!bg-cream/10 !border-cream/15 !text-cream placeholder:!text-cream/40 focus:!border-glyph-gold"
                />
                <Button type="submit" variant="secondary" size="md" disabled={loading}>
                  {loading ? t.devSigningIn : t.devSignIn}
                </Button>
              </form>
            )}
          </div>
        )}

        {step !== "success" && (
          <p className="mt-8 text-center font-sans text-body-s text-cream/55">
            <Link
              href={`/${lang}`}
              className="transition-colors hover:text-glyph-gold focus:outline-none focus-visible:text-glyph-gold"
            >
              ← {t.backToHome}
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  );
}
