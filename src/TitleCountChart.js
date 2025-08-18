import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function TitleCountChart({ titleCounts }) {
  if (!titleCounts || typeof titleCounts !== 'object' || Object.keys(titleCounts).length === 0) return null;

  const labels = Object.keys(titleCounts);
  const data = labels.map((title) => titleCounts[title]);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Count per Title",
        data,
        backgroundColor: "#5a6d85",
        borderColor: "#3a4d63",
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: "Count per Title"
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Title"
        }
      },
      y: {
        title: {
          display: true,
          text: "Count"
        },
        beginAtZero: true
      }
    }
  };

  return <Bar data={chartData} options={options} />;
}
