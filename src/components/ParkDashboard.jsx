import React, { useState } from "react";
import ParkHeatmap from "./ParkHeatmap";
import ParkZoneTable from "./ParkZoneTable";

function ParkDashboard({zoneData, guestData}) {
  const [toggleView, setToggleView] = useState(true);
  return (
    <div style={{alignSelf: "center", width: "100%", display: "flex", flexDirection: "column"}}>
      <button style={{marginBottom: "10px", width: "200px", background: "rgb(10,10,10)", alignSelf: "center"}} onClick={() => setToggleView(!toggleView)}>
        {toggleView ? "Toggle Table View" : "Toggle Map View"}
      </button>
      {toggleView ? <ParkHeatmap zoneData={zoneData} guestData={guestData} /> : <ParkZoneTable zoneData={zoneData} guestData={guestData} />}
    </div>
  );
}

export default ParkDashboard;
