import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DailyCountChart({ dailyCount }) {

  // If dailyCount is an object with date keys and count values
  if (!dailyCount || typeof dailyCount !== 'object' || Object.keys(dailyCount).length === 0) return null;

  const labels = Object.keys(dailyCount).sort();
  const data = labels.map((date) => dailyCount[date]);
  console.log(data);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Daily Count",
        data,
        fill: false,
        borderColor: "#3a4d63",
        backgroundColor: "#5a6d85",
        tension: 0.2
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top"
      },
      title: {
        display: true,
        text: "Daily Count Over Time"
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Date"
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

  return <Line data={chartData} options={options} />;
}
