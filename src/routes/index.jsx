import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useParkData } from "../context/ParkDataContext";
import ZoneLineChart from "../components/ZoneLineChart";
import ZoneBarChart from "../components/ZoneBarChart";
import ParkDashboard from "../components/ParkDashboard";
import { safeJsonFetch } from "../utils/safeFetch";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { zones, guests, paused, setPaused } = useParkData();

  // Local UI state
  const [selectedZone, setSelectedZone] = useState("");
  const [zoneHistory, setZoneHistory] = useState([]);
  const [durations, setDurations] = useState([]);
  const [occupancyData, setOccupancyData] = useState(null);
  const [averageStay, setAverageStay] = useState(null);
  const [jsonResponse, setJsonResponse] = useState("");

  // Format date helper (used for zone history entries)
  function formatDate(date) {
    const pad = (n) => n.toString().padStart(2, "0");
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
  }

  // Track zoneHistory and durations every time zones change
  useEffect(() => {
    if (paused || zones.length === 0) return;

    const timestamp = formatDate(new Date());
    const zoneHistoryData = { time: timestamp };
    const zoneDurationData = [];

    zones.forEach((zone) => {
      zoneHistoryData[zone.zoneName] = zone.currentGuestCount;
      zoneDurationData.push({
        zone: zone.zoneId,
        lowValue: zone.lowestDuration,
        value: zone.averageDuration,
      });
    });

    setDurations(zoneDurationData);
    setZoneHistory((prev) => [...prev, zoneHistoryData]);
  }, [zones, paused]);

  // Handlers for occupancy and average stay info
  const getOccupancyInfo = () => {
    if (!selectedZone) return;
    safeJsonFetch(`http://localhost:8080/zones/occupancy/${selectedZone}`).then(
      (data) => {
        setOccupancyData(data);
        setAverageStay(null);
        setTimeout(() => {
          setOccupancyData(null);
        }, 5000);
      }
    );
  };

  const getAverageStay = () => {
    if (!selectedZone) return;
    safeJsonFetch(
      `http://localhost:8080/zones/averageTimeSpent/${selectedZone}`
    ).then((data) => {
      setAverageStay(data);
      setOccupancyData(null);
      setTimeout(() => {
        setAverageStay(null);
      }, 5000);
    });
  };

  // Change zone capacity on enter key press
  const changeZoneCapacity = (e) => {
    if (e.key !== "Enter") return;
    const cap = e.target.value;
    if (!selectedZone || !cap) return;

    safeJsonFetch(
      `http://localhost:8080/zones/changeCapacity/${selectedZone}?newCapacity=${cap}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((data) => {
        setJsonResponse(`Status: ${data.status}`);
        setTimeout(() => setJsonResponse(""), 5000);
      })
      .catch((err) => {
        console.error("Capacity update failed:", err);
        setJsonResponse("Error updating capacity");
        setTimeout(() => setJsonResponse(""), 5000);
      });

    e.target.value = ""; // clear input after submit
  };
  return (
    <>
      <header>
        <div className="info-wrapper">
          <div className="info-container">
            {zones?.map((zone) => (
              <div
                key={zone.zoneId}
                onClick={() => setSelectedZone(zone.zoneId)}
                className={
                  "info-card" +
                  (zone.zoneId === selectedZone ? " active-card" : "")
                }
              >
                <h3>{zone.zoneName}</h3>
                <p>{"Zone " + zone.zoneId}</p>
                <div style={{ display: "flex", alignSelf: "center" }}>
                  <div className={`status-dot ${zone.status}`}></div>
                  <p style={{ display: "flex", alignSelf: "center" }}>
                    {zone.currentGuestCount}/{zone.capacity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="info-container">
            {guests?.map((guest) => (
              <div key={guest.guestId} className="info-card">
                <h3>In Zone {guest.currentZoneId}</h3>
                <p>{guest.guestId}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <button onClick={() => setPaused(!paused)}>
            {paused ? "Start Chart Stream" : "Pause Chart Stream"}
          </button>

          <h3>
            Click on a zone above to view its occupancy status, average stay
            time, or change its capacity
          </h3>

          <div className="button-container">
            {selectedZone && (
              <>
                <button onClick={getOccupancyInfo}>
                  View Occupancy Status
                </button>
                <button onClick={getAverageStay}>View Average Stay Time</button>
                <input
                  onKeyDown={changeZoneCapacity}
                  placeholder="Press enter to change cap"
                />
              </>
            )}
          </div>

          {occupancyData && (
            <p>
              {occupancyData.zoneName + " is currently " + occupancyData.status}
            </p>
          )}
          {averageStay && <p>{averageStay}</p>}
          <p>{jsonResponse}</p>
        </div>
      </header>

      <section className="main-body">
        <div className="chart-container">
          <ZoneLineChart data={zoneHistory} />

          <ZoneBarChart data={durations} />
        </div>
      </section>
    </>
  );
}
