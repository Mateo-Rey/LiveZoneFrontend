import React, { useEffect, useRef, useState, useMemo } from "react";
import h337 from "heatmap.js";
import useImage from "use-image";
import park from "../assets/park.png";

const CANVAS_WIDTH = 1500;
const CANVAS_HEIGHT = 1000;
const GUEST_RADIUS = 100;
const ORBIT_RADIUS = 30;
const FADE_DURATION = 1000;

const ZONE_POSITIONS = {
  "Thunder Coaster": { x: 150, y: 150 },
  "Food Court": { x: 600, y: 600 },
  "Splash Zone": { x: 1200, y: 500 },
  "Leaning Tower": { x: 200, y: 700 },
  Teacups: { x: 900, y: 800 },
};

export default function ParkHeatmap({ guestData = [], zoneData = [] }) {
  const [image] = useImage(park);
  const heatmapContainerRef = useRef();
  const heatmapRef = useRef(null);
  const simulationRef = useRef({});
  const [debugMode, setDebugMode] = useState(false);
  const [heatmapReady, setHeatmapReady] = useState(false);
  const [zonePositionsById, setZonePositionsById] = useState({});
  const [hoveredZoneId, setHoveredZoneId] = useState(null);

  const zoneCapacities = useMemo(
    () => zoneData.map(z => z.capacity).join(","),
    [zoneData]
  );

  useEffect(() => {
    const map = {};
    zoneData.forEach((zone, index) => {
      let pos = ZONE_POSITIONS[zone.zoneName];
      if (!pos) {
        const cols = Math.ceil(Math.sqrt(zoneData.length));
        const cellWidth = CANVAS_WIDTH / cols;
        const cellHeight = CANVAS_HEIGHT / cols;
        pos = {
          x: (index % cols) * cellWidth + cellWidth / 2,
          y: Math.floor(index / cols) * cellHeight + cellHeight / 2,
        };
      }
      map[zone.zoneId] = pos;
    });
    setZonePositionsById(map);
  }, [zoneData]);

  useEffect(() => {
    if (!heatmapRef.current && heatmapContainerRef.current) {
      heatmapRef.current = h337.create({
        container: heatmapContainerRef.current,
        radius: GUEST_RADIUS,
        maxOpacity: 0.8,
        minOpacity: 0.1,
        blur: 0.85,
        gradient: {
          0.0: "blue",
          0.25: "cyan",
          0.5: "lime",
          0.75: "yellow",
          1.0: "red",
        },
      });
      setHeatmapReady(true);
    }
  }, []);

  const getZonePosition = (zoneId) =>
    zonePositionsById[zoneId] || {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
    };

  const getRandomPosition = (center) => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = ORBIT_RADIUS * (0.3 + Math.random() * 0.7);
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  };

  useEffect(() => {
    if (!guestData.length || !heatmapReady || !Object.keys(zonePositionsById).length) return;

    const now = performance.now();
    const activeGuests = new Set();

    guestData.forEach((guest) => {
      activeGuests.add(guest.guestId);
      const zonePos = getZonePosition(guest.currentZoneId);
      if (!zonePos || isNaN(zonePos.x) || isNaN(zonePos.y)) return;

      const sim = simulationRef.current[guest.guestId];
      if (!sim) {
        const pos = getRandomPosition(zonePos);
        simulationRef.current[guest.guestId] = {
          guestId: guest.guestId,
          currentZoneId: guest.currentZoneId,
          x: pos.x,
          y: pos.y,
          targetX: pos.x,
          targetY: pos.y,
          opacity: 0,
          fadeIn: true,
          fadeOut: false,
          addedAt: now,
        };
      } else if (sim.currentZoneId !== guest.currentZoneId) {
        const newPos = getRandomPosition(zonePos);
        Object.assign(sim, {
          currentZoneId: guest.currentZoneId,
          targetX: newPos.x,
          targetY: newPos.y,
        });
      }
    });

    Object.keys(simulationRef.current).forEach((id) => {
      if (!activeGuests.has(id)) {
        const sim = simulationRef.current[id];
        if (!sim.fadeOut) {
          sim.fadeOut = true;
          sim.fadeIn = false;
          sim.removedAt = now;
        }
      }
    });
  }, [guestData, zonePositionsById, heatmapReady]);

  useEffect(() => {
    if (!heatmapReady) return;
    let raf;

    const loop = () => {
      const now = performance.now();
      const data = [];
      const remove = [];

      Object.entries(simulationRef.current).forEach(([id, sim]) => {
        const t = now * 0.001;
        const zone = zoneData.find(z => z.zoneId === sim.currentZoneId);
        const px = sim.x + Math.sin(t + parseInt(id, 36)) * 2;
        const py = sim.y + Math.cos(t + parseInt(id, 36)) * 2;

        if (sim.fadeIn) {
          sim.opacity = Math.min((now - sim.addedAt) / FADE_DURATION, 1);
          if (sim.opacity >= 1) sim.fadeIn = false;
        }
        if (sim.fadeOut) {
          sim.opacity = 1 - Math.min((now - sim.removedAt) / FADE_DURATION, 1);
          if (sim.opacity <= 0) remove.push(id);
        }

        sim.x = sim.x * 0.95 + sim.targetX * 0.05;
        sim.y = sim.y * 0.95 + sim.targetY * 0.05;

        if (!zone || isNaN(px) || isNaN(py)) return;

        const fullness = Math.max(
          0,
          (zone.currentGuestCount / zone.capacity - zone.threshold / zone.capacity) /
            (1 - zone.threshold / zone.capacity)
        );

        const heatValue = Math.max(0.01, sim.opacity * fullness);

        data.push({ x: Math.round(px), y: Math.round(py), value: heatValue });
      });

      remove.forEach(id => delete simulationRef.current[id]);
      heatmapRef.current?.setData({ max: 1, data });
      heatmapRef.current?.repaint();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [heatmapReady, zoneCapacities]);

  const hoveredZone = zoneData.find(z => z.zoneId === hoveredZoneId);
  const hoveredPos = hoveredZone && zonePositionsById[hoveredZone.zoneId];

  return (
    <div style={{ position: "relative", width: CANVAS_WIDTH, height: CANVAS_HEIGHT, alignSelf: "center", marginBottom: "1rem" }}>
      {image && (
        <img
          src={park}
          alt="Park map"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
        />
      )}

      <div
        ref={heatmapContainerRef}
        style={{ position: "absolute", top: 0, left: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, zIndex: 2, pointerEvents: "none" }}
      />

      {debugMode &&
        Object.values(simulationRef.current).map((sim) => (
          <div
            key={sim.guestId}
            style={{
              position: "absolute",
              left: sim.x - 5,
              top: sim.y - 5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: `rgba(255, 0, 0, ${sim.opacity})`,
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        ))}

      {zoneData.map(zone => {
        const pos = zonePositionsById[zone.zoneId];
        if (!pos) return null;
        return (
          <div
            key={zone.zoneId}
            onMouseEnter={() => setHoveredZoneId(zone.zoneId)}
            onMouseLeave={() => setHoveredZoneId(null)}
            style={{
              position: "absolute",
              left: pos.x - 50,
              top: pos.y - 50,
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "transparent",
              zIndex: 5,
            }}
          />
        );
      })}

      {hoveredZone && hoveredPos && (
        <div
          style={{
            position: "absolute",
            top: hoveredPos.y - 100,
            left: hoveredPos.x + 60,
            background: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "8px 12px",
            borderRadius: 6,
            fontSize: 12,
            zIndex: 6,
            pointerEvents: "none",
          }}
        >
          <div><strong>{hoveredZone.zoneName}</strong></div>
          <div>Guests: {hoveredZone.currentGuestCount}</div>
          <div>Max Capacity: {hoveredZone.capacity}</div>
          <div>Occupancy: {(Number(hoveredZone.threshold) * 100).toFixed(2)}%</div>
        </div>
      )}

      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 3 }}>
        <button
          onClick={() => setDebugMode(!debugMode)}
          style={{
            background: debugMode ? "#ff4444" : "#4444ff",
            color: "white",
            border: "none",
            padding: "5px 10px",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {debugMode ? "Hide Debug Dots" : "Show Debug Dots"}
        </button>
      </div>

      <div style={{
        position: "absolute",
        bottom: 20,
        left: 20,
        width: 200,
        height: 20,
        background: "linear-gradient(to right, blue, cyan, lime, yellow, red)",
        border: "1px solid #ccc",
        zIndex: 3,
        color: "white",
        fontSize: 12,
        textShadow: "0 0 4px black",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 5px",
      }}>
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}
