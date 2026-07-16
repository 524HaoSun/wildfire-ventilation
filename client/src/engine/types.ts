/** Instrumented Architectural Modernism: shared scientific state and data contracts. */
export type SelectedCase = "nyc2023" | "london2022";
export type Building = "single_room" | "two_storey" | "bus";
export type VentMode = "sealed" | "trickle" | "mech";
export type Agent = "pm_surrogate" | "co2_tracer" | "nox_lowdose";
export type SensorKind = "PM" | "CO2" | "NOx" | "T" | "RH";

export interface Sensor {
  id: string;
  x: number;
  y: number;
  kind: SensorKind;
}

export interface ExperimentState {
  selectedCase: SelectedCase;
  targetWindow: { startIdx: number; endIdx: number };
  building: Building;
  leakageACH50: number;
  ventMode: VentMode;
  filterEff: number;
  agent: Agent;
  extTempC: number;
  intTempC: number;
  playbackSpeed: 1 | 5 | 10;
  sensors: Sensor[];
}

export interface CaseDataset {
  id: SelectedCase;
  title: string;
  subtitle: string;
  site: string;
  instrument: string;
  sourceLabel: "EPA AQS" | "DEFRA AURN";
  timestamps: string[];
  pm25: Array<number | null>;
  co?: Array<number | null>;
  o3?: Array<number | null>;
  context?: string[];
}

export interface ModelParameters {
  lambdaInf: number;
  lambdaSup: number;
  eta: number;
  penetration: number;
  deposition: number;
  totalAch: number;
}

export interface MassBalanceResult {
  externalMinute: number[];
  indoorMinute: number[];
  indoorPeak: number;
  outdoorPeak: number;
  indoorPeakMinute: number;
  outdoorPeakMinute: number;
  lagMinutes: number;
  meanIoRatio: number;
  params: ModelParameters;
  gapFilled: boolean;
}

export interface TracerPoint {
  t: number;
  observed: number;
  fitted: number;
  logObserved: number;
  logFitted: number;
}

export interface TracerFit {
  lambdaTrue: number;
  estimate: number;
  ci95: number;
  intercept: number;
  points: TracerPoint[];
}

export interface ExposureResult {
  cumulative: number[];
  totalDose: number;
  equivalentWhoDays: number;
}

export interface StrategyResult {
  name: string;
  peak: number;
  dose: number;
  peakReduction: number;
  doseReduction: number;
  curve: number[];
}

export type GuidanceRisk = "low" | "moderate" | "high";

export interface GuidanceRules {
  smokeThreshold: number;
  heatThreshold: number;
  minimumFreshAirAch: number;
}

export interface GuidancePhase {
  id: "before" | "during" | "after";
  label: string;
  action: string;
}

export interface VentilationGuidance {
  recommendedStrategy: StrategyResult["name"];
  headline: string;
  explanation: string;
  phases: GuidancePhase[];
  tradeoffs: {
    pollutionReduction: number;
    overheatingRisk: GuidanceRisk;
    freshAirAdequacy: GuidanceRisk;
  };
  ruleTrace: string[];
  methodStatement: string;
}

export const DEFAULT_SENSORS: Sensor[] = [
  { id: "S1", x: 250, y: 146, kind: "PM" },
  { id: "S2", x: 690, y: 146, kind: "PM" },
  { id: "S3", x: 250, y: 246, kind: "PM" },
  { id: "S4", x: 690, y: 246, kind: "NOx" },
  { id: "S5", x: 402, y: 314, kind: "CO2" },
  { id: "S6", x: 462, y: 390, kind: "CO2" },
  { id: "S7", x: 532, y: 390, kind: "T" },
  { id: "S8", x: 780, y: 394, kind: "RH" },
];

export const DEFAULT_EXPERIMENT_STATE: ExperimentState = {
  selectedCase: "nyc2023",
  targetWindow: { startIdx: 120, endIdx: 215 },
  building: "single_room",
  leakageACH50: 1,
  ventMode: "sealed",
  filterEff: 0.55,
  agent: "pm_surrogate",
  extTempC: 25,
  intTempC: 21,
  playbackSpeed: 5,
  sensors: DEFAULT_SENSORS,
};
