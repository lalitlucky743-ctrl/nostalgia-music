import React from "react";
import MusicPlayer from "./components/MusicPlayer";

function App() {
  return (
    <>
      {/* 90s Indian Cinema Nostalgia Background */}
      <div
        className="bg-image"
        style={{
          backgroundImage: "url('/nostalgia-india.png')",
        }}
      />

      {/* Warm background glow */}
      <div className="bg-pulse" />

      {/* Main Music Player */}
      <div className="app-wrapper">
        <MusicPlayer />
      </div>

      {/* Atmospheric Retro Text */}
      <div className="atmo-text tl">
        PRESS·PLAY
      </div>

      <div className="atmo-text tr">
        MEMORIES·ON·REPEAT
      </div>

      <div className="atmo-text bl">
        MADE·FOR·NOSTALGIA
      </div>

      <div className="atmo-text br">
        90s·RADIO
      </div>

      <div className="atmo-text mid">
        ♪ NOSTALGIA ♪
      </div>

      {/* Dark cinematic vignette */}
      <div className="vignette" />
    </>
  );
}

export default App;