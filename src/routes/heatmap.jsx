import { createFileRoute } from "@tanstack/react-router"
import { useParkData } from "../context/ParkDataContext";
import ParkDashboard from "../components/ParkDashboard";

export const Route = createFileRoute("/heatmap")({
  component: Heatmap,
});

function Heatmap() {
  const { hotspots, zones, guests } = useParkData();

  return (
    <>
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
      <ParkDashboard zoneData={zones} guestData={guests} />
    </>
  );
}
