import { useRef } from "react";
import type { Building, Sensor, SensorKind, VentMode } from "@/engine";
import caveChamberSection from "@/assets/cave-chamber-section-shared.png";
import caveModelBus from "@/assets/cave-model-bus.png";
import caveModelSingleRoom from "@/assets/cave-model-single-room.png";
import caveModelTwoStorey from "@/assets/cave-model-two-storey.png";
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

const MODEL_ASSET: Record<Building, string> = {
  single_room: caveModelSingleRoom,
  two_storey: caveModelTwoStorey,
  bus: caveModelBus,
};

const MODEL_LABEL: Record<Building, string> = {
  single_room: "Single-room test cell",
  two_storey: "Two-storey dwelling",
  bus: "Transit bus cabin",
};

const MODEL_PLACEMENT: Record<Building, { x: number; y: number; width: number; height: number }> = {
  single_room: { x: 250, y: 226, width: 402, height: 218 },
  two_storey: { x: 256, y: 154, width: 390, height: 286 },
  bus: { x: 186, y: 258, width: 530, height: 178 },
};

const SENSOR_COLOR: Record<SensorKind, string> = {
  PM: "#bf5a3a",
  NOx: "#8a5f7e",
  CO2: "#0f766e",
  T: "#a87424",
  RH: "#3d6f95",
};

const FLOW_PATHS = [
  "M162 143 C208 188 220 250 176 323",
  "M738 143 C692 188 680 250 724 323",
  "M188 328 C292 269 390 265 455 313 C520 361 614 352 711 306",
  "M712 188 C610 154 514 166 455 207 C390 252 297 243 188 202",
];

function SensorMount({ id }: { id: string }) {
  if (id === "S1" || id === "S2") {
    return <path className="sensor-mount sensor-mount-ceiling" d="M0-58V-13M-8-58H8M-4-48H4" />;
  }
  if (id === "S3" || id === "S4") {
    return <path className="sensor-mount sensor-mount-floor" d="M0 12v126M-12 138H12M0 138l-10 12M0 138l10 12M-7 82H7" />;
  }
  if (id === "S8") {
    return <path className="sensor-mount sensor-mount-return" d="M0 12v38M-9 50H9M0 50l-8 9M0 50l8 9" />;
  }
  return <path className="sensor-mount sensor-mount-internal" d="M0 12v28M-8 40H8M0 40l-6 8M0 40l6 8" />;
}

export function CaveSection({
  sensors,
  onSensorsChange,
  selectedSensor,
  onSensorSelect,
  totalAch = 0.22,
  runMode,
  activeSensor,
  building = "single_room",
  exteriorTempC = 25,
}: CaveSectionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const modelPlacement = MODEL_PLACEMENT[building];

  const moveSensor = (id: string, clientX: number, clientY: number) => {
    if (!onSensorsChange || !svgRef.current) return;
    const point = svgRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const local = point.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    onSensorsChange(sensors.map((sensor) => (
      sensor.id === id
        ? { ...sensor, x: Math.max(92, Math.min(808, local.x)), y: Math.max(112, Math.min(430, local.y)) }
        : sensor
    )));
  };

  return (
    <div className="cave-section-wrap" data-building={building}>
      <div className="cave-section-info">
        <article><span>Controlled chamber</span><b>{exteriorTempC.toFixed(1)} C outdoor boundary</b></article>
        <article><span>Smoke injection manifold</span><b>CAVE-generated challenge</b></article>
        <article><span>Independent test article</span><b>{MODEL_LABEL[building]}</b></article>
      </div>
      <svg ref={svgRef} viewBox="0 0 900 470" className="cave-section" role="img" aria-label="CAVE controlled chamber section with movable sensor nodes">
        <defs>
          <radialGradient id="controlled-smoke" cx="50%" cy="35%" r="60%">
            <stop offset="0" stopColor="#d79248" stopOpacity={runMode ? ".38" : ".22"} />
            <stop offset=".58" stopColor="#d79248" stopOpacity={runMode ? ".2" : ".12"} />
            <stop offset="1" stopColor="#d79248" stopOpacity="0" />
          </radialGradient>
          <filter id="section-soft-glow"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>

        <image href={caveChamberSection} x="0" y="0" width="900" height="470" preserveAspectRatio="none" className="cave-chamber-image" />
        <g className="cave-smoke-layer" aria-hidden="true">
          <ellipse cx="450" cy="177" rx="312" ry="82" fill="url(#controlled-smoke)" />
          {[170, 230, 290, 350, 410, 470, 530, 590, 650, 710].map((x, index) => (
            <path key={x} d={`M${x} 96 C${x - 8} 122 ${x + 12} 143 ${x - 2} 172`} />
          ))}
        </g>
        <image
          href={MODEL_ASSET[building]}
          x={modelPlacement.x}
          y={modelPlacement.y}
          width={modelPlacement.width}
          height={modelPlacement.height}
          preserveAspectRatio="xMidYMid meet"
          className="cave-model-image"
        />

        <g className="cave-flow-layer" aria-hidden="true">
          {FLOW_PATHS.map((path) => <path key={path} d={path} />)}
          {runMode && FLOW_PATHS.map((path, index) => (
            <circle key={`${path}-dot`} r="3.5">
              <animateMotion dur={`${Math.max(3.2, 8 - totalAch * 2)}s`} repeatCount="indefinite" path={path} begin={`${index * -0.8}s`} />
            </circle>
          ))}
        </g>

        {sensors.map((sensor) => {
          const active = activeSensor === sensor.id || selectedSensor === sensor.id;
          return (
            <g
              key={sensor.id}
              transform={`translate(${sensor.x} ${sensor.y})`}
              className={`sensor-node ${active ? "active" : ""}`}
              tabIndex={onSensorsChange || onSensorSelect ? 0 : undefined}
              role={onSensorsChange || onSensorSelect ? "button" : undefined}
              aria-pressed={onSensorSelect ? selectedSensor === sensor.id : undefined}
              aria-label={`${sensor.id} ${sensor.kind} sensor${onSensorsChange ? ", draggable" : ""}`}
              onClick={() => onSensorSelect?.(sensor.id)}
              onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && onSensorSelect) {
                  event.preventDefault();
                  onSensorSelect(sensor.id);
                }
              }}
              onPointerDown={(event) => {
                if (!onSensorsChange) return;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && moveSensor(sensor.id, event.clientX, event.clientY)}
            >
              {active && <circle r="18" fill={SENSOR_COLOR[sensor.kind]} opacity=".18" filter="url(#section-soft-glow)" />}
              <SensorMount id={sensor.id} />
              <circle r="11.2" fill="#fffdf8" stroke={SENSOR_COLOR[sensor.kind]} strokeWidth="2.4" />
              <circle r="6.8" fill={SENSOR_COLOR[sensor.kind]} opacity=".94" />
              <text y="3.7" textAnchor="middle">{sensor.id}</text>
            </g>
          );
        })}
      </svg>
      <div className="cave-legend">
        <span><i className="sensor-dot sensor-dot-pm" />S1-S3 PM2.5</span>
        <span><i className="sensor-dot sensor-dot-nox" />S4 NOx</span>
        <span><i className="sensor-dot sensor-dot-co2" />S5-S6 CO2</span>
        <span><i className="sensor-dot sensor-dot-t" />S7 temperature</span>
        <span><i className="sensor-dot sensor-dot-rh" />S8 RH</span>
        <span><i className="airflow-line" />Unified chamber airflow</span>
      </div>
    </div>
  );
}
