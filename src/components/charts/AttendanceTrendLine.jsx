import ChartWrapper from "./ChartWrapper";

export default function AttendanceTrendLine({ data }) {
  // data: array of { month, pct }
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: "Attendance %",
        data: data.map((d) => d.pct),
        borderColor: "#4facfe",
        backgroundColor: "rgba(79,172,254,0.08)",
        tension: 0.45,
        fill: true,
        pointBackgroundColor: "#4facfe",
        pointBorderColor: "#0d1f35",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    scales: {
      y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } },
    },
  };

  return <ChartWrapper type="line" data={chartData} options={options} height={200} />;
}
