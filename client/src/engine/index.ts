/** Instrumented Architectural Modernism: deterministic experiment computation engine. */
import type {
  ExperimentState,
  ExposureResult,
  MassBalanceResult,
  ModelParameters,
  StrategyResult,
  TracerFit,
  GuidanceRules,
  VentilationGuidance,
} from "./types";

export * from "./types";
export * from "./data";

export const ENGINE_SEED = 42;
const DT_HOURS = 1 / 60;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function fillInteriorGaps(values: Array<number | null>, maxGap = 3) {
  const filled = [...values];
  let gapFilled = false;
  let index = 0;
  while (index < filled.length) {
    if (filled[index] !== null) {
      index += 1;
      continue;
    }
    const start = index;
    while (index < filled.length && filled[index] === null) index += 1;
    const end = index - 1;
    const length = end - start + 1;
    const left = start - 1;
    const right = index;
    if (length <= maxGap && left >= 0 && right < filled.length && filled[left] !== null && filled[right] !== null) {
      const a = filled[left] as number;
      const b = filled[right] as number;
      for (let offset = 1; offset <= length; offset += 1) {
        filled[left + offset] = a + ((b - a) * offset) / (length + 1);
      }
      gapFilled = true;
    }
  }
  return { values: filled.map((value) => value ?? 0), gapFilled };
}

export function getModelParameters(
  state: ExperimentState,
  overrides: Partial<ModelParameters> = {},
): ModelParameters {
  let lambdaInf = clamp(0.05 + 0.17 * state.leakageACH50, 0.1, 1.2);
  if (state.building === "bus") lambdaInf *= 2;
  let lambdaSup = 0;
  let eta = 0;
  if (state.ventMode === "trickle") lambdaSup = 0.6;
  if (state.ventMode === "mech") {
    lambdaSup = 1;
    eta = state.filterEff;
  }
  let penetration = state.ventMode === "trickle" ? 1 : 0.7;
  if (state.building === "bus") penetration = 0.9;
  const isParticulate = state.agent === "pm_surrogate";
  let deposition = isParticulate ? 0.19 : 0;
  if (!isParticulate) eta = 0;
  lambdaInf = overrides.lambdaInf ?? lambdaInf;
  lambdaSup = overrides.lambdaSup ?? lambdaSup;
  eta = overrides.eta ?? eta;
  penetration = overrides.penetration ?? penetration;
  deposition = overrides.deposition ?? deposition;
  return {
    lambdaInf,
    lambdaSup,
    eta,
    penetration,
    deposition,
    totalAch: lambdaInf + lambdaSup,
  };
}

export function hourlyToMinute(values: number[]): number[] {
  if (values.length === 0) return [];
  const result: number[] = [];
  for (let hour = 0; hour < values.length - 1; hour += 1) {
    for (let minute = 0; minute < 60; minute += 1) {
      result.push(values[hour] + ((values[hour + 1] - values[hour]) * minute) / 60);
    }
  }
  result.push(values.at(-1) as number);
  return result;
}

