"use client";

import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import type { TransferYearPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { CHART } from "@/components/charts/palette";
import { AutoSizer } from "@/components/charts/AutoSizer";

/**
 * Seasons before the transfer portal (2018) have no reliable league-wide count,
 * so that segment of the volume line is rendered dashed/muted as low-confidence.
 */
const PORTAL_SEASON = 2018;

/** Split a volume series at the portal boundary so it can render in two styles.
 *  The boundary year is included in BOTH segments so the line stays connected. */
function splitAtPortal<T extends { season: number; total_transfers: number }>(data: T[]) {
  return data.map((d) => ({
    ...d,
    volumePre: d.season <= PORTAL_SEASON ? d.total_transfers : null,
    volumePost: d.season >= PORTAL_SEASON ? d.total_transfers : null,
  }));
}

/** One year on the filterable timeline: league-wide volume + filtered sample. */
export interface TimelinePoint {
  season: number;
  total_transfers: number;
  sample_count: number;
  event: string | null;
}

interface TransferLineChartProps {
  data: TransferYearPoint[];
  /** Compact variant for the home-page teaser (hides axes labels, shorter). */
  compact?: boolean;
  height?: number;
  /** Draw annotated reference lines for portal launch / NIL rules. */
  showEvents?: boolean;
}

interface TooltipPayloadItem {
  payload: TransferYearPoint;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-text-primary">{point.season}</p>
      <p className="text-sm text-text-secondary">
        <span className="font-bold text-accent">{formatNumber(point.total_transfers)}</span> transfers
      </p>
      {point.event && <p className="mt-1 text-xs font-medium text-info">{point.event}</p>}
    </div>
  );
}

export function TransferLineChart({
  data,
  compact = false,
  height = compact ? 200 : 380,
  showEvents = !compact,
}: TransferLineChartProps) {
  const events = showEvents ? data.filter((d) => d.event) : [];
  const chartData = splitAtPortal(data);

  return (
    <AutoSizer height={height}>
      {({ width, height: h }) => (
        <ReLineChart width={width} height={h} data={chartData} margin={{ top: 12, right: 16, bottom: 4, left: compact ? -16 : 4 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="season"
            stroke={CHART.muted}
            tick={{ fill: CHART.textSecondary, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART.border }}
            interval={compact ? 4 : "preserveStartEnd"}
            minTickGap={compact ? 16 : 8}
          />
          <YAxis
            stroke={CHART.muted}
            tick={{ fill: CHART.textSecondary, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={compact ? 36 : 52}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.border }} />
          {events.map((e) => (
            <ReferenceLine
              key={e.season}
              x={e.season}
              stroke={CHART.info}
              strokeDasharray="4 4"
              label={{
                value: e.season === 2018 ? "Portal" : e.season === 2021 ? "NIL" : String(e.season),
                position: "top",
                fill: CHART.info,
                fontSize: 11,
              }}
            />
          ))}
          {/* pre-2018: no reliable league count — dashed/muted (low confidence) */}
          <Line
            type="monotone"
            dataKey="volumePre"
            stroke={CHART.muted}
            strokeWidth={compact ? 2 : 2.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
          {/* 2018+: portal-era volume — solid */}
          <Line
            type="monotone"
            dataKey="volumePost"
            stroke={CHART.accent}
            strokeWidth={compact ? 2 : 2.5}
            dot={compact ? false : { r: 2.5, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.accent, stroke: CHART.surface, strokeWidth: 2 }}
            connectNulls={false}
          />
        </ReLineChart>
      )}
    </AutoSizer>
  );
}

function TimelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: TimelinePoint }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-text-primary">{p.season}</p>
      <p className="text-sm text-text-secondary">
        <span className="font-bold text-accent">{formatNumber(p.total_transfers)}</span> total transfers
      </p>
      <p className="text-sm text-text-secondary">
        <span className="font-bold text-info">{formatNumber(p.sample_count)}</span> matching sample
      </p>
      {p.event && <p className="mt-1 text-xs font-medium text-info">{p.event}</p>}
    </div>
  );
}

/**
 * Dual-axis timeline: the league-wide illustrative volume (left axis, fixed
 * context) plus the filtered sample count (right axis) which reacts to the
 * filter bar. Two axes because the series live on very different scales.
 */
export function FilterableTimelineChart({
  data,
  height = 420,
}: {
  data: TimelinePoint[];
  height?: number;
}) {
  const events = data.filter((d) => d.event);
  const chartData = splitAtPortal(data);
  return (
    <AutoSizer height={height}>
      {({ width, height: h }) => (
        <ReLineChart width={width} height={h} data={chartData} margin={{ top: 16, right: 8, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="season"
            stroke={CHART.muted}
            tick={{ fill: CHART.textSecondary, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: CHART.border }}
            minTickGap={8}
          />
          <YAxis
            yAxisId="total"
            stroke={CHART.accent}
            tick={{ fill: CHART.textSecondary, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          />
          <YAxis
            yAxisId="sample"
            orientation="right"
            stroke={CHART.info}
            tick={{ fill: CHART.textSecondary, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip content={<TimelineTooltip />} cursor={{ stroke: CHART.border }} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: CHART.textSecondary }}
            formatter={(value) => (
              <span className="text-text-secondary">
                {value === "volumePost"
                  ? "Transfers, 2018+ (league-wide)"
                  : value === "volumePre"
                    ? "Transfers, pre-2018 (illustrative, low confidence)"
                    : "Matching sample"}
              </span>
            )}
          />
          {events.map((e) => (
            <ReferenceLine
              key={e.season}
              yAxisId="total"
              x={e.season}
              stroke={CHART.info}
              strokeDasharray="4 4"
              label={{
                value: e.season === 2018 ? "Portal" : e.season === 2021 ? "NIL" : String(e.season),
                position: "top",
                fill: CHART.info,
                fontSize: 11,
              }}
            />
          ))}
          {/* pre-2018: no reliable league count — dashed/muted (low confidence) */}
          <Line
            yAxisId="total"
            type="monotone"
            dataKey="volumePre"
            stroke={CHART.muted}
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={false}
            activeDot={false}
            connectNulls={false}
          />
          {/* 2018+: portal-era volume — solid */}
          <Line
            yAxisId="total"
            type="monotone"
            dataKey="volumePost"
            stroke={CHART.accent}
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.accent, stroke: CHART.surface, strokeWidth: 2 }}
            connectNulls={false}
          />
          <Line
            yAxisId="sample"
            type="monotone"
            dataKey="sample_count"
            stroke={CHART.info}
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 2, fill: CHART.info, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: CHART.info, stroke: CHART.surface, strokeWidth: 2 }}
          />
        </ReLineChart>
      )}
    </AutoSizer>
  );
}
