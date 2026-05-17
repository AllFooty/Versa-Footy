"use client";

import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        className: "!font-sans",
      }}
    />
  );
}
