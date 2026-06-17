/**
 * Report whether the seed data is illustrative sample data or real data, by
 * reading each file's `_meta.is_sample_data` flag.
 *
 *   npm run check:data                 # print a report (always exits 0)
 *   npm run check:data -- --require-real   # exit 1 if ANY file is still sample
 *
 * The `--require-real` form is meant as an optional CI/deploy gate for a
 * "production data" environment — it lets a pipeline refuse to ship while the
 * dataset is still illustrative.
 */
import { loadSeed } from "../lib/data/validate";

interface FileStatus {
  file: string;
  isSample: boolean;
  lastUpdated: string;
}

function main(): void {
  const requireReal = process.argv.includes("--require-real");
  const seed = loadSeed();

  const statuses: FileStatus[] = [
    { file: "players.json", isSample: seed.players._meta.is_sample_data, lastUpdated: seed.players._meta.last_updated },
    { file: "nil_deals.json", isSample: seed.nilDeals._meta.is_sample_data, lastUpdated: seed.nilDeals._meta.last_updated },
    { file: "season_summary.json", isSample: seed.seasons._meta.is_sample_data, lastUpdated: seed.seasons._meta.last_updated },
    { file: "schools.json", isSample: seed.schools._meta.is_sample_data, lastUpdated: seed.schools._meta.last_updated },
  ];

  const anySample = statuses.some((s) => s.isSample);

  console.log("\nData status (data/seed/_meta.is_sample_data):\n");
  for (const s of statuses) {
    const tag = s.isSample ? "SAMPLE" : "REAL";
    console.log(`  ${s.file.padEnd(22)} ${tag.padEnd(7)} last_updated=${s.lastUpdated}`);
  }

  console.log(
    `\nOverall: ${anySample ? "SAMPLE DATA (illustrative — not for analysis)" : "REAL DATA"}\n`,
  );

  if (requireReal && anySample) {
    console.error("✖ --require-real: refusing because one or more files are still sample data.");
    process.exit(1);
  }
}

main();
