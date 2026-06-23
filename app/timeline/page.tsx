"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Position, ClassYear } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { FilterableTimelineChart, type TimelinePoint } from "@/components/charts/LineChart";
import { FilterBar, FilterGroup } from "@/components/filters/FilterBar";
import { ChipMultiSelect } from "@/components/filters/ChipMultiSelect";
import { SearchInput } from "@/components/filters/SearchInput";
import { SeasonRange } from "@/components/filters/SeasonRange";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSeasonSummaries, getSeasonRange, SEASON_EVENTS } from "@/lib/data/seasons";
import { getPlayers, filterPlayers } from "@/lib/data/players";
import { getConferences } from "@/lib/data/schools";
import { POSITIONS, CLASS_YEARS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

const [SEASON_LO, SEASON_HI] = getSeasonRange();
const ALL_PLAYERS_COUNT = getPlayers().length;

export default function TimelinePage() {
  const [seasonMin, setSeasonMin] = useState(SEASON_LO);
  const [seasonMax, setSeasonMax] = useState(SEASON_HI);
  const [conferences, setConferences] = useState<string[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [classYears, setClassYears] = useState<ClassYear[]>([]);
  const [school, setSchool] = useState("");

  const conferenceOptions = useMemo(() => getConferences(), []);
  const seasons = useMemo(() => getSeasonSummaries(), []);

  const filtered = useMemo(
    () =>
      filterPlayers({
        seasonMin,
        seasonMax,
        conferences,
        positions,
        classYears,
        school,
      }),
    [seasonMin, seasonMax, conferences, positions, classYears, school],
  );

  // ASSUMPTION: season_summary holds league-wide volume only (no per-conference/
  // position breakdown), so filters drive a separate "matching sample" series on
  // a second axis while the headline volume line stays as fixed context.
  const timelineData: TimelinePoint[] = useMemo(() => {
    const sampleByYear = new Map<number, number>();
    for (const p of filtered) sampleByYear.set(p.season, (sampleByYear.get(p.season) ?? 0) + 1);
    return seasons
      .filter((s) => s.season >= seasonMin && s.season <= seasonMax)
      .map((s) => ({
        season: s.season,
        total_transfers: s.total_transfers,
        sample_count: sampleByYear.get(s.season) ?? 0,
        event: SEASON_EVENTS[s.season] ?? null,
      }));
  }, [filtered, seasons, seasonMin, seasonMax]);

  const isActive =
    seasonMin !== SEASON_LO ||
    seasonMax !== SEASON_HI ||
    conferences.length > 0 ||
    positions.length > 0 ||
    classYears.length > 0 ||
    school.trim() !== "";

  function reset() {
    setSeasonMin(SEASON_LO);
    setSeasonMax(SEASON_HI);
    setConferences([]);
    setPositions([]);
    setClassYears([]);
    setSchool("");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Transfer Timeline"
        subtitle="Total transfers per year (2005–2024) with the portal launch and NIL milestones marked. Filter the sample to see how a slice of players distributes across the same era."
      />

      <div className="space-y-6">
        <FilterBar
          onReset={reset}
          active={isActive}
          summary={
            <>
              Showing <span className="font-semibold text-text-secondary">{formatNumber(filtered.length)}</span> of{" "}
              {formatNumber(ALL_PLAYERS_COUNT)} sample transfers
            </>
          }
        >
          <FilterGroup label="Season range">
            <SeasonRange
              min={seasonMin}
              max={seasonMax}
              bounds={[SEASON_LO, SEASON_HI]}
              onChange={(lo, hi) => {
                setSeasonMin(lo);
                setSeasonMax(hi);
              }}
            />
          </FilterGroup>
          <FilterGroup label="School search">
            <SearchInput value={school} onChange={setSchool} placeholder="e.g. Alabama" />
          </FilterGroup>
          <FilterGroup label="Conference">
            <ChipMultiSelect options={conferenceOptions} selected={conferences} onChange={setConferences} />
          </FilterGroup>
          <FilterGroup label="Class year">
            <ChipMultiSelect options={CLASS_YEARS} selected={classYears} onChange={setClassYears} />
          </FilterGroup>
          <div className="sm:col-span-2 lg:col-span-4">
            <FilterGroup label="Position">
              <ChipMultiSelect options={POSITIONS} selected={positions} onChange={setPositions} />
            </FilterGroup>
          </div>
        </FilterBar>

        <Card
          title="Transfers by year"
          subtitle="Left axis: league-wide illustrative volume (fixed context). Right axis: your filtered sample (reacts to the filters above)."
        >
          {timelineData.length === 0 ? (
            <EmptyState message="No seasons in this range." hint="Widen the season range to see the timeline." />
          ) : (
            <ChartFrame label="the transfer timeline" height={420}>
              <FilterableTimelineChart data={timelineData} />
            </ChartFrame>
          )}
        </Card>

        <p className="text-xs leading-relaxed text-muted">
          The <span className="font-medium text-text-secondary">dashed pre-2018 segment</span> is
          illustrative and low-confidence — there is no reliable league-wide transfer count before the
          portal launched, so that stretch should not be read as measured. The solid 2018+ segment is
          where real ingested data lands. Per-conference and per-position breakdowns are not available
          at the league level, so filters drive the sample series only. See the{" "}
          <Link href="/methodology" className="text-accent underline-offset-2 hover:underline">
            Methodology
          </Link>{" "}
          page for details.
        </p>
      </div>
    </div>
  );
}
