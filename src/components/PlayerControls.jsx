import React from "react";

export default function PlayerControls({
  isPlaying,
  isLoading,
  onPlayPause,
  onPrev,
  onNext,
}) {
  return (
    <div className="player-controls">

      {/* PREVIOUS */}
      <button
        type="button"
        className="control-btn prev-btn"
        onClick={onPrev}
        disabled={isLoading}
        aria-label="Previous song"
      >
        ⏮
      </button>

      {/* PLAY / PAUSE */}
      <button
        type="button"
        className="control-btn play-btn"
        onClick={onPlayPause}
        aria-label={
          isPlaying
            ? "Pause"
            : "Play"
        }
      >
        {isLoading
          ? "⏳"
          : isPlaying
          ? "⏸"
          : "▶"}
      </button>

      {/* NEXT */}
      <button
        type="button"
        className="control-btn next-btn"
        onClick={onNext}
        disabled={isLoading}
        aria-label="Next song"
      >
        ⏭
      </button>

    </div>
  );
}