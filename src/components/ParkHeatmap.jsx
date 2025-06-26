import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import h337 from "heatmap.js";
import useImage from "use-image";
import park from "../assets/park.png";

const CANVAS_WIDTH = 1500;
const CANVAS_HEIGHT = 1000;
const GUEST_RADIUS = 80;
const ORBIT_RADIUS = 25;
const FADE_DURATION = 800;
const ORBIT_SPEED = 0.3;
const HEATMAP_FPS = 60;

// Enhanced zone positions with better spacing
const ZONE_POSITIONS = {
  "Thunder Coaster": { x: 180, y: 180 },
  "Food Court": { x: 650, y: 550 },
  "Splash Zone": { x: 1250, y: 550 },
  "Leaning Tower": { x: 250, y: 750 },
  Teacups: { x: 950, y: 750 },
};

export default function ParkHeatmap({ guestData = [], zoneData = [] }) {
  const [image] = useImage(park);
  const heatmapContainerRef = useRef();
  const heatmapRef = useRef(null);
  const simulationRef = useRef({});
  const debugCanvasRef = useRef(null);
  const pathCanvasRef = useRef(null);
  const animationRef = useRef();

  const [debugMode, setDebugMode] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [heatmapReady, setHeatmapReady] = useState(false);
  const [zonePositionsById, setZonePositionsById] = useState({});
  const [hoveredZoneId, setHoveredZoneId] = useState(null);
  const [heatmapIntensity, setHeatmapIntensity] = useState(0.8);
  const [orbitVariation, setOrbitVariation] = useState(0.7);

  const zoneCapacities = useMemo(
    () => zoneData.map((z) => z.capacity).join(","),
    [zoneData]
  );

  // Calculate overall park statistics
  const parkStats = useMemo(() => {
    const totalGuests = guestData.length;
    const totalCapacity = zoneData.reduce(
      (sum, zone) => sum + zone.capacity,
      0
    );
    const averageOccupancy =
      zoneData.length > 0
        ? zoneData.reduce(
            (sum, zone) => sum + zone.currentGuestCount / zone.capacity,
            0
          ) / zoneData.length
        : 0;
    const crowdedZones = zoneData.filter(
      (zone) => zone.currentGuestCount / zone.capacity > 0.8
    ).length;

    return {
      totalGuests,
      totalCapacity,
      averageOccupancy: averageOccupancy * 100,
      crowdedZones,
      totalZones: zoneData.length,
    };
  }, [guestData, zoneData]);

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
        maxOpacity: heatmapIntensity,
        minOpacity: 0.05,
        blur: 0.9,
        gradient: {
          0.0: "rgba(0, 0, 255, 0)",
          0.1: "rgba(0, 150, 255, 0.6)",
          0.3: "rgba(0, 255, 255, 0.7)",
          0.5: "rgba(50, 255, 0, 0.8)",
          0.7: "rgba(255, 255, 0, 0.9)",
          0.85: "rgba(255, 150, 0, 0.95)",
          1.0: "rgba(255, 0, 0, 1)",
        },
      });
      setHeatmapReady(true);
    }
  }, [heatmapIntensity]);

  // Initialize canvases
  useEffect(() => {
    const container = heatmapContainerRef.current?.parentElement;
    if (!container) return;

    // Debug canvas
    if (debugMode && !debugCanvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      Object.assign(canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "10",
        pointerEvents: "none",
      });
      debugCanvasRef.current = canvas;
      container.appendChild(canvas);
    } else if (!debugMode && debugCanvasRef.current) {
      debugCanvasRef.current.remove();
      debugCanvasRef.current = null;
    }

    // Path canvas
    if (showPaths && !pathCanvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      Object.assign(canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        zIndex: "9",
        pointerEvents: "none",
      });
      pathCanvasRef.current = canvas;
      container.appendChild(canvas);
    } else if (!showPaths && pathCanvasRef.current) {
      pathCanvasRef.current.remove();
      pathCanvasRef.current = null;
    }
  }, [debugMode, showPaths]);

  const getZonePosition = useCallback(
    (zoneId) =>
      zonePositionsById[zoneId] || {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
      },
    [zonePositionsById]
  );

  const getRandomOrbitOffset = useCallback(() => {
    const angle = Math.random() * 2 * Math.PI;
    const radius = ORBIT_RADIUS * (0.3 + Math.random() * orbitVariation);
    return { angle, orbitRadius: radius };
  }, [orbitVariation]);

  // Enhanced guest simulation with path tracking
  useEffect(() => {
    if (
      !guestData.length ||
      !heatmapReady ||
      !Object.keys(zonePositionsById).length
    )
      return;

    const now = performance.now();
    const activeGuests = new Set();

    guestData.forEach((guest) => {
      activeGuests.add(guest.guestId);
      const zonePos = getZonePosition(guest.currentZoneId);
      if (!zonePos || isNaN(zonePos.x) || isNaN(zonePos.y)) return;

      const sim = simulationRef.current[guest.guestId];
      if (!sim) {
        const { angle, orbitRadius } = getRandomOrbitOffset();
        const startX = zonePos.x + orbitRadius * Math.cos(angle);
        const startY = zonePos.y + orbitRadius * Math.sin(angle);

        simulationRef.current[guest.guestId] = {
          guestId: guest.guestId,
          currentZoneId: guest.currentZoneId,
          x: startX,
          y: startY,
          opacity: 0,
          fadeIn: true,
          fadeOut: false,
          addedAt: now,
          angle,
          orbitRadius,
          targetZoneId: guest.currentZoneId,
          transitionProgress: 1,
          path: [{ x: startX, y: startY, time: now }], // Track movement path
          lastPositionTime: now,
        };
      } else if (
        sim.targetZoneId !== guest.currentZoneId &&
        sim.transitionProgress >= 1
      ) {
        const { angle, orbitRadius } = getRandomOrbitOffset();
        Object.assign(sim, {
          targetZoneId: guest.currentZoneId,
          transitionProgress: 0,
          targetAngle: angle,
          targetOrbitRadius: orbitRadius,
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
  }, [
    guestData,
    zonePositionsById,
    heatmapReady,
    getZonePosition,
    getRandomOrbitOffset,
  ]);

  // Enhanced animation loop
  useEffect(() => {
    if (!heatmapReady) return;
    let previousTime = performance.now();
    let lastPaintTime = previousTime;

    const loop = () => {
      const now = performance.now();
      const deltaTime = Math.min(now - previousTime, 50);
      const deltaSeconds = deltaTime / 1000;
      previousTime = now;

      const data = [];
      const remove = [];

      // Clear canvases
      let debugCtx = null;
      let pathCtx = null;

      if (debugMode && debugCanvasRef.current) {
        debugCtx = debugCanvasRef.current.getContext("2d");
        debugCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      if (showPaths && pathCanvasRef.current) {
        pathCtx = pathCanvasRef.current.getContext("2d");
        pathCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      Object.entries(simulationRef.current).forEach(([id, sim]) => {
        // Handle zone transitions with improved easing
        if (sim.transitionProgress < 1) {
          sim.transitionProgress = Math.min(
            1,
            sim.transitionProgress + deltaSeconds / 2
          );

          if (sim.transitionProgress >= 1) {
            sim.currentZoneId = sim.targetZoneId;
            sim.angle = sim.targetAngle || sim.angle;
            sim.orbitRadius = sim.targetOrbitRadius || sim.orbitRadius;
          }
        }

        const currentZonePos = getZonePosition(sim.currentZoneId);
        const targetZonePos = sim.targetZoneId
          ? getZonePosition(sim.targetZoneId)
          : currentZonePos;

        if (!currentZonePos) return;

        // Smooth zone position interpolation
        let zonePos;
        if (sim.transitionProgress < 1) {
          const eased =
            sim.transitionProgress *
            sim.transitionProgress *
            (3 - 2 * sim.transitionProgress);
          zonePos = {
            x: currentZonePos.x + (targetZonePos.x - currentZonePos.x) * eased,
            y: currentZonePos.y + (targetZonePos.y - currentZonePos.y) * eased,
          };

          if (
            sim.targetAngle !== undefined &&
            sim.targetOrbitRadius !== undefined
          ) {
            const currentAngle = sim.angle;
            const currentRadius = sim.orbitRadius;
            sim.angle =
              currentAngle + (sim.targetAngle - currentAngle) * eased * 0.3;
            sim.orbitRadius =
              currentRadius + (sim.targetOrbitRadius - currentRadius) * eased;
          }
        } else {
          zonePos = currentZonePos;
        }

        // Update orbital motion
        sim.angle += ORBIT_SPEED * deltaSeconds;

        const newX = zonePos.x + sim.orbitRadius * Math.cos(sim.angle);
        const newY = zonePos.y + sim.orbitRadius * Math.sin(sim.angle);

        sim.x = newX;
        sim.y = newY;

        // Track path for visualization
        if (now - sim.lastPositionTime > 100) {
          // Record position every 100ms
          sim.path.push({ x: sim.x, y: sim.y, time: now });
          sim.lastPositionTime = now;

          // Keep only last 50 positions (5 seconds of history)
          if (sim.path.length > 50) {
            sim.path.shift();
          }
        }

        // Handle fading
        if (sim.fadeIn) {
          sim.opacity = Math.min(
            1,
            sim.opacity + deltaSeconds * (1000 / FADE_DURATION)
          );
          if (sim.opacity >= 1) {
            sim.fadeIn = false;
          }
        }

        if (sim.fadeOut) {
          sim.opacity = Math.max(
            0,
            sim.opacity - deltaSeconds * (1000 / FADE_DURATION)
          );
          if (sim.opacity <= 0) {
            remove.push(id);
          }
        }

        const zone = zoneData.find((z) => z.zoneId === sim.currentZoneId);
        if (!zone) return;

        // Enhanced heat calculation with crowd density
        const occupancyRatio = zone.currentGuestCount / zone.capacity;
        const thresholdRatio = zone.threshold / zone.capacity;

        let heatIntensity;
        if (occupancyRatio <= thresholdRatio) {
          heatIntensity = 0.1 + (occupancyRatio / thresholdRatio) * 0.3;
        } else {
          const overcrowdRatio =
            (occupancyRatio - thresholdRatio) / (1 - thresholdRatio);
          heatIntensity = 0.4 + overcrowdRatio * 0.6;
        }

        const heatValue = Math.max(0.01, sim.opacity * heatIntensity);
        data.push({
          x: Math.round(sim.x),
          y: Math.round(sim.y),
          value: heatValue,
        });

        // Draw debug information
        if (debugCtx && sim.opacity > 0) {
          // Guest dot with zone color coding
          const zoneIndex = zoneData.findIndex(
            (z) => z.zoneId === sim.currentZoneId
          );
          const hue = (zoneIndex * 137.5) % 360; // Golden angle distribution
          debugCtx.fillStyle = `hsla(${hue}, 70%, 60%, ${sim.opacity})`;
          debugCtx.beginPath();
          debugCtx.arc(sim.x, sim.y, 6, 0, 2 * Math.PI);
          debugCtx.fill();

          // Guest ID
          debugCtx.fillStyle = "white";
          debugCtx.font = "10px Arial";
          debugCtx.textAlign = "center";
          debugCtx.fillText(
            sim.guestId.toString().slice(-2),
            sim.x,
            sim.y - 10
          );
        }

        // Draw movement paths
        if (pathCtx && sim.path.length > 1) {
          pathCtx.strokeStyle = `rgba(255, 255, 255, ${sim.opacity * 0.5})`;
          pathCtx.lineWidth = 2;
          pathCtx.beginPath();
          pathCtx.moveTo(sim.path[0].x, sim.path[0].y);

          for (let i = 1; i < sim.path.length; i++) {
            const alpha = i / sim.path.length; // Fade older parts of path
            pathCtx.globalAlpha = alpha * sim.opacity * 0.3;
            pathCtx.lineTo(sim.path[i].x, sim.path[i].y);
          }
          pathCtx.stroke();
          pathCtx.globalAlpha = 1;
        }
      });

      remove.forEach((id) => delete simulationRef.current[id]);

      // Update heatmap
      if (now - lastPaintTime > 1000 / HEATMAP_FPS) {
        heatmapRef.current?.setData({ max: 1, data });
        lastPaintTime = now;
      }

      heatmapRef.current?.repaint();
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    heatmapReady,
    zoneCapacities,
    debugMode,
    showPaths,
    zoneData,
    getZonePosition,
  ]);

  const hoveredZone = zoneData.find((z) => z.zoneId === hoveredZoneId);
  const hoveredPos = hoveredZone && zonePositionsById[hoveredZone.zoneId];

  const getZoneStatus = (zone) => {
    const occupancy = zone.currentGuestCount / zone.capacity;
    if (occupancy >= 0.9)
      return {
        status: "Full",
        color: "#ff4444",
        bgColor: "rgba(255, 68, 68, 0.1)",
      };
    if (occupancy >= 0.7)
      return {
        status: "Crowded",
        color: "#ff8800",
        bgColor: "rgba(255, 136, 0, 0.1)",
      };
    return {
      status: "Ok",
      color: "#44ff44",
      bgColor: "rgba(68, 255, 68, 0.1)",
    };
  };

  return (
    <div
      style={{
        position: "relative",
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        alignSelf: "center",
        marginBottom: "1rem",
      }}
    >
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
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Zone interaction areas */}
      {zoneData.map((zone) => {
        const pos = zonePositionsById[zone.zoneId];
        if (!pos) return null;
        const { color, bgColor } = getZoneStatus(zone);

        return (
          <div
            key={zone.zoneId}
            onMouseEnter={() => setHoveredZoneId(zone.zoneId)}
            onMouseLeave={() => setHoveredZoneId(null)}
            style={{
              position: "absolute",
              left: pos.x - 60,
              top: pos.y - 60,
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: bgColor,

              zIndex: 5,
              transition: "all 0.3s ease",
              transform:
                hoveredZoneId === zone.zoneId ? "scale(1.1)" : "scale(1)",
            }}
          />
        );
      })}

      {/* Enhanced tooltip */}
      {hoveredZone && hoveredPos && (
        <div
          style={{
            position: "absolute",
            top: hoveredPos.y - 140,
            left: hoveredPos.x + 80,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "12px 16px",
            borderRadius: 8,
            fontSize: 13,
            zIndex: 6,
            pointerEvents: "none",
            minWidth: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 14 }}>
            {hoveredZone.zoneName}
          </div>
          <div>👥 Current: {hoveredZone.currentGuestCount} guests</div>
          <div>🏗️ Capacity: {hoveredZone.capacity}</div>
          <div>
            📊 Occupancy:{" "}
            {(
              (hoveredZone.currentGuestCount / hoveredZone.capacity) *
              100
            ).toFixed(1)}
            %
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "4px 8px",
              borderRadius: 4,
              backgroundColor: getZoneStatus(hoveredZone).color,
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            {getZoneStatus(hoveredZone).status}
          </div>
        </div>
      )}

      {/* Enhanced controls */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 7,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={() => setDebugMode(!debugMode)}
          style={{
            background: debugMode ? "#ff4444" : "#4444ff",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {debugMode ? "🔍 Hide Guests" : "🔍 Show Guests"}
        </button>

        <button
          onClick={() => setShowStats(!showStats)}
          style={{
            background: showStats ? "#00aa44" : "#666666",
            color: "white",
            border: "none",
            padding: "8px 12px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {showStats ? "📊 Hide Stats" : "📊 Show Stats"}
        </button>
      </div>

      {/* Park statistics panel */}
      {showStats && (
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(0,0,0,0.85)",
            color: "white",
            padding: "16px",
            borderRadius: 10,
            fontSize: 12,
            zIndex: 7,
            minWidth: 200,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: 12,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            🎢 Park Overview
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            <div>
              👥 Total Guests: <strong>{parkStats.totalGuests}</strong>
            </div>
            <div>
              🏗️ Total Capacity: <strong>{parkStats.totalCapacity}</strong>
            </div>
            <div>
              📊 Avg Occupancy:{" "}
              <strong>{parkStats.averageOccupancy.toFixed(1)}%</strong>
            </div>
            <div>
              ⚠️ Crowded Zones:{" "}
              <strong>
                {parkStats.crowdedZones}/{parkStats.totalZones}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced legend */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          background: "rgba(0,0,0,0.8)",
          padding: "12px",
          borderRadius: 8,
          zIndex: 7,
          color: "white",
          fontSize: 11,
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: "bold" }}>
          🌡️ Relative Crowd Density
        </div>
        <div
          style={{
            width: 200,
            height: 20,
            background:
              "linear-gradient(to right, rgba(0,150,255,0.6), rgba(0,255,255,0.7), rgba(50,255,0,0.8), rgba(255,255,0,0.9), rgba(255,150,0,0.95), rgba(255,0,0,1))",
            border: "1px solid #ccc",
            borderRadius: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 8px",
            marginBottom: 8,
          }}
        >
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
