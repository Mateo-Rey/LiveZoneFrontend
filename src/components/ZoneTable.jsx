import React from "react";
import GuestCell from "./GuestCell";

function ZoneTable({ zone, guestData, movingGuests, selectedGuest, setSelectedGuest, handleCheckboxChange }) {
  // Group guests by their currentZoneId
  const guestsByZone = guestData.reduce((acc, guest) => {
    const zoneId = guest.currentZoneId;
    if (!acc[zoneId]) {
      acc[zoneId] = [];
    }
    acc[zoneId].push(guest);
    return acc;
  }, {});
  const guestsInZone = guestsByZone[zone.zoneId] || [];

  return (
    <div key={zone.zoneId} className="zone-card">
      <strong className="zone-header">{zone.zoneName}</strong>

      <ul className="guest-list">
        {guestsInZone.map((guest) => (
          <GuestCell key={guest.guestId} guest={guest} guestData={guestData} movingGuests={movingGuests} selectedGuest={selectedGuest} setSelectedGuest={setSelectedGuest} handleCheckboxChange={handleCheckboxChange}  />
        ))}
      </ul>
    </div>
  );
}

export default ZoneTable;
