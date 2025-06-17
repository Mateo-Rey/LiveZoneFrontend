import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ZoneLineChart({ data }) {
  const [displayData, setDisplayData] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (!isPaused) {
      setDisplayData(data);
    }
  }, [data, isPaused]);

  const colors = [
    "#00FFAF", "#1E90FF", "#FF69B4", "#ADFF2F", "#FF8C00",
    "#BA55D3", "#FF4500", "#40E0D0", "#FF1493", "#7CFC00",
    "#DA70D6", "#48D1CC", "#FFA500", "#8A2BE2", "#00CED1",
    "#FF6347", "#20B2AA", "#00BFFF"
  ];

  return (
    <>
      <h2>Amount of Guests Per Zone Over Time</h2>
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ width: '100%', height: "100%" }}
      >
        <ResponsiveContainer width={1200} height={550}>
          <LineChart
            data={displayData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="5 5" />
            <XAxis dataKey="time" tick={{ fill: "#FFFFFF" }} />
            <YAxis tick={{ fill: "#FFFFFF" }} />
            <Tooltip />
            <Legend />
            {displayData.length > 0 &&
              Object.keys(displayData[0])
                .filter(key => key !== "time")
                .map((zone, index) => (
                  <Line
                    key={zone}
                    type="monotone"
                    dataKey={zone}
                    stroke={colors[index % colors.length]}
                  />
                ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
