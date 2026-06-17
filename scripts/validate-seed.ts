/**
 * Seed-data validation entrypoint.
 *
 * Wired into package.json as `predev` and `prebuild`, so an invalid seed file
 * blocks both local dev and production builds. Exits non-zero with a descriptive
 * message on failure (the actual rules live in lib/data/validate.ts and are also
 * exercised by Vitest in lib/data/validate.test.ts).
 */
import { loadSeed, collectSeedErrors } from "../lib/data/validate";

function main(): void {
  const bundle = loadSeed();
  const errors = collectSeedErrors(bundle);

  if (errors.length > 0) {
    console.error(`\n✖ Seed validation FAILED — ${errors.length} problem(s):\n`);
    for (const e of errors) console.error(`  • ${e}`);
    console.error("");
    process.exit(1);
  }

  const counts = {
    schools: bundle.schools.data.length,
    seasons: bundle.seasons.data.length,
    players: bundle.players.data.length,
    nil_deals: bundle.nilDeals.data.length,
    confirmed: bundle.nilDeals.data.filter((d) => d.confidence_level === "confirmed").length,
  };
  console.log("✓ Seed validation passed");
  console.log(
    `  schools=${counts.schools}  seasons=${counts.seasons}  players=${counts.players}  ` +
      `nil_deals=${counts.nil_deals} (confirmed=${counts.confirmed})`,
  );
}

main();
