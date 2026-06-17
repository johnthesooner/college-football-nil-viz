import Link from "next/link";
import { Info } from "lucide-react";
import type { ConfidenceLevel, NILAggregate } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { DataDisclaimer } from "@/components/ui/DataDisclaimer";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Badge } from "@/components/ui/Badge";
import { SourceLink } from "@/components/ui/SourceLink";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { NILBarChart, FlowBalanceChart } from "@/components/charts/BarChart";
import {
  getTopDeals,
  getNILByPosition,
  getNILBySchool,
  getNILByConference,
} from "@/lib/data/nil";
import { getConferenceFlowBalance } from "@/lib/data/players";
import { formatNilAmount } from "@/lib/utils";

// Least-certain confidence present in an aggregate set — shown as the
// chart-level badge so a chart never reads as more confident than its data.
const RANK: Record<ConfidenceLevel, number> = { confirmed: 3, reported: 2, estimated: 1, unknown: 0 };
function worstConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.length === 0) return "unknown";
  let worst: ConfidenceLevel = "confirmed";
  for (const l of levels) if (RANK[l] < RANK[worst]) worst = l;
  return worst;
}
const confidencesOf = (aggs: NILAggregate[]): ConfidenceLevel[] => aggs.map((a) => a.confidence);

export default function NILPage() {
  const topDeals = getTopDeals(10);
  const byPosition = getNILByPosition();
  const bySchool = getNILBySchool(10);
  const byConference = getNILByConference();
  const flowBalance = getConferenceFlowBalance();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="NIL Money View"
        subtitle="Reported NIL activity by position, school, and conference. Every dollar figure is illustrative sample data and carries a confidence badge — never treat these as real reported amounts."
      />

      <div className="space-y-6">
        <DataDisclaimer />

        {/* Top reported deals table */}
        <Card
          title="Top reported deals"
          subtitle="Ranked by reported amount. Every figure here — including rows badged “confirmed” — is illustrative sample data; hover the ⓘ on any row for its specific caveat. Unknown-amount deals are excluded from this ranking."
          action={<ConfidenceBadge level={worstConfidence(topDeals.map((d) => d.confidence_level))} />}
        >
          {topDeals.length === 0 ? (
            <EmptyState message="No reported deals available." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 font-medium">Player</th>
                    <th className="py-2 pr-3 font-medium">School</th>
                    <th className="py-2 pr-3 font-medium">Season</th>
                    <th className="py-2 pr-3 font-medium">Reported amount</th>
                    <th className="py-2 pr-3 font-medium">Confidence</th>
                    <th className="py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {topDeals.map((d) => (
                    <tr key={d.deal_id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-text-primary">
                        {d.player?.player_name ?? "—"}
                        {d.player && (
                          <Badge variant="neutral" className="ml-2">
                            {d.player.position}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-text-secondary">{d.school}</td>
                      <td className="py-2.5 pr-3 text-text-secondary">{d.season}</td>
                      {/* Dollar figure + its confidence badge, always together. */}
                      <td className="py-2.5 pr-3 font-semibold text-accent">
                        {formatNilAmount(d.reported_amount)}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="inline-flex items-center gap-1.5">
                          <ConfidenceBadge level={d.confidence_level} />
                          <Tooltip content={d.notes}>
                            <Info
                              className="h-3.5 w-3.5 text-muted"
                              aria-label={`Why this figure is illustrative: ${d.notes}`}
                            />
                          </Tooltip>
                        </span>
                      </td>
                      <td className="py-2.5">
                        <SourceLink url={d.source_url} name={d.source_name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Dollar bar charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card
            title="Reported NIL by position"
            subtitle="Summed reported amounts (illustrative)."
            action={<ConfidenceBadge level={worstConfidence(confidencesOf(byPosition))} />}
          >
            <ChartFrame label="NIL by position" height={320}>
              <NILBarChart data={byPosition} height={320} />
            </ChartFrame>
          </Card>

          <Card
            title="Reported NIL by school (top 10)"
            subtitle="Summed reported amounts (illustrative)."
            action={<ConfidenceBadge level={worstConfidence(confidencesOf(bySchool))} />}
          >
            <ChartFrame label="NIL by school" height={320}>
              <NILBarChart data={bySchool} height={320} />
            </ChartFrame>
          </Card>

          <Card
            title="Reported NIL by conference"
            subtitle="Summed reported amounts (illustrative)."
            action={<ConfidenceBadge level={worstConfidence(confidencesOf(byConference))} />}
          >
            <ChartFrame label="NIL by conference" height={320}>
              <NILBarChart data={byConference} height={320} />
            </ChartFrame>
          </Card>

          <Card
            title="Inbound vs outbound transfers by conference"
            subtitle="Player counts (all seasons) — not dollar figures."
          >
            <ChartFrame label="conference flow balance" height={320}>
              <FlowBalanceChart data={flowBalance} height={320} />
            </ChartFrame>
          </Card>
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Dollar totals sum only deals that disclose an amount; unknown amounts are never counted as
          $0. Each chart&apos;s badge reflects the least-certain deal in that view. Source links on
          &ldquo;confirmed&rdquo; sample rows point to a real organization&apos;s home page to
          demonstrate the sourced-tier UI — they do <strong>not</strong> document the specific
          (illustrative) dollar figure, and the per-conference/school/position rankings reflect the
          dataset&apos;s built-in sampling assumptions rather than a measured finding. See the{" "}
          <Link href="/methodology" className="text-accent underline-offset-2 hover:underline">
            Methodology
          </Link>{" "}
          page for confidence definitions.
        </p>
      </div>
    </div>
  );
}
