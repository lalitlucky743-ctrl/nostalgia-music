import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { songs } from "../data/songs";
import AlbumArt from "./AlbumArt";
import ProgressBar from "./ProgressBar";
import PlayerControls from "./PlayerControls";

export default function MusicPlayer() {
  // =========================================================
  // STATE
  // =========================================================

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // =========================================================
  // REFS
  // =========================================================

  const playerContainerRef = useRef(null);
  const playerRef = useRef(null);

  const trackingRef = useRef(null);

  const readyRef = useRef(false);
  const playingRef = useRef(false);
  const indexRef = useRef(0);

  const changingSongRef = useRef(false);
  const mountedRef = useRef(false);

  // =========================================================
  // CURRENT SONG
  // =========================================================

  const currentSong = useMemo(() => {
    return songs[currentIndex];
  }, [currentIndex]);

  // Keep index ref updated
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  // Keep playing ref updated
  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  // =========================================================
  // STOP TRACKING
  // =========================================================

  const stopTracking = useCallback(() => {
    if (trackingRef.current) {
      clearInterval(trackingRef.current);
      trackingRef.current = null;
    }
  }, []);

  // =========================================================
  // START TRACKING
  // =========================================================

  const startTracking = useCallback(() => {
    stopTracking();

    trackingRef.current = setInterval(() => {
      const player = playerRef.current;

      if (!player || !readyRef.current) {
        return;
      }

      try {
        const current = player.getCurrentTime();
        const total = player.getDuration();

        if (Number.isFinite(current)) {
          setCurrentTime(current);
        }

        if (Number.isFinite(total) && total > 0) {
          setDuration(total);
        }
      } catch (error) {
        // Player can briefly be unavailable
      }
    }, 200);
  }, [stopTracking]);

  // =========================================================
  // SET PLAYER VOLUME
  // =========================================================

  const applyVolume = useCallback(() => {
    const player = playerRef.current;

    if (!player || !readyRef.current) {
      return;
    }

    try {
      player.setVolume(isMuted ? 0 : volume * 100);
    } catch (error) {
      console.log("Volume error:", error);
    }
  }, [volume, isMuted]);

  useEffect(() => {
    applyVolume();
  }, [applyVolume]);

  // =========================================================
  // CHANGE SONG
  // =========================================================

  const changeSong = useCallback(
    (direction) => {
      if (!songs.length) return;

      const player = playerRef.current;

      if (!player || !readyRef.current) {
        return;
      }

      // Prevent double click / double change
      if (changingSongRef.current) {
        return;
      }

      changingSongRef.current = true;

      const oldIndex = indexRef.current;

      let newIndex;

      if (direction === "next") {
        newIndex = (oldIndex + 1) % songs.length;
      } else {
        newIndex =
          (oldIndex - 1 + songs.length) %
          songs.length;
      }

      // Reset UI immediately
      setIsTransitioning(true);
      setIsLoading(true);
      setIsPlaying(false);

      playingRef.current = false;

      setCurrentTime(0);
      setDuration(0);

      stopTracking();

      try {
        // IMPORTANT:
        // loadVideoById always starts from 0
        player.loadVideoById({
          videoId: songs[newIndex].videoId,
          startSeconds: 0,
        });

        indexRef.current = newIndex;
        setCurrentIndex(newIndex);

        // Wait for YouTube
        setTimeout(() => {
          if (!mountedRef.current) return;

          const currentPlayer = playerRef.current;

          if (!currentPlayer) {
            changingSongRef.current = false;
            return;
          }

          try {
            // Force song to 0:00 and PAUSE
            currentPlayer.seekTo(0, true);
            currentPlayer.pauseVideo();

            const total = currentPlayer.getDuration();

            if (Number.isFinite(total) && total > 0) {
              setDuration(total);
            }
          } catch (error) {
            console.log("Song setup error:", error);
          }

          setCurrentTime(0);
          setIsPlaying(false);
          playingRef.current = false;

          setIsTransitioning(false);
          setIsLoading(false);

          changingSongRef.current = false;
        }, 900);
      } catch (error) {
        console.error("Change song error:", error);

        changingSongRef.current = false;
        setIsTransitioning(false);
        setIsLoading(false);
      }
    },
    [stopTracking]
  );

  // =========================================================
  // NEXT
  // =========================================================

  const handleNext = useCallback(() => {
    changeSong("next");
  }, [changeSong]);

  // =========================================================
  // PREVIOUS
  // =========================================================

  const handlePrev = useCallback(() => {
    changeSong("prev");
  }, [changeSong]);

  // =========================================================
  // PLAY / PAUSE
  // =========================================================

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;

    if (!player || !readyRef.current) {
      console.log("YouTube player not ready");
      return;
    }

    if (changingSongRef.current) {
      return;
    }

    try {
      if (playingRef.current) {
        // PAUSE
        player.pauseVideo();

        playingRef.current = false;
        setIsPlaying(false);

        stopTracking();
      } else {
        // PLAY
        setIsLoading(true);

        player.playVideo();
      }
    } catch (error) {
      console.error("Play/Pause error:", error);
      setIsLoading(false);
    }
  }, [stopTracking]);

  // =========================================================
  // SEEK
  // =========================================================

  const handleSeek = useCallback((time) => {
    const player = playerRef.current;

    if (!player || !readyRef.current) {
      return;
    }

    try {
      const safeTime = Math.max(
        0,
        Math.min(Number(time), duration || Number(time))
      );

      player.seekTo(safeTime, true);
      setCurrentTime(safeTime);
    } catch (error) {
      console.log("Seek error:", error);
    }
  }, [duration]);

  // =========================================================
  // VOLUME
  // =========================================================

  const handleVolumeChange = useCallback((value) => {
    const safeValue = Math.max(
      0,
      Math.min(1, Number(value))
    );

    setVolume(safeValue);

    if (safeValue <= 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  }, []);

  // =========================================================
  // MUTE
  // =========================================================

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => !previous);
  }, []);

  // =========================================================
  // YOUTUBE PLAYER
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    let destroyed = false;

    const createPlayer = () => {
      if (destroyed) return;

      if (!playerContainerRef.current) {
        return;
      }

      if (playerRef.current) {
        return;
      }

      if (!window.YT || !window.YT.Player) {
        return;
      }

      playerRef.current = new window.YT.Player(
        playerContainerRef.current,
        {
          width: "1",
          height: "1",

          videoId: songs[0].videoId,

          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
          },

          events: {
            // ---------------------------------------------
            // READY
            // ---------------------------------------------

            onReady: (event) => {
              if (destroyed) return;

              readyRef.current = true;

              try {
                event.target.setVolume(
                  isMuted ? 0 : volume * 100
                );

                const total =
                  event.target.getDuration();

                if (total > 0) {
                  setDuration(total);
                }
              } catch (error) {
                console.log(
                  "Initial player error:",
                  error
                );
              }

              setIsLoading(false);
            },

            // ---------------------------------------------
            // STATE CHANGE
            // ---------------------------------------------

            onStateChange: (event) => {
              if (destroyed) return;

              const state = event.data;

              // PLAYING
              if (
                state ===
                window.YT.PlayerState.PLAYING
              ) {
                if (changingSongRef.current) {
                  return;
                }

                playingRef.current = true;

                setIsPlaying(true);
                setIsLoading(false);

                startTracking();
              }

              // PAUSED
              else if (
                state ===
                window.YT.PlayerState.PAUSED
              ) {
                if (changingSongRef.current) {
                  return;
                }

                playingRef.current = false;

                setIsPlaying(false);
                setIsLoading(false);

                stopTracking();
              }

              // BUFFERING
              else if (
                state ===
                window.YT.PlayerState.BUFFERING
              ) {
                if (!changingSongRef.current) {
                  setIsLoading(true);
                }
              }

              // ENDED
              else if (
                state ===
                window.YT.PlayerState.ENDED
              ) {
                if (changingSongRef.current) {
                  return;
                }

                stopTracking();

                // Automatically move to next song
                const nextIndex =
                  (indexRef.current + 1) %
                  songs.length;

                changingSongRef.current = true;

                playingRef.current = false;

                setIsPlaying(false);
                setIsLoading(true);
                setIsTransitioning(true);

                setCurrentTime(0);
                setDuration(0);

                indexRef.current = nextIndex;
                setCurrentIndex(nextIndex);

                try {
                  playerRef.current.loadVideoById({
                    videoId:
                      songs[nextIndex].videoId,
                    startSeconds: 0,
                  });

                  // Automatically PLAY next song
                  setTimeout(() => {
                    if (destroyed) return;

                    try {
                      playerRef.current.seekTo(
                        0,
                        true
                      );

                      playerRef.current.playVideo();
                    } catch (error) {
                      console.log(
                        "Auto next error:",
                        error
                      );
                    }

                    setCurrentTime(0);
                    setIsTransitioning(false);

                    changingSongRef.current = false;
                  }, 900);
                } catch (error) {
                  console.error(
                    "Auto next error:",
                    error
                  );

                  changingSongRef.current = false;
                  setIsTransitioning(false);
                  setIsLoading(false);
                }
              }
            },

            // ---------------------------------------------
            // ERROR
            // ---------------------------------------------

            onError: (event) => {
              console.error(
                "YouTube Error:",
                event.data
              );

              playingRef.current = false;

              setIsPlaying(false);
              setIsLoading(false);

              changingSongRef.current = false;

              stopTracking();
            },
          },
        }
      );
    };

    // -----------------------------------------------------
    // LOAD YOUTUBE API
    // -----------------------------------------------------

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );

      const previousCallback =
        window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousCallback === "function") {
          previousCallback();
        }

        createPlayer();
      };

      if (!existingScript) {
        const script =
          document.createElement("script");

        script.src =
          "https://www.youtube.com/iframe_api";

        script.async = true;

        document.body.appendChild(script);
      }
    }

    // -----------------------------------------------------
    // CLEANUP
    // -----------------------------------------------------

    return () => {
      destroyed = true;
      mountedRef.current = false;

      stopTracking();

      readyRef.current = false;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.log(
            "Destroy error:",
            error
          );
        }

        playerRef.current = null;
      }
    };

    // Intentionally initialize only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // KEYBOARD CONTROLS
  // =========================================================

  useEffect(() => {
    const handleKeyboard = (event) => {
      const tag =
        event.target?.tagName?.toLowerCase();

      // Don't interfere with inputs
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select"
      ) {
        return;
      }

      // SPACE
      if (event.code === "Space") {
        event.preventDefault();
        togglePlayPause();
      }

      // RIGHT
      else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleNext();
      }

      // LEFT
      else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handlePrev();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [
    togglePlayPause,
    handleNext,
    handlePrev,
  ]);

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* =====================================================
          ONLY YOUTUBE PLAYER LIVES HERE
      ===================================================== */}

      <div
        ref={playerContainerRef}
        style={{
          position: "fixed",
          left: "-10000px",
          top: "-10000px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      />

      {/* =====================================================
          ACTUAL NOSTALGIA UI
      ===================================================== */}

      <div className="music-player">

        <header className="header">
          <h1>NOSTALGIA</h1>

          <p className="subtitle">
            9 0 s&nbsp; R A D I O
          </p>
        </header>

        <AlbumArt
          cover={currentSong.cover}
          title={currentSong.title}
          isPlaying={isPlaying}
          isTransitioning={isTransitioning}
        />

        <div className="song-info">
          <div
            className={`title ${
              isTransitioning ? "fade" : ""
            }`}
          >
            {currentSong.title}
          </div>

          <div
            className={`artist ${
              isTransitioning ? "fade" : ""
            }`}
          >
            {currentSong.artist}
          </div>
        </div>

        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
        />

        <PlayerControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlayPause={togglePlayPause}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {/* =================================================
            VOLUME
        ================================================= */}

        <div className="volume-section">

          <button
            type="button"
            className="vol-icon"
            onClick={toggleMute}
            aria-label={
              isMuted
                ? "Unmute"
                : "Mute"
            }
          >
            {isMuted || volume === 0
              ? "🔇"
              : volume < 0.3
              ? "🔈"
              : volume < 0.6
              ? "🔉"
              : "🔊"}
          </button>

          <div
            className="volume-slider-track"
            onPointerDown={(event) => {
              const track =
                event.currentTarget;

              track.setPointerCapture(
                event.pointerId
              );

              const rect =
                track.getBoundingClientRect();

              const value =
                (event.clientX - rect.left) /
                rect.width;

              handleVolumeChange(value);
            }}
            onPointerMove={(event) => {
              if (
                event.buttons !== 1
              ) {
                return;
              }

              const rect =
                event.currentTarget.getBoundingClientRect();

              const value =
                (event.clientX - rect.left) /
                rect.width;

              handleVolumeChange(value);
            }}
          >
            <div
              className="volume-slider-fill"
              style={{
                width: `${
                  isMuted
                    ? 0
                    : volume * 100
                }%`,
              }}
            />

            <div
              className="vol-thumb"
              style={{
                left: `${
                  isMuted
                    ? 0
                    : volume * 100
                }%`,
              }}
            />
          </div>
        </div>

        <div className="footer-tagline">
          Some memories never get old.
        </div>

      </div>
    </>
  );
}