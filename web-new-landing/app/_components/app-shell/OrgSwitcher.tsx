"use client";

import { useAuth } from "../../_lib/auth/AuthProvider";
import type { ProductDict } from "../../_dictionaries/product";

export function OrgSwitcher({ dict }: { dict: ProductDict }) {
  const { organizations, activeOrg, setActiveOrg } = useAuth();

  if (!organizations.length) {
    return (
      <span className="font-sans text-body-s text-cream/60">
        {dict.shell.orgSwitcher.empty}
      </span>
    );
  }

  return (
    <select
      aria-label={dict.shell.orgSwitcher.ariaLabel}
      value={activeOrg?.id ?? ""}
      onChange={(e) => {
        const next = organizations.find((o) => o.id === e.target.value) ?? null;
        setActiveOrg(next);
      }}
      className="h-9 rounded-full border border-cream/20 bg-transparent px-3 font-sans text-body-s text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-glyph-gold"
    >
      {organizations.map((o) => (
        <option key={o.id} value={o.id} className="bg-accent-dark text-cream">
          {o.name}
        </option>
      ))}
    </select>
  );
}
