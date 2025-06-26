import { createFileRoute } from "@tanstack/react-router";
import { useParkData } from "../context/ParkDataContext";
import ParkDashboard from "../components/ParkDashboard";

export const Route = createFileRoute("/heatmap")({
  component: Heatmap,
});

function Heatmap() {
  const { hotspots, zones, guests } = useParkData();
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
      <div style={{ display: "flex", flexDirection: "column" }}>
        <h2>Heatmap and Hotspots</h2>
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
      </div>
    </>
  );
}
