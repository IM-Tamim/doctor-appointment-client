import ChartWrapper from "./ChartWrapper";

export default function MarksLineChart({ data }) {
  // data: array of { semester, avgMarks }
  const labels = data.map((d) => `Sem ${d.semester}`);
  const values = data.map((d) => d.avgMarks);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Avg Marks",
        data: values,
        borderColor: "#00c9a7",
        backgroundColor: "rgba(0,201,167,0.08)",
        tension: 0.45,
        fill: true,
        pointBackgroundColor: "#00c9a7",
        pointBorderColor: "#0d1f35",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { callback: (v) => v },
      },
    },
  };

  return <ChartWrapper type="line" data={chartData} options={options} height={240} />;
}
