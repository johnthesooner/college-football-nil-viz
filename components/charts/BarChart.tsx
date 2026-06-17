"use client";

import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import type { ConfidenceLevel, NILAggregate, ConferenceFlowBalance } from "@/lib/types";
import { CHART, CATEGORICAL } from "@/components/charts/palette";
import { AutoSizer } from "@/components/charts/AutoSizer";
import { CONFIDENCE_META } from "@/components/ui/ConfidenceBadge";
import { formatCompactCurrency, formatNumber } from "@/lib/utils";

interface NILBarDatum {
  key: string;
  total_reported: number;
  deal_count: number;
  confidence: ConfidenceLevel;
}

function NILTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: NILBarDatum }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const meta = CONFIDENCE_META[d.confidence];
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-text-primary">{d.key}</p>
      <p className="text-sm text-text-secondary">
        <span className="font-bold text-accent">{formatCompactCurrency(d.total_reported)}</span> reported
      </p>
      <p className="text-xs text-muted">{d.deal_count} deal{d.deal_count === 1 ? "" : "s"}</p>
      {/* Confidence travels with the dollar figure, even in the tooltip. */}
      <p className={`mt-1 text-xs font-medium ${meta.classes.split(" ")[0]}`}>
        {meta.label} confidence
      </p>
    </div>
  );
}

/**
 * Horizontal bar chart for NIL dollar aggregates. Bars are colored per the
 * categorical palette; the tooltip always surfaces the bucket's confidence
 * level so no dollar figure is shown without its confidence.
 */
export function NILBarChart({ data, height = 300 }: { data: NILAggregate[]; height?: number }) {
  return (
    <AutoSizer height={height}>
      {({ width, height: h }) => (
        <ReBarChart
          width={width}
          height={h}
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            stroke={CHART.muted}
            tick={{ fill: CHART.textSecondary, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART.border }}
            tickFormatter={(v: number) => formatCompactCurrency(v)}
          />
          <YAxis
            type="category"
            dataKey="key"
            stroke={CHART.muted}
            tick={{ fill: CHART.textSecondary, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={96}
          />
          <Tooltip content={<NILTooltip />} cursor={{ fill: CHART.surface2, opacity: 0.4 }} />
          <Bar dataKey="total_reported" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <Cell key={d.key} fill={CATEGORICAL[i % CATEGORICAL.length]} />
            ))}
          </Bar>
        </ReBarChart>
      )}
    </AutoSizer>
  );
}

function FlowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-text-primary">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm text-text-secondary">
          <span className="font-bold" style={{ color: p.color }}>
            {formatNumber(p.value)}
          </span>{" "}
          {p.name}
        </p>
      ))}
    </div>
  );
}

/**
 * Grouped bar chart of inbound vs outbound transfer COUNTS per conference.
 * These are player counts, not dollars, so no confidence badge applies.
 */
export function FlowBalanceChart({
  data,
  height = 300,
}: {
  data: ConferenceFlowBalance[];
  height?: number;
}) {
  return (
    <AutoSizer height={height}>
      {({ width, height: h }) => (
        <ReBarChart
          width={width}
          height={h}
          data={data}
          margin={{ top: 8, right: 8, bottom: 4, left: -8 }}
        >
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="conference"
            stroke={CHART.muted}
            tick={{ fill: CHART.textSecondary, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART.border }}
          />
          <YAxis
            stroke={CHART.muted}
            tick={{ fill: CHART.textSecondary, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<FlowTooltip />} cursor={{ fill: CHART.surface2, opacity: 0.4 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="inbound" name="Inbound" fill={CHART.success} radius={[3, 3, 0, 0]} />
          <Bar dataKey="outbound" name="Outbound" fill={CHART.danger} radius={[3, 3, 0, 0]} />
        </ReBarChart>
      )}
    </AutoSizer>
  );
}
