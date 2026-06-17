// School data access. Pure functions over the static seed JSON.
import type { School, SeedFile } from "@/lib/types";
import schoolsJson from "@/data/seed/schools.json";

const file = schoolsJson as unknown as SeedFile<School>;

/** All schools, sorted by name. */
export function getSchools(): School[] {
  return [...file.data].sort((a, b) => a.name.localeCompare(b.name));
}

export function getSchoolByName(name: string): School | undefined {
  return file.data.find((s) => s.name === name);
}

export function getSchoolById(id: string): School | undefined {
  return file.data.find((s) => s.school_id === id);
}

/** Map of school name -> conference, for fast joins. */
export function getConferenceBySchool(): Map<string, string> {
  return new Map(file.data.map((s) => [s.name, s.conference]));
}

/** Distinct conferences, sorted. */
export function getConferences(): string[] {
  return [...new Set(file.data.map((s) => s.conference))].sort((a, b) => a.localeCompare(b));
}

export function getSchoolsByConference(conference: string): School[] {
  return getSchools().filter((s) => s.conference === conference);
}

/** Sample-data disclaimer carried on the schools file. */
export function getSchoolsMeta() {
  return file._meta;
}
