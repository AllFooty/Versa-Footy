"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "../../../_components/primitives/Skeleton";
import type { WeeklyActivityPoint } from "../../../_lib/academy/useAcademyDashboard";

type Labels = {
  weeklyActivePlayers: string;
  weeklyXpEarned: string;
  activePlayers: string;
  xp: string;
};

const tickStyle = { fill: "rgb(143, 122, 102)", fontSize: 11 } as const;
const tooltipContentStyle = {
  background: "#fff",
  border: "1px solid rgba(36,23,15,0.12)",
  borderRadius: 12,
  fontSize: 12,
  fontFamily: "var(--font-sans)",
  color: "rgb(36,23,15)",
};
const gridStroke = "rgba(36,23,15,0.08)";

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-accent-dark/10 bg-white p-5">
      <h3 className="mb-4 font-display uppercase label-sm text-warm-shadow">
        {title}
      </h3>
      <div className="h-[240px]">{children}</div>
    </div>
  );
}

export function AcademyCharts({
  data,
  loading,
  labels,
}: {
  data: WeeklyActivityPoint[];
  loading: boolean;
  labels: Labels;
}) {
  if (loading) {
    return (
      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={labels.weeklyActivePlayers}>
          <Skeleton className="h-full w-full" />
        </ChartCard>
        <ChartCard title={labels.weeklyXpEarned}>
          <Skeleton className="h-full w-full" />
        </ChartCard>
      </section>
    );
  }
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title={labels.weeklyActivePlayers}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="week"
              tick={tickStyle}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
            />
            <YAxis
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={tooltipContentStyle}
              labelStyle={{ color: "rgb(36,23,15)" }}
            />
            <Line
              type="monotone"
              dataKey="activePlayers"
              name={labels.activePlayers}
              stroke="var(--color-deep-teal)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-deep-teal)" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={labels.weeklyXpEarned}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="week"
              tick={tickStyle}
              axisLine={{ stroke: gridStroke }}
              tickLine={false}
            />
            <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipContentStyle}
              labelStyle={{ color: "rgb(36,23,15)" }}
            />
            <Bar
              dataKey="totalXp"
              name={labels.xp}
              fill="var(--color-glyph-gold)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
