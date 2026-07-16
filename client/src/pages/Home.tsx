/** Editorial research atlas: Times New Roman throughout, generous 16:9 spacing, no compressed evidence surfaces. */
/* Editorial / Mineral Research Atlas: evidence-led hierarchy, restrained ornament, and stable 16:9 scientific layouts. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Download, FileText, Pause, Play, RotateCcw, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { BUILDING_PROFILES, BuildingScene3D } from "@/components/BuildingScene3D";
import { CaveSection } from "@/components/CaveSection";
import { PlanSheet } from "@/components/PlanSheet";
import { ScientificChart } from "@/components/ScientificChart";
import caveMarkUrl from "@/assets/cave-mark_84921330.png";
import {
  CASES,
  DEFAULT_EXPERIMENT_STATE,
  DEFAULT_GUIDANCE_RULES,
  calculateExposureDose,
  compareProtectionStrategies,
  deriveVentilationGuidance,
  deriveMeasuredAnchors,
  estimateInverseParameters,
  generateAndFitCo2Decay,
  getCaseDataset,
  getModelParameters,
  peak,
  simulateMassBalance,
  type ExperimentState,
  type GuidancePhase,
  type GuidanceRules,
  type SelectedCase,
} from "@/engine";

const STEPS = ["Challenge", "Design", "Run", "Analyse"];
const TARGET_WINDOW_HOURS = 24;
const PM25_24H_GUIDELINE = 15;
const EVENT_CONTEXT: Record<SelectedCase, string> = {
  nyc2023: "Canadian wildfire smoke · New York sky turned orange",
  london2022: "Wennington wildfire, East London · UK's first 40 °C day",
};
const CASE_GIS_META: Record<SelectedCase, {
  place: string;
  coordinate: string;
  sourceRegion: string;
  transport: string;
  operationalCue: string;
}> = {
  nyc2023: {
    place: "Queens, New York",
    coordinate: "40.74°N · 73.82°W",
    sourceRegion: "Canadian wildfire smoke transport",
    transport: "A long-range plume episode moves from boreal fire regions into a dense urban receptor site.",
    operationalCue: "Treat outdoor PM as the measured boundary condition before testing indoor protection.",
  },
  london2022: {
    place: "Bloomsbury, London",
    coordinate: "51.52°N · 0.13°W",
    sourceRegion: "Urban-edge wildfire + heatwave",
    transport: "A local-to-regional fire and heat episode stresses the smoke, heat and fresh-air trade-off.",
    operationalCue: "Use the CAVE exterior setpoint to test ventilation choices under simultaneous heat stress.",
  },
};
const EVENT_EXTERNAL_TEMPERATURE: Record<SelectedCase, number> = {
  nyc2023: 29,
  london2022: 40,
};
const STORAGE_KEY = "cave-experiment-state-v1";
const INTERACTION_STORAGE_KEY = "cave-interaction-state-v1";
const ANALYSIS_CHAPTERS = [
  { label: "Characterise", note: "Tracer decay establishes the chamber air-change rate." },
  { label: "Fit", note: "The shared cursor now tests the reconstructed indoor response." },
  { label: "Dose", note: "Cumulative exposure becomes the primary evidence field." },
  { label: "Decide", note: "Operational guidance links thresholds, phases and strategy evidence." },
] as const;

function fixedDayWindow(startIdx: number, length: number) {
  const maxStart = Math.max(0, length - TARGET_WINDOW_HOURS);
  const safeStart = Math.max(0, Math.min(Math.round(startIdx), maxStart));
  return { startIdx: safeStart, endIdx: Math.min(length - 1, safeStart + TARGET_WINDOW_HOURS - 1) };
}

function Provenance({ type, children }: { type: "measured" | "model" | "illustrative"; children: React.ReactNode }) {
  return <span className={`provenance-chip ${type}`}>{children}</span>;
}

function Panel({ title, eyebrow, action, children, className = "" }: { title?: string; eyebrow?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{(title || eyebrow || action) && <header className="panel-header"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}{title && <h2 className="section-title">{title}</h2>}</div>{action}</header>}{children}</section>;
}

function Segmented<T extends string | number>({ value, values, labels, onChange }: { value: T; values: readonly T[]; labels: readonly string[]; onChange: (value: T) => void }) {
  return <div className="segmented">{values.map((item, index) => <button key={String(item)} className={value === item ? "active" : ""} onClick={() => onChange(item)}>{labels[index]}</button>)}</div>;
}

function formatTimestamp(timestamp: string) {
  const [date, time] = timestamp.split(" ");
  return `${date.slice(5)} ${time}`;
}

function CaseRouteMap({ id }: { id: SelectedCase }) {
  const meta = CASE_GIS_META[id];
  const isNyc = id === "nyc2023";
  return <figure className={`case-route-map case-route-${id}`} aria-label={`${meta.place} schematic smoke-transport context`}>
    <svg viewBox="0 0 320 140" role="img">
      <title>{meta.place} smoke transport schematic</title>
      <rect x="0" y="0" width="320" height="140" rx="0" />
      <path className="map-grid" d="M28 16v108M84 16v108M140 16v108M196 16v108M252 16v108M12 36h296M12 74h296M12 112h296" />
      {isNyc ? <>
        <path className="map-land" d="M33 19c33-11 76-8 103 8 34 20 39 47 68 54 27 7 43-7 71 6 18 8 26 22 30 34H37c-16-14-24-31-22-50 2-21 8-42 18-52Z" />
        <path className="map-plume" d="M63 37C103 52 131 66 164 76c31 9 64 11 95 27" />
        <circle className="map-source" cx="70" cy="38" r="8" />
        <circle className="map-site" cx="260" cy="104" r="7" />
        <path className="map-ring" d="M238 104a22 22 0 1 0 44 0a22 22 0 1 0-44 0M222 104a38 38 0 1 0 76 0a38 38 0 1 0-76 0" />
        <text x="42" y="29">CANADA FIRE REGION</text>
        <text x="220" y="127">QUEENS AQS</text>
      </> : <>
        <path className="map-land" d="M94 19c35-9 77 3 91 31 9 18 6 35 22 47 20 15 52 6 74 22H67c8-17 1-34 10-52 7-15 2-39 17-48Z" />
        <path className="map-plume" d="M249 105C225 93 205 77 184 65c-29-15-56-20-89-24" />
        <circle className="map-source" cx="247" cy="105" r="8" />
        <circle className="map-site" cx="96" cy="42" r="7" />
        <path className="map-ring" d="M78 42a18 18 0 1 0 36 0a18 18 0 1 0-36 0M64 42a32 32 0 1 0 64 0a32 32 0 1 0-64 0" />
        <text x="68" y="30">BLOOMSBURY AURN</text>
        <text x="204" y="126">EAST LONDON FIRE</text>
      </>}
      <text className="map-caption" x="14" y="130">SCHEMATIC GIS CUE · NOT A MEASURED SMOKE FIELD</text>
    </svg>
  </figure>;
}

function ChallengeScreen({ state, setState, sharedMinute, setSharedMinute, onAdvance }: { state: ExperimentState; setState: React.Dispatch<React.SetStateAction<ExperimentState>>; sharedMinute: number; setSharedMinute: React.Dispatch<React.SetStateAction<number>>; onAdvance: () => void }) {
  const anchors = deriveMeasuredAnchors();
  const selected = getCaseDataset(state.selectedCase);
  const selectedPeak = peak(selected.pm25);
  const selectedMeta = CASE_GIS_META[state.selectedCase];
  const selectedMultiple = selectedPeak.value / PM25_24H_GUIDELINE;
  const targetWindow = fixedDayWindow(state.targetWindow.startIdx, selected.pm25.length);
  const selectCase = (id: SelectedCase) => {
    const next = getCaseDataset(id);
    const nextPeak = peak(next.pm25);
    const targetWindow = fixedDayWindow(nextPeak.index - Math.floor(TARGET_WINDOW_HOURS / 2), next.pm25.length);
    setState((current) => ({
      ...current,
      selectedCase: id,
      targetWindow,
      extTempC: EVENT_EXTERNAL_TEMPERATURE[id],
    }));
    setSharedMinute(Math.max(0, Math.min((nextPeak.index - targetWindow.startIdx) * 60, (TARGET_WINDOW_HOURS * 60) - 1)));
  };
  const setWindowStart = (value: number) => setState((current) => ({
    ...current,
    targetWindow: fixedDayWindow(value, selected.pm25.length),
  }));
  return <main className="screen"><div className="screen-grid grid-challenge">
    <Panel eyebrow="Select event" title="Contrasting events">
      <div className="panel-body case-list">
        {(["nyc2023", "london2022"] as SelectedCase[]).map((id) => {
          const item = CASES[id];
          const itemPeak = peak(item.pm25);
          const meta = CASE_GIS_META[id];
          const anchorSummary = id === "nyc2023" ? `${anchors.nycRatio.toFixed(0)}× local baseline` : `O₃ peak ${anchors.londonO3Peak.value.toFixed(1)} µg/m³`;
          return <button key={id} className={`case-card case-${id} ${state.selectedCase === id ? "selected" : ""}`} onClick={() => selectCase(id)}>
            <span className="case-place">{meta.place}</span>
            <h3>{item.title}</h3><p>{item.subtitle}</p><p className="event-context">{EVENT_CONTEXT[id]}</p>
            <div className="case-peak"><strong>{itemPeak.value.toFixed(1)}</strong><span>µg/m³<br />peak hourly PM₂.₅</span></div>
            <div className="case-card-meta"><span><b>{(itemPeak.value / PM25_24H_GUIDELINE).toFixed(id === "nyc2023" ? 0 : 1)}×</b> WHO 24 h line</span><span><b>{anchorSummary}</b> measured anchor</span></div>
            <div className="case-tags"><span className="tiny-tag">{item.site.split(" · ")[0]}</span><span className="tiny-tag">{meta.coordinate}</span></div>
          </button>;
        })}
      </div>
    </Panel>
    <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
      <Panel className={`event-explorer event-${state.selectedCase}`} eyebrow="Event explorer" title={selected.title} action={<div className="button-row"><Provenance type="measured">Measured · {selected.sourceLabel}</Provenance><button className="primary-button" onClick={onAdvance}>Design experiment <ArrowRight size={13} /></button></div>}>
        <div className="panel-body">
          <ScientificChart
            series={[
              { label: "PM₂.₅ measured", values: selected.pm25, color: "#b64d32", width: 2.2 },
              { label: "WHO 2021 24 h guideline", values: selected.pm25.map(() => PM25_24H_GUIDELINE), color: "#6d7f78", dashed: true, width: 1.4 },
            ]}
            xLabels={selected.timestamps}
            yLabel="PM₂.₅ (µg/m³)"
            xLabel="Local time"
            height={220}
            range={{ start: targetWindow.startIdx, end: targetWindow.endIdx }}
            markerIndex={Math.min(selected.pm25.length - 1, targetWindow.startIdx + Math.floor(sharedMinute / 60))}
            onPointSelect={(index) => {
              const nextWindow = fixedDayWindow(index - Math.floor(TARGET_WINDOW_HOURS / 2), selected.pm25.length);
              setState((current) => ({ ...current, targetWindow: nextWindow }));
              setSharedMinute(Math.max(0, Math.min((index - nextWindow.startIdx) * 60, (TARGET_WINDOW_HOURS * 60) - 1)));
            }}
          />
          <div className="range-controls single-window-control">
            <label htmlFor="event-day-window">
              <span className="window-control-heading"><b>24-hour window</b><strong>{formatTimestamp(selected.timestamps[targetWindow.startIdx])} — {formatTimestamp(selected.timestamps[targetWindow.endIdx])}</strong></span>
              <input id="event-day-window" aria-label="Select the start of the fixed 24-hour exposure window" type="range" min={0} max={Math.max(0, selected.pm25.length - TARGET_WINDOW_HOURS)} value={targetWindow.startIdx} onChange={(event) => setWindowStart(+event.target.value)} />
              <span className="window-control-scale"><i>First available day</i><i>Fixed duration · 24 h</i><i>Last available day</i></span>
            </label>
          </div>
          <aside className="case-context-panel">
            <CaseRouteMap id={state.selectedCase} />
            <div className="case-context-copy">
              <div className="case-context-heading"><span>{selectedMeta.sourceRegion}</span><Provenance type="illustrative">Schematic GIS context</Provenance></div>
              <p>{selectedMeta.transport}</p>
              <dl>
                <div><dt>Monitoring site</dt><dd>{selected.site}</dd></div>
                <div><dt>Reference line</dt><dd>WHO 2021 PM₂.₅ 24 h guideline: {PM25_24H_GUIDELINE} µg/m³; used here as context, not an hourly compliance test.</dd></div>
                <div><dt>Experiment cue</dt><dd>{selectedMeta.operationalCue}</dd></div>
              </dl>
            </div>
          </aside>
        </div>
        <div className="metric-band challenge-metrics">
          <div className="metric"><label>Peak event</label><strong className="smoke">{selectedPeak.value.toFixed(1)} µg/m³</strong></div>
          <div className="metric"><label>Peak timestamp</label><strong>{formatTimestamp(selected.timestamps[selectedPeak.index])}</strong></div>
          <div className="metric"><label>Guideline multiple</label><strong>{selectedMultiple.toFixed(state.selectedCase === "nyc2023" ? 0 : 1)}×</strong></div>
        </div>
      </Panel>
    </div>
  </div></main>;
}

function DesignScreen({ state, setState, simulation, selectedSensor, setSelectedSensor, onAdvance }: { state: ExperimentState; setState: React.Dispatch<React.SetStateAction<ExperimentState>>; simulation: ReturnType<typeof simulateMassBalance>; selectedSensor: string; setSelectedSensor: (sensorId: string) => void; onAdvance: () => void }) {
  const params = simulation.params;
  const profile = BUILDING_PROFILES[state.building];
  const [sceneMode, setSceneMode] = useState<"section" | "3d">("section");
  const [planOpen, setPlanOpen] = useState(false);
  return <main className="screen"><div className="screen-grid grid-design">
    <Panel className="design-controls" eyebrow="1 · Configure" title="Experiment controls">
      <div className="panel-body design-control-body">
        <div className="control-group building-control"><span className="control-label">Test building</span><div className="building-selector">{(["single_room", "two_storey", "bus"] as const).map((building) => {
          const item = BUILDING_PROFILES[building]; const Icon = item.icon;
          return <button key={building} className={state.building === building ? "active" : ""} onClick={() => setState((s) => ({ ...s, building }))}><Icon size={15} /><span><b>{item.shortName}</b><small>{item.volume}</small></span></button>;
        })}</div></div>
        <div className="control-group"><div className="slider-readout"><span>Envelope airtightness</span><strong>{state.leakageACH50.toFixed(1)} <small className="mono">h⁻¹</small></strong></div><input aria-label="Envelope airtightness" type="range" min="0.5" max="7" step="0.1" value={state.leakageACH50} onChange={(e) => setState((s) => ({ ...s, leakageACH50: +e.target.value }))} /></div>
        <div className="control-group"><span className="control-label">Ventilation mode</span><Segmented value={state.ventMode} values={["sealed", "trickle", "mech"] as const} labels={["Sealed", "Trickle", "Mechanical"]} onChange={(ventMode) => setState((s) => ({ ...s, ventMode }))} /></div>
        <div className="control-group"><div className="slider-readout"><span>Filter efficiency</span><strong>{Math.round(state.filterEff * 100)}%</strong></div><input aria-label="Filter efficiency" type="range" min="0" max="0.997" step="0.01" value={state.filterEff} onChange={(e) => setState((s) => ({ ...s, filterEff: +e.target.value }))} /><div className="muted mono" style={{ fontSize: 10 }}>MERV 8 · F7 · F9 · HEPA</div></div>
        <div className="control-pair"><div className="control-group"><span className="control-label">Challenge agent</span><Segmented value={state.agent} values={["pm_surrogate", "co2_tracer", "nox_lowdose"] as const} labels={["PM₂.₅", "CO₂", "NOx"]} onChange={(agent) => setState((s) => ({ ...s, agent }))} /></div><div className="control-group temperature-control"><div className="slider-readout"><span>Exterior · −5…43 °C</span><strong>{state.extTempC.toFixed(1)}°C</strong></div><input aria-label="External temperature" type="range" min="-5" max="43" step="0.5" value={state.extTempC} onChange={(e) => setState((s) => ({ ...s, extTempC: +e.target.value }))} /><div className="slider-readout dual-temperature"><span>Interior · 10…28 °C</span><strong>{state.intTempC.toFixed(1)}°C</strong></div><input aria-label="Interior temperature" type="range" min="10" max="28" step="0.5" value={state.intTempC} onChange={(e) => setState((s) => ({ ...s, intTempC: +e.target.value }))} /></div></div>
      </div>
      <div className="design-generate"><div className="button-row"><button className="secondary-button" onClick={() => setPlanOpen(true)}><FileText size={13} /> Plan sheet</button><button className="primary-button" onClick={() => { toast.success(`${profile.name} plan generated`); onAdvance(); }}><FileText size={13} /> Generate experiment</button></div><span>Proceed with the same building and sensor field.</span></div>
    </Panel>
    <Panel className="design-scene-panel" eyebrow="2 · Orient" title="Interactive CAVE model" action={<div className="button-row"><Segmented value={sceneMode} values={["section", "3d"] as const} labels={["Section", "3D"]} onChange={setSceneMode} /><Provenance type="illustrative">Facility schematic</Provenance></div>}>
      {sceneMode === "section" ? <CaveSection building={state.building} sensors={state.sensors} onSensorsChange={(sensors) => setState((current) => ({ ...current, sensors }))} selectedSensor={selectedSensor} onSensorSelect={setSelectedSensor} totalAch={params.totalAch} exteriorTempC={state.extTempC} interiorTempC={state.intTempC} ventMode={state.ventMode} /> : <BuildingScene3D building={state.building} sensors={state.sensors} totalAch={params.totalAch} selectedSensor={selectedSensor} onSensorSelect={setSelectedSensor} />}
    </Panel>
    <div className="design-evidence-column">
      <Panel className="design-readiness" eyebrow="3 · Predicted response" action={<Provenance type="model">Model prediction</Provenance>}>
        <div className="design-readiness-ledger"><div><span>Indoor peak</span><strong>{simulation.indoorPeak.toFixed(1)} <small>µg/m³</small></strong></div><div><span>Response lag</span><strong>{simulation.lagMinutes} <small>min</small></strong></div><div><span>I/O ratio</span><strong>{simulation.meanIoRatio.toFixed(2)}</strong></div><div><span>Air exchange</span><strong>{params.totalAch.toFixed(2)} <small>h⁻¹</small></strong></div></div>
      </Panel>
    </div>
    <PlanSheet open={planOpen} onClose={() => setPlanOpen(false)} state={state} parameters={params} />
  </div></main>;
}

function RunScreen({ state, setState, simulation, minute, setMinute, selectedSensor, setSelectedSensor }: { state: ExperimentState; setState: React.Dispatch<React.SetStateAction<ExperimentState>>; simulation: ReturnType<typeof simulateMassBalance>; minute: number; setMinute: React.Dispatch<React.SetStateAction<number>>; selectedSensor: string; setSelectedSensor: (sensorId: string) => void }) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setMinute((value) => {
      const next = value + state.playbackSpeed;
      if (next >= simulation.indoorMinute.length - 1) { setPlaying(false); return simulation.indoorMinute.length - 1; }
      return next;
    }), 300);
    return () => window.clearInterval(timer);
  }, [playing, simulation.indoorMinute.length, state.playbackSpeed]);
  const currentIndoor = simulation.indoorMinute[minute] ?? simulation.indoorMinute[0];
  const currentOutdoor = simulation.externalMinute[minute] ?? simulation.externalMinute[0];
  const sensorValues = useMemo(() => Object.fromEntries(state.sensors.map((sensor, index) => {
    if (sensor.kind === "PM") return [sensor.id, currentIndoor * (0.9 + index * .025)];
    if (sensor.kind === "CO2") return [sensor.id, 842 + Math.sin(minute / 90) * 26];
    if (sensor.kind === "NOx") return [sensor.id, Math.max(4, currentOutdoor * .34)];
    if (sensor.kind === "T") return [sensor.id, state.intTempC + .1];
    return [sensor.id, 46 + Math.sin(minute / 120) * 2];
  })), [currentIndoor, currentOutdoor, minute, state.intTempC, state.sensors]);
  const pmRanked = state.sensors.filter((sensor) => sensor.kind === "PM").sort((a, b) => (sensorValues[b.id] ?? 0) - (sensorValues[a.id] ?? 0));
  const keySensors = [pmRanked[0], ...(["CO2", "T", "RH"] as const).map((kind) => state.sensors.find((sensor) => sensor.kind === kind))].filter(Boolean) as typeof state.sensors;
  const hours = Math.floor(minute / 60); const mins = minute % 60;
  return <main className="screen"><div className="screen-grid grid-run">
    <Panel className="timeline-panel" eyebrow="Experiment replay" action={<div className="button-row"><Segmented value={state.playbackSpeed} values={[1, 5, 10] as const} labels={["×1", "×5", "×10"]} onChange={(playbackSpeed) => setState((s) => ({ ...s, playbackSpeed }))} /><button className="secondary-button replay-reset" onClick={() => { setMinute(0); setPlaying(false); }}><RotateCcw size={13} /> Reset</button></div>}>
      <div className="timeline"><button className="transport" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause replay" : "Play replay"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button><input aria-label="Experiment timeline" type="range" min="0" max={simulation.indoorMinute.length - 1} value={minute} onChange={(e) => setMinute(+e.target.value)} /><div className="timecode">{String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:00</div></div>
    </Panel>
    <div className="run-main" style={{ gridColumn: "1 / -1" }}>
      <Panel className="run-scene-panel" eyebrow="Spatial check" title={BUILDING_PROFILES[state.building].shortName}><BuildingScene3D building={state.building} sensors={state.sensors} totalAch={simulation.params.totalAch} runMode externalSmokeIntensity={Math.max(0, Math.min(1, currentOutdoor / 410.1))} activeSensor={pmRanked[0]?.id} sensorValues={sensorValues} selectedSensor={selectedSensor} onSensorSelect={setSelectedSensor} /></Panel>
      <Panel className="run-response-panel" eyebrow="Primary evidence" title="External → indoor response">
        <div className="panel-body run-response-chart"><ScientificChart series={[{ label: "External PM₂.₅", values: simulation.externalMinute.filter((_, i) => i % 30 === 0), color: "#b64d32" }, { label: "Indoor PM₂.₅", values: simulation.indoorMinute.filter((_, i) => i % 30 === 0), color: "#0f6c62", dashed: true }]} markerIndex={Math.floor(minute / 30)} height={240} chartWidth={1200} yLabel="PM₂.₅ (µg/m³)" xLabel="Elapsed time" /></div>
        <div className="metric-band"><div className="metric"><label>External now</label><strong className="smoke">{currentOutdoor.toFixed(1)}</strong></div><div className="metric"><label>Indoor now</label><strong className="teal">{currentIndoor.toFixed(1)}</strong></div><div className="metric"><label>Peak / lag</label><strong>{simulation.indoorPeak.toFixed(1)} / {simulation.lagMinutes} min</strong></div></div>
      </Panel>
      <Panel className="run-sensor-panel" eyebrow="Key sensors" title="Modelled sensors" action={<Provenance type="model">Model prediction</Provenance>}><div className="panel-body sensor-grid">{keySensors.map((sensor) => <button key={sensor.id} onClick={() => setSelectedSensor(sensor.id)} className={`sensor-tile ${sensor.id === pmRanked[0]?.id ? "hot" : ""} ${selectedSensor === sensor.id ? "selected" : ""}`}><div className="sensor-tile-head"><b>{sensor.id}</b><span>{sensor.kind}</span></div><div className="sensor-tile-value">{sensorValues[sensor.id].toFixed(sensor.kind === "PM" ? 0 : 1)} <small>{sensor.kind === "PM" || sensor.kind === "NOx" ? "µg/m³" : sensor.kind === "CO2" ? "ppm" : sensor.kind === "T" ? "°C" : "%"}</small></div></button>)}</div><p className="run-sensor-caveat">Single-zone model · one indoor mean · inter-sensor spatial variation is illustrative.</p></Panel>
    </div>
  </div></main>;
}

function AnalyseScreen({ state, simulation, windowValues, sharedMinute, setSharedMinute, selectedSensor, guidanceRules, setGuidanceRules, lockedStrategy, setLockedStrategy, decisionNote, setDecisionNote, analysisChapter, setAnalysisChapter }: {
  state: ExperimentState;
  simulation: ReturnType<typeof simulateMassBalance>;
  windowValues: Array<number | null>;
  sharedMinute: number;
  setSharedMinute: React.Dispatch<React.SetStateAction<number>>;
  selectedSensor: string;
  guidanceRules: GuidanceRules;
  setGuidanceRules: React.Dispatch<React.SetStateAction<GuidanceRules>>;
  lockedStrategy: string | null;
  setLockedStrategy: React.Dispatch<React.SetStateAction<string | null>>;
  decisionNote: string;
  setDecisionNote: React.Dispatch<React.SetStateAction<string>>;
  analysisChapter: number;
  setAnalysisChapter: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [hoveredStrategy, setHoveredStrategy] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<GuidancePhase["id"]>("during");
  const [expandedTradeoff, setExpandedTradeoff] = useState<"pollution" | "heat" | "fresh" | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const wheelDelta = useRef(0);
  const wheelLocked = useRef(false);
  const tracer = useMemo(() => generateAndFitCo2Decay(simulation.params.totalAch || .1), [simulation.params.totalAch]);
  const inverse = useMemo(() => estimateInverseParameters(windowValues, state), [state, windowValues]);
  const exposure = useMemo(() => calculateExposureDose(simulation.indoorMinute, "home"), [simulation.indoorMinute]);
  const strategies = useMemo(() => compareProtectionStrategies(windowValues, state), [state, windowValues]);
  const selectedPeak = useMemo(() => peak(windowValues), [windowValues]);
  const guidance = useMemo(() => deriveVentilationGuidance({ selectedCase: state.selectedCase, outdoorPeak: selectedPeak.value, externalTempC: state.extTempC, eventHours: windowValues.length, strategies, rules: guidanceRules }), [guidanceRules, selectedPeak.value, state.extTempC, state.selectedCase, strategies, windowValues.length]);
  const activeStrategyName = hoveredStrategy ?? lockedStrategy;
  const activeStrategy = strategies.find((strategy) => strategy.name === activeStrategyName);
  const phaseMinute: Record<GuidancePhase["id"], number> = {
    before: Math.max(0, simulation.outdoorPeakMinute - 120),
    during: simulation.outdoorPeakMinute,
    after: Math.min(simulation.indoorMinute.length - 1, simulation.outdoorPeakMinute + 180),
  };
  const phaseRange: Record<GuidancePhase["id"], { start: number; end: number }> = {
    before: { start: Math.max(0, simulation.outdoorPeakMinute - 240), end: Math.max(0, simulation.outdoorPeakMinute - 1) },
    during: { start: Math.max(0, simulation.outdoorPeakMinute - 60), end: Math.min(simulation.indoorMinute.length - 1, simulation.outdoorPeakMinute + 90) },
    after: { start: Math.min(simulation.indoorMinute.length - 1, simulation.outdoorPeakMinute + 91), end: Math.min(simulation.indoorMinute.length - 1, simulation.outdoorPeakMinute + 360) },
  };
  const setChapter = useCallback((chapter: number) => {
    const next = Math.max(0, Math.min(ANALYSIS_CHAPTERS.length - 1, chapter));
    setAnalysisChapter(next);
    const chapterMinutes = [0, simulation.outdoorPeakMinute, simulation.indoorPeakMinute, phaseMinute[activePhase]];
    setSharedMinute(chapterMinutes[next]);
  }, [activePhase, phaseMinute, setAnalysisChapter, setSharedMinute, simulation.indoorPeakMinute, simulation.outdoorPeakMinute]);
  const handleWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (rulesOpen || exportOpen) return;
    event.preventDefault();
    wheelDelta.current += event.deltaY;
    if (wheelLocked.current || Math.abs(wheelDelta.current) < 44) return;
    const direction = wheelDelta.current > 0 ? 1 : -1;
    wheelDelta.current = 0;
    wheelLocked.current = true;
    setChapter(analysisChapter + direction);
    window.setTimeout(() => { wheelLocked.current = false; }, 260);
  };
  const selectPhase = (phase: GuidancePhase["id"]) => {
    setActivePhase(phase);
    setSharedMinute(phaseMinute[phase]);
    setAnalysisChapter(3);
  };
  const exportPack = () => {
    const payload = {
      exportedAt: new Date().toISOString(), seed: 42, state, parameters: simulation.params,
      interaction: { sharedMinute, selectedSensor, activePhase, lockedStrategy, guidanceRules, analysisChapter: ANALYSIS_CHAPTERS[analysisChapter].label },
      decisionNote,
      outcomes: { indoorPeak: simulation.indoorPeak, lagMinutes: simulation.lagMinutes, meanIoRatio: simulation.meanIoRatio, totalDose: exposure.totalDose },
      tracer: { estimate: tracer.estimate, ci95: tracer.ci95 }, inverse: { penetration: inverse.penetration, deposition: inverse.deposition },
      strategies: strategies.map(({ curve: _curve, ...item }) => item), ventilationGuidance: guidance,
      limitations: ["Hourly outdoor observations are interpolated for minute-level reconstruction.", "Predictions depend on selected envelope, supply and filtration assumptions.", "Guidance supports experiment interpretation and is not clinical advice."],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "cave-analysis-pack.json"; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0); setExportOpen(false); toast.success("Analysis pack and decision note exported");
  };
  const sampledRange = { start: Math.floor(phaseRange[activePhase].start / 30), end: Math.ceil(phaseRange[activePhase].end / 30) };
  const sharedMarker = Math.floor(sharedMinute / 30);
  const inverseSeries = [
    { label: "Observed indoor", values: inverse.observed.filter((_, i) => i % 30 === 0), color: "#202827" },
    { label: "Fitted response", values: inverse.fitted.filter((_, i) => i % 30 === 0), color: "#0f6c62", dashed: true },
    ...(activeStrategy ? [{ label: `${activeStrategy.name} preview`, values: activeStrategy.curve.filter((_, i) => i % 30 === 0), color: "#b64d32", width: 2.3 }] : []),
  ];
  const tradeoffDetail = expandedTradeoff === "pollution" ? <><b>Peak comparison</b><span>{strategies[0].peak.toFixed(1)} sealed − {strategies.find((item) => item.name === guidance.recommendedStrategy)?.peak.toFixed(1)} recommended, divided by sealed peak. Source: deterministic mass-balance strategy runs.</span></> : expandedTradeoff === "heat" ? <><b>Heat rule</b><span>{state.extTempC.toFixed(1)} °C outdoor vs {guidanceRules.heatThreshold.toFixed(0)} °C threshold; limited unconditioned supply raises the conflict rating.</span></> : expandedTradeoff === "fresh" ? <><b>Fresh-air rule</b><span>{simulation.params.lambdaSup.toFixed(2)} h⁻¹ supply vs {guidanceRules.minimumFreshAirAch.toFixed(1)} h⁻¹ minimum across {windowValues.length} h.</span></> : null;
  return <main className="screen analyse-screen" tabIndex={0} onWheel={handleWheel} onKeyDown={(event) => { if (event.key === "PageDown") { event.preventDefault(); setChapter(analysisChapter + 1); } if (event.key === "PageUp") { event.preventDefault(); setChapter(analysisChapter - 1); } }} aria-label="Analysis atlas. Scroll or use Page Up and Page Down to change evidence focus.">
    <div className="screen-grid grid-analyse">
      <Panel className={`analysis-panel ${analysisChapter === 0 ? "chapter-active" : "chapter-muted"}`} eyebrow="1. Air-exchange characterisation" action={<div className="button-row"><Provenance type="illustrative">Synthetic tracer</Provenance><Provenance type="model">ACH fit</Provenance></div>}>
        <div className="analysis-content"><ScientificChart series={[{ label: "Synthetic tracer observation", values: tracer.points.map((p) => p.observed), color: "#202827" }, { label: "Exponential fit", values: tracer.points.map((p) => p.fitted), color: "#b64d32", dashed: true }]} markerIndex={Math.min(tracer.points.length - 1, Math.floor(sharedMinute / Math.max(1, simulation.indoorMinute.length / tracer.points.length)))} height={230} minY={400} yLabel="CO₂ (ppm)" xLabel="Time (h)" /><div><div className="eyebrow">Air-change rate</div><div className="fit-number">{tracer.estimate.toFixed(2)}<small> h⁻¹</small></div><p className="mono muted">95% CI<br />[{Math.max(0, tracer.estimate - tracer.ci95).toFixed(2)}, {(tracer.estimate + tracer.ci95).toFixed(2)}]</p></div></div>
      </Panel>
      <Panel className={`analysis-panel ${analysisChapter === 1 ? "chapter-active" : "chapter-muted"}`} eyebrow="2. Parameter estimation" action={<Provenance type="model">Inverse model</Provenance>}>
        <div className="analysis-content"><div><ScientificChart series={inverseSeries} markerIndex={sharedMarker} range={sampledRange} height={180} yLabel="PM₂.₅ (µg/m³)" xLabel="Time" /><div className="eyebrow" style={{ marginTop: 8 }}>Residuals · indoor model − measurement</div><div className="residual-strip">{inverse.residuals.filter((_, i) => i % 25 === 0).map((value, index) => <i key={index} style={{ height: `${Math.max(1, Math.min(70, Math.abs(value) * 2))}px`, background: value > 0 ? "#b64d32" : "#0f6c62" }} />)}</div></div><div><div className="eyebrow">Fitted parameters</div><table className="parameter-table"><tbody><tr><td>Penetration P</td><td><b>{inverse.penetration.toFixed(2)}</b></td></tr><tr><td>Deposition kdep</td><td><b>{inverse.deposition.toFixed(2)} h⁻¹</b></td></tr></tbody></table></div></div>
      </Panel>
      <Panel className={`analysis-panel dose-panel ${analysisChapter === 2 ? "chapter-active" : "chapter-muted"}`} eyebrow="3. Occupant exposure dose" action={<Provenance type="model">Dose calculation</Provenance>}>
        <div className="analysis-content"><ScientificChart series={[{ label: "Indoor cumulative dose", values: exposure.cumulative.filter((_, i) => i % 30 === 0), color: "#b64d32" }, { label: "WHO guideline-day", values: exposure.cumulative.filter((_, i) => i % 30 === 0).map((_, i) => i * .5 * 15), color: "#0f6c62", dashed: true }]} markerIndex={sharedMarker} range={sampledRange} height={235} yLabel="Dose (µg·h/m³)" xLabel="Exposure time" /><div><div className="eyebrow">Total dose</div><div className="fit-number">{Math.round(exposure.totalDose).toLocaleString()}<small> µg·h/m³</small></div><div className="hero-number dose-equivalent">{exposure.equivalentWhoDays.toFixed(2)}<small> WHO guideline-days</small></div></div></div>
      </Panel>
      <Panel className={`analysis-panel guidance-panel ${analysisChapter === 3 ? "chapter-active" : "chapter-muted"}`} eyebrow="4. Ventilation guidance" action={<div className="button-row"><button className="secondary-button" onClick={() => setRulesOpen(true)}><Settings2 size={13} /> What changes this?</button><button className="primary-button" onClick={() => setExportOpen(true)}><Download size={13} /> Export</button></div>}>
        <div className="guidance-layout">
          <section className="guidance-decision" aria-labelledby="guidance-headline">
            <div className="guidance-recommendation"><div className="guidance-recommendation-label"><span>Recommended strategy</span><strong>{guidance.recommendedStrategy}</strong></div><h3 id="guidance-headline">{guidance.headline}</h3><p>{guidance.explanation}</p></div>
            <div className="guidance-phases" aria-label="Operational sequence">{guidance.phases.map((phase, index) => {
              const trigger = phase.id === "before" ? `Outdoor PM₂.₅ remains below ${guidanceRules.smokeThreshold.toFixed(0)} µg/m³` : phase.id === "during" ? "The modelled outdoor pollution peak is active" : "Outdoor PM₂.₅ is falling after the peak";
              return <button type="button" key={phase.id} className={activePhase === phase.id ? "active" : ""} aria-pressed={activePhase === phase.id} onClick={() => selectPhase(phase.id)}><header><span className="phase-number">0{index + 1}</span><div><small>Phase</small><h4>{phase.label}</h4></div></header><p>{phase.action}</p><span className="phase-trigger"><span>Activate when</span><b>{trigger}</b></span></button>;
            })}</div>
            <div className="guidance-tradeoffs"><div className="guidance-subhead"><span>Trade-off summary</span><small>Select a metric to inspect its derivation</small></div><div className="tradeoff-grid">
              <button type="button" aria-expanded={expandedTradeoff === "pollution"} onClick={() => setExpandedTradeoff((value) => value === "pollution" ? null : "pollution")}><span>Pollution reduction</span><strong>↓ {guidance.tradeoffs.pollutionReduction}%</strong><small>Peak relative to sealed baseline</small></button>
              <button type="button" aria-expanded={expandedTradeoff === "heat"} onClick={() => setExpandedTradeoff((value) => value === "heat" ? null : "heat")}><span>Overheating risk</span><strong className={`risk-${guidance.tradeoffs.overheatingRisk}`}>{guidance.tradeoffs.overheatingRisk}</strong><small>{state.extTempC.toFixed(1)} °C external temperature</small></button>
              <button type="button" aria-expanded={expandedTradeoff === "fresh"} onClick={() => setExpandedTradeoff((value) => value === "fresh" ? null : "fresh")}><span>Fresh-air adequacy</span><strong className={`risk-${guidance.tradeoffs.freshAirAdequacy}`}>{guidance.tradeoffs.freshAirAdequacy}</strong><small>{simulation.params.lambdaSup.toFixed(1)} h⁻¹ current supply</small></button>
            </div>{tradeoffDetail && <div className="tradeoff-detail" aria-live="polite">{tradeoffDetail}</div>}</div>
          </section>
          <aside className="guidance-evidence" aria-label="Strategy comparison evidence"><div className="guidance-evidence-heading"><div><span>Strategy comparison</span><h4>{activeStrategy ? `${activeStrategy.name} curve preview` : "Modelled indoor PM₂.₅ peak"}</h4></div><small>{lockedStrategy ? "Comparison locked" : "Hover to preview · click to lock"}</small></div><div className="guidance-inputs"><div><span>Selected event</span><b>{CASES[state.selectedCase].title}</b></div><div><span>Shared context</span><b>{selectedSensor} · {Math.floor(sharedMinute / 60)}h {sharedMinute % 60}m</b></div></div><div className="strategy-bars">{strategies.map((strategy) => {
            const isRecommended = strategy.name === guidance.recommendedStrategy; const isLocked = lockedStrategy === strategy.name; const isPreviewed = activeStrategyName === strategy.name; const barWidth = Math.max(1, Math.min(100, strategy.peak / Math.max(1, strategies[0].peak) * 100));
            return <button type="button" className={`strategy-row ${isRecommended ? "recommended" : ""} ${isPreviewed ? "previewed" : ""}`} key={strategy.name} aria-pressed={isLocked} onMouseEnter={() => setHoveredStrategy(strategy.name)} onMouseLeave={() => setHoveredStrategy(null)} onFocus={() => setHoveredStrategy(strategy.name)} onBlur={() => setHoveredStrategy(null)} onClick={() => { setLockedStrategy((value) => value === strategy.name ? null : strategy.name); setAnalysisChapter(1); }}><span className="strategy-name"><b>{strategy.name}</b><small>{isLocked ? "Locked comparison" : isRecommended ? "Recommended" : "Preview curve"}</small></span><span className="strategy-track" role="img" aria-label={`${strategy.name}: ${strategy.peak.toFixed(1)} micrograms per cubic metre`}><span className="strategy-fill" style={{ width: `${barWidth}%` }} /></span><span className="strategy-value"><strong>{strategy.peak.toFixed(1)}</strong><small>↓ {Math.max(0, strategy.peakReduction).toFixed(0)}%</small></span></button>;
          })}</div><p className="guidance-evidence-note">The selected phase controls chart shading and the shared cursor. A locked strategy adds its predicted curve to Parameter estimation.</p></aside>
        </div>
      </Panel>
    </div>
    <div className="analysis-scroll-announcer" aria-live="polite"><b>{String(analysisChapter + 1).padStart(2, "0")} · {ANALYSIS_CHAPTERS[analysisChapter].label}</b><span>{ANALYSIS_CHAPTERS[analysisChapter].note}</span><small>Scroll / Page Up / Page Down changes evidence focus</small></div>
    {rulesOpen && <div className="workbench-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRulesOpen(false); }}><section className="workbench-sheet rules-sheet" role="dialog" aria-modal="true" aria-labelledby="rules-title"><header><div><span>Rule sensitivity</span><h2 id="rules-title">What changes this recommendation?</h2></div><button className="icon-button" onClick={() => setRulesOpen(false)} aria-label="Close rule sensitivity"><X size={17} /></button></header><p>Adjust bounded research assumptions. Guidance, phases and trade-offs update immediately.</p><div className="rule-controls">
      <label><span>Acute smoke threshold <b>{guidanceRules.smokeThreshold.toFixed(0)} µg/m³</b></span><input type="range" min="50" max="200" step="5" value={guidanceRules.smokeThreshold} onChange={(event) => setGuidanceRules((rules) => ({ ...rules, smokeThreshold: +event.target.value }))} /><small>Outdoor peak: {selectedPeak.value.toFixed(1)} µg/m³</small></label>
      <label><span>Heat-conflict threshold <b>{guidanceRules.heatThreshold.toFixed(0)} °C</b></span><input type="range" min="24" max="38" step="1" value={guidanceRules.heatThreshold} onChange={(event) => setGuidanceRules((rules) => ({ ...rules, heatThreshold: +event.target.value }))} /><small>Exterior input: {state.extTempC.toFixed(1)} °C</small></label>
      <label><span>Minimum fresh-air target <b>{guidanceRules.minimumFreshAirAch.toFixed(1)} h⁻¹</b></span><input type="range" min="0.3" max="1.2" step="0.1" value={guidanceRules.minimumFreshAirAch} onChange={(event) => setGuidanceRules((rules) => ({ ...rules, minimumFreshAirAch: +event.target.value }))} /><small>Modelled supply: {simulation.params.lambdaSup.toFixed(2)} h⁻¹</small></label>
    </div><div className="rule-result"><b>{guidance.recommendedStrategy}</b><span>{guidance.headline}</span>{guidance.ruleTrace.map((line) => <small key={line}>{line}</small>)}</div><footer><button className="secondary-button" onClick={() => setGuidanceRules(DEFAULT_GUIDANCE_RULES)}><RotateCcw size={13} /> Reset documented defaults</button><button className="primary-button" onClick={() => setRulesOpen(false)}>Apply to analysis</button></footer></section></div>}
    {exportOpen && <div className="workbench-sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setExportOpen(false); }}><section className="workbench-sheet export-sheet" role="dialog" aria-modal="true" aria-labelledby="export-title"><header><div><span>Research annotation</span><h2 id="export-title">Decision note</h2></div><button className="icon-button" onClick={() => setExportOpen(false)} aria-label="Close export"><X size={17} /></button></header><p>The note is saved locally and exported with the current event, strategy, evidence, rules and limitations.</p><textarea aria-label="Decision note" maxLength={1200} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Record the operational decision, assumptions that matter, unresolved uncertainty and the next measurement required…" /><div className="export-summary"><span><b>Event</b>{CASES[state.selectedCase].title}</span><span><b>Strategy</b>{lockedStrategy ?? guidance.recommendedStrategy}</span><span><b>Context</b>{selectedSensor} · {Math.floor(sharedMinute / 60)}h {sharedMinute % 60}m</span></div><footer><span>{decisionNote.length} / 1200 characters</span><button className="primary-button" onClick={exportPack}><Download size={13} /> Download analysis pack</button></footer></section></div>}
  </main>;
}

function BootHeroVisual() {
  const sensorPoints = [[32, 65, 0], [45, 50, 1.2], [55, 69, 2.1], [65, 49, .7], [75, 62, 1.7]];
  return <figure className="boot-hero" aria-label="CAVE controlled-environment chamber with an instrumented test building and visualised airflow">
    <div className="boot-hero-media" aria-hidden="true">
      <svg className="boot-hero-cave-visual" viewBox="0 0 1000 600">
        <defs>
          <linearGradient id="boot-hall-surface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#edf4ef" stopOpacity=".35" />
            <stop offset=".58" stopColor="#7f8f8a" stopOpacity=".16" />
            <stop offset="1" stopColor="#101817" stopOpacity=".3" />
          </linearGradient>
          <linearGradient id="boot-test-cell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#eef3ef" stopOpacity=".5" />
            <stop offset="1" stopColor="#d96c2c" stopOpacity=".1" />
          </linearGradient>
          <pattern id="boot-floor-grid" width="42" height="34" patternUnits="userSpaceOnUse">
            <path d="M42 0H0V34" fill="none" stroke="#7ec2bd" strokeOpacity=".16" strokeWidth="1" />
          </pattern>
        </defs>
        <path className="boot-hall-shell" d="M76 500V96l46-42h754l48 42v404H76Z" fill="url(#boot-hall-surface)" />
        <path className="boot-hall-rear" d="M150 450V122h700v328H150Z" />
        <path className="boot-floor-plane" d="M76 500h848L768 414H230Z" fill="url(#boot-floor-grid)" />
        <g className="boot-ceiling-grid">
          {[168, 242, 316, 390, 464, 538, 612, 686, 760, 834].map((x) => <path key={x} d={`M${x} 64v75`} />)}
          {[0, 1, 2].map((row) => <path key={row} d={`M134 ${82 + row * 24}H866`} />)}
        </g>
        <g className="boot-supply-rail">
          <rect x="190" y="102" width="620" height="28" rx="5" />
          {[230, 300, 370, 440, 510, 580, 650, 720, 790].map((x) => <path key={x} d={`M${x} 130v40m-14-10h28`} />)}
        </g>
        <g className="boot-return-wall">
          <rect x="780" y="172" width="84" height="222" rx="3" />
          {[0, 1, 2, 3, 4].map((row) => <path key={row} d={`M796 ${200 + row * 36}h52`} />)}
          {[0, 1, 2].map((col) => <path key={col} d={`M808 ${188}v188`} />)}
        </g>
        <g className="boot-plant-block">
          <rect x="112" y="360" width="84" height="96" />
          <path d="M128 384h52M128 404h52M128 424h52" />
          <path d="M196 390C254 352 296 341 362 354" />
        </g>
        <g className="boot-test-building">
          <path d="M335 432V270l160-70 174 70v162H335Z" fill="url(#boot-test-cell)" />
          <path d="M318 270l177-80 192 80M335 270v162M669 270v162M335 350h334M495 198v234" />
          <path d="M380 296h72v54h-72zM548 296h72v54h-72zM386 370h54v62h-54zM548 370h80v62h-80z" />
          <path d="M368 250h254" className="boot-service-rack" />
        </g>
        <g className="boot-sensor-masts">
          {[378, 465, 555, 638].map((x, index) => <g key={x}>
            <path d={`M${x} 432v-${70 + (index % 2) * 30}`} />
            <rect x={x - 10} y={350 - (index % 2) * 30} width="20" height="16" rx="2" />
            <path d={`M${x - 12} 432h24m-18 0l-16 18m34-18l16 18`} />
          </g>)}
        </g>
        <g className="boot-reference-lines">
          <path d="M76 520h848M76 512v16M924 512v16" />
          <path d="M50 96v404M42 96h16M42 500h16" />
        </g>
      </svg>
    </div>
    <div className="boot-hero-grid" aria-hidden="true" />
    <svg className="boot-hero-section-lines" viewBox="0 0 1000 600" aria-hidden="true">
      <path className="section-envelope" d="M74 500V96l48-42h756l48 42v404H74Z" />
      <path className="section-building" d="M328 432V270l168-78 178 78v162M328 270h346M496 192v240" />
      <path className="section-registration" d="M45 520h930M74 540h870M74 532v16M944 532v16M52 96v404M44 96h16M44 500h16" />
    </svg>
    <svg className="boot-hero-airflow" viewBox="0 0 1000 600" aria-hidden="true">
      <path d="M42 390C190 298 268 288 410 342S676 438 958 270" />
      <path d="M58 454C246 352 369 380 504 414S746 438 932 344" />
      <path d="M166 248C306 174 425 205 548 256S745 314 886 216" />
    </svg>
    <div className="boot-hero-sensors" aria-hidden="true">{sensorPoints.map(([x, y, delay], index) => <i key={index} style={{ "--sensor-x": `${x}%`, "--sensor-y": `${y}%`, "--sensor-delay": `${delay}s` } as React.CSSProperties} />)}</div>
    <div className="boot-hero-scan" aria-hidden="true" />
    <div className="boot-hero-dimension boot-hero-dimension-x" aria-hidden="true"><i /><span>206 m² controlled environment</span><i /></div>
    <div className="boot-hero-dimension boot-hero-dimension-y" aria-hidden="true"><i /><span>9 m clear height</span><i /></div>
    <div className="boot-hero-registration" aria-hidden="true"><i /><i /><i /><i /></div>
    <figcaption className="boot-hero-caption"><span>UCL CAVE hall / instrumented test volume</span><b>01</b></figcaption>
    <div className="boot-hero-status" aria-hidden="true"><i /> Dual HVAC / sensor reconstruction</div>
  </figure>;
}

function EnteringPage({ onEnter }: { onEnter: () => void }) {
  const [skipped, setSkipped] = useState(false);
  const enteringRef = useRef(false);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;
  const beginEnter = useCallback(() => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    const url = new URL(window.location.href);
    url.searchParams.set("screen", "1");
    window.history.replaceState(null, "", url);
    onEnterRef.current();
  }, []);
  useEffect(() => {
    const handleEnter = (event: KeyboardEvent) => { if (event.key === "Enter") beginEnter(); };
    window.addEventListener("keydown", handleEnter);
    return () => window.removeEventListener("keydown", handleEnter);
  }, [beginEnter]);
  return <main className={`entry-page boot-page ${skipped ? "boot-skipped" : ""}`}>
    <div className="boot-smoke-field" aria-hidden="true"><i /><i /><i /></div>
    <button className="boot-skip" onClick={() => setSkipped(true)}>Reveal complete plate</button>
    <header className="entry-header">
      <div className="entry-brand"><img src={caveMarkUrl} alt="CAVE Wildfire Workbench mark" /><span>CAVE Wildfire</span><i>/</i><small>Workbench</small></div>
      <div className="entry-meta"><span>Research Fellow interview · Dr Hao Sun</span><span>UCL CAVE · 2026</span></div>
    </header>
    <div className="boot-layout" aria-label="CAVE Experiment Workbench instrument boot sequence">
      <section className="entry-copy">
        <div className="entry-kicker"><span>01</span> UCL CAVE · Research Fellow interview</div>
        <div className="boot-wordmark">CAVE Wildfire <span>Workbench</span></div>
        <h1>Research Fellow Interview Demo for Wildfire Indoor Safety</h1>
        <p className="entry-thesis">Prepared for Dr Hao Sun: measured wildfire smoke episodes become controlled CAVE experiments, model predictions and decision evidence.</p>
        <a
          className="entry-button"
          href="?screen=1"
          onClick={(event) => {
            event.preventDefault();
            beginEnter();
          }}
        ><span>Open measured-event workbench</span><ArrowRight size={18} /></a>
        <div className="entry-hint">Press Enter · Select a measured exposure event</div>
      </section>
      <section className="boot-instrument">
        <div className="boot-section"><BootHeroVisual /></div>
        <div className="boot-readout" aria-live="polite">
          <p style={{ "--boot-order": 0 } as React.CSSProperties}>Boundary-condition provenance</p>
          <p style={{ "--boot-order": 1 } as React.CSSProperties}>NEW YORK · 07 JUN 2023 · PM₂.₅ peak 410.1 µg/m³ <b>MEASURED</b></p>
          <p style={{ "--boot-order": 2 } as React.CSSProperties}>LONDON · 19 JUL 2022 · 40.3 °C · O₃ 142 µg/m³ <b>MEASURED</b></p>
          <div className="boot-progress"><i /></div><span>2 measured events · UCL CAVE experiment workflow</span>
        </div>
      </section>
    </div>
    <footer className="entry-footer"><span>Measure</span><i /><span>Design</span><i /><span>Replay</span><i /><span>Decide</span><b>01—04</b></footer>
  </main>;
}

export default function Home() {
  const [entered, setEntered] = useState(() => new URLSearchParams(window.location.search).has("screen"));
  const [screen, setScreen] = useState(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("screen"));
    return requested >= 1 && requested <= 4 ? requested : 1;
  });
  const [state, setState] = useState<ExperimentState>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<ExperimentState>;
      const storedAgent = (stored as { agent?: string }).agent;
      const storedSensors = Array.isArray(stored.sensors) ? stored.sensors : [];
      const sensors = DEFAULT_EXPERIMENT_STATE.sensors.map((sensor, index) => ({
        ...sensor,
        x: storedSensors[index]?.x ?? sensor.x,
        y: storedSensors[index]?.y ?? sensor.y,
      }));
      const selectedCase: SelectedCase = stored.selectedCase === "london2022" ? "london2022" : "nyc2023";
      const merged = { ...DEFAULT_EXPERIMENT_STATE, ...stored, selectedCase, agent: storedAgent === "co_lowdose" ? "nox_lowdose" : stored.agent ?? DEFAULT_EXPERIMENT_STATE.agent, sensors } as ExperimentState;
      const storedDataset = getCaseDataset(merged.selectedCase);
      const storedHours = merged.targetWindow.endIdx - merged.targetWindow.startIdx + 1;
      const preferredStart = storedHours === TARGET_WINDOW_HOURS ? merged.targetWindow.startIdx : peak(storedDataset.pm25).index - Math.floor(TARGET_WINDOW_HOURS / 2);
      return { ...merged, targetWindow: fixedDayWindow(preferredStart, storedDataset.pm25.length) };
    } catch { return DEFAULT_EXPERIMENT_STATE; }
  });
  const [sharedMinute, setSharedMinute] = useState(() => {
    try { return Number(JSON.parse(localStorage.getItem(INTERACTION_STORAGE_KEY) ?? "{}").sharedMinute) || 0; }
    catch { return 0; }
  });
  const [selectedSensor, setSelectedSensor] = useState(() => {
    try { return String(JSON.parse(localStorage.getItem(INTERACTION_STORAGE_KEY) ?? "{}").selectedSensor || DEFAULT_EXPERIMENT_STATE.sensors[0].id); }
    catch { return DEFAULT_EXPERIMENT_STATE.sensors[0].id; }
  });
  const [guidanceRules, setGuidanceRules] = useState<GuidanceRules>(() => {
    try { return { ...DEFAULT_GUIDANCE_RULES, ...JSON.parse(localStorage.getItem(INTERACTION_STORAGE_KEY) ?? "{}").guidanceRules }; }
    catch { return DEFAULT_GUIDANCE_RULES; }
  });
  const [lockedStrategy, setLockedStrategy] = useState<string | null>(() => {
    try { return JSON.parse(localStorage.getItem(INTERACTION_STORAGE_KEY) ?? "{}").lockedStrategy ?? null; }
    catch { return null; }
  });
  const [decisionNote, setDecisionNote] = useState(() => {
    try { return String(JSON.parse(localStorage.getItem(INTERACTION_STORAGE_KEY) ?? "{}").decisionNote || ""); }
    catch { return ""; }
  });
  const [analysisChapter, setAnalysisChapter] = useState(0);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);
  useEffect(() => {
    localStorage.setItem(INTERACTION_STORAGE_KEY, JSON.stringify({ sharedMinute, selectedSensor, guidanceRules, lockedStrategy, decisionNote }));
  }, [decisionNote, guidanceRules, lockedStrategy, selectedSensor, sharedMinute]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (entered) url.searchParams.set("screen", String(screen));
    else url.searchParams.delete("screen");
    window.history.replaceState(null, "", url);
  }, [entered, screen]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (entered && event.key === "Escape") setEntered(false);
      if (/^[1-4]$/.test(event.key)) { setEntered(true); setScreen(+event.key); }
      if (entered && event.key === "ArrowRight") setScreen((value) => Math.min(4, value + 1));
      if (entered && event.key === "ArrowLeft") setScreen((value) => Math.max(1, value - 1));
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [entered]);
  const dataset = getCaseDataset(state.selectedCase);
  const windowValues = useMemo(() => dataset.pm25.slice(state.targetWindow.startIdx, state.targetWindow.endIdx + 1), [dataset, state.targetWindow]);
  const simulation = useMemo(() => simulateMassBalance(windowValues, state), [state, windowValues]);
  useEffect(() => { setSharedMinute((value) => Math.max(0, Math.min(value, simulation.indoorMinute.length - 1))); }, [simulation.indoorMinute.length]);
  const advance = useCallback(() => setScreen((value) => Math.min(4, value + 1)), []);
  const sharedTimestampIndex = Math.min(state.targetWindow.endIdx, state.targetWindow.startIdx + Math.floor(sharedMinute / 60));
  return <div className="experience-shell"><div className="experience-stage">
    {!entered ? <EnteringPage onEnter={() => setEntered(true)} /> : <div className="workbench">
    <header className="topbar">
      <button className="brand brand-button" onClick={() => setEntered(false)} aria-label="Return to entering page"><img className="brand-mark" src={caveMarkUrl} alt="CAVE Wildfire Workbench mark" /><div><div className="brand-wordmark">CAVE Wildfire <span>Workbench</span></div><div className="brand-subtitle">Research Fellow interview · Dr Hao Sun</div></div></button>
      <nav className="lifecycle" aria-label="Experiment lifecycle">{STEPS.map((label, index) => <div key={label} className={`life-step ${screen === index + 1 ? "active" : ""} ${screen > index + 1 ? "done" : ""}`}><button className="life-button" onClick={() => setScreen(index + 1)}><span className="life-index">{screen > index + 1 ? "✓" : String(index + 1).padStart(2, "0")}</span>{label}</button></div>)}</nav>
      <div className="atlas-edition"><span>UCL CAVE</span><strong>Research demo · 2026</strong></div>
    </header>
    <div className="status-strip"><span><i>Case</i>{dataset.title}</span><span><i>Shared context</i>{formatTimestamp(dataset.timestamps[sharedTimestampIndex])} · {selectedSensor}</span><span><i>Modelled air change</i>{simulation.params.totalAch.toFixed(2)} h⁻¹</span>{screen === 4 && <span className="analysis-status"><i>{ANALYSIS_CHAPTERS[analysisChapter].label}</i><b>{ANALYSIS_CHAPTERS[analysisChapter].note}</b></span>}{simulation.gapFilled && <span className="gap-note">Interpolated evidence gap</span>}</div>
    {screen === 1 && <ChallengeScreen state={state} setState={setState} sharedMinute={sharedMinute} setSharedMinute={setSharedMinute} onAdvance={advance} />}
    {screen === 2 && <DesignScreen state={state} setState={setState} simulation={simulation} selectedSensor={selectedSensor} setSelectedSensor={setSelectedSensor} onAdvance={advance} />}
    {screen === 3 && <RunScreen state={state} setState={setState} simulation={simulation} minute={sharedMinute} setMinute={setSharedMinute} selectedSensor={selectedSensor} setSelectedSensor={setSelectedSensor} />}
    {screen === 4 && <AnalyseScreen state={state} simulation={simulation} windowValues={windowValues} sharedMinute={sharedMinute} setSharedMinute={setSharedMinute} selectedSensor={selectedSensor} guidanceRules={guidanceRules} setGuidanceRules={setGuidanceRules} lockedStrategy={lockedStrategy} setLockedStrategy={setLockedStrategy} decisionNote={decisionNote} setDecisionNote={setDecisionNote} analysisChapter={analysisChapter} setAnalysisChapter={setAnalysisChapter} />}
  </div>}
  </div></div>;
}
