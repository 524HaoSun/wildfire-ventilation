/** Instrumented Architectural Modernism: thin-line scientific plotting primitives. */
import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface PlotSeries {
  label: string;
  values: Array<number | null | undefined>;
  color: string;
  dashed?: boolean;
  width?: number;
}

interface ScientificChartProps {
  series: PlotSeries[];
  height?: number;
  chartWidth?: number;
  xLabels?: string[];
  yLabel?: string;
  xLabel?: string;
  maxY?: number;
  markerIndex?: number;
  range?: { start: number; end: number };
  onPointSelect?: (index: number) => void;
  compact?: boolean;
  showLegend?: boolean;
}

const PAD = { left: 56, right: 18, top: 20, bottom: 38 };

function pathFor(values: PlotSeries["values"], x: (index: number) => number, y: (value: number) => number) {
  let path = "";
  let open = false;
  values.forEach((value, index) => {
    if (value == null || !Number.isFinite(value)) {
      open = false;
      return;
    }
    path += `${open ? "L" : "M"}${x(index).toFixed(2)},${y(value).toFixed(2)} `;
    open = true;
  });
  return path;
}

export function ScientificChart({
  series,
  height = 250,
  chartWidth = 720,
  xLabels,
  yLabel,
  xLabel,
  maxY,
  markerIndex,
  range,
  onPointSelect,
  compact = false,
  showLegend = true,
}: ScientificChartProps) {
  const id = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(chartWidth);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const updateWidth = () => setMeasuredWidth(Math.round(node.getBoundingClientRect().width));
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const width = Math.max(compact ? 80 : 280, measuredWidth || chartWidth);
  const length = Math.max(2, ...series.map((item) => item.values.length));
  const finite = series.flatMap((item) => item.values.filter((value): value is number => value != null && Number.isFinite(value)));
  const yMax = maxY ?? Math.max(1, ...finite) * 1.08;
  const chartPad = compact ? { left: 8, right: 8, top: 8, bottom: 8 } : PAD;
  const innerWidth = width - chartPad.left - chartPad.right;
  const innerHeight = height - chartPad.top - chartPad.bottom;
  const x = (index: number) => chartPad.left + (index / (length - 1)) * innerWidth;
  const y = (value: number) => chartPad.top + innerHeight - (value / yMax) * innerHeight;
  const ticks = compact ? [] : [0, 0.25, 0.5, 0.75, 1];
  const active = hovered ?? markerIndex;
  const activeValues = active == null ? [] : series.map((item) => item.values[active]);
  const labelTicks = useMemo(() => {
    if (!xLabels?.length || compact) return [];
    return [0, Math.floor((length - 1) / 2), length - 1];
  }, [compact, length, xLabels]);

  const locate = (clientX: number, rect: DOMRect) =>
    Math.max(0, Math.min(length - 1, Math.round(((clientX - rect.left) / rect.width) * (length - 1))));

  return (
    <div ref={frameRef} className="scientific-chart" data-compact={compact || undefined}>
      {showLegend && !compact && (
        <div className="chart-legend">
          {series.map((item) => (
            <span key={item.label}><i style={{ backgroundColor: item.color }} />{item.label}</span>
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ height }}
        role="img"
        aria-label={`${yLabel ?? "Scientific series"} over ${xLabel ?? "time"}`}
        onPointerMove={(event) => setHovered(locate(event.clientX, event.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setHovered(null)}
        onClick={(event) => onPointSelect?.(locate(event.clientX, event.currentTarget.getBoundingClientRect()))}
      >
        <defs>
          <pattern id={`${id}-grid`} width="36" height="24" patternUnits="userSpaceOnUse">
            <path d="M36 0H0V24" fill="none" stroke="#dfe1dc" strokeWidth="0.6" />
          </pattern>
        </defs>
        {!compact && <rect x={chartPad.left} y={chartPad.top} width={innerWidth} height={innerHeight} fill={`url(#${id}-grid)`} />}
        {range && (
          <rect
            x={x(range.start)}
            y={chartPad.top}
            width={Math.max(1, x(range.end) - x(range.start))}
            height={innerHeight}
            fill="#2e7e8c"
            opacity="0.08"
          />
        )}
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={chartPad.left} x2={width - chartPad.right} y1={chartPad.top + innerHeight * tick} y2={chartPad.top + innerHeight * tick} stroke="#bfc4bf" strokeWidth="0.65" />
            <text x={chartPad.left - 8} y={chartPad.top + innerHeight * tick + 3} textAnchor="end" className="axis-text">{Math.round(yMax * (1 - tick))}</text>
          </g>
        ))}
        {series.map((item) => (
          <path key={item.label} d={pathFor(item.values, x, y)} fill="none" stroke={item.color} strokeWidth={item.width ?? 2} strokeDasharray={item.dashed ? "7 5" : undefined} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ))}
        {active != null && (
          <g>
            <line x1={x(active)} x2={x(active)} y1={chartPad.top} y2={height - chartPad.bottom} stroke="#171b1b" strokeWidth="0.8" strokeDasharray="3 3" />
            {activeValues.map((value, index) => value != null && <circle key={series[index].label} cx={x(active)} cy={y(value)} r="3.3" fill="#fff" stroke={series[index].color} strokeWidth="2" />)}
          </g>
        )}
        {!compact && labelTicks.map((index) => <text key={index} x={x(index)} y={height - 9} textAnchor={index === 0 ? "start" : index === length - 1 ? "end" : "middle"} className="axis-text">{xLabels?.[index]?.slice(5, 16)}</text>)}
        {!compact && yLabel && <text x="16" y={height / 2} transform={`rotate(-90 16 ${height / 2})`} textAnchor="middle" className="axis-label">{yLabel}</text>}
        {!compact && xLabel && <text x={width - chartPad.right} y={chartPad.top + 11} textAnchor="end" className="axis-label">{xLabel}</text>}
      </svg>
      {active != null && !compact && (
        <div className="chart-readout">
          <span>{xLabels?.[active] ?? `Index ${active}`}</span>
          {series.map((item, index) => <b key={item.label} style={{ color: item.color }}>{item.label} {activeValues[index] == null ? "—" : Number(activeValues[index]).toFixed(1)}</b>)}
        </div>
      )}
    </div>
  );
}
