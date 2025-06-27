import React, { PureComponent } from 'react';
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default class ZoneBarChart extends PureComponent {

  render() {
    const { data } = this.props;
    const zoneKeys = data.length > 0 ? Object.keys(data[0]).filter(key => key !== "status") : [];
    const colors = [
      "#00FFAF", "#1E90FF", "#FF69B4", "#ADFF2F", "#FF8C00",
      "#BA55D3", "#FF4500", "#40E0D0", "#FF1493", "#7CFC00",
      "#DA70D6", "#48D1CC", "#FFA500", "#8A2BE2", "#00CED1",
      "#FF6347", "#20B2AA", "#00BFFF"
    ];
    return (
      <>
      {/* <h2>Low and Average Duration in Each Zone</h2> */}
      <ResponsiveContainer height={600}>
        <BarChart
          
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="zone" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar

            dataKey="lowValue"
            fill="#1E90FF"
            maxBarSize={30}
          /><Bar

            dataKey="value"
            fill="#8A2BE2"
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
      </>
    );
  }
}
