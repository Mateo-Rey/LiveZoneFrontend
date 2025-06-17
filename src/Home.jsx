import React, { useState } from "react";
import App from "./App";
import "./App.css";
import { v4 as uuidv4 } from "uuid";
function Home() {
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [zones, setZones] = useState({});
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneName, setZoneName] = useState();
  const [capacity, setCapacity] = useState();
  console.log(zones);

  const submit = () => {
    fetch("http://localhost:8080/zones/addZones", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },body: JSON.stringify(zones)
    }).then((response) => {if (response.status == 200) setZonesLoaded(true)})
  };

  const handleKeyDown = (e, zone) => {
    if (e.key === "Enter") {
      const input = e.target.value.trim();

      // Validate input
      if (
        !input ||
        !selectedZone ||
        input === selectedZone ||
        !Object.values(zones).some((z) => z.zoneName === input)
      )
        return;

      const connectionsArr = input.split(" ");

      setZones((prevZones) => {
        // Find the zone key for the selectedZone name
        const selectedZoneEntry = Object.entries(prevZones).find(
          ([key, z]) => z.zoneName === selectedZone
        );
        if (!selectedZoneEntry) return prevZones;

        const [selectedZoneId, selectedZoneObj] = selectedZoneEntry;

        // Clone connectedZones and add/update connections
        const updatedConnected = { ...selectedZoneObj.connectedZones };

        connectionsArr.forEach((connZoneName) => {
          const connectedZoneEntry = Object.entries(prevZones).find(
            ([zoneId, zoneObj]) => zoneObj.zoneName === connZoneName
          );
          if (connectedZoneEntry) {
            const [connZoneId] = connectedZoneEntry;
            const randomValue = Math.floor(Math.random() * 10) + 1;
            updatedConnected[connZoneId] = randomValue;
          }
        });

        // Return updated zones object with updated connectedZones for selected zone
        return {
          ...prevZones,
          [selectedZoneId]: {
            ...selectedZoneObj,
            connectedZones: updatedConnected,
          },
        };
      });

      e.target.value = "";
    }
  };

  const addZone = () => {
    const id = uuidv4();

    if (!Object.values(zones).some((zone) => zone.zoneName === zoneName)) {
      setZones((prevZones) => ({
        ...prevZones,
        [id]: {
          zoneId: id,
          zoneName: zoneName,
          capacity: Number(capacity),
          currentGuestCount: 0,
        },
      }));
    }
  };

  return (
    <>
      {zonesLoaded ? (
        <App />
      ) : (
        <div>
          <h1>Current Zones</h1>
          <div className="add-zones-container">
            {Object.values(zones).map((zone) => (
              <div
                className="zone-card"
                key={zone.zoneId}
                onClick={() => setSelectedZone(zone.zoneName)}
              >
                <h2>{zone.zoneName}</h2>
                <h3>Capacity: {zone.capacity}</h3>
                <input
                  placeholder="Add connected zones (space-separated)"
                  onKeyDown={(e) => handleKeyDown(e, zone)}
                />
                <h3>Connected Zones: {JSON.stringify(zone.connectedZones)}</h3>
              </div>
            ))}
          </div>

          <h2>Add New Zone</h2>
          <div className="zone-input-container">
            <input
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="Zone Name"
            />
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Capacity"
            />
            <button onClick={addZone}>Add Zone</button>
          </div>
          <button onClick={submit} className="submit">
            Add All Zones
          </button>
           <button onClick={() => setZonesLoaded(true)} className="submit">
            Skip to Dashboard
          </button>
        </div>
      )}
    </>
  );
}

export default Home;
