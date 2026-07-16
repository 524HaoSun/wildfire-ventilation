/** Instrumented Architectural Modernism: acceptance tests for scientific computation. */
import { describe, expect, it } from "vitest";
import {
  CASES,
  DEFAULT_EXPERIMENT_STATE,
  calculateExposureDose,
  compareProtectionStrategies,
  deriveVentilationGuidance,
  deriveMeasuredAnchors,
  assessFreshAirAdequacy,
  assessOverheatingRisk,
  generateAndFitCo2Decay,
  simulateMassBalance,
} from ".";

describe("measured anchors", () => {
  it("derives every headline value from the embedded arrays", () => {
    const anchors = deriveMeasuredAnchors();
    expect(anchors.nycPeak.value).toBe(410.1);
    expect(CASES.nyc2023.timestamps[anchors.nycPeak.index]).toBe("2023-06-07 13:00");
    expect(anchors.nycBackground).toBeCloseTo(9.1, 0);
    expect(anchors.nycRatio).toBeCloseTo(45, 0);
    expect(anchors.nycCoPeak.value).toBe(1.17);
    expect(anchors.london2022Peak.value).toBe(38.2);
    expect(anchors.londonO3Peak.value).toBe(142.4);
  });
});

describe("mass balance", () => {
  const window = CASES.nyc2023.pm25.slice(
    DEFAULT_EXPERIMENT_STATE.targetWindow.startIdx,
    DEFAULT_EXPERIMENT_STATE.targetWindow.endIdx + 1,
  );

  it("uses minute Euler integration and returns finite derived metrics", () => {
    const result = simulateMassBalance(window, DEFAULT_EXPERIMENT_STATE);
    expect(result.indoorMinute).toHaveLength((window.length - 1) * 60 + 1);
    expect(result.indoorPeak).toBeGreaterThan(0);
    expect(result.lagMinutes).toBeGreaterThanOrEqual(0);
    expect(result.meanIoRatio).toBeGreaterThan(0);
  });

  it("keeps the HEPA peak below 15 percent of the sealed strategy peak", () => {
    const comparison = compareProtectionStrategies(window, DEFAULT_EXPERIMENT_STATE);
    expect(comparison[3].peak).toBeLessThan(comparison[0].peak * 0.15);
  });

  it("computes cumulative exposure dose and WHO-equivalent days", () => {
    const result = simulateMassBalance(window, DEFAULT_EXPERIMENT_STATE);
    const home = calculateExposureDose(result.indoorMinute, "home");
    const away = calculateExposureDose(result.indoorMinute, "out_9_17");
    expect(home.totalDose).toBeGreaterThan(away.totalDose);
    expect(home.equivalentWhoDays).toBeCloseTo(home.totalDose / 360, 8);
  });

  it("treats CO2 and NOx as unfiltered gaseous challenges", () => {
    const nox = simulateMassBalance(window, { ...DEFAULT_EXPERIMENT_STATE, agent: "nox_lowdose" });
    const co2 = simulateMassBalance(window, { ...DEFAULT_EXPERIMENT_STATE, agent: "co2_tracer" });
    expect(nox.params.eta).toBe(0);
    expect(nox.params.deposition).toBe(0);
    expect(co2.params.eta).toBe(0);
    expect(co2.params.deposition).toBe(0);
  });

  it("retains independent CAVE exterior and interior temperature setpoints", () => {
    const state = { ...DEFAULT_EXPERIMENT_STATE, extTempC: -5, intTempC: 10 };
    expect(state.extTempC).toBe(-5);
    expect(state.intTempC).toBe(10);
  });
});

describe("CO2 tracer fit", () => {
  it("recovers true ACH within the reported confidence interval for at least 95 percent of seeds", () => {
    const lambdaTrue = 0.61;
    let covered = 0;
    for (let seed = 1; seed <= 100; seed += 1) {
      const fit = generateAndFitCo2Decay(lambdaTrue, seed);
      if (Math.abs(fit.estimate - lambdaTrue) <= fit.ci95) covered += 1;
    }
    expect(covered).toBeGreaterThanOrEqual(95);
  });

  it("keeps the fitted tracer curve finite and physically positive across workbench ACH values", () => {
    [0.1, 0.61, 1.2, 2.4, 3.4].forEach((lambdaTrue) => {
      const fit = generateAndFitCo2Decay(lambdaTrue, 42);
      expect(fit.estimate).toBeGreaterThan(0);
      expect(fit.estimate).toBeLessThan(8);
      fit.points.forEach((point) => {
        expect(Number.isFinite(point.fitted)).toBe(true);
        expect(point.fitted).toBeGreaterThanOrEqual(420);
        expect(point.fitted).toBeLessThan(1900);
      });
    });
  });
});

describe("rule-based ventilation guidance", () => {
  const caseWindow = (id: "nyc2023" | "london2022") => CASES[id].pm25.slice(
    DEFAULT_EXPERIMENT_STATE.targetWindow.startIdx,
    DEFAULT_EXPERIMENT_STATE.targetWindow.endIdx + 1,
  );

  it("recommends sealing the acute New York smoke peak while preserving filtered fresh air", () => {
    const window = caseWindow("nyc2023");
    const strategies = compareProtectionStrategies(window, DEFAULT_EXPERIMENT_STATE);
    const guidance = deriveVentilationGuidance({
      selectedCase: "nyc2023",
      outdoorPeak: 410.1,
      externalTempC: 25,
      eventHours: 96,
      strategies,
    });
    expect(guidance.recommendedStrategy).toBe("Mechanical + HEPA");
    expect(guidance.headline).toContain("windows shut");
    expect(guidance.phases.map((phase) => phase.id)).toEqual(["before", "during", "after"]);
    expect(guidance.tradeoffs.pollutionReduction).toBeGreaterThan(80);
    expect(guidance.methodStatement).toContain("single-zone mass-balance model");
  });

  it("surfaces the heat-pollution conflict for London 2022", () => {
    const state = { ...DEFAULT_EXPERIMENT_STATE, selectedCase: "london2022" as const, extTempC: 40.3 };
    const window = caseWindow("london2022");
    const strategies = compareProtectionStrategies(window, state);
    const guidance = deriveVentilationGuidance({
      selectedCase: "london2022",
      outdoorPeak: 38.2,
      externalTempC: 40.3,
      eventHours: 96,
      strategies,
    });
    expect(guidance.recommendedStrategy).toBe("Mechanical + HEPA");
    expect(guidance.headline).toContain("heat");
    expect(guidance.explanation).toContain("overnight");
    expect(guidance.tradeoffs.overheatingRisk).toBe("moderate");
  });

  it("uses transparent temperature, ventilation and duration thresholds", () => {
    expect(assessOverheatingRisk(40.3, 0)).toBe("high");
    expect(assessOverheatingRisk(40.3, 1)).toBe("moderate");
    expect(assessOverheatingRisk(22, 0)).toBe("low");
    expect(assessFreshAirAdequacy(0, 6)).toBe("high");
    expect(assessFreshAirAdequacy(1, 6)).toBe("low");
  });
});
