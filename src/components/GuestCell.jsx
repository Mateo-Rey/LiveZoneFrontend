import React, { useEffect } from "react";
import { GuestTTLBar } from "./GuestTTLBar";
import { Trash2 } from "lucide-react";
function GuestCell({
  guest,
  guestData,
  movingGuests,
  selectedGuest,
  setSelectedGuest,
  handleCheckboxChange,
}) {
  useEffect(() => {
    const exists = guestData.some((g) => g.guestId === selectedGuest?.guestId);
    if (!exists && selectedGuest !== null) {
      setSelectedGuest(null);
    }
  }, [guestData, selectedGuest]);
  const handleRemoveGuest = () => {
    fetch("http://localhost:8080/guests/removeGuest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guest),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => console.log(data));
  };

  return (
    <li
      className={`guest-row ${
        selectedGuest?.guestId === guest.guestId ? "selected" : ""
      }`}
      onClick={() => setSelectedGuest(guest)}
    >
      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <input
          value={guest.guestId}
          checked={movingGuests.some((g) => g.guestId === guest.guestId)}
          onChange={(e) => handleCheckboxChange(e, guest)}
          type="checkbox"
        />
        <p className="guest-id">{guest.guestId}</p>
        <div
          style={{ position: "relative", top: -10, right: 211, height: "30px" }}
        >
          <Trash2 onClick={handleRemoveGuest} />
        </div>
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
