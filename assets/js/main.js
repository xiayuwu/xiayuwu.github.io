const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const fireflyLayer = document.querySelector("[data-fireflies]");
const player = document.querySelector("[data-player]");

const applyTheme = (theme) => {
  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  if (themeMeta) {
    themeMeta.setAttribute("content", theme === "light" ? "#edf5ff" : "#08111f");
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

const padTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const createSynthEngine = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  const context = new AudioContextClass();
  const master = context.createGain();
  master.gain.value = 0;
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
    gain.connect(master);
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
      master.gain.linearRampToValueAtTime(0.06, context.currentTime + 0.6);
    },
    stop() {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.linearRampToValueAtTime(0, context.currentTime + 0.4);
    }
  };
};

if (player) {
  const toggle = player.querySelector("[data-player-toggle]");
  const icon = player.querySelector("[data-toggle-icon]");
  const progress = player.querySelector("[data-progress]");
  const current = player.querySelector("[data-current]");
  const durationLabel = player.querySelector("[data-duration-label]");
  const duration = Number(player.dataset.duration || 188);
  const audioSrc = player.dataset.audioSrc;
  let engine = null;
  let audio = null;
  let isPlaying = false;
  let startedAt = 0;
  let elapsed = 0;
  let frame = 0;

  durationLabel.textContent = padTime(duration);

  if (audioSrc) {
    audio = new Audio(audioSrc);
    audio.loop = true;
    audio.addEventListener("timeupdate", () => {
      const time = audio.currentTime || 0;
      progress.style.width = `${(time / duration) * 100}%`;
      current.textContent = padTime(time);
    });
  } else {
    engine = createSynthEngine();
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
}
