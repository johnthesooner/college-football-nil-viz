import type { Metadata } from "next";
import { Database, ShieldQuestion, BookOpen, Upload, ListTree } from "lucide-react";
import type { ConfidenceLevel } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ConfidenceBadge, CONFIDENCE_META } from "@/components/ui/ConfidenceBadge";
import { getConfidenceMix, getNILDeals } from "@/lib/data/nil";
import { getPlayers } from "@/lib/data/players";
import { getSeasonSummaries } from "@/lib/data/seasons";
import { getSchools } from "@/lib/data/schools";

export const metadata: Metadata = {
  title: "Methodology & Data Quality — NIL & Transfer Portal",
  description:
    "How this dataset is built, what each confidence level means, what we don't know, the full data dictionary, and how to load real data.",
};

const CONFIDENCE_EXAMPLES: Record<ConfidenceLevel, string> = {
  confirmed: "A school's official announcement or a signed-deal disclosure stating an exact figure.",
  reported: "A national outlet reports a number attributed to sources, but no document confirms it.",
  estimated: "A valuation model infers a likely range from social following, market, and role.",
  unknown: "A deal is known to exist, but no credible dollar amount is available.",
};

interface FieldDoc {
  name: string;
  type: string;
  desc: string;
}

const DICTIONARY: { entity: string; file: string; fields: FieldDoc[] }[] = [
  {
    entity: "Player (transfer record)",
    file: "data/seed/players.json",
    fields: [
      { name: "player_id", type: "string", desc: "Stable unique id for the transfer record." },
      { name: "player_name", type: "string", desc: "Player name. In sample data these are fictional." },
      { name: "position", type: "Position", desc: "QB · RB · WR · TE · OL · DL · LB · CB · S · K · P · ATH." },
      { name: "class_year", type: "ClassYear", desc: "FR · SO · JR · SR · GR at time of transfer." },
      { name: "season", type: "number", desc: "Season year the transfer is attributed to (2005–2024)." },
      { name: "from_school / to_school", type: "string", desc: "Origin and destination school names." },
      { name: "from_conference / to_conference", type: "string", desc: "Conference of origin and destination." },
      { name: "transfer_date", type: "string | null", desc: "ISO date of the move, or null if unknown." },
      { name: "source_url / source_name", type: "string | null", desc: "Provenance for the record, when available." },
    ],
  },
  {
    entity: "NILDeal",
    file: "data/seed/nil_deals.json",
    fields: [
      { name: "deal_id", type: "string", desc: "Stable unique id for the deal." },
      { name: "player_id", type: "string", desc: "References the related Player record." },
      { name: "season", type: "number", desc: "Season the deal is attributed to (NIL era, 2021+)." },
      { name: "school", type: "string", desc: "School associated with the deal." },
      { name: "reported_amount", type: "number | null", desc: "USD; null when no amount is disclosed (never shown as $0)." },
      { name: "amount_type", type: "AmountType", desc: "exact · range · estimated · unknown." },
      { name: "confidence_level", type: "ConfidenceLevel", desc: "confirmed · reported · estimated · unknown." },
      { name: "source_url / source_name", type: "string | null", desc: "Provenance. Required (non-null url) when confirmed." },
      { name: "notes", type: "string", desc: "Required. Explains the limitation behind the figure." },
    ],
  },
  {
    entity: "SeasonSummary",
    file: "data/seed/season_summary.json",
    fields: [
      { name: "season", type: "number", desc: "Season year (one row per year, 2005–2024)." },
      { name: "total_transfers", type: "number", desc: "League-wide transfer volume for the year (illustrative)." },
      { name: "total_reported_nil_value", type: "number | null", desc: "Sum of reported deal values; null before the NIL era." },
      { name: "estimated_nil_market_size", type: "number | null", desc: "Estimated total NIL market; null before 2021." },
      { name: "source_url / source_name", type: "string | null", desc: "Provenance, when available." },
      { name: "notes", type: "string", desc: "Context and caveats for the row." },
    ],
  },
  {
    entity: "School",
    file: "data/seed/schools.json",
    fields: [
      { name: "school_id", type: "string", desc: "Stable unique id." },
      { name: "name", type: "string", desc: "Display name." },
      { name: "conference", type: "string", desc: "Representative conference (realignment not tracked over time)." },
      { name: "state", type: "string", desc: "Two-letter state code." },
      { name: "latitude / longitude", type: "number", desc: "Approximate campus coordinates." },
    ],
  },
];

