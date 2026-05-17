"use client";

import { useEffect, type ReactNode } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Spinner } from "../../_components/primitives/Spinner";

type Role = "any" | "admin" | "coach";

function useLoginHref() {
  const params = useParams<{ lang?: string }>();
  const pathname = usePathname();
  const lang = params?.lang ?? "ar";
  const next = encodeURIComponent(pathname);
  return `/${lang}/login?next=${next}`;
}

function Gate({ children, role }: { children: ReactNode; role: Role }) {
  const { loading, isAuthenticated, isAdmin, isCoach, profileLoading, orgsLoading } =
    useAuth();
  const router = useRouter();
  const loginHref = useLoginHref();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) router.replace(loginHref);
  }, [loading, isAuthenticated, router, loginHref]);

  if (loading || (role !== "any" && (profileLoading || orgsLoading))) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (role === "admin" && !isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center font-sans text-body-m text-accent-dark/70">
        You don&apos;t have access to this page.
      </div>
    );
  }
  if (role === "coach" && !isCoach) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center font-sans text-body-m text-accent-dark/70">
        You need an academy role to view this page.
      </div>
    );
  }
  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <Gate role="any">{children}</Gate>;
}

export function AdminProtectedRoute({ children }: { children: ReactNode }) {
  return <Gate role="admin">{children}</Gate>;
}

export function AcademyProtectedRoute({ children }: { children: ReactNode }) {
  return <Gate role="coach">{children}</Gate>;
}
