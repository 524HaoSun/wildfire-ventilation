/** Instrumented Architectural Modernism: hand-built architectural experiment section. */
import { useRef } from "react";
import type { Building, Sensor, VentMode } from "@/engine";
import "./CaveSection.css";

interface CaveSectionProps {
  sensors: Sensor[];
  onSensorsChange?: (sensors: Sensor[]) => void;
  selectedSensor?: string;
  onSensorSelect?: (sensorId: string) => void;
  totalAch?: number;
  runMode?: boolean;
  activeSensor?: string;
  sensorValues?: Record<string, number>;
  building?: Building;
  exteriorTempC?: number;
  interiorTempC?: number;
  ventMode?: VentMode;
}

const leakPaths = [
  "M135 180 C210 135 260 145 318 198",
  "M765 178 C680 140 640 150 586 210",
  "M164 300 C250 264 305 276 352 331",
  "M736 296 C654 265 608 282 565 332",
];

const BUILDING_LABEL: Record<Building, string> = { single_room: "SINGLE-ROOM TEST CELL", two_storey: "TWO-STOREY DWELLING", bus: "TRANSIT BUS CABIN" };

export function CaveSection({ sensors, onSensorsChange, selectedSensor, onSensorSelect, totalAch = 0.22, runMode, activeSensor, sensorValues, building = "single_room", exteriorTempC = 25, interiorTempC = 21, ventMode = "sealed" }: CaveSectionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const moveSensor = (id: string, clientX: number, clientY: number) => {
    if (!onSensorsChange || !svgRef.current) return;
    const point = svgRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const local = point.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    onSensorsChange(sensors.map((sensor) => sensor.id === id ? { ...sensor, x: Math.max(105, Math.min(805, local.x)), y: Math.max(115, Math.min(427, local.y)) } : sensor));
  };

  return (
    <div className="cave-section-wrap">
      <svg ref={svgRef} viewBox="0 0 900 470" className="cave-section" role="img" aria-label="CAVE controlled chamber architectural section with movable sensor nodes">
        <defs>
          <linearGradient id="external-smoke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ef8354" stopOpacity={runMode ? ".72" : ".18"} />
            <stop offset="1" stopColor="#f5e6d4" stopOpacity=".18" />
          </linearGradient>
          <linearGradient id="internal-air" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fcfbf5" />
            <stop offset="1" stopColor="#f5c247" stopOpacity={runMode ? ".36" : ".12"} />
          </linearGradient>
          <pattern id="wall-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="8" stroke="#8b918d" strokeWidth="1" opacity=".38" />
          </pattern>
          <filter id="soft-glow"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <rect x="92" y="82" width="726" height="355" fill="url(#external-smoke)" stroke="#171b1b" strokeWidth="2" />
        <path d="M92 82H818M104 67H806M128 58V82M198 58V82M268 58V82M338 58V82M408 58V82M478 58V82M548 58V82M618 58V82M688 58V82M758 58V82" stroke="#171b1b" strokeWidth="1.25" fill="none" />
        <text x="455" y="49" textAnchor="middle" className="cave-small-label">INJECTION MANIFOLD</text>
        <text x="455" y="108" textAnchor="middle" className="cave-zone-label">EXTERNAL CAVE HALL · 206 m²</text>
        <text x="455" y="126" textAnchor="middle" className="cave-note">ONE 9 m-HIGH VOLUME · CONTROLLED OUTDOOR ENVIRONMENT · {exteriorTempC.toFixed(1)} °C</text>
        <g opacity=".72">
          {Array.from({ length: 10 }, (_, index) => <path key={index} d={`M${145 + index * 63} 64v16l-5-7m5 7l5-7`} stroke="#171b1b" fill="none" strokeWidth="1" />)}
        </g>
        {leakPaths.map((path, index) => (
          <g key={path}>
            <path d={path} fill="none" stroke="#2e7e8c" strokeWidth="1.2" strokeDasharray="4 6" />
            {runMode && <circle r="4" fill="#2e7e8c"><animateMotion dur={`${Math.max(2.5, 8 - totalAch * 2)}s`} repeatCount="indefinite" path={path} begin={`${index * -.9}s`} /></circle>}
          </g>
        ))}
        {building === "single_room" && <g className="section-building section-single">
          <rect x="288" y="257" width="334" height="165" fill="url(#internal-air)" stroke="none" />
          <rect x="278" y="247" width="354" height="12" fill="url(#wall-hatch)" stroke="#171b1b" strokeWidth="1.5" />
          <rect x="278" y="247" width="12" height="175" fill="url(#wall-hatch)" stroke="#171b1b" strokeWidth="1.5" />
          <rect x="620" y="247" width="12" height="175" fill="url(#wall-hatch)" stroke="#171b1b" strokeWidth="1.5" />
          <rect x="278" y="418" width="354" height="8" fill="#777e7a" stroke="#171b1b" />
          <rect x="316" y="328" width="52" height="90" fill="#877d6f" stroke="#171b1b" strokeWidth="1.4" />
          <path d="M357 375a4 4 0 1 0 .1 0" fill="#171b1b" />
          <rect x="507" y="282" width="82" height="58" fill="#a9c3c4" fillOpacity=".52" stroke="#171b1b" strokeWidth="1.4" />
          <path d="M548 282v58M507 311h82" stroke="#596360" />
          <rect x="304" y="272" width="302" height="14" rx="7" fill="#8c9793" stroke="#171b1b" />
          {[340,455,570].map((x) => <g key={x}><path d={`M${x} 286v16`} stroke="#596360" /><rect x={x - 17} y="302" width="34" height="6" fill="#75817d" stroke="#171b1b" /></g>)}
          <rect x="487" y="380" width="82" height="8" fill="#777e7a" /><path d="M496 388v30M560 388v30" stroke="#596360" strokeWidth="2" />
        </g>}
        {building === "two_storey" && <g className="section-building section-house">
          <path d="M267 269L455 174L643 269L631 276L455 188L279 276Z" fill="#6d7471" stroke="#171b1b" strokeWidth="1.6" />
          <path d="M285 270V422H625V270L455 187Z" fill="url(#internal-air)" stroke="none" />
          <path d="M274 270L455 180L636 270M280 270v152M630 270v152" fill="none" stroke="#171b1b" strokeWidth="12" />
          <rect x="280" y="337" width="350" height="12" fill="url(#wall-hatch)" stroke="#171b1b" strokeWidth="1.4" />
          <rect x="280" y="418" width="350" height="8" fill="#777e7a" stroke="#171b1b" />
          <rect x="350" y="280" width="60" height="38" fill="#a9c3c4" fillOpacity=".52" stroke="#171b1b" /><path d="M380 280v38" stroke="#596360" />
          <rect x="505" y="280" width="60" height="38" fill="#a9c3c4" fillOpacity=".52" stroke="#171b1b" /><path d="M535 280v38" stroke="#596360" />
          <rect x="332" y="365" width="64" height="45" fill="#a9c3c4" fillOpacity=".52" stroke="#171b1b" /><path d="M364 365v45" stroke="#596360" />
          <rect x="531" y="350" width="44" height="68" fill="#877d6f" stroke="#171b1b" />
          {[0,1,2,3,4,5,6,7].map((step) => <rect key={step} x={420 + step * 8} y={405 - step * 8} width="42" height="5" fill="#837b70" stroke="#535b58" strokeWidth=".6" />)}
          <path d="M414 418L505 341" stroke="#596360" strokeWidth="2" /><path d="M421 411L512 334" stroke="#596360" />
          <path d="M300 258h310" stroke="#87938f" strokeWidth="12" /><path d="M330 258v13M455 258v13M580 258v13" stroke="#596360" />
        </g>}
        {building === "bus" && <g className="section-building section-bus">
          <path d="M244 391V288q0-38 42-45l260-10q80 0 111 48v110Z" fill="url(#internal-air)" stroke="#171b1b" strokeWidth="3" />
          <path d="M248 331h405M286 245v146M590 240v151" stroke="#596360" strokeWidth="2" />
          <path d="M252 255L548 242q66 0 94 43l-394 8Z" fill="#a9c3c4" fillOpacity=".58" stroke="#171b1b" />
          {[310,364,418,472,526,580].map((x) => <path key={x} d={`M${x} 247v43`} stroke="#596360" />)}
          <rect x="603" y="296" width="40" height="88" fill="#a9c3c4" fillOpacity=".35" stroke="#171b1b" />
          {[290,340,390,440,490,540].map((x) => <g key={x}><path d={`M${x} 346h28v29h-28v-29M${x + 4} 375v15M${x + 24} 375v15`} fill="#55736f" stroke="#364440" /></g>)}
          <path d="M270 318h350" stroke="#89948f" strokeWidth="10" /><path d="M300 318v13M420 318v13M540 318v13" stroke="#596360" />
          <circle cx="319" cy="393" r="27" fill="#2b302f" stroke="#171b1b" strokeWidth="2" /><circle cx="319" cy="393" r="11" fill="#9ca29f" />
          <circle cx="574" cy="393" r="27" fill="#2b302f" stroke="#171b1b" strokeWidth="2" /><circle cx="574" cy="393" r="11" fill="#9ca29f" />
          <rect x="247" y="382" width="407" height="10" fill="#9f4e35" />
        </g>}
        <g className="section-caption" transform="translate(112 142)">
          <rect width="196" height="70" fill="#fffdf7" fillOpacity=".94" stroke="#171b1b" strokeWidth="1" />
          <text x="12" y="20" className="cave-zone-label">{BUILDING_LABEL[building]}</text>
          <text x="12" y="41" className="cave-note">INTERIOR · {interiorTempC.toFixed(1)} °C</text>
          <text x="12" y="58" className="cave-note">HVAC · {ventMode.toUpperCase()} · {totalAch.toFixed(2)} h⁻¹</text>
        </g>
        <g transform="translate(778 318)">
          <rect x="0" y="0" width="26" height="58" fill="#fffdf7" stroke="#171b1b" />
          <path d="M13 6V52M7 12h12M7 22h12M7 32h12M7 42h12" stroke="#171b1b" strokeWidth="1" />
          <text x="13" y="71" textAnchor="middle" className="cave-note">HALL HVAC</text>
        </g>
        <path d="M72 82V437M72 82h10M72 437h10M67 82l5-12 5 12M67 437l5 12 5-12" stroke="#171b1b" fill="none" />
        <text x="54" y="260" transform="rotate(-90 54 260)" textAnchor="middle" className="cave-small-label">9.0 m CLEAR</text>
        <path d="M92 454H818M92 449v10M818 449v10" stroke="#171b1b" />
        <text x="455" y="466" textAnchor="middle" className="cave-small-label">22.0 m INTERNAL CLEAR</text>
        {sensors.map((sensor) => {
          const active = activeSensor === sensor.id || selectedSensor === sensor.id;
          const value = sensorValues?.[sensor.id];
          return (
            <g
              key={sensor.id}
              transform={`translate(${sensor.x} ${sensor.y})`}
              className="sensor-node"
              tabIndex={onSensorsChange || onSensorSelect ? 0 : undefined}
              role={onSensorsChange || onSensorSelect ? "button" : undefined}
              aria-pressed={onSensorSelect ? selectedSensor === sensor.id : undefined}
              aria-label={`${sensor.id} ${sensor.kind} sensor${onSensorsChange ? ", draggable" : ""}`}
              onClick={() => onSensorSelect?.(sensor.id)}
              onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && onSensorSelect) { event.preventDefault(); onSensorSelect(sensor.id); } }}
              onPointerDown={(event) => {
                if (!onSensorsChange) return;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && moveSensor(sensor.id, event.clientX, event.clientY)}
            >
              {active && <circle cy="-1" r="22" fill="#f5c247" opacity=".28" filter="url(#soft-glow)" />}
              <path d="M0 8v20M-8 28H8" stroke="#596360" strokeWidth="2" />
              <path d="M-7 28l-7 7M7 28l7 7M0 28v8" stroke="#596360" strokeWidth="1.4" />
              <rect x="-12" y="-8" width="24" height="17" rx="2" fill="#f7f5ef" stroke={active ? "#c5522f" : "#171b1b"} strokeWidth={active ? 2.2 : 1.2} />
              <rect x="-12" y="-8" width="24" height="4" fill={sensor.kind === "PM" ? "#c45a36" : sensor.kind === "NOx" ? "#8d587d" : sensor.kind === "CO2" ? "#226d70" : sensor.kind === "T" ? "#b38b2d" : "#4b6d91"} />
              <rect x="-7" y="-1" width="9" height="4" rx=".7" fill="#d7ded9" stroke="#5b6662" strokeWidth=".6" />
              <circle cx="7" cy="1" r="1.5" fill={runMode ? "#2f8c68" : "#81928b"} />
              <path d="M0-8v-9M-3-17h6" stroke="#171b1b" strokeWidth="1.5" />
              <path d="M-10 8q-10 8-2 19" fill="none" stroke="#454e4b" strokeWidth="1" strokeDasharray="2 1" />
              <text x="17" y="1" className="sensor-id">{sensor.id}</text>
              {value != null && <text x="17" y="14" className="sensor-value">{value.toFixed(sensor.kind === "PM" ? 0 : 1)}</text>}
            </g>
          );
        })}
      </svg>
      <div className="cave-legend"><span><i className="sensor-dot" />S1–S3 PM₂.₅</span><span>S4 NOx · S5–S6 CO₂</span><span>S7 temperature · S8 RH</span><span><i className="airflow-line" />Independent hall / interior airflow</span></div>
    </div>
  );
}
