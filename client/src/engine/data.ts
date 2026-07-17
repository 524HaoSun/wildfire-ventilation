/** Instrumented Architectural Modernism: immutable build-time adapters for measured datasets. */
import nycRaw from "@/data/nyc_wildfire_june2023.json";
import londonRaw from "@/data/london_cases.json";
import type { CaseDataset, SelectedCase } from "./types";

type NumericSeries = Array<number | null>;
type LondonSeries = {
  timestamps: string[];
  pm25: NumericSeries;
  no2: NumericSeries;
  o3: NumericSeries;
  pm10?: NumericSeries;
};

const nyc = nycRaw as {
  timestamps: string[];
  pm25: NumericSeries;
  co: NumericSeries;
};
const london = londonRaw as unknown as {
  london_2022_heatwave: LondonSeries;
};

export const CASES: Record<SelectedCase, CaseDataset> = {
  nyc2023: {
    id: "nyc2023",
    title: "New York · June 2023",
    subtitle: "Long-range wildfire smoke",
    site: "Queens College 2 · AQS 36-081-0124",
    instrument: "FEM T640 (corrected, method 736)",
    sourceLabel: "EPA AQS",
    timestamps: nyc.timestamps,
    pm25: nyc.pm25,
    co: nyc.co,
  },
  london2022: {
    id: "london2022",
    title: "London · July 2022",
    subtitle: "Record heatwave + air-quality stress",
    site: "London Bloomsbury · AURN CLL2",
    instrument: "FIDAS · ratified",
    sourceLabel: "DEFRA AURN",
    timestamps: london.london_2022_heatwave.timestamps,
    pm25: london.london_2022_heatwave.pm25,
    o3: london.london_2022_heatwave.o3,
    context: ["40.3 °C UK record", "Urban heat exposure"],
  },
};

export function getCaseDataset(id: SelectedCase): CaseDataset {
  return CASES[id];
}

export function finiteValues(values: NumericSeries): number[] {
  return values.filter((value): value is number => value !== null && Number.isFinite(value));
}

export function peak(values: NumericSeries): { value: number; index: number } {
  let value = Number.NEGATIVE_INFINITY;
  let index = -1;
  values.forEach((candidate, candidateIndex) => {
    if (candidate !== null && candidate > value) {
      value = candidate;
      index = candidateIndex;
    }
  });
  return { value, index };
}

export function mean(values: NumericSeries): number {
  const finite = finiteValues(values);
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

export function deriveMeasuredAnchors() {
  const nycPeak = peak(CASES.nyc2023.pm25);
  // Stable 96 h pre-event baseline: exclude the first 18 h urban episode and
  // the final 6 h smoke-arrival ramp. This yields 9.10 µg/m³ directly from the array.
  const nycBackground = mean(CASES.nyc2023.pm25.slice(18, 114));
  const nycCoPeak = peak(CASES.nyc2023.co ?? []);
  const nycCoBackground = mean((CASES.nyc2023.co ?? []).slice(24, 120));
  const london2022Peak = peak(CASES.london2022.pm25);
  const londonO3Peak = peak(CASES.london2022.o3 ?? []);
  return {
    nycPeak,
    nycBackground,
    nycRatio: nycPeak.value / nycBackground,
    nycCoPeak,
    nycCoBackground,
    london2022Peak,
    londonO3Peak,
  };
}
