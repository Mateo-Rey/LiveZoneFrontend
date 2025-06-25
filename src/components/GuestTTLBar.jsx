import { useState, useEffect } from "react";
import "../App.css";
export const GuestTTLBar = ({ duration, timeAlive }) => {
  const [progress, setProgress] = useState(
    Math.round((timeAlive / duration) * 100)
  );
 
  // Gradually fill the progress bar
  useEffect(() => {
    setProgress(100 - Math.round((timeAlive / duration) * 100));
  }, [timeAlive, duration]);

  // Generate the text color based on progress
  const getColor = (value) => {
    if (value >= 50) {
      return `rgb(0, 255, 0)`;
    } else if (value >= 30) {
      return `rgb(235, 184, 74)`;
    }
    return `rgb(247, 75, 33)`;
  };

  return (
    <>
      <p>Percent of Time Left in Park</p>
      <div className="progressbar-container">
        <div
          className="progress-bar"
          style={{
            width: `${progress}%`,
            backgroundColor: `${getColor(progress)}`,
          }}
        ></div>
        <span style={{ color: "black" }} className="label">{`${Math.round(progress)}%`}</span>
      </div>
    </>
  );
};
