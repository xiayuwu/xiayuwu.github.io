const root = document.documentElement;
const themeButton = document.querySelector(".theme-toggle");
const themeMeta = document.querySelector('meta[name="theme-color"]');
const fireflyLayer = document.querySelector("[data-fireflies]");
const cursorTrailLayer = document.querySelector("[data-cursor-trail]");
const shootingStarLayer = document.querySelector("[data-shooting-stars]");
const cosmosCanvas = document.querySelector("[data-cosmos]");
const scrollProgress = document.querySelector("[data-scroll-progress]");
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

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.body.classList.add("motion-ready");

const revealElements = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7%" });

  revealElements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 80}ms`);
    revealObserver.observe(element);
  });
}

if (shootingStarLayer && !reducedMotion) {
  const launchShootingStar = () => {
    const star = document.createElement("span");
    star.className = "shooting-star";
    star.style.left = `${20 + Math.random() * 70}%`;
    star.style.top = `${5 + Math.random() * 42}%`;
    star.style.setProperty("--shoot-scale", `${0.65 + Math.random() * 0.65}`);
    shootingStarLayer.appendChild(star);
    window.setTimeout(() => star.remove(), 1700);
  };
  window.setInterval(launchShootingStar, 4200);
  window.setTimeout(launchShootingStar, 900);
}

if (!reducedMotion) {
  let scrollFrame = 0;
  window.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      const scrollY = Math.min(window.scrollY, 1800);
      root.style.setProperty("--scroll-y", `${scrollY}px`);
      root.style.setProperty("--moon-shift", `${scrollY * -0.055}px`);
      if (scrollProgress) {
        const maximum = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress.style.transform = `scaleX(${maximum > 0 ? window.scrollY / maximum : 0})`;
      }
      scrollFrame = 0;
    });
  }, { passive: true });
}

if (cosmosCanvas && !reducedMotion) {
  const context = cosmosCanvas.getContext("2d");
  const pointer = { x: -1000, y: -1000 };
  let particles = [];
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  const resizeCosmos = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    cosmosCanvas.width = width * pixelRatio;
    cosmosCanvas.height = height * pixelRatio;
    cosmosCanvas.style.width = `${width}px`;
    cosmosCanvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const count = Math.min(86, Math.max(38, Math.floor(width / 18)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      radius: 0.6 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2
    }));
  };

  const drawCosmos = (time) => {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.x = (particle.x + particle.vx + width) % width;
      particle.y = (particle.y + particle.vy + height) % height;
      const twinkle = 0.38 + Math.sin(time * 0.0018 + particle.phase) * 0.28;
      context.beginPath();
      context.fillStyle = `rgba(188, 226, 255, ${twinkle})`;
      context.shadowBlur = 10;
      context.shadowColor = "rgba(100, 205, 255, .75)";
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();

      for (let next = index + 1; next < particles.length; next += 1) {
        const target = particles[next];
        const dx = particle.x - target.x;
        const dy = particle.y - target.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 105) {
          context.beginPath();
          context.strokeStyle = `rgba(117, 177, 255, ${(1 - distance / 105) * 0.12})`;
          context.lineWidth = 0.6;
          context.moveTo(particle.x, particle.y);
          context.lineTo(target.x, target.y);
          context.stroke();
        }
      }

      const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
      if (pointerDistance < 150) {
        context.beginPath();
        context.strokeStyle = `rgba(126, 230, 255, ${(1 - pointerDistance / 150) * 0.42})`;
        context.lineWidth = 0.8;
        context.moveTo(particle.x, particle.y);
        context.lineTo(pointer.x, pointer.y);
        context.stroke();
      }
    });
    context.shadowBlur = 0;
    requestAnimationFrame(drawCosmos);
  };

  window.addEventListener("resize", resizeCosmos, { passive: true });
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }, { passive: true });
  resizeCosmos();
  requestAnimationFrame(drawCosmos);
}

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
  const collapseState = "false";
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
