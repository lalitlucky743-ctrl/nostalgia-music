import React from "react";

export default function AlbumArt({
  cover,
  title,
  isPlaying,
  isTransitioning,
}) {
  return (
    <div className="album-art-container">
      <div
        className={`album-art-inner ${
          isPlaying ? "playing" : ""
        }`}
      >
        <img
          src={cover}
          alt={title}
          className={`art-image ${
            isTransitioning ? "fade-out" : "fade-in"
          }`}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    </div>
  );
}