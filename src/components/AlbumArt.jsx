import React from "react";

export default function AlbumArt({
  cover,
  title,
  artist,
  isPlaying,
  isLoading,
  currentTime,
  duration,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}) {
  const formatTime = (seconds) => {
    if (!seconds || !Number.isFinite(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleProgressClick = (e) => {
    if (!duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;

    onSeek(Math.max(0, Math.min(duration, percent * duration)));
  };

  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const value = (e.clientX - rect.left) / rect.width;

    onVolumeChange(Math.max(0, Math.min(1, value)));
  };

  return (
    <div className="nostalgia-poster">
      {/* Poster Image */}
      <img
        src={cover}
        alt={title}
        className="nostalgia-poster-image"
      />

      {/* Dark cinematic overlay */}
      <div className="poster-overlay" />

      {/* Poster Content */}
      <div className="poster-content">

        {/* Main Poster Heading */}
        <div className="poster-welcome">
          WELCOME TO 90'S
        </div>

        <div className="poster-radio">
          ★ NOSTALGIA RADIO ★
        </div>

        {/* Current Song */}
        <div className="poster-song-info">
          <div className="poster-song-title">
            {title}
          </div>

          <div className="poster-song-artist">
            {artist}
          </div>
        </div>

        {/* Progress */}
        <div className="poster-progress-area">

          <div className="poster-time">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div
            className="poster-progress-track"
            onClick={handleProgressClick}
          >
            <div
              className="poster-progress-fill"
              style={{ width: `${progress}%` }}
            />

            <div
              className="poster-progress-thumb"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Controls */}
        <div className="poster-controls">

          <button
            className="poster-control-btn"
            onClick={onPrev}
            aria-label="Previous song"
          >
            ⏮
          </button>

          <button
            className="poster-play-btn"
            onClick={onPlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? "•••" : isPlaying ? "Ⅱ" : "▶"}
          </button>

          <button
            className="poster-control-btn"
            onClick={onNext}
            aria-label="Next song"
          >
            ⏭
          </button>

        </div>

        {/* Volume */}
        <div className="poster-volume">

          <button
            className="poster-volume-icon"
            onClick={onToggleMute}
            aria-label="Mute"
          >
            {isMuted || volume === 0
              ? "🔇"
              : volume < 0.35
              ? "🔈"
              : volume < 0.7
              ? "🔉"
              : "🔊"}
          </button>

          <div
            className="poster-volume-track"
            onClick={handleVolumeClick}
          >
            <div
              className="poster-volume-fill"
              style={{
                width: `${isMuted ? 0 : volume * 100}%`,
              }}
            />

            <div
              className="poster-volume-thumb"
              style={{
                left: `${isMuted ? 0 : volume * 100}%`,
              }}
            />
          </div>

        </div>

        {/* Bottom Retro Text */}
        <div className="poster-bottom-text">
          SOME MEMORIES NEVER GET OLD
        </div>

      </div>
    </div>
  );
}