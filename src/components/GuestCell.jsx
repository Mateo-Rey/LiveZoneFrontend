import React from "react";
import { GuestTTLBar } from "./GuestTTLBar";

function GuestCell({
  guest,
  index,
  movingGuests,
  selectedGuest,
  setSelectedGuest,
  handleCheckboxChange,
}) {
  return (
    <li
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
      <GuestTTLBar duration={guest.timeToLive} timeAlive={guest.timeAlive} />
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
  );
}

export default GuestCell;
