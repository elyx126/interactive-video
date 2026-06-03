import { useState, useRef, useEffect, useCallback } from "react";

// ─── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_FLOW = {
  start: "intro",
  videos: {
    intro: {
      id: "intro",
      title: "Intro",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      choices: [
        { label: "🏔️  Abenteuer", target: "adventure" },
        { label: "🏙️  Stadt", target: "city" },
      ],
    },
    adventure: {
      id: "adventure",
      title: "Abenteuer",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      choices: [
        { label: "🔙  Zurück", target: "intro" },
        { label: "🌊  Wasser", target: "water" },
      ],
    },
    city: {
      id: "city",
      title: "Stadtleben",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      choices: [{ label: "🔙  Zurück zum Start", target: "intro" }],
    },
    water: {
      id: "water",
      title: "Wasser",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      choices: [{ label: "🏁  Nochmal von vorne", target: "intro" }],
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function InteractiveVideo() {
  const [flow] = useState(DEMO_FLOW);
  const [currentId, setCurrentId] = useState(flow.start);
  const [phase, setPhase] = useState("playing"); // playing | choices | transition
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [choiceTimer, setChoiceTimer] = useState(10);
  const videoRef = useRef(null);
  const hideTimer = useRef(null);
  const choiceInterval = useRef(null);

  const current = flow.videos[currentId];

  // auto-hide controls
  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (phase === "playing") setControlsVisible(false);
    }, 2500);
  }, [phase]);

  useEffect(() => {
    showControls();
    return () => clearTimeout(hideTimer.current);
  }, [currentId, phase, showControls]);

  // choice countdown
  useEffect(() => {
    if (phase !== "choices") {
      clearInterval(choiceInterval.current);
      return;
    }
    setChoiceTimer(10);
    choiceInterval.current = setInterval(() => {
      setChoiceTimer((t) => {
        if (t <= 1) {
          clearInterval(choiceInterval.current);
          // auto-pick first choice
          if (current.choices.length > 0) navigate(current.choices[0].target);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(choiceInterval.current);
  }, [phase, currentId]);

  const navigate = (targetId) => {
    clearInterval(choiceInterval.current);
    setPhase("transition");
    setTimeout(() => {
      setCurrentId(targetId);
      setPhase("playing");
    }, 400);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setProgress(v.currentTime);
    setDuration(v.duration);
    // show choices in last 1s
    if (v.duration - v.currentTime < 1 && phase === "playing") {
      setPhase("choices");
    }
  };

  const handleEnded = () => setPhase("choices");

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (videoRef.current) videoRef.current.currentTime = ratio * duration;
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
        padding: "24px",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          width: "100%",
          maxWidth: 860,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#ff3b30",
              boxShadow: "0 0 10px #ff3b30",
              animation: "pulse 2s infinite",
            }}
          />
          <span
            style={{
              color: "#555",
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            Interactive Video · Demo
          </span>
          <span style={{ marginLeft: "auto", color: "#333", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
            {currentId.toUpperCase()}
          </span>
        </div>

        {/* Player */}
        <div
          style={{
            position: "relative",
            background: "#000",
            borderRadius: 12,
            overflow: "hidden",
            aspectRatio: "16/9",
            cursor: "pointer",
            outline: "1px solid #1a1a1a",
          }}
          onMouseMove={showControls}
          onClick={phase === "playing" ? togglePlay : undefined}
        >
          {/* Video */}
          <video
            ref={videoRef}
            key={currentId}
            src={current.src}
            autoPlay
            muted={muted}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: phase === "transition" ? 0 : 1,
              transition: "opacity 0.4s ease",
            }}
          />

          {/* Choice overlay */}
          {phase === "choices" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: 32,
                gap: 16,
              }}
            >
              <div style={{ color: "#aaa", fontSize: 12, letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
                WAS KOMMT ALS NÄCHSTES? · {choiceTimer}s
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                {current.choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(c.target)}
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      padding: "14px 28px",
                      borderRadius: 8,
                      fontSize: 15,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      cursor: "pointer",
                      backdropFilter: "blur(12px)",
                      transition: "all 0.2s ease",
                      letterSpacing: "0.02em",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* timer bar */}
              <div style={{ width: "100%", maxWidth: 320, height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                <div
                  style={{
                    height: "100%",
                    background: "#fff",
                    borderRadius: 2,
                    width: `${(choiceTimer / 10) * 100}%`,
                    transition: "width 1s linear",
                  }}
                />
              </div>
            </div>
          )}

          {/* Controls bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
              padding: "24px 16px 14px",
              opacity: phase === "playing" && controlsVisible ? 1 : 0,
              transition: "opacity 0.3s ease",
              pointerEvents: phase === "playing" && controlsVisible ? "auto" : "none",
            }}
          >
            {/* Progress bar */}
            <div
              style={{ height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2, cursor: "pointer", marginBottom: 10 }}
              onClick={seek}
            >
              <div
                style={{
                  height: "100%",
                  background: "#fff",
                  borderRadius: 2,
                  width: duration ? `${(progress / duration) * 100}%` : "0%",
                  transition: "width 0.1s linear",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#aaa", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                {formatTime(progress)} / {formatTime(duration)}
              </span>
              <span style={{ marginLeft: "auto" }} />
              <button
                onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
                style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: 16, padding: 4 }}
              >
                {muted ? "🔇" : "🔊"}
              </button>
            </div>
          </div>
        </div>

        {/* Flow map */}
        <div
          style={{
            background: "#0d0d0d",
            border: "1px solid #1a1a1a",
            borderRadius: 10,
            padding: "16px 20px",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#444", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginRight: 4 }}>
            Flow
          </span>
          {Object.values(flow.videos).map((v) => (
            <button
              key={v.id}
              onClick={() => navigate(v.id)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: `1px solid ${v.id === currentId ? "#444" : "#1e1e1e"}`,
                background: v.id === currentId ? "#1e1e1e" : "transparent",
                color: v.id === currentId ? "#fff" : "#444",
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {v.title}
            </button>
          ))}
          <span style={{ marginLeft: "auto", color: "#2a2a2a", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
            {Object.keys(flow.videos).length} Videos
          </span>
        </div>

        {/* Embed hint */}
        <div style={{ color: "#2a2a2a", fontSize: 11, fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
          {'<iframe src="https://dein-tool.de/video/projekt-xy" />'}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