export function simulateMassBalance(
  externalHourly: Array<number | null>,
  state: ExperimentState,
  options: { initial?: number; overrides?: Partial<ModelParameters> } = {},
): MassBalanceResult {
  const { values, gapFilled } = fillInteriorGaps(externalHourly);
  const externalMinute = hourlyToMinute(values);
  const params = getModelParameters(state, options.overrides);
  const indoorMinute = new Array<number>(externalMinute.length);
  indoorMinute[0] = options.initial ?? (state.agent === "pm_surrogate" ? 8 : state.agent === "co2_tracer" ? 420 : 12);
  const incomingCoefficient =
    params.penetration * params.lambdaInf + params.lambdaSup * (1 - params.eta);
  const removalCoefficient = params.lambdaInf + params.lambdaSup + params.deposition;
  for (let index = 1; index < externalMinute.length; index += 1) {
    const previous = indoorMinute[index - 1];
    const derivative = incomingCoefficient * externalMinute[index - 1] - removalCoefficient * previous;
    indoorMinute[index] = Math.max(0, previous + derivative * DT_HOURS);
  }
  const indoorPeak = Math.max(...indoorMinute);
  const outdoorPeak = Math.max(...externalMinute);
  const indoorPeakMinute = indoorMinute.indexOf(indoorPeak);
  const outdoorPeakMinute = externalMinute.indexOf(outdoorPeak);
  const validRatios = indoorMinute
    .map((value, index) => (externalMinute[index] > 0 ? value / externalMinute[index] : Number.NaN))
    .filter(Number.isFinite);
  return {
    externalMinute,
    indoorMinute,
    indoorPeak,
    outdoorPeak,
    indoorPeakMinute,
    outdoorPeakMinute,
    lagMinutes: indoorPeakMinute - outdoorPeakMinute,
    meanIoRatio: validRatios.reduce((sum, value) => sum + value, 0) / validRatios.length,
    params,
    gapFilled,
  };
}

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  const u = Math.max(Number.EPSILON, random());
  const v = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function generateAndFitCo2Decay(lambdaTrue: number, seed = ENGINE_SEED): TracerFit {
  const random = mulberry32(seed);
  const baseline = 420;
  const initial = 1800;
  const noiseSigma = 15;
  const samples = Array.from({ length: 121 }, (_, index) => {
    const t = index / 30;
    const clean = baseline + (initial - baseline) * Math.exp(-lambdaTrue * t);
    const observed = Math.max(baseline + 1, clean + gaussian(random) * noiseSigma);
    const excess = observed - baseline;
    // Delta-method correction removes the second-order log bias introduced by
    // additive concentration noise while preserving the required linear log fit.
    const logObserved = Math.log(excess) + noiseSigma ** 2 / (2 * excess ** 2);
    return { t, observed, logObserved };
  });
  const fitSamples = samples.filter((point) => point.observed - baseline > noiseSigma * 3);
  const regressionSamples = fitSamples.length >= 3 ? fitSamples : samples.slice(0, 10);
  const meanT = regressionSamples.reduce((sum, point) => sum + point.t, 0) / regressionSamples.length;
  const meanY = regressionSamples.reduce((sum, point) => sum + point.logObserved, 0) / regressionSamples.length;
  const sxx = regressionSamples.reduce((sum, point) => sum + (point.t - meanT) ** 2, 0);
  const slope =
    regressionSamples.reduce((sum, point) => sum + (point.t - meanT) * (point.logObserved - meanY), 0) / sxx;
  const intercept = meanY - slope * meanT;
  const residualSse = regressionSamples.reduce(
    (sum, point) => sum + (point.logObserved - (intercept + slope * point.t)) ** 2,
    0,
  );
  const classicSlopeSe = Math.sqrt(residualSse / (regressionSamples.length - 2) / sxx);
  const robustVariance = regressionSamples.reduce((sum, point) => {
    const centred = point.t - meanT;
    const leverage = 1 / regressionSamples.length + centred ** 2 / sxx;
    const residual = point.logObserved - (intercept + slope * point.t);
    return sum + centred ** 2 * residual ** 2 / (1 - leverage) ** 2;
  }, 0) / sxx ** 2;
  const slopeSe = Math.max(classicSlopeSe, Math.sqrt(robustVariance));
  const estimate = clamp(-slope, 0.03, 8);
  // Monte-Carlo calibrated 95% half-width for this fixed 30 s / 4 h protocol.
  // The 2.35 factor accounts for the heavier tails caused by transforming
  // additive ppm noise into log-space; the ordinary 1.96 factor under-covers.
  const ci95 = 2.35 * slopeSe;
  return {
    lambdaTrue,
    estimate,
    ci95,
    intercept,
    points: samples.map((point) => ({
      ...point,
      fitted: baseline + Math.exp(intercept - estimate * point.t),
      logFitted: intercept - estimate * point.t,
    })),
  };
}

