/** Editorial research atlas: Times New Roman throughout, generous 16:9 spacing, no compressed evidence surfaces. */
/* Editorial / Mineral Research Atlas: evidence-led hierarchy, restrained ornament, and stable 16:9 scientific layouts. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Download, FileText, Pause, Play, RotateCcw, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { BUILDING_PROFILES, BuildingScene3D } from "@/components/BuildingScene3D";
import { CaveSection } from "@/components/CaveSection";
import { PlanSheet } from "@/components/PlanSheet";
import { ScientificChart } from "@/components/ScientificChart";
import caveHero3dUrl from "@/assets/cave-hero-3d-v2.webp";
import caveMarkUrl from "@/assets/cave-mark_84921330.png";
import gisLondonBasemapUrl from "@/assets/gis-london-basemap.png";
import gisNewYorkBasemapUrl from "@/assets/gis-new-york-basemap.png";
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
  nyc2023: "Canadian wildfire smoke transport",
  london2022: "UK record heatwave and urban air-quality stress",
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
    sourceRegion: "London heatwave exposure corridor",
    transport: "A 40.3 °C heatwave is translated into the CAVE exterior setpoint, with PM₂.₅ and O₃ used as air-quality context.",
    operationalCue: "Treat heat as the primary London stressor; use PM₂.₅ and O₃ traces as co-exposure context.",
  },
};
type MapFocus = "source" | "plume" | "site";
const MAP_FOCUS_LABELS: Record<SelectedCase, Record<MapFocus, string>> = {
  nyc2023: {
    source: "Source",
    plume: "Diffusion",
    site: "Receptor",
  },
  london2022: {
    source: "Heat field",
    plume: "Thermal route",
    site: "Receptor",
  },
};
const MAP_FOCUS_COPY: Record<SelectedCase, Record<MapFocus, string>> = {
  nyc2023: {
    source: "Boreal fire regions sit outside the city frame; the map shows the arriving urban boundary condition.",
    plume: "A designed diffusion layer shows how the long-range PM₂.₅ plume reaches the receptor.",
    site: "Queens College 2 anchors the measured urban boundary condition for CAVE replay.",
  },
  london2022: {
    source: "The London case is driven by the record heat field, not a wildfire-smoke source.",
    plume: "The thermal route highlights an urban heat corridor and co-exposure context without smoke styling.",
    site: "London Bloomsbury provides the measured receptor trace for comparison and replay.",
  },
};
const CASE_EVIDENCE_CARDS: Record<SelectedCase, Array<{ label: string; title: string; detail: string }>> = {
  nyc2023: [
    { label: "Monitoring receptor", title: "Queens College 2", detail: "AQS 36-081-0124" },
    { label: "Transport layer", title: "Wildfire PM₂.₅ plume", detail: "route + diffusion overlay" },
    { label: "CAVE boundary", title: "Measured outdoor PM", detail: "EPA AQS trace drives replay" },
  ],
  london2022: [
    { label: "Monitoring receptor", title: "London Bloomsbury", detail: "AURN CLL2" },
    { label: "Heat driver", title: "40.3 °C heatwave", detail: "thermal corridor overlay" },
    { label: "Co-exposure context", title: "PM₂.₅ + O₃ trace", detail: "DEFRA AURN evidence layer" },
  ],
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

function CaseRouteMap({ id, focus }: { id: SelectedCase; focus: MapFocus }) {
  const meta = CASE_GIS_META[id];
  const isNyc = id === "nyc2023";
  const activeSource = focus === "source";
  const activePlume = focus === "plume";
  const activeSite = focus === "site";
  return <figure className={`case-route-map case-route-${id} focus-${focus}`} aria-label={`${meta.place} GIS evidence context`}>
    <img className="case-route-basemap" src={isNyc ? gisNewYorkBasemapUrl : gisLondonBasemapUrl} alt="" />
    <div className="case-route-grade" />
    <div className="map-design-grid" />
    <svg className="case-route-overlay" viewBox="0 0 720 360" role="img">
      <title>{isNyc ? "Wildfire smoke transport route into Queens" : "London heatwave thermal route into Bloomsbury"}</title>
      <defs>
        <filter id={`route-soft-${id}`} x="-20%" y="-30%" width="140%" height="160%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`route-glow-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`route-line-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={isNyc ? "#d6a27b" : "#d8a25a"} stopOpacity=".18" />
          <stop offset=".55" stopColor={isNyc ? "#c86b45" : "#d27435"} stopOpacity=".86" />
          <stop offset="1" stopColor="#0f6c62" stopOpacity=".9" />
        </linearGradient>
        <radialGradient id={`source-fill-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={isNyc ? "#f2aa7c" : "#f6c16f"} />
          <stop offset=".7" stopColor={isNyc ? "#b64d32" : "#c9732e"} />
          <stop offset="1" stopColor={isNyc ? "#84301f" : "#7b3f18"} />
        </radialGradient>
      </defs>
      {isNyc ? <>
        <g className="map-contours smoke-contours">
          <ellipse cx="492" cy="208" rx="150" ry="54" />
          <ellipse cx="502" cy="212" rx="104" ry="36" />
          <ellipse cx="516" cy="219" rx="62" ry="22" />
        </g>
        <g className={`map-source-layer ${activeSource ? "active" : ""}`}>
          <circle className="route-source-halo" cx="92" cy="70" r="30" />
          <circle className="route-source" cx="92" cy="70" r="11" />
        </g>
        <g className={`map-plume-layer smoke-layer ${activePlume ? "active" : ""}`}>
          <path className="smoke-diffusion smoke-diffusion-wide" d="M70 62C162 76 234 112 310 138C386 164 457 162 574 231" />
          <path className="smoke-diffusion smoke-diffusion-mid" d="M88 79C177 93 240 124 313 152C395 182 477 178 584 236" />
          <path className="smoke-diffusion smoke-diffusion-soft" d="M58 45C151 61 223 101 298 126C382 154 456 152 566 214" />
          <path className="route-core" d="M92 70C184 88 248 124 324 151C400 178 474 178 586 235" />
        </g>
        <g className={`map-site-layer ${activeSite ? "active" : ""}`}>
          <circle className="route-ring" cx="586" cy="235" r="35" />
          <circle className="route-ring route-ring-outer" cx="586" cy="235" r="55" />
          <circle className="route-site" cx="586" cy="235" r="10" />
        </g>
        <g className="map-route-callouts">
          <path d="M105 84h78M586 235h-82" />
          <circle cx="183" cy="84" r="3" />
          <circle cx="504" cy="235" r="3" />
        </g>
      </> : <>
        <g className="map-contours heat-contours">
          <ellipse cx="510" cy="218" rx="158" ry="70" />
          <ellipse cx="470" cy="196" rx="106" ry="48" />
          <ellipse cx="408" cy="166" rx="58" ry="26" />
        </g>
        <g className={`map-source-layer heat-layer ${activeSource ? "active" : ""}`}>
          <ellipse className="heat-field heat-field-wide" cx="560" cy="230" rx="150" ry="78" />
          <ellipse className="heat-field heat-field-core" cx="560" cy="230" rx="72" ry="36" />
        </g>
        <g className={`map-plume-layer thermal-layer ${activePlume ? "active" : ""}`}>
          <path className="thermal-band thermal-band-wide" d="M610 245C526 217 455 183 380 154C288 119 204 95 112 75" />
          <path className="thermal-band thermal-band-mid" d="M604 249C512 218 441 184 367 153C281 118 198 91 111 72" />
          <path className="route-core heat-route" d="M600 248C511 218 440 184 365 153C278 116 194 91 110 72" />
        </g>
        <g className={`map-site-layer ${activeSite ? "active" : ""}`}>
          <circle className="route-ring route-ring-heat" cx="110" cy="72" r="34" />
          <circle className="route-ring route-ring-outer route-ring-heat" cx="110" cy="72" r="54" />
          <circle className="route-site" cx="110" cy="72" r="10" />
        </g>
        <g className="map-route-callouts heat-callouts">
          <path d="M110 72h92M560 230h-86" />
          <circle cx="202" cy="72" r="3" />
          <circle cx="474" cy="230" r="3" />
        </g>
      </>}
    </svg>
    <div className="map-corner-frame" aria-hidden="true"><i /><i /><i /><i /></div>
    <div className="map-overlay-labels" aria-hidden="true">
      <span className="map-chip map-chip-mode">{isNyc ? "Smoke diffusion layer" : "Heat-exposure layer"}</span>
      <span className="map-chip map-chip-site">{isNyc ? "Queens College 2 receptor" : "London Bloomsbury receptor"}</span>
      <span className="map-chip map-chip-source">{isNyc ? "regional source vector" : "urban thermal field"}</span>
      <span className="map-scale">0  |  10 km</span>
    </div>
    <div className="map-readout-card" aria-hidden="true">
      <span>{isNyc ? "Boundary peak" : "Heat driver"}</span>
      <b>{isNyc ? "410.1" : "40.3"}<small>{isNyc ? " µg/m³" : " °C"}</small></b>
      <i>{isNyc ? "measured PM2.5" : "UK record day"}</i>
    </div>
    <div className="map-replay-card" aria-hidden="true">
      <span>GIS layer</span>
      <b>{isNyc ? "Outdoor PM boundary" : "Exterior heat boundary"}</b>
      <em>CAVE replay</em>
    </div>
    <div className="map-side-scale" aria-hidden="true">
      <span>{isNyc ? "PM plume density" : "thermal load"}</span>
      <i />
    </div>
  </figure>;
}

function ChallengeScreen({ state, setState, sharedMinute, setSharedMinute, onAdvance }: { state: ExperimentState; setState: React.Dispatch<React.SetStateAction<ExperimentState>>; sharedMinute: number; setSharedMinute: React.Dispatch<React.SetStateAction<number>>; onAdvance: () => void }) {
  const anchors = deriveMeasuredAnchors();
  const selected = getCaseDataset(state.selectedCase);
  const selectedPeak = peak(selected.pm25);
  const selectedMeta = CASE_GIS_META[state.selectedCase];
  const selectedEvidence = CASE_EVIDENCE_CARDS[state.selectedCase];
  const selectedFocusLabels = MAP_FOCUS_LABELS[state.selectedCase];
  const isLondonCase = state.selectedCase === "london2022";
  const selectedMultiple = selectedPeak.value / PM25_24H_GUIDELINE;
  const targetWindow = fixedDayWindow(state.targetWindow.startIdx, selected.pm25.length);
  const [mapFocus, setMapFocus] = useState<MapFocus>("site");
  const selectCase = (id: SelectedCase) => {
    const next = getCaseDataset(id);
    const nextPeak = peak(next.pm25);
    const targetWindow = fixedDayWindow(nextPeak.index - Math.floor(TARGET_WINDOW_HOURS / 2), next.pm25.length);
    setMapFocus("site");
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
          const caseIndex = id === "nyc2023" ? "01" : "02";
          const caseMode = id === "nyc2023" ? "Smoke event" : "Heat event";
          return <button key={id} className={`case-card case-${id} ${state.selectedCase === id ? "selected" : ""}`} onClick={() => selectCase(id)}>
            <div className="case-card-top"><span className="case-place">{meta.place}</span><span className="case-index">{caseIndex}</span></div>
            <div className="case-card-title"><h3>{item.title}</h3><p>{item.subtitle}</p></div>
            <p className="event-context">{EVENT_CONTEXT[id]}</p>
            <div className="case-peak-row">
              <div className="case-peak"><strong>{itemPeak.value.toFixed(1)}</strong><span>µg/m³<br />peak hourly PM₂.₅</span></div>
              <div className="case-mode"><span>{caseMode}</span><b>{id === "nyc2023" ? "Boundary PM" : "Thermal stress"}</b></div>
            </div>
            <div className="case-card-meta"><span><b>{(itemPeak.value / PM25_24H_GUIDELINE).toFixed(id === "nyc2023" ? 0 : 1)}×</b> WHO 24 h line</span><span><b>{anchorSummary}</b> measured anchor</span></div>
            <div className="case-tags"><span className="tiny-tag">{item.site.split(" · ")[0]}</span><span className="tiny-tag">{meta.coordinate}</span></div>
          </button>;
        })}
      </div>
    </Panel>
    <div className="challenge-main-stack">
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
            <div className="case-map-card">
              <CaseRouteMap id={state.selectedCase} focus={mapFocus} />
              <div className="map-focus-controls" aria-label="GIS focus controls">
                {(["source", "plume", "site"] as MapFocus[]).map((item) => <button type="button" key={item} className={mapFocus === item ? "active" : ""} onClick={() => setMapFocus(item)}>{selectedFocusLabels[item]}</button>)}
              </div>
            </div>
            <div className="case-context-copy">
              <div className="case-context-heading"><span>{selectedMeta.sourceRegion}</span><Provenance type="illustrative">GIS evidence briefing</Provenance></div>
              <p><b>{selectedFocusLabels[mapFocus]} focus.</b> {MAP_FOCUS_COPY[state.selectedCase][mapFocus]}</p>
              <div className="case-evidence-grid">
                {selectedEvidence.map((item) => <article key={item.label}><span>{item.label}</span><b>{item.title}</b><small>{item.detail}</small></article>)}
              </div>
              <div className="experiment-cue"><span>Experiment cue</span><b>{selectedMeta.operationalCue}</b></div>
              <div className="context-workflow">
                <span>Measured event</span>
                <i />
                <span>CAVE boundary</span>
                <i />
                <span>Indoor protection</span>
              </div>
            </div>
          </aside>
        </div>
        {isLondonCase ? <div className="metric-band challenge-metrics challenge-metrics-heat">
          <div className="metric metric-peak metric-heat"><label>Heat driver</label><strong>40.3<small>°C</small></strong><span>UK record heatwave</span></div>
          <div className="metric"><label>PM₂.₅ peak</label><strong>{selectedPeak.value.toFixed(1)}<small>µg/m³</small></strong><span>{formatTimestamp(selected.timestamps[selectedPeak.index])}</span></div>
          <div className="metric"><label>O₃ co-exposure</label><strong>{anchors.londonO3Peak.value.toFixed(1)}<small>µg/m³</small></strong><span>measured ozone anchor</span></div>
        </div> : <div className="metric-band challenge-metrics">
          <div className="metric metric-peak"><label>Peak event</label><strong className="smoke">{selectedPeak.value.toFixed(1)}<small>µg/m³</small></strong><span>peak hourly PM₂.₅</span></div>
          <div className="metric"><label>Peak timestamp</label><strong>{formatTimestamp(selected.timestamps[selectedPeak.index])}</strong><span>local measurement time</span></div>
          <div className="metric"><label>Guideline multiple</label><strong>{selectedMultiple.toFixed(0)}×</strong><span>relative to WHO 24 h line</span></div>
        </div>}
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
        <div className="run-replay-strip">
          <button className="transport run-transport" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause replay" : "Play replay"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button>
          <div className="run-replay-track">
            <div className="run-replay-head"><span>Experiment replay</span><strong>{String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:00</strong></div>
            <input aria-label="Experiment timeline" type="range" min="0" max={simulation.indoorMinute.length - 1} value={minute} onChange={(e) => setMinute(+e.target.value)} />
          </div>
          <Segmented value={state.playbackSpeed} values={[1, 5, 10] as const} labels={["×1", "×5", "×10"]} onChange={(playbackSpeed) => setState((s) => ({ ...s, playbackSpeed }))} />
          <button className="secondary-button replay-reset" onClick={() => { setMinute(0); setPlaying(false); }}><RotateCcw size={13} /> Reset</button>
        </div>
        <div className="run-response-body">
          <div className="panel-body run-response-chart"><ScientificChart series={[{ label: "External PM₂.₅", values: simulation.externalMinute.filter((_, i) => i % 30 === 0), color: "#b64d32" }, { label: "Indoor PM₂.₅", values: simulation.indoorMinute.filter((_, i) => i % 30 === 0), color: "#0f6c62", dashed: true }]} markerIndex={Math.floor(minute / 30)} height={240} chartWidth={900} yLabel="PM₂.₅ (µg/m³)" xLabel="Elapsed time" /></div>
          <aside className="run-response-brief" aria-label="Replay evidence summary">
            <article className="run-brief-card boundary-card"><span>Boundary condition</span><b>{currentOutdoor.toFixed(1)} <small>µg/m³</small></b><em>Measured outdoor replay input.</em></article>
            <article className="run-brief-card indoor-card"><span>Indoor response</span><b>{currentIndoor.toFixed(1)} <small>µg/m³</small></b><em>Protected-zone concentration.</em></article>
            <article className="run-brief-card lag-card"><span>Response lag</span><b>{simulation.lagMinutes} <small>min</small></b><em>Peak-to-peak model delay.</em></article>
          </aside>
        </div>
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

function SmokePlumeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const puffs = Array.from({ length: 52 }, (_, index) => {
      const seed = Math.sin(index * 91.73) * 10000;
      const unit = seed - Math.floor(seed);
      const seed2 = Math.sin(index * 43.17 + 8.2) * 10000;
      const unit2 = seed2 - Math.floor(seed2);
      return {
        offset: unit,
        drift: unit2,
        speed: 0.04 + unit * 0.035,
        size: 0.032 + unit2 * 0.044,
        lift: 0.34 + unit * 0.22,
        spread: 0.26 + unit2 * 0.16,
        wobble: 0.025 + unit * 0.035,
      };
    });

    let animationFrame = 0;
    let width = 0;
    let height = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionScale = reducedMotion ? 0.45 : 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.floor(rect.width * dpr));
      const pixelHeight = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = rect.width;
      height = rect.height;
    };

    const drawPuff = (x: number, y: number, radius: number, alpha: number, stretch: number, rotation: number) => {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.scale(stretch, 0.74 + stretch * 0.18);
      const gradient = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, radius);
      gradient.addColorStop(0, `rgba(183, 174, 154, ${alpha * 0.62})`);
      gradient.addColorStop(0.34, `rgba(132, 120, 101, ${alpha * 0.48})`);
      gradient.addColorStop(0.66, `rgba(80, 73, 65, ${alpha * 0.26})`);
      gradient.addColorStop(1, "rgba(76, 70, 62, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    };

    const render = (time: number) => {
      resize();
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const seconds = time / 1000 * motionScale;
      for (let index = 0; index < puffs.length; index += 1) {
        const puff = puffs[index];
        const progress = (seconds * puff.speed + puff.offset) % 1;
        const ease = 1 - Math.pow(1 - progress, 2.1);
        const sourceX = width * (0.13 + puff.drift * 0.035);
        const sourceY = height * (0.76 + puff.offset * 0.08);
        const x = sourceX + width * puff.spread * ease + Math.sin(seconds * 1.2 + index) * width * puff.wobble;
        const y = sourceY - height * puff.lift * ease + Math.sin(seconds * 0.9 + index * 0.6) * height * puff.wobble;
        const radius = width * (puff.size + ease * 0.055);
        const fadeIn = Math.min(progress / 0.22, 1);
        const fadeOut = Math.min((1 - progress) / 0.26, 1);
        const alpha = 0.15 * fadeIn * fadeOut * (0.72 + puff.drift * 0.34);
        const stretch = 1.05 + ease * 0.62 + puff.drift * 0.34;
        drawPuff(x, y, radius, alpha, stretch, -0.34 + ease * -0.28 + puff.drift * 0.18);
      }

      drawPuff(width * 0.15, height * 0.78, width * 0.1, 0.12, 1.22, -0.16);
      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return <canvas className="boot-smoke-canvas" ref={canvasRef} aria-hidden="true" />;
}

function BootHeroVisual() {
  return <figure className="boot-hero boot-hero-photo" aria-label="3D view of the UCL CAVE controlled-environment chamber with an instrumented test volume">
    <img className="boot-hero-image" src={caveHero3dUrl} alt="UCL CAVE controlled-environment chamber with a test volume, wildfire-smoke plume, sensors, HVAC services and mitigation equipment" />
    <div className="boot-hero-vignette" aria-hidden="true" />
    <div className="boot-chamber-smoke" aria-hidden="true"><SmokePlumeCanvas /></div>
  </figure>;
}

function EnteringPage({ onEnter }: { onEnter: () => void }) {
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
  return <main className="entry-page boot-page">
    <div className="boot-smoke-field" aria-hidden="true"><i /><i /><i /></div>
    <header className="entry-header">
      <div className="entry-brand"><img src={caveMarkUrl} alt="CAVE Wildfire Workbench mark" /><span>CAVE interview</span><i>/</i><small>Wildfire Smoke Mitigation Demo</small></div>
      <div className="entry-meta"><span>Research Fellow Interview</span><span>20 July 2026</span></div>
    </header>
    <div className="boot-layout" aria-label="CAVE Experiment Workbench instrument boot sequence">
      <section className="entry-copy">
        <h1><span>Wildfire Smoke Mitigation Demo</span><em>Research Fellow Interview</em></h1>
        <p className="entry-thesis">Dr Hao Sun · 20 July 2026</p>
        <div className="entry-context-strip" aria-label="Demo research context">
          <span>UCL CAVE chamber</span>
          <span>Wildfire smoke ingress</span>
          <span>Ventilation response</span>
        </div>
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
      </section>
    </div>
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
