import ChartWrapper from "./ChartWrapper";

export default function SubjectRadar({ data }) {
  // data: array of { subject, avgMarks }
  const chartData = {
    labels: data.map((d) => d.subject),
    datasets: [
      {
        label: "Avg Marks",
        data: data.map((d) => d.avgMarks),
        backgroundColor: "rgba(0,201,167,0.15)",
        borderColor: "#00c9a7",
        borderWidth: 2,
        pointBackgroundColor: "#00c9a7",
        pointBorderColor: "#0d1f35",
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: "rgba(255,255,255,0.06)" },
        angleLines: { color: "rgba(255,255,255,0.06)" },
        ticks: {
          color: "#7a8fa6",
          backdropColor: "transparent",
          font: { size: 9 },
          stepSize: 25,
        },
        pointLabels: {
          color: "#7a8fa6",
          font: { size: 10, family: "'DM Mono', monospace" },
        },
      },
    },
  };

  return <ChartWrapper type="radar" data={chartData} options={options} height={280} />;
}
