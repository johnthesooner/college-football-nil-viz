import Link from "next/link";
import {
  ArrowRightLeft,
  DollarSign,
  Trophy,
  Users,
  LineChart as LineChartIcon,
  GitBranch,
  Table2,
  FileText,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { DataDisclaimer } from "@/components/ui/DataDisclaimer";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { TransferLineChart } from "@/components/charts/LineChart";
import {
  getLatestSeason,
  getSeasonSummary,
  getTransferTimeline,
  getLatestEstimatedMarketSize,
} from "@/lib/data/seasons";
import {
  getMostTransferredPosition,
  getTopDestinationConference,
} from "@/lib/data/players";
import { formatNumber, formatCompactCurrency } from "@/lib/utils";

const ERAS = [
  {
    name: "Pre-Portal Era",
    years: "pre-2018",
    body: "Transfers were slow and rare — most players had to sit out a year, so movement between programs was limited.",
  },
  {
    name: "Transfer Portal Launch",
    years: "2018",
    body: "The NCAA opens the transfer portal, formalizing and streamlining how players enter the transfer market.",
  },
  {
    name: "NIL Era Begins",
    years: "2021",
    body: "Athletes can finally profit from their name, image, and likeness — adding a financial dimension to player movement.",
  },
  {
    name: "High-Mobility Era",
    years: "2022–present",
    body: "Record transfer volume. The portal and NIL together reshape roster building, recruiting, and competitive balance.",
  },
];

const PAGES = [
  { href: "/timeline", icon: LineChartIcon, title: "Transfer Timeline", body: "Total transfers per year with portal and NIL milestones, filterable by conference, school, position, and class." },
  { href: "/flow", icon: GitBranch, title: "Player Flow Map", body: "A Sankey diagram of where players moved — conference-to-conference or school-to-school, by season." },
  { href: "/nil", icon: DollarSign, title: "NIL Money View", body: "Reported NIL activity by position, school, and conference — every figure carries a confidence badge." },
  { href: "/players", icon: Table2, title: "Player Explorer", body: "Search and filter individual transfers; click any row for the full record and data notes." },
  { href: "/methodology", icon: FileText, title: "Methodology", body: "Confidence definitions, what we don't know, the full data dictionary, and how to load real data." },
];

export default function HomePage() {
  const latestSeason = getLatestSeason();
  const latest = getSeasonSummary(latestSeason);
  const marketSize = getLatestEstimatedMarketSize();
  const topConference = getTopDestinationConference();
  const topPosition = getMostTransferredPosition();
  const timeline = getTransferTimeline();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="mb-12 max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          Transfer volume since 2005 · NIL era 2021–{latestSeason}
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          How NIL and the transfer portal rewired college football.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-text-secondary">
          From a trickle of transfers to a high-mobility marketplace. Explore transfer volume since
          2005, where players moved, and reported NIL activity for the 2021–{latestSeason} NIL era —
          with honest labeling of how confident we are in every number. The point of the project is
          the <em>method</em> for showing data confidence, not the numbers themselves.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/timeline"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background hover:bg-accent-dim"
          >
            Explore the timeline <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/methodology"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-2"
          >
            How the data works
          </Link>
        </div>
      </section>

      {/* Sample-data disclaimer — visible on the first screen, not just the footer */}
      <DataDisclaimer className="mb-10">
        <span className="font-semibold text-warning">Illustrative sample data.</span> Player names are
        fictional and every dollar figure is a placeholder — never a real reported amount. Headline
        stats below (e.g. top destination conference) reflect the sample&apos;s built-in assumptions,
        not a measured finding. See the{" "}
        <Link href="/methodology" className="font-medium text-accent underline-offset-2 hover:underline">
          Methodology
        </Link>{" "}
        page.
      </DataDisclaimer>

      {/* Callout cards */}
      <section className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Transfers · ${latestSeason}`}
          value={latest ? formatNumber(latest.total_transfers) : "—"}
          icon={ArrowRightLeft}
          caption="Illustrative full-season volume, shaped to public reporting on portal activity."
        />
        <StatCard
          label="Est. NIL market size"
          value={marketSize ? formatCompactCurrency(marketSize.value) : "—"}
          icon={DollarSign}
          badge={<ConfidenceBadge level="estimated" />}
          caption={marketSize ? `Estimated total for ${marketSize.season} (all college sports).` : undefined}
        />
        <StatCard
          label="Top destination conference"
          value={topConference ?? "—"}
          icon={Trophy}
          caption="Sample artifact — the data is shaped by a built-in conference-pull assumption, not a measured result."
        />
        <StatCard
          label="Most transferred position"
          value={topPosition ?? "—"}
          icon={Users}
          caption="Highest transfer count in the sample (position mix is a generation assumption)."
        />
      </section>

      {/* Era timeline */}
      <section className="mb-14">
        <h2 className="text-xl font-semibold text-text-primary">Four eras of player movement</h2>
        <p className="mt-1 text-sm text-muted">A quick orientation before you dig into the data.</p>
        <ol className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ERAS.map((era, i) => (
            <li key={era.name} className="relative rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-accent">{era.years}</span>
              </div>
              <h3 className="mt-3 text-base font-semibold text-text-primary">{era.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{era.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Mini line chart teaser */}
      <section className="mb-14">
        <Card
          title="Transfers by year, 2005–2024"
          subtitle="A teaser — open the Timeline page to filter by conference, school, position, and class."
          action={
            <Link
              href="/timeline"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Open timeline <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        >
          <ChartFrame label="the transfer timeline" height={220}>
            <TransferLineChart data={timeline} compact />
          </ChartFrame>
        </Card>
      </section>

      {/* How to use */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary">How to use this app</h2>
        <p className="mt-1 text-sm text-muted">Five views, each answering a different question.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50 hover:bg-surface-2"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <p.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="text-base font-semibold text-text-primary">{p.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{p.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Open <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