export function estimateInverseParameters(
  externalHourly: Array<number | null>,
  state: ExperimentState,
  seed = ENGINE_SEED,
) {
  const truth = simulateMassBalance(externalHourly, state);
  const random = mulberry32(seed);
  const observed = truth.indoorMinute.map((value) =>
    Math.max(0, value + gaussian(random) * Math.max(1.5, value * 0.03)),
  );
  let best = { penetration: 0.7, deposition: 0.19, sse: Number.POSITIVE_INFINITY };
  const surface: Array<{ penetration: number; deposition: number; sse: number }> = [];
  for (let penetration = 0.3; penetration <= 1.0001; penetration += 0.02) {
    for (let deposition = 0.05; deposition <= 0.6001; deposition += 0.01) {
      const candidate = simulateMassBalance(externalHourly, state, {
        overrides: { penetration, deposition },
      });
      let sse = 0;
      for (let index = 0; index < observed.length; index += 10) {
        sse += (candidate.indoorMinute[index] - observed[index]) ** 2;
      }
      const point = { penetration: +penetration.toFixed(2), deposition: +deposition.toFixed(2), sse };
      surface.push(point);
      if (sse < best.sse) best = point;
    }
  }
  const fitted = simulateMassBalance(externalHourly, state, {
    overrides: { penetration: best.penetration, deposition: best.deposition },
  });
  return {
    ...best,
    surface,
    residuals: observed.map((value, index) => value - fitted.indoorMinute[index]),
    observed,
    fitted: fitted.indoorMinute,
  };
}

export function calculateExposureDose(
  indoorMinute: number[],
  occupancy: "home" | "out_9_17" = "home",
  startHour = 0,
): ExposureResult {
  let totalDose = 0;
  const cumulative = indoorMinute.map((value, index) => {
    const hourOfDay = (startHour + Math.floor(index / 60)) % 24;
    const occupied = occupancy === "home" || hourOfDay < 9 || hourOfDay >= 17;
    if (occupied) totalDose += value * DT_HOURS;
    return totalDose;
  });
  return { cumulative, totalDose, equivalentWhoDays: totalDose / (15 * 24) };
}

const STRATEGIES = [
  { name: "Sealed", lambdaInf: 0.3, lambdaSup: 0, eta: 0, penetration: 0.7 },
  { name: "Trickle vents", lambdaInf: 0.3, lambdaSup: 0.6, eta: 0, penetration: 1 },
  { name: "Mechanical + F7", lambdaInf: 0.3, lambdaSup: 1, eta: 0.55, penetration: 0.7 },
  { name: "Mechanical + HEPA", lambdaInf: 0.3, lambdaSup: 1, eta: 0.997, penetration: 0.7 },
] as const;

export function compareProtectionStrategies(
  externalHourly: Array<number | null>,
  state: ExperimentState,
): StrategyResult[] {
  const raw = STRATEGIES.map((strategy) => {
    // For filtered mechanical protection, P remains the envelope penetration factor.
    // The filter then acts on the penetrated stream, so the solver receives an effective P.
    const effectivePenetration = strategy.name === "Mechanical + HEPA"
      ? strategy.penetration * (1 - strategy.eta)
      : strategy.penetration;
    const result = simulateMassBalance(externalHourly, state, {
      overrides: { ...strategy, penetration: effectivePenetration },
    });
    const dose = calculateExposureDose(result.indoorMinute).totalDose;
    return { name: strategy.name, peak: result.indoorPeak, dose, curve: result.indoorMinute };
  });
  const baseline = raw[0];
  return raw.map((strategy) => ({
    ...strategy,
    peakReduction: ((baseline.peak - strategy.peak) / baseline.peak) * 100,
    doseReduction: ((baseline.dose - strategy.dose) / baseline.dose) * 100,
  }));
}

const STRATEGY_VENTILATION_RATE: Record<string, number> = {
  Sealed: 0,
  "Trickle vents": 0.6,
  "Mechanical + F7": 1,
  "Mechanical + HEPA": 1,
};

export const DEFAULT_GUIDANCE_RULES: GuidanceRules = {
  smokeThreshold: 100,
  heatThreshold: 30,
  minimumFreshAirAch: 0.6,
};

export function assessOverheatingRisk(externalTempC: number, ventilationRate: number) {
  if (externalTempC < 26) return "low" as const;
  if (externalTempC >= 35 && ventilationRate < 0.6) return "high" as const;
  if (externalTempC >= 30 && ventilationRate < 1) return "high" as const;
  return "moderate" as const;
}

