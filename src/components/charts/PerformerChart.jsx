import ChartWrapper from "./ChartWrapper";

export default function PerformerChart({ students, mode = "top" }) {
  // students: [{ name, avgMarks }]
  const sorted = [...students].sort((a, b) =>
    mode === "top" ? b.avgMarks - a.avgMarks : a.avgMarks - b.avgMarks
  );
  const top5 = sorted.slice(0, 5);

  const chartData = {
    labels: top5.map((s) => s.name),
    datasets: [
      {
        label: "Avg Marks",
        data: top5.map((s) => s.avgMarks),
        backgroundColor:
          mode === "top" ? "rgba(0,201,167,0.7)" : "rgba(255,107,53,0.7)",
        borderColor: mode === "top" ? "#00c9a7" : "#ff6b35",
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    scales: {
      x: { min: 0, max: 100 },
    },
  };

  return <ChartWrapper type="bar" data={chartData} options={options} height={200} />;
}
