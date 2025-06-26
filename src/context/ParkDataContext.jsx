import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { safeJsonFetch } from "../utils/safeFetch";

const ParkDataContext = createContext();

export function ParkDataProvider({ children }) {
  const [zones, setZones] = useState([]);
  const [guests, setGuests] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  const intervalRef = useRef(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const fetchZones = () => {
    safeJsonFetch("http://localhost:8080/zones")
      .then(setZones)
      .catch(console.error);
  };

  const fetchGuests = () => {
    safeJsonFetch("http://localhost:8080/guests")
      .then(setGuests)
      .catch(console.error);
  };

  const fetchHotspots = () => {
    safeJsonFetch("http://localhost:8080/zones/hotspots")
      .then(setHotspots)
      .catch(console.error);
  };

  useEffect(() => {
    fetchZones();
    fetchGuests();
    fetchHotspots();
    intervalRef.current = setInterval(() => {
      fetchZones();
      fetchGuests();
      fetchHotspots();
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <ParkDataContext.Provider
      value={{
        zones,
        guests,
        hotspots,
        paused,
        setPaused,
      }}
    >
      {children}
    </ParkDataContext.Provider>
  );
}

export function useParkData() {
  const context = useContext(ParkDataContext);
  if (!context) {
    throw new Error("useParkData must be used within a ParkDataProvider");
  }
  return context;
}
