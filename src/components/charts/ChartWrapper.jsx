import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function deepMerge(target, source) {
  const out = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

const noScales = ["pie", "doughnut", "polarArea", "radar"];

// Read CSS vars at render time so charts respect current theme
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function ChartWrapper({ type, data, options = {}, height = 260 }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const gridColor    = getCSSVar("--ete-chart-grid")    || "rgba(255,255,255,0.04)";
    const tickColor    = getCSSVar("--ete-chart-tick")    || "#7a8fa6";
    const tooltipBg    = getCSSVar("--ete-tooltip-bg")    || "#0d1f35";
    const tooltipTitle = getCSSVar("--ete-tooltip-title") || "#e2e8f0";
    const tooltipBody  = getCSSVar("--ete-tooltip-body")  || "#7a8fa6";
    const borderColor  = getCSSVar("--ete-border")        || "rgba(0,201,167,0.3)";

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: tickColor,
            font: { family: "'Syne', sans-serif", size: 11 },
            boxWidth: 12, padding: 16,
          },
        },
        tooltip: {
          backgroundColor: tooltipBg,
          borderColor:     borderColor,
          borderWidth: 1,
          titleColor:  tooltipTitle,
          bodyColor:   tooltipBody,
          titleFont:   { family: "'Syne', sans-serif", size: 12, weight: "700" },
          bodyFont:    { family: "'DM Mono', monospace", size: 11 },
          padding: 12, cornerRadius: 8,
        },
      },
      scales: noScales.includes(type) ? undefined : {
        x: {
          grid:  { color: gridColor },
          ticks: { color: tickColor, font: { family: "'DM Mono', monospace", size: 10 } },
        },
        y: {
          grid:  { color: gridColor },
          ticks: { color: tickColor, font: { family: "'DM Mono', monospace", size: 10 } },
        },
      },
    };

    chartRef.current = new Chart(canvasRef.current.getContext("2d"), {
      type,
      data,
      options: deepMerge(defaultOptions, options),
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [type, data, options]);

  return (
    <div style={{ position: "relative", height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
