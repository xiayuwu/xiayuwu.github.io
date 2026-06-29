const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const fireflyLayer = document.querySelector("[data-fireflies]");
const cursorTrailLayer = document.querySelector("[data-cursor-trail]");
const player = document.querySelector("[data-player]");

const applyTheme = (theme) => {
  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  if (themeMeta) {
    themeMeta.setAttribute("content", theme === "light" ? "#ebf5ff" : "#08111f");
  }
};

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  applyTheme(savedTheme);
} else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
  applyTheme("light");
} else {
  applyTheme("dark");
}

themeButton?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "light" ? "dark" : "light");
});

if (fireflyLayer) {
  for (let index = 0; index < 18; index += 1) {
    const firefly = document.createElement("span");
    firefly.style.left = `${Math.random() * 100}%`;
    firefly.style.top = `${Math.random() * 100}%`;
    firefly.style.setProperty("--duration", `${7 + Math.random() * 6}s`);
    firefly.style.setProperty("--shift-x", `${(Math.random() - 0.5) * 48}px`);
    firefly.style.setProperty("--shift-y", `${(Math.random() - 0.5) * 64}px`);
    fireflyLayer.appendChild(firefly);
  }
}

if (cursorTrailLayer) {
  let trailTimer = 0;

  window.addEventListener("pointermove", (event) => {
    if (trailTimer) return;
    trailTimer = window.setTimeout(() => {
      trailTimer = 0;
    }, 28);

    const star = document.createElement("span");
    star.className = "cursor-star";
    star.style.left = `${event.clientX}px`;
    star.style.top = `${event.clientY}px`;
    star.style.setProperty("--trail-x", `${(Math.random() - 0.5) * 34}px`);
    star.style.setProperty("--trail-y", `${12 + Math.random() * 28}px`);
    cursorTrailLayer.appendChild(star);
    window.setTimeout(() => star.remove(), 650);
  }, { passive: true });
}

const padTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const createSynthEngine = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  const volume = context.createGain();
  const master = context.createGain();

  volume.gain.value = 0.36;
  master.gain.value = 0;
  volume.connect(master);
  master.connect(context.destination);

  const oscillators = [
    { frequency: 196, type: "sine" },
    { frequency: 246.94, type: "triangle" },
    { frequency: 329.63, type: "sine" }
  ].map((voice) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = voice.type;
    oscillator.frequency.value = voice.frequency;
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(volume);
    oscillator.start();
    return oscillator;
  });

  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.frequency.value = 0.16;
  lfoGain.gain.value = 22;
  lfo.connect(lfoGain);
  lfoGain.connect(oscillators[0].frequency);
  lfo.start();

  return {
    async start() {
      if (context.state === "suspended") {
        await context.resume();
      }
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.5);
    },
    stop() {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.linearRampToValueAtTime(0, context.currentTime + 0.35);
    },
    setVolume(value) {
      volume.gain.value = value;
    }
  };
};

if (player) {
  const toggle = player.querySelector("[data-player-toggle]");
  const collapse = player.querySelector("[data-player-collapse]");
  const volumeInput = player.querySelector("[data-volume]");
  const icon = player.querySelector("[data-toggle-icon]");
  const progress = player.querySelector("[data-progress]");
  const current = player.querySelector("[data-current]");
  const durationLabel = player.querySelector("[data-duration-label]");
  const duration = Number(player.dataset.duration || 188);
  const audioSrc = player.dataset.audioSrc;
  const collapseState = localStorage.getItem("player-collapsed");
  let engine = null;
  let audio = null;
  let isPlaying = false;
  let startedAt = 0;
  let elapsed = 0;
  let frame = 0;
  let currentVolume = Number(localStorage.getItem("player-volume") || "0.36");

  player.classList.toggle("is-collapsed", collapseState === "true");
  durationLabel.textContent = padTime(duration);
  volumeInput.value = String(Math.round(currentVolume * 100));

  if (audioSrc) {
    audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = currentVolume;
    audio.addEventListener("timeupdate", () => {
      const time = audio.currentTime || 0;
      progress.style.width = `${(time / duration) * 100}%`;
      current.textContent = padTime(time);
    });
  } else {
    engine = createSynthEngine();
    engine?.setVolume(currentVolume);
  }

  const render = () => {
    if (!isPlaying) return;
    const now = performance.now();
    const time = audio ? audio.currentTime || 0 : ((elapsed + (now - startedAt) / 1000) % duration);
    progress.style.width = `${(time / duration) * 100}%`;
    current.textContent = padTime(time);
    frame = requestAnimationFrame(render);
  };

  const start = async () => {
    if (audio) {
      await audio.play();
    } else if (engine) {
      await engine.start();
    }

    isPlaying = true;
    startedAt = performance.now();
    player.classList.add("is-playing");
    icon.textContent = "❚❚";
    cancelAnimationFrame(frame);
    render();
  };

  const stop = () => {
    if (audio) {
      audio.pause();
    } else if (engine) {
      engine.stop();
      elapsed = (elapsed + (performance.now() - startedAt) / 1000) % duration;
    }

    isPlaying = false;
    player.classList.remove("is-playing");
    icon.textContent = "▶";
    cancelAnimationFrame(frame);
  };

  toggle?.addEventListener("click", async () => {
    if (isPlaying) {
      stop();
      return;
    }

    try {
      await start();
    } catch (error) {
      icon.textContent = "♪";
    }
  });

  collapse?.addEventListener("click", () => {
    const collapsed = !player.classList.contains("is-collapsed");
    player.classList.toggle("is-collapsed", collapsed);
    collapse.textContent = collapsed ? "+" : "−";
    localStorage.setItem("player-collapsed", String(collapsed));
  });

  if (collapseState === "true") {
    collapse.textContent = "+";
  }

  volumeInput?.addEventListener("input", (event) => {
    currentVolume = Number(event.target.value) / 100;
    localStorage.setItem("player-volume", String(currentVolume));
    if (audio) {
      audio.volume = currentVolume;
    } else if (engine) {
      engine.setVolume(currentVolume);
    }
  });
}
