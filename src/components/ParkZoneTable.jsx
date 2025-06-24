import React, { useState } from "react";

function ParkZoneTable({ zoneData, guestData }) {
  const [selectedGuest, setSelectedGuest] = useState(null);
  const moveSelectedGuest = () => {
    fetch(`http://localhost:8080/guests/moveGuest/${selectedGuest.guestId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => console.log(data));
  };
  return (
    <>
      <button
        style={{ width: "200px", alignSelf: "center", marginBottom: "10px" }}
        onClick={moveSelectedGuest}
      >
        Move Selected Guest
      </button>
      <div className="table-container">
        {zoneData.map((zone) => {
          const guestsInZone = guestData.filter(
            (guest) => guest.currentZoneId === zone.zoneId
          );

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
                    <div className="guest-id">{guest.guestId}</div>
                    {selectedGuest?.guestId === guest.guestId && (
                      <div className="guest-info">
                        <strong>Time Alive:</strong> {guest.timeAlive}s<br />
                        <strong>Time in Zone:</strong> {guest.timeInZone}s<br />
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
