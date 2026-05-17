"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CategoryRadarPoint,
  DailyActivity,
  WeeklyTrendPoint,
} from "../../../../../_lib/academy/usePlayerDetail";

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

function Empty({ label }: { label: string }) {
  return (
    <p className="grid h-[260px] place-items-center font-sans text-body-s text-warm-shadow">
      {label}
    </p>
  );
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 h-[260px]">{children}</div>;
}

function RadarChart({
  data,
  emptyLabel,
}: {
  data: CategoryRadarPoint[];
  emptyLabel: string;
}) {
  const hasData =
    data.length > 0 && data.some((c) => (c.masteryPercent || 0) > 0);
  if (!hasData) return <Empty label={emptyLabel} />;
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data}>
          <PolarGrid stroke={gridStroke} />
          <PolarAngleAxis dataKey="category" tick={tickStyle} />
          <PolarRadiusAxis tick={tickStyle} domain={[0, 100]} />
          <Radar
            dataKey="masteryPercent"
            name="Mastery %"
            stroke="var(--color-deep-teal)"
            fill="var(--color-deep-teal)"
            fillOpacity={0.25}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function ActivityBars({
  data,
  xpLabel,
  emptyLabel,
}: {
  data: DailyActivity[];
  xpLabel: string;
  emptyLabel: string;
}) {
  const hasData = data.length > 0 && data.some((d) => (d.xp_earned || 0) > 0);
  if (!hasData) return <Empty label={emptyLabel} />;
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="activity_date"
            tick={tickStyle}
            tickFormatter={(d: string) =>
              new Date(d).toLocaleDateString("en", {
                month: "short",
                day: "numeric",
              })
            }
            interval={14}
            axisLine={{ stroke: gridStroke }}
            tickLine={false}
          />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={{ color: "rgb(36,23,15)" }}
          />
          <Bar
            dataKey="xp_earned"
            name={xpLabel}
            fill="var(--color-success)"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function WeeklyLine({
  data,
  xpLabel,
}: {
  data: WeeklyTrendPoint[];
  xpLabel: string;
}) {
  return (
    <ChartFrame>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="xp"
            name={xpLabel}
            stroke="var(--color-deep-teal)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-deep-teal)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function WeeklyBars({
  data,
  minutesLabel,
}: {
  data: WeeklyTrendPoint[];
  minutesLabel: string;
}) {
  return (
    <ChartFrame>
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
            dataKey="minutes"
            name={minutesLabel}
            fill="var(--color-glyph-gold)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export const PlayerCharts = {
  RadarChart,
  ActivityBars,
  WeeklyLine,
  WeeklyBars,
};
