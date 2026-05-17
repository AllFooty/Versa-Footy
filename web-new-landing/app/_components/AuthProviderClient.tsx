"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "../_lib/auth/AuthProvider";
import { Toaster } from "./primitives/Toast";

export function AuthProviderClient({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