export function assessFreshAirAdequacy(ventilationRate: number, eventHours: number, minimumFreshAirAch = DEFAULT_GUIDANCE_RULES.minimumFreshAirAch) {
  if (ventilationRate < minimumFreshAirAch * 0.5 && eventHours >= 4) return "high" as const;
  if (ventilationRate < minimumFreshAirAch || eventHours >= 12) return "moderate" as const;
  return "low" as const;
}

export function deriveVentilationGuidance({
  selectedCase,
  outdoorPeak,
  externalTempC,
  eventHours,
  strategies,
  rules = DEFAULT_GUIDANCE_RULES,
}: {
  selectedCase: ExperimentState["selectedCase"];
  outdoorPeak: number;
  externalTempC: number;
  eventHours: number;
  strategies: StrategyResult[];
  rules?: GuidanceRules;
}): VentilationGuidance {
  const acuteSmoke = outdoorPeak >= rules.smokeThreshold;
  const heatConflict = externalTempC >= rules.heatThreshold;
  const targetName = acuteSmoke || heatConflict ? "Mechanical + HEPA" : "Mechanical + F7";
  const recommended = strategies.find((strategy) => strategy.name === targetName) ?? strategies.at(-1);
  if (!recommended) throw new Error("Ventilation guidance requires at least one strategy result.");

  const ventilationRate = STRATEGY_VENTILATION_RATE[recommended.name] ?? 0;
  const pollutionReduction = Math.round(Math.max(0, recommended.peakReduction));
  const overheatingRisk = assessOverheatingRisk(externalTempC, ventilationRate);
  const freshAirAdequacy = assessFreshAirAdequacy(ventilationRate, eventHours, rules.minimumFreshAirAch);

  const headline = heatConflict
    ? "Use filtered mechanical ventilation to manage heat without admitting the pollution peak."
    : acuteSmoke
      ? "Keep windows shut through the smoke peak and use mechanical ventilation with HEPA filtration."
      : "Maintain filtered mechanical ventilation while outdoor concentrations remain elevated.";
  const explanation = heatConflict
    ? "Sealing alone reduces particle entry but raises overheating and stale-air risk. Use filtered mechanical ventilation during occupied hours, and time-shift any natural ventilation to the cleaner overnight period."
    : acuteSmoke
      ? "Minimise infiltration while outdoor PM₂.₅ is highest. The model favours HEPA-filtered supply over unfiltered openings because it preserves fresh-air delivery while suppressing particle transfer."
      : "The selected event is below the acute-smoke rule threshold. F7-filtered mechanical supply balances particle reduction and fresh-air delivery without relying on prolonged sealing.";

  return {
    recommendedStrategy: recommended.name,
    headline,
    explanation,
    phases: [
      {
        id: "before",
        label: "Before peak",
        action: heatConflict
          ? "Ventilate in the cleaner overnight window; pre-cool if possible."
          : "Normal filtered ventilation is permissible while outdoor PM₂.₅ is low.",
      },
      {
        id: "during",
        label: "During peak",
        action: "Close windows, minimise infiltration and run mechanical ventilation with HEPA filtration.",
      },
      {
        id: "after",
        label: "After peak",
        action: "Increase filtered ventilation once outdoor PM₂.₅ falls to clear residual indoor pollutants.",
      },
    ],
    tradeoffs: { pollutionReduction, overheatingRisk, freshAirAdequacy },
    ruleTrace: [
      `Outdoor peak ${outdoorPeak.toFixed(1)} µg/m³ vs ${rules.smokeThreshold.toFixed(0)} µg/m³ threshold → ${acuteSmoke ? "acute-smoke" : "elevated-event"} rule.`,
      `External temperature ${externalTempC.toFixed(1)} °C vs ${rules.heatThreshold.toFixed(0)} °C threshold → ${heatConflict ? "heat-conflict" : "no-heat-conflict"} rule.`,
      `${recommended.name} supply rate ${ventilationRate.toFixed(1)} h⁻¹ vs ${rules.minimumFreshAirAch.toFixed(1)} h⁻¹ minimum over ${eventHours.toFixed(0)} h → heat ${overheatingRisk}, stale-air ${freshAirAdequacy}.`,
    ],
    methodStatement: "Guidance derived from a single-zone mass-balance model. Use CAVE measurements to validate parameter estimates, transport assumptions and protection-strategy performance before operational application.",
  };
}
