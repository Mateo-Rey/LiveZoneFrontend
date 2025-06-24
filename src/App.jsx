import { useEffect, useState, useRef } from "react";
import "./App.css";
import ZoneLineChart from "./components/ZoneLineChart";
import ZoneBarChart from "./components/ZoneBarChart";
import { safeJsonFetch } from "./utils/safeFetch";
import ParkHeatmap from "./components/ParkHeatmap";
import ParkDashboard from "./components/ParkDashboard";
function App() {
  const [zones, setZones] = useState([]);
  const [guests, setGuests] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [jsonResponse, setJsonResponse] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [zoneHistory, setZoneHistory] = useState([]);
  const [durations, setDurations] = useState([]);
  const intervalRef = useRef(null);
  const [isFetching, setIsFetching] = useState(false);
  const [occupancyData, setOccupancyData] = useState();
  const [averageStay, setAverageStay] = useState();
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

  const fetchZones = () => {
    const timestamp = formatDate(new Date());
    const zoneHistoryData = { time: timestamp };
    const zoneDurationData = [];

    safeJsonFetch("http://localhost:8080/zones")
      .then((data) => {
        setZones(data);
        data.forEach((zone) => {
          zoneHistoryData[zone.zoneName] = zone.currentGuestCount;
          zoneDurationData.push({
            zone: zone.zoneId,
            lowValue: zone.lowestDuration,
            value: zone.averageDuration,
          });
        });

        setDurations(zoneDurationData);
        setZoneHistory((prev) => [...prev, zoneHistoryData]);
      })
      .catch((error) => {
        console.error("Error fetching zones:", error);
      });
  };

  const fetchGuests = () => {
    safeJsonFetch("http://localhost:8080/guests").then((data) => {
      setGuests(data);
    });
  };

  const fetchHotspots = () => {
    safeJsonFetch("http://localhost:8080/zones/hotspots").then((data) => {
      setHotspots(data);
    });
  };
  useEffect(() => {
    startFetching();
    return () => stopFetching();
  }, []);

  const startFetching = () => {
    if (!intervalRef.current) {
      fetchZones();
      fetchGuests();
      fetchHotspots();
      intervalRef.current = setInterval(() => {
        fetchZones();
        fetchGuests();
        fetchHotspots();
      }, 1000);
      setIsFetching(true);
      console.log("Started fetching zone data");
    }
  };

  const stopFetching = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsFetching(false);
    console.log("Stopped fetching zone data");
  };

  const getOccupancyInfo = () => {
    safeJsonFetch(`http://localhost:8080/zones/occupancy/${selectedZone}`).then(
      (data) => {
        setOccupancyData(data);
        setAverageStay("");
        setTimeout(() => {
          setOccupancyData();
        }, 5000);
      }
    );
  };

  const getAverageStay = () => {
    safeJsonFetch(
      `http://localhost:8080/zones/averageTimeSpent/${selectedZone}`
    ).then((data) => {
      setAverageStay(data);
      setOccupancyData();
      setTimeout(() => {
        setAverageStay("");
      }, 5000);
    });
  };

  const changeZoneCapacity = (e) => {
    const cap = e.target.value;
    if (e.key === "Enter") {
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
          setTimeout(() => {
            setJsonResponse(`Status: ${data.status}`);
          }, 5000);
        })
        .catch((err) => {
          console.error("Capacity update failed:", err);
          setJsonResponse("Error updating capacity");
        });
    }
  };

  const moveGuests = () => {
    fetch(`http://localhost:8080/guests/simulateMove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response;
      })
      .then((data) => {
        setJsonResponse(`Status for moving guests: ${data.status}`);
        setTimeout(() => {
          setJsonResponse("");
        }, 5000);
      })
      .catch((err) => {
        console.error("Moving guests failed:", err);
        setJsonResponse("Error moving guests");
        setTimeout(() => {
          setJsonResponse("");
        }, 5000);
      });
  };

  

  const addGuest = () => {
    fetch(`http://localhost:8080/guests/addGuest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.text();
      })
      .then((data) => console.log(data));
  };

  return (
    <>
      <header>
        <nav>
          <div className="info-wrapper">
            <div className="info-container">
              {zones?.map((zone, index) => (
                <div
                  key={zone.zoneId}
                  onClick={() => setSelectedZone(zone.zoneId)}
                  className={
                    "info-card" +
                    (zone.zoneId == selectedZone ? " active-card" : "")
                  }
                >
                  <h3>{zone.zoneName}</h3>
                  <p>{"Zone" + " " + zone.zoneId}</p>
                  <div style={{ display: "flex", alignSelf: "center" }}>
                    <div className={`status-dot ${zone.status}`}></div>{" "}
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
            {isFetching ? (
              <button onClick={stopFetching}>Stop Stream</button>
            ) : (
              <button onClick={startFetching}>Start Stream</button>
            )}
            <h3>
              Click on a zone above to view it's occupancy status, average stay
              time, or change it's capacity
            </h3>
            <div className="button-container">
              {selectedZone && (
                <>
                  <button onClick={getOccupancyInfo}>
                    View Occupancy Status
                  </button>
                  <button onClick={getAverageStay}>
                    View Average Stay Time
                  </button>
                  <input
                    onKeyDown={changeZoneCapacity}
                    placeholder="Press enter to change cap"
                  />
                </>
              )}
            </div>
            {occupancyData && (
              <p>
                {occupancyData.zoneName +
                  " is currently " +
                  occupancyData?.status}
              </p>
            )}
            <p>{averageStay}</p>
            <p>{jsonResponse}</p>
          </div>
        </nav>
      </header>
      <section className="main-body">
        <div className="chart-container">
          <div style={{ width: "100%", height: "100%" }}>
            <ZoneLineChart data={zoneHistory} />
          </div>
          <div style={{ width: "100%", height: "100%" }}>
            <ZoneBarChart data={durations} />
          </div>
        </div>
        <div>
          <h3>Hotspots</h3>
          <div className="hotspots-container">
            {hotspots?.map((hotspot) => (
              <div key={hotspot.zoneId} className="hotspot-card">
                <p>Zone {hotspot.zoneId}</p>
                <p>{hotspot.zoneName}</p>
                <div
                  className={`hotspot-block ${
                    hotspot.status === "FULL"
                      ? "full"
                      : hotspot.status === "CROWDED"
                      ? "crowded"
                      : ""
                  }`}
                >
                  {hotspot.status}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "center",
            marginBottom: "10px",
            gap: "10px",
          }}
        >
          <button style={{ width: "200px" }} onClick={addGuest}>
            Add New Guest
          </button>
          <button style={{ width: "200px" }} onClick={moveGuests}>
            Move Guests
          </button>
          
        </div>
        <ParkDashboard zoneData={zones} guestData={guests} />
      </section>
    </>
  );
}

export default App;
