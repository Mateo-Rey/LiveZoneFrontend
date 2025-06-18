// Full modified ParkHeatmap component with animated fade colors for new and switching guests
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Stage, Layer, Circle, Line, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import park from "../assets/park.png";

const SHAPES = {
  "Leaning Tower": { x: 200, y: 700 },
  "Teacups": { x: 900, y: 800 },
  "Food Court": { x: 600, y: 600 },
  "Thunder Coaster": { x: 150, y: 150 },
  "Splash Zone": { x: 1200, y: 500 },
};

const ZONE_RADIUS = 70;
const GUEST_RADIUS = 6;
const ORBIT_RADIUS = 35;
const ORBIT_SPEED = 0.015;

const CANVAS_WIDTH = 1500;
const CANVAS_HEIGHT = 1000;

function getHeatColor(threshold) {
  const hue = (1 - threshold) * 240;
  return `hsl(${hue}, 100%, 50%)`;
}

function lerpColor(color1, color2, t) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function ParkHeatmap({ zoneData = [], guestData = [] }) {
  const [image] = useImage(park);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (image) {
      const imageAspect = image.width / image.height;
      const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
      let newWidth, newHeight;
      if (imageAspect > canvasAspect) {
        newHeight = CANVAS_HEIGHT;
        newWidth = newHeight * imageAspect;
      } else {
        newWidth = CANVAS_WIDTH;
        newHeight = newWidth / imageAspect;
      }
      setImageDimensions({ width: newWidth, height: newHeight });
    }
  }, [image]);

  const zoneMap = React.useMemo(() => {
    const map = {};
    zoneData.forEach((zone) => {
      const center = SHAPES[zone.zoneName];
      if (center) {
        map[zone.zoneId] = { ...zone, center };
      }
    });
    return map;
  }, [zoneData]);

  const guestSimulationRef = useRef({});
  const lastApiStateRef = useRef({});
  const animationFrameRef = useRef();
  const [, setTick] = useState(0);

  const getOrbitPosition = useCallback((center, angle, radius) => {
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    };
  }, []);

  useEffect(() => {
    const now = performance.now();
    const currentApiState = {};
    guestData.forEach((guest) => {
      currentApiState[guest.guestId] = guest.currentZoneId;
    });

    guestData.forEach((guest) => {
      const { guestId, currentZoneId } = guest;
      const lastKnownZone = lastApiStateRef.current[guestId];
      let guestSim = guestSimulationRef.current[guestId];
      const toZone = zoneMap[currentZoneId];

      if (!guestSim && toZone) {
        const angle = Math.random() * 2 * Math.PI;
        guestSimulationRef.current[guestId] = {
          guestId,
          currentZone: currentZoneId,
          position: getOrbitPosition(toZone.center, angle, ORBIT_RADIUS + Math.random() * 20),
          orbitAngle: angle,
          orbitRadius: ORBIT_RADIUS + Math.random() * 20,
          fadeIn: true,
          fadeOut: false,
          fadeInType: "new",
          opacity: 0,
          addedAt: now,
        };
      } else if (guestSim && lastKnownZone !== currentZoneId) {
        if (toZone) {
          const angle = Math.random() * 2 * Math.PI;
          guestSim.currentZone = currentZoneId;
          guestSim.position = getOrbitPosition(toZone.center, angle, ORBIT_RADIUS + Math.random() * 20);
          guestSim.orbitAngle = angle;
          guestSim.orbitRadius = ORBIT_RADIUS + Math.random() * 20;
          guestSim.fadeIn = true;
          guestSim.fadeOut = false;
          guestSim.fadeInType = "switch";
          guestSim.opacity = 0;
          guestSim.addedAt = now;
        }
      }
    });

    Object.keys(guestSimulationRef.current).forEach((guestId) => {
      if (!currentApiState[guestId]) {
        const sim = guestSimulationRef.current[guestId];
        if (sim && !sim.fadeOut) {
          sim.fadeOut = true;
          sim.removedAt = now;
        }
      }
    });

    lastApiStateRef.current = currentApiState;
  }, [guestData, zoneMap, getOrbitPosition]);

  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      let hasChanges = false;
      const toDelete = [];

      Object.values(guestSimulationRef.current).forEach((guestSim) => {
        if (guestSim.fadeIn) {
          const fadeProgress = Math.min((now - guestSim.addedAt) / 1000, 1);
          guestSim.opacity = fadeProgress;
          if (fadeProgress >= 1) guestSim.fadeIn = false;
        } else if (guestSim.fadeOut) {
          const fadeProgress = Math.min((now - guestSim.removedAt) / 1000, 1);
          guestSim.opacity = 1 - fadeProgress;
          if (fadeProgress >= 1) toDelete.push(guestSim.guestId);
        } else {
          const zoneCenter = zoneMap[guestSim.currentZone]?.center;
          if (zoneCenter) {
            guestSim.orbitAngle += ORBIT_SPEED;
            if (guestSim.orbitAngle > 2 * Math.PI)
              guestSim.orbitAngle -= 2 * Math.PI;
            guestSim.position = getOrbitPosition(zoneCenter, guestSim.orbitAngle, guestSim.orbitRadius);
          }
        }
        hasChanges = true;
      });

      toDelete.forEach((guestId) => delete guestSimulationRef.current[guestId]);
      if (hasChanges) setTick((t) => t + 1);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [zoneMap, getOrbitPosition]);

  return (
    <div style={{ width: "1500px", margin: "0 auto", overflow: "hidden", padding: " 0 0 100px 0" }}>
      <Stage width={1500} height={CANVAS_HEIGHT}>
        <Layer>
          {image && (
            <KonvaImage
              image={image}
              x={(CANVAS_WIDTH - imageDimensions.width) / 2}
              y={(CANVAS_HEIGHT - imageDimensions.height) / 2}
            />
          )}

          {zoneData.map((zone) =>
            Object.entries(zone.connectedZones || {}).map(([targetId, weight]) => {
              const fromCenter = zoneMap[zone.zoneId]?.center;
              const toCenter = zoneMap[targetId]?.center;
              if (!fromCenter || !toCenter) return null;
              return (
                <Line
                  key={`${zone.zoneId}-${targetId}`}
                  points={[fromCenter.x, fromCenter.y, toCenter.x, toCenter.y]}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth={Math.min(Math.max(weight * 3, 1), 12)}
                  opacity={0.2 + 0.5 * Math.min(weight, 1)}
                  lineCap="round"
                  shadowColor="rgba(255, 255, 255, 0.3)"
                  shadowBlur={5}
                />
              );
            })
          )}

          {zoneData.map((zone) => {
            const center = zoneMap[zone.zoneId]?.center;
            if (!center) return null;
            return (
              <Circle
                key={zone.zoneId}
                x={center.x}
                y={center.y}
                radius={ZONE_RADIUS}
                fill={getHeatColor(zone.threshold)}
                opacity={0.7}
                shadowColor={getHeatColor(zone.threshold)}
                shadowBlur={20}
                shadowOpacity={0.5}
              />
            );
          })}

          {Object.values(guestSimulationRef.current).map((guestSim) => {
            let fill = "#9900cc";
            if (guestSim.fadeIn) {
              const t = guestSim.opacity ?? 0;
              fill = lerpColor(
                guestSim.fadeInType === "switch" ? "#ffcc00" : "#00ff00",
                "#9900cc",
                t
              );
            } else if (guestSim.fadeOut) {
              const t = guestSim.opacity ?? 1;
              fill = lerpColor("#9900cc", "#000000", 1 - t);
            }

            return (
              <Circle
                key={guestSim.guestId}
                x={guestSim.position?.x || 0}
                y={guestSim.position?.y || 0}
                radius={GUEST_RADIUS}
                fill={fill}
                opacity={guestSim.opacity ?? 1}
                stroke="white"
                strokeWidth={1}
                shadowColor="black"
                shadowBlur={3}
                shadowOpacity={0.8}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
