import ChartWrapper from "./ChartWrapper";

export default function GradeDonut({ data }) {
  // data: { A: n, B: n, C: n, D: n, F: n }
  const chartData = {
    labels: ["A+/A", "B", "C/D", "Fail"],
    datasets: [
      {
        data: [
          (data["A+"] || 0) + (data["A"] || 0),
          data["B"] || 0,
          (data["C"] || 0) + (data["D"] || 0),
          data["F"] || 0,
        ],
        backgroundColor: [
          "rgba(0,201,167,0.8)",
          "rgba(79,172,254,0.8)",
          "rgba(255,206,86,0.8)",
          "rgba(255,107,53,0.8)",
        ],
        borderColor: ["#00c9a7", "#4facfe", "#ffce56", "#ff6b35"],
        borderWidth: 1.5,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    cutout: "65%",
    plugins: {
      legend: { position: "right" },
    },
  };

  return <ChartWrapper type="doughnut" data={chartData} options={options} height={220} />;
}
