import ChartWrapper from "./ChartWrapper";

export default function AttendanceBarChart({ data }) {
  // data: array of { subject, present, total }
  const labels = data.map((d) => d.subject);
  const pcts = data.map((d) => Math.round((d.present / d.total) * 100));

  const chartData = {
    labels,
    datasets: [
      {
        label: "Attendance %",
        data: pcts,
        backgroundColor: pcts.map((p) =>
          p >= 75 ? "rgba(0,201,167,0.7)" : p >= 60 ? "rgba(255,206,86,0.7)" : "rgba(255,107,53,0.7)"
        ),
        borderColor: pcts.map((p) =>
          p >= 75 ? "#00c9a7" : p >= 60 ? "#ffce56" : "#ff6b35"
        ),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          callback: (v) => v + "%",
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y}% attendance`,
        },
      },
    },
  };

  return <ChartWrapper type="bar" data={chartData} options={options} height={240} />;
}
