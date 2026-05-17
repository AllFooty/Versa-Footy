"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../../_lib/supabase";

export type TriggerType = "signup_welcome" | "inactivity" | "level_reached";

export type AutomationListItem = {
  id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown> | null;
  is_active: boolean;
  step_count: number;
  runs_pending: number;
  runs_sent: number;
  runs_failed: number;
};

export type AutomationRow = {
  id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown> | null;
  is_active: boolean;
};

export type StepRow = {
  id: string;
  automation_id: string;
  step_order: number;
  delay_days: number;
  subject: string;
  html: string;
  subject_ar: string | null;
  html_ar: string | null;
  category: string | null;
};

export function useAutomations() {
  const [list, setList] = useState<AutomationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { data, error: rpcError } = await supabase.rpc("marketing_automations_list");
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setError(null);
    setList((data as AutomationListItem[]) ?? []);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, error, reload };
}

export async function toggleAutomationActive(id: string, next: boolean) {
  return supabase.from("marketing_automations").update({ is_active: next }).eq("id", id);
}

export async function deleteAutomation(id: string) {
  return supabase.from("marketing_automations").delete().eq("id", id);
}

export async function loadAutomation(id: string) {
  const [{ data: a, error: aErr }, { data: ss, error: sErr }] = await Promise.all([
    supabase.from("marketing_automations").select("*").eq("id", id).single(),
    supabase
      .from("marketing_automation_steps")
      .select("*")
      .eq("automation_id", id)
      .order("step_order"),
  ]);
  return {
    automation: (a as AutomationRow) ?? null,
    steps: (ss as StepRow[]) ?? [],
    error: aErr?.message ?? sErr?.message ?? null,
  };
}