export default function MethodologyPage() {
  const mix = getConfidenceMix();
  const dealCount = getNILDeals().length;
  const playerCount = getPlayers().length;
  const seasonCount = getSeasonSummaries().length;
  const schoolCount = getSchools().length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Methodology & Data Quality"
        subtitle="This project is built to be honest about what it knows. Here is where the data comes from, what each confidence level means, what we can't tell you, and how to swap in real data."
      />

      <div className="space-y-8">
        {/* Sample data banner */}
        <Card>
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden />
            <div className="text-sm leading-relaxed text-text-secondary">
              <p className="font-semibold text-text-primary">Everything here is illustrative sample data.</p>
              <p className="mt-1">
                The dataset ships with {playerCount} transfer records, {dealCount} NIL deals,{" "}
                {seasonCount} season summaries, and {schoolCount} schools. Player names are fictional and
                player-level NIL figures are placeholders for layout — never real reported amounts. The
                point of this app is the <em>method</em> for showing data confidence honestly, not the
                numbers themselves.
              </p>
            </div>
          </div>
        </Card>

        {/* Explainer — the differentiation, in one shareable block */}
        <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
          <h2 className="text-lg font-semibold text-accent">Why NIL numbers can&rsquo;t be trusted</h2>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-secondary">
            <p>
              Almost every NIL dollar figure you see is an <strong>estimate dressed up as a fact</strong>.
              Even the market leaders say so: On3&rsquo;s own methodology states its valuation is a{" "}
              <em>projection</em> of annual contract value and{" "}
              <a
                href="https://www.on3.com/nil/news/about-on3-nil-valuation-per-post-value/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline-offset-2 hover:underline"
              >
                &ldquo;does not act as a tracker of the value of NIL deals an athlete has completed&rdquo;
              </a>
              . Most deals are private, so exact amounts are rarely disclosed at all.
            </p>
            <p>
              So this app refuses to hide the uncertainty. Every dollar figure is labeled{" "}
              <span className="font-medium text-success">confirmed</span> /{" "}
              <span className="font-medium text-info">reported</span> /{" "}
              <span className="font-medium text-warning">estimated</span> /{" "}
              <span className="font-medium text-muted">unknown</span>, and an undisclosed amount reads
              &ldquo;not disclosed&rdquo; — <strong>never $0</strong>. That honesty is the whole point.
            </p>
          </div>
        </div>

        {/* Data sources */}
        <Section icon={BookOpen} title="Data sources">
          <p>
            In a production build, this app would draw transfer records and NIL activity from public
            reporting and databases, each row carrying its own provenance. Good candidate sources:
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>Transfer portal entries and outcomes from recruiting outlets (247Sports, On3, Rivals).</li>
            <li>NIL valuations and deal reporting (On3 NIL, Opendorse), always labeled by confidence.</li>
            <li>Official school and conference announcements for confirmed figures.</li>
            <li>National reporting (ESPN, The Athletic) for reported-but-unconfirmed numbers.</li>
          </ul>
          <p className="mt-3">
            The shipped data is shaped to match publicly reported <em>trends</em> (e.g. the post-2018
            portal surge and post-2021 NIL era) without copying any specific real figures.
          </p>
        </Section>

        {/* Confidence definitions */}
        <Section icon={ShieldQuestion} title="Confidence level definitions">
          <p>
            Every NIL dollar figure in the app carries one of four confidence levels. This is the core
            of the design — a value never appears without its confidence.
          </p>
          <div className="mt-4 space-y-3">
            {(Object.keys(CONFIDENCE_META) as ConfidenceLevel[]).map((level) => {
              const count = mix.find((m) => m.level === level)?.count ?? 0;
              return (
                <div key={level} className="rounded-lg border border-border bg-surface-2/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <ConfidenceBadge level={level} />
                    <span className="text-xs text-muted">{count} deals in sample</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">{CONFIDENCE_META[level].description}</p>
                  <p className="mt-1 text-xs text-muted">
                    <span className="font-medium text-text-secondary">Example:</span>{" "}
                    {CONFIDENCE_EXAMPLES[level]}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm">
            Rule enforced in code: a deal may only be <ConfidenceBadge level="confirmed" /> if it has a
            source URL. Seed validation throws otherwise, and the same check runs as a unit test.
          </p>
        </Section>

        {/* What we don't know */}
        <Section icon={ShieldQuestion} title="What we don&rsquo;t know">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Exact player-level NIL dollar amounts — most are private and never disclosed.</li>
            <li>The full population of transfers; the sample is a representative slice, not a census.</li>
            <li>Conference membership over time — schools are pinned to one representative conference.</li>
            <li>Deal structure (cash vs. in-kind, collectives vs. brands) beyond a single reported figure.</li>
            <li>Causation — this app shows movement and reported money, not why any player transferred.</li>
          </ul>
        </Section>

        {/* Data dictionary */}
        <Section icon={ListTree} title="Data dictionary">
          <p className="mb-4">Every field, its type, and what it means.</p>
          <div className="space-y-6">
            {DICTIONARY.map((entity) => (
              <div key={entity.entity}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-semibold text-text-primary">{entity.entity}</h3>
                  <code className="text-xs text-muted">{entity.file}</code>
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-2/40 text-xs uppercase tracking-wide text-muted">
                        <th className="px-3 py-2 font-medium">Field</th>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entity.fields.map((f) => (
                        <tr key={f.name} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-2 font-mono text-xs text-accent">{f.name}</td>
                          <td className="px-3 py-2 font-mono text-xs text-info">{f.type}</td>
                          <td className="px-3 py-2 text-text-secondary">{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* How to contribute */}
        <Section icon={Upload} title="How to contribute real data">
          <p>
            The seed data is designed to be replaceable: swapping the JSON files is the only change
            needed to load real data.
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>
              Replace the four files in <code className="text-info">data/seed/</code> with real records,
              keeping the same shape (each file has a <code className="text-info">_meta</code> block and a{" "}
              <code className="text-info">data</code> array).
            </li>
            <li>
              Keep the integrity rules: every <code className="text-info">NILDeal</code> needs a non-empty{" "}
              <code className="text-info">notes</code> field, and any <ConfidenceBadge level="confirmed" />{" "}
              deal needs a <code className="text-info">source_url</code>.
            </li>
            <li>
              Run <code className="text-info">npm run validate</code> — it checks counts, enums,
              referential integrity, the volume-table distribution, and the confidence rule.
            </li>
            <li>
              Set <code className="text-info">_meta.is_sample_data</code> to{" "}
              <code className="text-info">false</code> once the data is real, and update the disclaimer copy.
            </li>
          </ol>
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Database;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-text-secondary">{children}</div>
    </section>
  );
}
