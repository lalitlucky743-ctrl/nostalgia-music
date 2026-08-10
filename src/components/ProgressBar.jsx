import React, { useCallback, useRef } from "react";

export default function ProgressBar({
  currentTime = 0,
  duration = 0,
  onSeek,
}) {
  const progressRef = useRef(null);

  const safeDuration =
    Number.isFinite(duration) && duration > 0
      ? duration
      : 0;

  const safeCurrent =
    Number.isFinite(currentTime) && currentTime >= 0
      ? Math.min(currentTime, safeDuration)
      : 0;

  const percentage =
    safeDuration > 0
      ? (safeCurrent / safeDuration) * 100
      : 0;

  const calculateTime = useCallback(
    (event) => {
      if (!progressRef.current || safeDuration <= 0) {
        return;
      }

      const rect =
        progressRef.current.getBoundingClientRect();

      let percent =
        (event.clientX - rect.left) /
        rect.width;

      percent = Math.max(
        0,
        Math.min(1, percent)
      );

      const newTime =
        percent * safeDuration;

      onSeek(newTime);
    },
    [safeDuration, onSeek]
  );

  const formatTime = (seconds) => {
    if (
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      return "0:00";
    }

    const mins = Math.floor(seconds / 60);

    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  };

  return (
    <div className="progress-section">

      <span className="time current-time">
        {formatTime(safeCurrent)}
      </span>

      <div
        ref={progressRef}
        className="progress-bar-track"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(
            event.pointerId
          );

          calculateTime(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) {
            return;
          }

          calculateTime(event);
        }}
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${percentage}%`,
          }}
        />

        <div
          className="progress-thumb"
          style={{
            left: `${percentage}%`,
          }}
        />
      </div>

      <span className="time duration">
        {formatTime(safeDuration)}
      </span>

    </div>
  );
}