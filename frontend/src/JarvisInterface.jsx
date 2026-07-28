import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Send, X, MessageSquare, Cpu, Wifi, HardDrive, Laptop, Smartphone, ChevronRight } from "lucide-react";

/* ============================================================
   JARVIS RUNTIME CONNECTOR
   ------------------------------------------------------------
   The frontend never talks to Jarvis logic directly. It only
   emits typed events ("user.input", "voice.toggle") and
   listens for typed events back ("assistant.response",
   "device.updated", "jarvis.state", "activity.log").

   This mock connector simulates a runtime so the interface is
   fully testable today. Swap createConnector() for a real
   transport later (WebSocket, IPC, HTTP stream) — nothing
   above this layer needs to change.
   ============================================================ */

function createConnector(onEvent) {
  const ws = new WebSocket("ws://localhost:8787");

  ws.onclose = () => {
    onEvent({ type: "connection.state", connected: false });
  };

  ws.onerror = () => {
    onEvent({ type: "connection.state", connected: false });
  };

  ws.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data);
      onEvent(event);
    } catch {
      // ignore malformed messages
    }
  };

  return {
    send(event) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
      } else {
        onEvent({
          type: "activity.log",
          message: "Not connected to runtime — command not sent"
        });
      }
    },
  };
}

/* ============================================================
   JARVIS CORE — isolated visual component.
   Replace this later with the particle-based spatial engine.
   Contract: <JarvisVisualEngine state="idle|listening|thinking" />
   ============================================================ */

