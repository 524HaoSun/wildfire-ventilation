/** Instrumented Architectural Modernism: a compact technical plan drawer with explicit facility provenance. */
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import type { ExperimentState, ModelParameters } from "@/engine";
import { BUILDING_PROFILES } from "./BuildingScene3D";
import "./PlanSheet.css";

export function PlanSheet({ open, onClose, state, parameters }: { open: boolean; onClose: () => void; state: ExperimentState; parameters: ModelParameters }) {
  if (!open) return null;
  const profile = BUILDING_PROFILES[state.building];
  const download = () => {
    const text = [
      "CAVE / EXPERIMENT WORKBENCH — PLAN SHEET",
      "FACILITY · UCL Controlled Active Ventilation Environment",
      "Main hall · 206 m² plan area · 9.0 m clear height",
      "Exterior environment · −5…43 °C · independent HVAC and challenge-agent control",
      "Interior test environment · 10…28 °C · independent HVAC and ventilation mode",
      `Test article · ${profile.name} · ${profile.floorArea} · ${profile.volume}`,
      `Protocol · ${state.agent} · exterior ${state.extTempC.toFixed(1)} °C · interior ${state.intTempC.toFixed(1)} °C`,
      `Envelope · ${state.leakageACH50.toFixed(1)} h⁻¹ at 50 Pa · supply ${parameters.lambdaSup.toFixed(2)} h⁻¹ · filter ${(state.filterEff * 100).toFixed(1)}%`,
      "Monitoring · S1–S3 PM₂.₅ · S4 NOx · S5–S6 CO₂ · S7 temperature · S8 relative humidity",
      "STATUS · ILLUSTRATIVE protocol; facility facts from UCL CAVE documentation.",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cave-experiment-plan.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Plan sheet downloaded");
  };
  return <div className="plan-sheet-layer" role="dialog" aria-modal="true" aria-label="Experiment plan sheet">
    <button className="plan-sheet-scrim" onClick={onClose} aria-label="Close plan sheet" />
    <aside className="plan-sheet">
      <header><div><span>Facility / Protocol</span><h2>Experiment plan sheet</h2></div><button onClick={onClose} aria-label="Close plan sheet"><X size={16} /></button></header>
      <section className="facility-block"><div className="sheet-stamp">CAVE<br /><small>206 m² / 9 m</small></div><div><span>UCL Controlled Active Ventilation Environment</span><h3>One tall external hall.<br />One independent test environment.</h3><p>The hall represents controlled outdoor conditions; the building or vehicle inside is the separate occupied environment.</p></div></section>
      <div className="sheet-facts"><article><span>Exterior</span><b>−5…43 °C</b><small>Independent hall HVAC</small></article><article><span>Interior</span><b>10…28 °C</b><small>Independent test HVAC</small></article><article><span>Monitoring</span><b>S1–S8</b><small>PM · CO₂ · NOx · T · RH</small></article></div>
      <section className="sheet-section"><span>Test article</span><h3>{profile.name}</h3><table><tbody><tr><td>Floor / volume</td><td>{profile.floorArea} / {profile.volume}</td></tr><tr><td>Exterior / interior</td><td>{state.extTempC.toFixed(1)} °C / {state.intTempC.toFixed(1)} °C</td></tr><tr><td>Ventilation</td><td>{state.ventMode} · {parameters.totalAch.toFixed(2)} h⁻¹</td></tr><tr><td>Challenge agent</td><td>{state.agent === "pm_surrogate" ? "PM₂.₅ surrogate" : state.agent === "co2_tracer" ? "CO₂ tracer" : "NOx low-dose"}</td></tr></tbody></table></section>
      <section className="sheet-section"><span>Instrument field</span><div className="sensor-register">{state.sensors.map((sensor) => <b key={sensor.id}>{sensor.id}<small>{sensor.kind}</small></b>)}</div></section>
      <footer><p><b>Illustrative protocol.</b> Facility facts follow UCL CAVE documentation; schematic span and model outcomes require project-specific verification.</p><button className="primary-button" onClick={download}><Download size={13} /> Download sheet</button></footer>
    </aside>
  </div>;
}
