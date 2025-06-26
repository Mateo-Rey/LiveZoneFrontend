import React, { useState, useEffect } from "react";
import ZoneTable from "./ZoneTable";

function ParkZoneTable({ zoneData, guestData }) {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [movingGuests, setMovingGuests] = useState([]);

  // Remove guests from movingGuests if they no longer exist in guestData
  useEffect(() => {
    const currentGuestIds = new Set(guestData.map((g) => g.guestId));
    setMovingGuests((prev) =>
      prev.filter((g) => currentGuestIds.has(g.guestId))
    );
  }, [guestData]);

  const moveSelectedGuest = () => {
    if (!selectedGuest) return;
    fetch(`http://localhost:8080/guests/moveGuest/${selectedGuest.guestId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((data) => console.log(data));
  };

  const moveMultipleGuests = () => {
    fetch(`http://localhost:8080/guests/moveMultipleGuests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movingGuests),
    })
      .then((response) => response.json())
      .then((data) => console.log(data));
  };

  const handleCheckboxChange = (event, guest) => {
    const { checked } = event.target;
    if (checked) {
      setMovingGuests((prev) => [...prev, guest]);
    } else {
      setMovingGuests((prev) =>
        prev.filter((g) => g.guestId !== guest.guestId)
      );
    }
  };

  return (
    <>
      <div
        style={{
          alignSelf: "center",
          display: "flex",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <button
          style={{ width: "200px" }}
          onClick={moveSelectedGuest}
          disabled={!selectedGuest}
        >
          Move Selected Guest
        </button>
        <button
          style={{ width: "200px" }}
          onClick={moveMultipleGuests}
          disabled={movingGuests.length === 0}
        >
          Move Multiple Guests
        </button>
      </div>
      <div className="table-container">
        {zoneData.map((zone) => (
          <ZoneTable
            zone={zone}
            guestData={guestData}
            movingGuests={movingGuests}
            selectedGuest={selectedGuest}
            setSelectedGuest={setSelectedGuest}
            handleCheckboxChange={handleCheckboxChange}
          />
        ))}
      </div>
    </>
  );
}

export default ParkZoneTable;