function JarvisVisualEngine({ state }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;
    const baseRadius = size * 0.16;

    const palette = {
      idle: { core: "#4fd8ff", ring: "#2f8fff", glow: "rgba(47,143,255,0.35)", sweep: "rgba(124,212,255,0.55)" },
      listening: { core: "#7cd4ff", ring: "#4fd8ff", glow: "rgba(124,212,255,0.45)", sweep: "rgba(124,212,255,0.75)" },
      thinking: { core: "#eaf6ff", ring: "#2f8fff", glow: "rgba(47,143,255,0.6)", sweep: "rgba(47,143,255,0.9)" },
    }[state] || { core: "#4fd8ff", ring: "#2f8fff", glow: "rgba(47,143,255,0.35)", sweep: "rgba(124,212,255,0.55)" };

    const particleCount = state === "thinking" ? 16 : state === "listening" ? 11 : 8;
    const speed = state === "thinking" ? 0.03 : state === "listening" ? 0.02 : 0.011;

    function draw() {
      tRef.current += 1;
      const t = tRef.current;

      // trailing fade instead of a hard clear — gives orbits and the
      // sweep a faint comet trail rather than a flat redraw
      ctx.fillStyle = "rgba(2,6,13,0.28)";
      ctx.fillRect(0, 0, size, size);

      // outer hex frame, slow rotation
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(t * 0.0015);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const r = baseRadius * 2.6;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(47,143,255,0.22)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      // tick-mark dial ring, counter-rotating
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(-t * 0.003);
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const rInner = baseRadius * 2.15;
        const rOuter = i % 3 === 0 ? baseRadius * 2.32 : baseRadius * 2.22;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
        ctx.lineTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
        ctx.strokeStyle = "rgba(124,212,255,0.28)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // radar sweep wedge
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(t * (state === "thinking" ? 0.05 : 0.024));
      const sweepGrad = ctx.createLinearGradient(0, 0, baseRadius * 2.1, 0);
      sweepGrad.addColorStop(0, palette.sweep);
      sweepGrad.addColorStop(1, "rgba(47,143,255,0)");
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, baseRadius * 2.1, -0.26, 0.26);
      ctx.closePath();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = sweepGrad;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // breathing outer glow
      const pulse = 1 + Math.sin(t * 0.045) * (state === "thinking" ? 0.12 : 0.06);
      const grad = ctx.createRadialGradient(center, center, 0, center, center, baseRadius * 2.2 * pulse);
      grad.addColorStop(0, palette.glow);
      grad.addColorStop(1, "rgba(2,6,13,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center, center, baseRadius * 2.2 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // core sphere with off-center highlight for a lit, dimensional feel
      const coreGrad = ctx.createRadialGradient(
        center - baseRadius * 0.3,
        center - baseRadius * 0.3,
        baseRadius * 0.1,
        center,
        center,
        baseRadius * pulse
      );
      coreGrad.addColorStop(0, "#eaf6ff");
      coreGrad.addColorStop(0.45, palette.core);
      coreGrad.addColorStop(1, "#0b3a73");
      ctx.beginPath();
      ctx.arc(center, center, baseRadius * pulse, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = palette.core;
      ctx.shadowBlur = 26;
      ctx.fill();
      ctx.shadowBlur = 0;

      // orbiting telemetry particles
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + t * speed;
        const orbitR = baseRadius * (1.85 + 0.2 * Math.sin(t * 0.02 + i));
        const px = center + Math.cos(angle) * orbitR;
        const py = center + Math.sin(angle) * orbitR * 0.5;
        const psize = 1.6 + Math.sin(t * 0.05 + i) * 0.7;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(psize, 0.6), 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? "#eaf6ff" : palette.ring;
        ctx.shadowColor = palette.ring;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [state]);

  return (
    <div style={styles.coreWrap}>
      <canvas ref={canvasRef} style={styles.coreCanvas} />
      <div style={styles.coreLabel}>
        <div style={styles.coreLabelTitle}>JARVIS CORE</div>
        <div style={styles.coreLabelSub}>
          {state === "thinking" ? "Processing…" : state === "listening" ? "Listening…" : "Ready for your command."}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN INTERFACE
   ============================================================ */

function timeNow() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

export default function JarvisInterface() {
  const [jarvisState, setJarvisState] = useState("idle");
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([
    { id: 0, from: "jarvis", text: "Interface ready." },
  ]);
  const [input, setInput] = useState("");
  const [devices, setDevices] = useState([]);
  const [status, setStatus] = useState([]);
  const [activity, setActivity] = useState([
    { id: 0, time: timeNow(), message: "Interface initialized" },
  ]);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const connectorRef = useRef(null);
  const chatEndRef = useRef(null);
  const activityEndRef = useRef(null);

  // All device/status data below is populated exclusively by events
  // coming from the connector — nothing here is seeded or guessed.
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;
    return (
      voices.find((v) => v.lang.includes("GBCWMD")) ||
      voices.find((v) => v.lang.startsWith("en-GB")) ||
      voices.find((v) => v.lang === "en-GB") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0]
    );
  };

  const speak = useCallback((text) => {
    if (!("speechSynthesis" in window) || !text) return;

    const doSpeak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = doSpeak;
    } else {
      doSpeak();
    }
  }, []);

  const handleEvent = useCallback((event) => {
    if (event.type === "assistant.response") {
      // Voice output is handled server-side via Piper — see runtime/jarvis.server.js.
      // The Web Speech API speak() call was removed here to avoid two voices
      // responding at once. speak() is kept unused above in case we want a
      // browser-only fallback later (e.g. when running against a remote server).
      setMessages((m) => [...m, { id: m.length, from: "jarvis", text: event.text }]);
      setConversationOpen(true);
    }
    if (event.type === "jarvis.state") {
      setJarvisState(event.state);
    }
    if (event.type === "connection.state") {
      setConnected(event.connected);
    }
    if (event.type === "activity.log") {
      setActivity((a) => [
        ...a.slice(-40),
        { id: a.length, time: timeNow(), message: event.message, detail: event.detail },
      ]);
    }
    // Expected shape: { type: "device.updated", id, name, online }
    if (event.type === "device.updated") {
      setDevices((d) => {
        const exists = d.some((x) => x.id === event.id);
        if (exists) return d.map((x) => (x.id === event.id ? { ...x, ...event } : x));
        return [...d, { id: event.id, name: event.name, icon: event.icon || "laptop", online: event.online }];
      });
    }
    // Expected shape: { type: "status.updated", id, label, value, ok }
    if (event.type === "status.updated") {
      setStatus((s) => {
        const exists = s.some((x) => x.id === event.id);
        if (exists) return s.map((x) => (x.id === event.id ? { ...x, ...event } : x));
        return [...s, { id: event.id, label: event.label, value: event.value, ok: event.ok }];
      });
    }
  }, []);

  useEffect(() => {
    connectorRef.current = createConnector(handleEvent);
  }, [handleEvent]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, conversationOpen]);

  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activity]);

  const submit = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: m.length, from: "user", text }]);
    connectorRef.current.send({ type: "user.input", input: text });
    setInput("");
    setConversationOpen(true);
  };

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const toggleListen = async () => {
    const next = !listening;

    if (next) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        mediaRecorderRef.current = recorder;
        const recordedBlobs = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedBlobs.push(e.data);
          }
        };

        recorder.onstop = async () => {
          if (recordedBlobs.length > 0) {
            const fullBlob = new Blob(recordedBlobs, { type: "audio/webm" });
            const buffer = await fullBlob.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(buffer).reduce((str, byte) => str + String.fromCharCode(byte), "")
            );
            connectorRef.current.send({ type: "audio.chunk", data: base64 });
          }
          connectorRef.current.send({ type: "audio.end" });
          stream.getTracks().forEach((track) => track.stop());
        };

        recorder.start();
        setListening(true);
        connectorRef.current.send({ type: "voice.toggle", listening: true });
      } catch (error) {
        handleEvent({
          type: "activity.log",
          message: "Microphone access failed",
          detail: error.message
        });
        setListening(false);
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setListening(false);
      connectorRef.current.send({ type: "voice.toggle", listening: false });
    }
  };

  const onlineCount = devices.filter((d) => d.online).length;

  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #1c3a5e; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .jv-input::placeholder { color: #3f5c7d; }
        .jv-fade-in { animation: jvFadeIn 0.25s ease both; }
        @keyframes jvFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .jv-scanline {
          position: fixed; inset: 0; pointer-events: none; z-index: 30; mix-blend-mode: screen;
          background: repeating-linear-gradient(0deg, rgba(79,216,255,0.025) 0px, rgba(79,216,255,0.025) 1px, transparent 1px, transparent 3px);
        }
        .jv-scanline::after {
          content: ""; position: absolute; left: 0; right: 0; height: 120px;
          background: linear-gradient(to bottom, rgba(79,216,255,0) 0%, rgba(79,216,255,0.05) 50%, rgba(79,216,255,0) 100%);
          animation: jvSweepDown 7s linear infinite;
        }
        @keyframes jvSweepDown { from { top: -120px; } to { top: 100%; } }
        .hud-panel { position: relative; }
        .hud-corner { position: absolute; width: 10px; height: 10px; border-color: #2f8fff; opacity: 0.6; pointer-events: none; }
        .hud-corner-tl { top: -1px; left: -1px; border-top: 1.5px solid; border-left: 1.5px solid; }
        .hud-corner-tr { top: -1px; right: -1px; border-top: 1.5px solid; border-right: 1.5px solid; }
        .hud-corner-bl { bottom: -1px; left: -1px; border-bottom: 1.5px solid; border-left: 1.5px solid; }
        .hud-corner-br { bottom: -1px; right: -1px; border-bottom: 1.5px solid; border-right: 1.5px solid; }
        @media (max-width: 860px) {
          .jv-grid { grid-template-columns: 1fr !important; }
          .jv-rail { flex-direction: row !important; overflow-x: auto; }
          .jv-rail > div { min-width: 220px; }
        }
      `}</style>
      <div className="jv-scanline" />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brandRow}>
          <div style={styles.brandMark} />
          <span style={styles.brandText}>JARVIS</span>
        </div>
        <div style={styles.headerRight}>
          <div style={{ ...styles.onlinePill, ...(connected ? {} : styles.onlinePillOffline) }}>
            <span
              style={{
                ...styles.dot,
                background: connected ? "#4fd8ff" : "#3f5c7d",
                boxShadow: connected ? "0 0 6px #4fd8ff" : "none",
              }}
            />
            {connected ? "ONLINE" : "NO RUNTIME"}
          </div>
          <button style={styles.convoBtn} onClick={() => setConversationOpen((v) => !v)}>
            <MessageSquare size={15} strokeWidth={2} />
            <span>Conversation</span>
          </button>
        </div>
      </header>

      {/* Main grid */}
      <div className="jv-grid" style={styles.grid}>
        {/* Left rail */}
        <div className="jv-rail" style={styles.rail}>
          <Panel title="System Status" icon={<Cpu size={13} />}>
            {status.length === 0 ? (
              <div style={styles.emptyState}>No status reported yet</div>
            ) : (
              status.map((s) => (
                <div key={s.id} style={styles.statusRow}>
                  <span style={styles.statusLabel}>
                    <span style={{ ...styles.dot, background: s.ok ? "#4fd8ff" : "#3f5c7d" }} />
                    {s.label}
                  </span>
                  <span style={{ ...styles.statusValue, color: s.ok ? "#8fe0ff" : "#3f5c7d" }}>{s.value}</span>
                </div>
              ))
            )}
          </Panel>

          <Panel
            title="Devices"
            icon={<Wifi size={13} />}
            subtitle={devices.length ? `${onlineCount} of ${devices.length} online` : undefined}
          >
            {devices.length === 0 ? (
              <div style={styles.emptyState}>No devices reported yet</div>
            ) : (
              devices.map((d) => (
                <div key={d.id} style={styles.deviceRow}>
                  <span style={styles.statusLabel}>
                    {d.icon === "laptop" ? <Laptop size={14} color="#6f92c2" /> : <Smartphone size={14} color="#6f92c2" />}
                    {d.name}
                  </span>
                  <span style={{ ...styles.statusValue, color: d.online ? "#8fe0ff" : "#3f5c7d" }}>
                    {d.online ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>
              ))
            )}
          </Panel>
        </div>

        {/* Center */}
        <div style={styles.center}>
          <JarvisVisualEngine state={jarvisState} />

          <div style={styles.quickBar}>
            <button
              style={{ ...styles.micBtn, ...(listening ? styles.micBtnActive : {}) }}
              onClick={toggleListen}
              aria-label="Toggle voice input"
            >
              <Mic size={16} />
            </button>
            <input
              className="jv-input"
              style={styles.textInput}
              placeholder={listening ? "Listening…" : "Type a command…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button style={styles.sendBtn} onClick={submit} aria-label="Send command">
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Right rail */}
        <div className="jv-rail" style={styles.rail}>
          <Panel title="Activity" icon={<HardDrive size={13} />} grow>
            <div style={styles.activityScroll}>
              {activity.map((a) => (
                <div key={a.id} className="jv-fade-in" style={styles.activityRow}>
                  <div style={styles.activityTime}>{a.time}</div>
                  <div style={styles.activityMsg}>
                    {a.message}
                    {a.detail && <span style={styles.activityDetail}> — {a.detail}</span>}
                  </div>
                </div>
              ))}
              <div ref={activityEndRef} />
            </div>
          </Panel>
        </div>
      </div>

      {/* Conversation drawer */}
      <div style={{ ...styles.drawer, transform: conversationOpen ? "translateX(0)" : "translateX(100%)" }}>
        <div style={styles.drawerHeader}>
          <span style={styles.drawerTitle}>CONVERSATION</span>
          <button style={styles.closeBtn} onClick={() => setConversationOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <div style={styles.drawerBody}>
          {messages.map((m) => (
            <div key={m.id} className="jv-fade-in" style={{ ...styles.bubbleRow, justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ ...styles.bubble, ...(m.from === "user" ? styles.bubbleUser : styles.bubbleJarvis) }}>
                <div style={styles.bubbleLabel}>{m.from === "user" ? "You" : "Jarvis"}</div>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div style={styles.drawerInputRow}>
          <input
            className="jv-input"
            style={styles.drawerInput}
            placeholder="Type a command…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button style={styles.sendBtnSmall} onClick={submit}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, subtitle, children, grow }) {
  return (
    <div className="hud-panel" style={{ ...styles.panel, ...(grow ? { flex: 1, minHeight: 0 } : {}) }}>
      <span className="hud-corner hud-corner-tl" />
      <span className="hud-corner hud-corner-tr" />
      <span className="hud-corner hud-corner-bl" />
      <span className="hud-corner hud-corner-br" />
      <div style={styles.panelHeader}>
        {icon}
        <span style={styles.panelTitle}>{title}</span>
      </div>
      {subtitle && <div style={styles.panelSubtitle}>{subtitle}</div>}
      <div style={{ ...styles.panelBody, ...(grow ? { flex: 1, minHeight: 0 } : {}) }}>{children}</div>
    </div>
  );
}

/* ============================================================
   STYLE TOKENS
   ============================================================ */

const font = {
  display: "'Rajdhani', ui-sans-serif, system-ui, sans-serif",
  brand: "'Orbitron', ui-sans-serif, system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
};

const styles = {
  app: {
    minHeight: "100vh",
    width: "100%",
    background: `
      radial-gradient(circle at 50% -10%, rgba(47,143,255,0.14) 0%, rgba(2,4,9,0) 55%),
      repeating-linear-gradient(0deg, rgba(47,143,255,0.05) 0px, rgba(47,143,255,0.05) 1px, transparent 1px, transparent 48px),
      repeating-linear-gradient(90deg, rgba(47,143,255,0.05) 0px, rgba(47,143,255,0.05) 1px, transparent 1px, transparent 48px),
      #020409
    `,
    color: "#d9e8ff",
    fontFamily: font.display,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(47,143,255,0.16)",
    background: "rgba(4,9,18,0.5)",
    backdropFilter: "blur(10px)",
    flexShrink: 0,
    position: "relative",
    zIndex: 5,
  },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  brandMark: {
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#4fd8ff",
    boxShadow: "0 0 10px #4fd8ff, 0 0 22px rgba(47,143,255,0.6)",
  },
  brandText: {
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: "0.32em",
    fontFamily: font.brand,
    color: "#eaf6ff",
    textShadow: "0 0 14px rgba(79,216,255,0.5)",
  },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  emptyState: { fontFamily: font.mono, fontSize: 11, color: "#43597a", padding: "4px 0" },
  onlinePillOffline: { color: "#5c7699", borderColor: "rgba(47,143,255,0.12)" },
  onlinePill: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: font.mono,
    fontSize: 10,
    letterSpacing: "0.12em",
    color: "#8fe0ff",
    border: "1px solid rgba(47,143,255,0.3)",
    background: "rgba(10,22,40,0.6)",
    padding: "5px 10px",
    borderRadius: 20,
  },
  convoBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: font.display,
    fontSize: 13,
    fontWeight: 600,
    color: "#bcdcff",
    background: "rgba(10,22,40,0.6)",
    border: "1px solid rgba(47,143,255,0.28)",
    padding: "6px 14px",
    borderRadius: 20,
    cursor: "pointer",
  },
  dot: { width: 6, height: 6, borderRadius: "50%", display: "inline-block", flexShrink: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: "220px 1fr 260px",
    gap: 16,
    padding: 16,
    flex: 1,
    minHeight: 0,
    position: "relative",
    zIndex: 5,
  },
  rail: { display: "flex", flexDirection: "column", gap: 14, minHeight: 0 },
  panel: {
    background: "rgba(8,16,30,0.55)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(47,143,255,0.18)",
    borderRadius: 6,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  panelHeader: { display: "flex", alignItems: "center", gap: 7, color: "#6f92c2" },
  panelTitle: { fontFamily: font.mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" },
  panelSubtitle: { fontFamily: font.mono, fontSize: 10, color: "#43597a", marginTop: -4 },
  panelBody: { display: "flex", flexDirection: "column", gap: 7 },
  statusRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  statusLabel: { display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 500, color: "#c3d9f5" },
  statusValue: { fontFamily: font.mono, fontSize: 10, letterSpacing: "0.06em" },
  deviceRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  activityScroll: { overflowY: "auto", display: "flex", flexDirection: "column", gap: 9, maxHeight: 420 },
  activityRow: { display: "flex", flexDirection: "column", gap: 1 },
  activityTime: { fontFamily: font.mono, fontSize: 9.5, color: "#43597a" },
  activityMsg: { fontSize: 12.5, color: "#c3d9f5" },
  activityDetail: { color: "#6f92c2" },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
    gap: 26,
    position: "relative",
    zIndex: 5,
  },
  coreWrap: { position: "relative", width: "min(320px, 62vw)", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center" },
  coreCanvas: { width: "100%", height: "100%", borderRadius: "50%" },
  coreLabel: { position: "absolute", bottom: "-10%", textAlign: "center" },
  coreLabelTitle: { fontFamily: font.mono, fontSize: 11, letterSpacing: "0.3em", color: "#6f92c2" },
  coreLabelSub: { fontSize: 13.5, fontWeight: 500, color: "#c3d9f5", marginTop: 4 },
  quickBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "min(480px, 92vw)",
    background: "rgba(8,16,30,0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(47,143,255,0.28)",
    borderRadius: 24,
    padding: "6px 8px 6px 6px",
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1px solid rgba(47,143,255,0.3)",
    background: "rgba(10,22,40,0.7)",
    color: "#6f92c2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  micBtnActive: { background: "rgba(20,50,80,0.85)", borderColor: "#4fd8ff", color: "#4fd8ff", boxShadow: "0 0 12px rgba(79,216,255,0.4)" },
  textInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#eaf6ff",
    fontFamily: font.display,
    fontSize: 14.5,
    fontWeight: 500,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #4fd8ff, #2f8fff)",
    color: "#02040c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 0 14px rgba(47,143,255,0.5)",
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    height: "100%",
    width: "min(380px, 100vw)",
    background: "rgba(4,9,18,0.85)",
    backdropFilter: "blur(16px)",
    borderLeft: "1px solid rgba(47,143,255,0.2)",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.28s ease",
    zIndex: 20,
    boxShadow: "-20px 0 50px rgba(0,0,0,0.55)",
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 16px 12px",
    borderBottom: "1px solid rgba(47,143,255,0.16)",
  },
  drawerTitle: { fontFamily: font.mono, fontSize: 11, letterSpacing: "0.22em", color: "#6f92c2" },
  closeBtn: { background: "none", border: "none", color: "#6f92c2", cursor: "pointer", padding: 4 },
  drawerBody: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  bubbleRow: { display: "flex" },
  bubble: { maxWidth: "82%", padding: "9px 12px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.45 },
  bubbleUser: { background: "linear-gradient(135deg, #4fd8ff, #2f8fff)", color: "#02040c", fontWeight: 500, borderBottomRightRadius: 3 },
  bubbleJarvis: { background: "rgba(10,22,40,0.7)", color: "#dbe8ff", border: "1px solid rgba(47,143,255,0.22)", borderBottomLeftRadius: 3 },
  bubbleLabel: { fontFamily: font.mono, fontSize: 9, opacity: 0.65, marginBottom: 3, letterSpacing: "0.1em" },
  drawerInputRow: {
    display: "flex",
    gap: 8,
    padding: 14,
    borderTop: "1px solid rgba(47,143,255,0.16)",
  },
  drawerInput: {
    flex: 1,
    background: "rgba(10,22,40,0.6)",
    border: "1px solid rgba(47,143,255,0.28)",
    borderRadius: 18,
    padding: "9px 14px",
    color: "#eaf6ff",
    fontFamily: font.display,
    fontSize: 14,
    fontWeight: 500,
    outline: "none",
  },
  sendBtnSmall: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #4fd8ff, #2f8fff)",
    color: "#02040c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
    boxShadow: "0 0 14px rgba(47,143,255,0.5)",
  },
};
