import { describe, it, expect } from "vitest";
import {
  getSchools,
  getSchoolByName,
  getSchoolById,
  getConferences,
  getConferenceBySchool,
  getSchoolsByConference,
} from "@/lib/data/schools";

describe("schools access", () => {
  it("returns >= 25 schools sorted by name", () => {
    const s = getSchools();
    expect(s.length).toBeGreaterThanOrEqual(25);
    for (let i = 1; i < s.length; i++) {
      expect(s[i - 1].name.localeCompare(s[i].name)).toBeLessThanOrEqual(0);
    }
  });

  it("covers the six required conferences", () => {
    const confs = getConferences();
    for (const required of ["SEC", "Big Ten", "Big 12", "ACC", "Pac-12", "AAC"]) {
      expect(confs).toContain(required);
    }
  });

  it("lookups by name and id work", () => {
    const byName = getSchoolByName("Alabama");
    expect(byName?.conference).toBe("SEC");
    expect(getSchoolById(byName!.school_id)?.name).toBe("Alabama");
  });

  it("conference-by-school map is consistent", () => {
    const map = getConferenceBySchool();
    for (const s of getSchools()) expect(map.get(s.name)).toBe(s.conference);
  });

  it("getSchoolsByConference returns only that conference", () => {
    const sec = getSchoolsByConference("SEC");
    expect(sec.length).toBeGreaterThan(0);
    expect(sec.every((s) => s.conference === "SEC")).toBe(true);
  });
});
