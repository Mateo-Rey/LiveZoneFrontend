import React, { useState, useEffect } from "react";
import { GuestTTLBar } from "./GuestTTLBar";

function ParkZoneTable({ zoneData, guestData }) {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [movingGuests, setMovingGuests] = useState([]);

  // Remove guests from movingGuests if they no longer exist in guestData
  useEffect(() => {
    const currentGuestIds = new Set(guestData.map((g) => g.guestId));
    setMovingGuests((prev) => prev.filter((g) => currentGuestIds.has(g.guestId)));
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
      setMovingGuests((prev) => prev.filter((g) => g.guestId !== guest.guestId));
    }
  };

  // Group guests by their currentZoneId
  const guestsByZone = guestData.reduce((acc, guest) => {
    const zoneId = guest.currentZoneId;
    if (!acc[zoneId]) {
      acc[zoneId] = [];
    }
    acc[zoneId].push(guest);
    return acc;
  }, {});

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
        <button style={{ width: "200px" }} onClick={moveSelectedGuest} disabled={!selectedGuest}>
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
        {zoneData.map((zone) => {
          const guestsInZone = guestsByZone[zone.zoneId] || [];

          return (
            <div key={zone.zoneId} className="zone-card">
              <strong className="zone-header">{zone.zoneName}</strong>

              <ul className="guest-list">
                {guestsInZone.map((guest, index) => (
                  <li
                    key={guest.guestId}
                    tabIndex={index}
                    className={`guest-row ${
                      selectedGuest?.guestId === guest.guestId ? "selected" : ""
                    }`}
                    onClick={() => setSelectedGuest(guest)}
                  >
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        value={guest.guestId}
                        checked={movingGuests.some((g) => g.guestId === guest.guestId)}
                        onChange={(e) => handleCheckboxChange(e, guest)}
                        type="checkbox"
                      />
                      <p className="guest-id">{guest.guestId}</p>
                    </div>
                    <GuestTTLBar
                      duration={guest.timeToLive}
                      timeAlive={guest.timeAlive}
                    />
                    {selectedGuest?.guestId === guest.guestId && (
                      <div className="guest-info">
                        <strong>Time Alive:</strong> {guest.timeAlive}s
                        <br />
                        <strong>Time in Zone:</strong> {guest.timeInZone}s
                        <br />
                        <strong>TTL:</strong> {guest.timeToLive}s
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default ParkZoneTable;
