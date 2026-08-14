import React, { useEffect, useRef, useState } from "react";
import { songs } from "../data/songs";

export default function MusicPlayer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  const playerRef = useRef(null);
  const playerDivRef = useRef(null);
  const timerRef = useRef(null);

  const currentIndexRef = useRef(0);
  const playingRef = useRef(false);
  const volumeRef = useRef(70);

  const currentSong = songs[currentIndex];

  /* ==========================================
     UPDATE TIME
  ========================================== */

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      if (!playerRef.current) return;

      try {
        const time = playerRef.current.getCurrentTime();
        const total = playerRef.current.getDuration();

        setCurrentTime(time || 0);
        setDuration(total || 0);
      } catch (error) {
        // Player may not be ready yet
      }
    }, 500);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /* ==========================================
     LOAD YOUTUBE PLAYER
  ========================================== */

  useEffect(() => {
    const createPlayer = () => {
      if (!playerDivRef.current) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player(
        playerDivRef.current,
        {
          height: "1",
          width: "1",

          videoId: songs[0].videoId,

          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1
          },

          events: {
            onReady: (event) => {
              event.target.setVolume(volumeRef.current);

              setDuration(
                event.target.getDuration() || 0
              );

              setLoading(false);
            },

            onStateChange: (event) => {
              /*
                0 = ENDED
                1 = PLAYING
                2 = PAUSED
                3 = BUFFERING
              */

              if (event.data === 1) {
                playingRef.current = true;
                setIsPlaying(true);
                setLoading(false);

                startTimer();
              }

              if (event.data === 2) {
                playingRef.current = false;
                setIsPlaying(false);
                setLoading(false);

                stopTimer();
              }

              if (event.data === 3) {
                setLoading(true);
              }

              if (event.data === 0) {
                stopTimer();

                const next =
                  (currentIndexRef.current + 1) %
                  songs.length;

                currentIndexRef.current = next;
                setCurrentIndex(next);

                setCurrentTime(0);
                setDuration(0);
                setLoading(true);

                /*
                  Automatically play next song
                */
                setTimeout(() => {
                  if (!playerRef.current) return;

                  playerRef.current.loadVideoById(
                    songs[next].videoId
                  );

                  playerRef.current.setVolume(
                    isMuted ? 0 : volumeRef.current
                  );

                  playerRef.current.playVideo();
                }, 100);
              }
            },

            onError: () => {
              setLoading(false);
              setIsPlaying(false);
              playingRef.current = false;
              stopTimer();
            }
          }
        }
      );
    };

    /*
      If API already exists
    */
    if (
      window.YT &&
      window.YT.Player
    ) {
      createPlayer();
    } else {
      /*
        Load YouTube API
      */
      const script =
        document.createElement("script");

      script.src =
        "https://www.youtube.com/iframe_api";

      script.async = true;

      document.body.appendChild(script);

      window.onYouTubeIframeAPIReady =
        createPlayer;
    }

    return () => {
      stopTimer();
    };
  }, []);

  /* ==========================================
     PLAY / PAUSE
  ========================================== */

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (playingRef.current) {
      playerRef.current.pauseVideo();

      playingRef.current = false;
      setIsPlaying(false);
    } else {
      setLoading(true);

      playerRef.current.playVideo();
    }
  };

  /* ==========================================
     CHANGE SONG
  ========================================== */

  const changeSong = (index) => {
    if (!playerRef.current) return;

    let newIndex = index;

    if (newIndex < 0) {
      newIndex = songs.length - 1;
    }

    if (newIndex >= songs.length) {
      newIndex = 0;
    }

    const shouldPlay =
      playingRef.current;

    currentIndexRef.current = newIndex;

    setCurrentIndex(newIndex);

    setCurrentTime(0);
    setDuration(0);
    setLoading(true);

    stopTimer();

    /*
      Load new YouTube video
    */
    playerRef.current.loadVideoById(
      songs[newIndex].videoId
    );

    /*
      Keep current volume
    */
    playerRef.current.setVolume(
      isMuted ? 0 : volumeRef.current
    );

    if (shouldPlay) {
      setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.playVideo();
        }
      }, 150);
    } else {
      playingRef.current = false;
      setIsPlaying(false);
    }
  };

  const previousSong = () => {
    changeSong(
      currentIndexRef.current - 1
    );
  };

  const nextSong = () => {
    changeSong(
      currentIndexRef.current + 1
    );
  };

  /* ==========================================
     SEEK
  ========================================== */

  const handleSeek = (event) => {
    if (!playerRef.current) return;
    if (!duration) return;

    const rect =
      event.currentTarget.getBoundingClientRect();

    const clickPosition =
      event.clientX - rect.left;

    const percentage =
      clickPosition / rect.width;

    const newTime =
      percentage * duration;

    playerRef.current.seekTo(
      newTime,
      true
    );

    setCurrentTime(newTime);
  };

  /* ==========================================
     VOLUME
  ========================================== */

  const handleVolume = (event) => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    let newVolume =
      ((event.clientX - rect.left) /
        rect.width) *
      100;

    newVolume = Math.max(
      0,
      Math.min(100, newVolume)
    );

    volumeRef.current = newVolume;

    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);

      if (playerRef.current) {
        playerRef.current.setVolume(0);
      }
    } else {
      setIsMuted(false);

      if (playerRef.current) {
        playerRef.current.setVolume(
          newVolume
        );
      }
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      setIsMuted(false);

      playerRef.current.setVolume(
        volumeRef.current
      );
    } else {
      setIsMuted(true);

      playerRef.current.setVolume(0);
    }
  };

  /* ==========================================
     TIME FORMAT
  ========================================== */

  const formatTime = (time) => {
    if (!time || isNaN(time)) {
      return "0:00";
    }

    const minutes =
      Math.floor(time / 60);

    const seconds =
      Math.floor(time % 60);

    return (
      minutes +
      ":" +
      seconds.toString().padStart(2, "0")
    );
  };

  /* ==========================================
     KEYBOARD
  ========================================== */

  useEffect(() => {
    const keyboard = (event) => {
      /*
        Don't trigger when typing
      */
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        previousSong();
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        nextSong();
      }
    };

    window.addEventListener(
      "keydown",
      keyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        keyboard
      );
    };
  });

  const progress =
    duration > 0
      ? (currentTime / duration) * 100
      : 0;

  const actualVolume =
    isMuted ? 0 : volume;

  return (
    <div className="music-player">

      {/* ====================================
          HIDDEN YOUTUBE PLAYER
      ==================================== */}

      <div
        ref={playerDivRef}
        className="youtube-player"
      />

      {/* ====================================
          FULL SCREEN POSTER
      ==================================== */}

      <div className="poster">

        <div className="poster-dark" />

        <div className="player-content">

          {/* TOP */}

          <div className="top-text">

            <div className="welcome">
              WELCOME TO 90'S
            </div>

            <div className="radio">
              NOSTALGIA RADIO
            </div>

          </div>


          {/* SONG INFORMATION */}

          <div className="song-info">

            <h1>
              {currentSong.title}
            </h1>

            <p>
              {currentSong.artist}
            </p>

          </div>


          {/* PROGRESS */}

          <div className="progress-container">

            <div className="time-row">

              <span>
                {formatTime(currentTime)}
              </span>

              <span>
                {formatTime(duration)}
              </span>

            </div>

            <div
              className="progress"
              onClick={handleSeek}
            >

              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`
                }}
              />

              <div
                className="progress-dot"
                style={{
                  left: `${progress}%`
                }}
              />

            </div>

          </div>


          {/* CONTROLS */}

          <div className="controls">

            <button
              onClick={previousSong}
              className="control-button"
            >
              ⏮
            </button>

            <button
              onClick={togglePlay}
              className="play-button"
            >
              {loading
                ? "..."
                : isPlaying
                ? "Ⅱ"
                : "▶"}
            </button>

            <button
              onClick={nextSong}
              className="control-button"
            >
              ⏭
            </button>

          </div>


          {/* VOLUME */}

          <div className="volume">

            <button
              className="volume-button"
              onClick={toggleMute}
            >
              {isMuted || volume === 0
                ? "🔇"
                : volume < 35
                ? "🔈"
                : volume < 70
                ? "🔉"
                : "🔊"}
            </button>

            <div
              className="volume-bar"
              onClick={handleVolume}
            >

              <div
                className="volume-fill"
                style={{
                  width: `${actualVolume}%`
                }}
              />

              <div
                className="volume-dot"
                style={{
                  left: `${actualVolume}%`
                }}
              />

            </div>

          </div>
        


          {/* FOOTER */}

          <div className="footer">
            SOME MEMORIES NEVER GET OLD.
          </div>

        </div>

      </div>

    </div>
  );
}