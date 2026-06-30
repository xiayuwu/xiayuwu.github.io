const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const applyTheme = (theme) => {
  root.dataset.theme = theme;
  localStorage.setItem("theme", theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#bcecff" : "#071536");
};

applyTheme(localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
document.querySelector(".theme-toggle")?.addEventListener("click", () => {
  root.classList.add("theme-changing");
  applyTheme(root.dataset.theme === "light" ? "dark" : "light");
  window.setTimeout(() => root.classList.remove("theme-changing"), 720);
});

document.body.classList.add("motion-ready");
const reveals = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }), { threshold: 0.1, rootMargin: "0px 0px -5%" });
  reveals.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index % 3, 2) * 80}ms`);
    observer.observe(item);
  });
}

const fireflies = document.querySelector("[data-fireflies]");
if (fireflies && !reducedMotion) {
  for (let index = 0; index < 24; index += 1) {
    const light = document.createElement("span");
    light.style.left = `${Math.random() * 100}%`;
    light.style.top = `${Math.random() * 100}%`;
    light.style.setProperty("--duration", `${7 + Math.random() * 8}s`);
    light.style.setProperty("--shift-x", `${(Math.random() - 0.5) * 80}px`);
    light.style.setProperty("--shift-y", `${(Math.random() - 0.5) * 100}px`);
    fireflies.appendChild(light);
  }
}

const petals = document.querySelector("[data-petals]");
if (petals && !reducedMotion) {
  for (let index = 0; index < 30; index += 1) {
    const petal = document.createElement("i");
    const drift = (Math.random() - 0.5) * 260;
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.setProperty("--petal-size", `${5 + Math.random() * 10}px`);
    petal.style.setProperty("--petal-delay", `${Math.random() * -18}s`);
    petal.style.setProperty("--petal-duration", `${10 + Math.random() * 14}s`);
    petal.style.setProperty("--petal-drift", `${drift}px`);
    petal.style.setProperty("--petal-drift-back", `${drift * -0.25}px`);
    petals.appendChild(petal);
  }
}

const shootingStars = document.querySelector("[data-shooting-stars]");
if (shootingStars && !reducedMotion) {
  const launch = () => {
    const star = document.createElement("span");
    star.className = "shooting-star";
    star.style.left = `${18 + Math.random() * 76}%`;
    star.style.top = `${4 + Math.random() * 48}%`;
    star.style.setProperty("--shoot-scale", `${0.6 + Math.random() * 0.8}`);
    shootingStars.appendChild(star);
    window.setTimeout(() => star.remove(), 1700);
  };
  window.setInterval(launch, 2700);
  window.setTimeout(launch, 500);
}

const trail = document.querySelector("[data-cursor-trail]");
if (trail && !reducedMotion) {
  let blocked = false;
  window.addEventListener("pointermove", (event) => {
    if (blocked) return;
    blocked = true;
    window.setTimeout(() => { blocked = false; }, 24);
    const star = document.createElement("span");
    star.className = "cursor-star";
    star.style.left = `${event.clientX}px`;
    star.style.top = `${event.clientY}px`;
    star.style.setProperty("--trail-x", `${(Math.random() - 0.5) * 42}px`);
    star.style.setProperty("--trail-y", `${12 + Math.random() * 32}px`);
    trail.appendChild(star);
    window.setTimeout(() => star.remove(), 650);
  }, { passive: true });
}

const progress = document.querySelector("[data-scroll-progress]");
let scrollFrame = 0;
window.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    const scrollY = Math.min(window.scrollY, 1800);
    root.style.setProperty("--moon-shift", `${scrollY * -0.055}px`);
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${maximum > 0 ? window.scrollY / maximum : 0})`;
    scrollFrame = 0;
  });
}, { passive: true });

const canvas = document.querySelector("[data-cosmos]");
if (canvas && !reducedMotion) {
  const context = canvas.getContext("2d");
  const pointer = { x: -1000, y: -1000 };
  let particles = [];
  let width = 0;
  let height = 0;
  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: Math.min(92, Math.max(42, Math.floor(width / 17))) }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.14, vy: (Math.random() - 0.5) * 0.14,
      radius: 0.6 + Math.random() * 1.6, phase: Math.random() * Math.PI * 2
    }));
  };
  const draw = (time) => {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      particle.x = (particle.x + particle.vx + width) % width;
      particle.y = (particle.y + particle.vy + height) % height;
      const glow = 0.4 + Math.sin(time * 0.0018 + particle.phase) * 0.28;
      context.beginPath();
      context.fillStyle = `rgba(205, 235, 255, ${glow})`;
      context.shadowBlur = 9;
      context.shadowColor = "rgba(104, 210, 255, .8)";
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
      for (let next = index + 1; next < particles.length; next += 1) {
        const target = particles[next];
        const distance = Math.hypot(particle.x - target.x, particle.y - target.y);
        if (distance < 105) {
          context.beginPath();
          context.strokeStyle = `rgba(130, 185, 255, ${(1 - distance / 105) * 0.13})`;
          context.lineWidth = 0.6;
          context.moveTo(particle.x, particle.y);
          context.lineTo(target.x, target.y);
          context.stroke();
        }
      }
      const pointerDistance = Math.hypot(particle.x - pointer.x, particle.y - pointer.y);
      if (pointerDistance < 155) {
        context.beginPath();
        context.strokeStyle = `rgba(130, 230, 255, ${(1 - pointerDistance / 155) * 0.48})`;
        context.moveTo(particle.x, particle.y);
        context.lineTo(pointer.x, pointer.y);
        context.stroke();
      }
    });
    context.shadowBlur = 0;
    requestAnimationFrame(draw);
  };
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", (event) => { pointer.x = event.clientX; pointer.y = event.clientY; }, { passive: true });
  resize();
  requestAnimationFrame(draw);
}

const padTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
const createSynth = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  const context = new AudioContextClass();
  const volume = context.createGain();
  const master = context.createGain();
  volume.gain.value = 0.36;
  master.gain.value = 0;
  volume.connect(master);
  master.connect(context.destination);
  [196, 246.94, 329.63].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 1 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.018;
    oscillator.connect(gain);
    gain.connect(volume);
    oscillator.start();
  });
  return {
    async start() { if (context.state === "suspended") await context.resume(); master.gain.linearRampToValueAtTime(0.08, context.currentTime + 0.5); },
    stop() { master.gain.linearRampToValueAtTime(0, context.currentTime + 0.35); },
    setVolume(value) { volume.gain.value = value; }
  };
};

const player = document.querySelector("[data-player]");
if (player) {
  const toggle = player.querySelector("[data-player-toggle]");
  const collapse = player.querySelector("[data-player-collapse]");
  const volume = player.querySelector("[data-volume]");
  const icon = player.querySelector("[data-toggle-icon]");
  const bar = player.querySelector("[data-progress]");
  const current = player.querySelector("[data-current]");
  const durationLabel = player.querySelector("[data-duration-label]");
  const duration = Number(player.dataset.duration || 188);
  const engine = createSynth();
  let playing = false;
  let started = 0;
  let elapsed = 0;
  let frame = 0;
  let currentVolume = Number(localStorage.getItem("player-volume") || "0.36");
  const lyricStage = document.querySelector("[data-lyric-stage]");
  const lyricBefore = document.querySelector("[data-lyric-before]");
  const lyricCurrent = document.querySelector("[data-lyric-current]");
  const lyricAfter = document.querySelector("[data-lyric-after]");
  const lyrics = [
    "夜色落在云的背面",
    "让星光替我说晚安",
    "我们在温柔里慢慢靠岸",
    "风把未说完的话吹向远方",
    "这一刻只属于夏鱼屋",
    "等下一颗流星经过窗边"
  ];
  let lyricIndex = 1;
  durationLabel.textContent = padTime(duration);
  volume.value = String(Math.round(currentVolume * 100));
  engine?.setVolume(currentVolume);
  const render = () => {
    if (!playing) return;
    const time = (elapsed + (performance.now() - started) / 1000) % duration;
    bar.style.width = `${time / duration * 100}%`;
    current.textContent = padTime(time);
    const nextLyricIndex = Math.floor(time / 7) % lyrics.length;
    if (lyricStage && nextLyricIndex !== lyricIndex) {
      lyricIndex = nextLyricIndex;
      lyricStage.classList.add("is-changing");
      window.setTimeout(() => {
        lyricBefore.textContent = lyrics[(lyricIndex - 1 + lyrics.length) % lyrics.length];
        lyricCurrent.textContent = lyrics[lyricIndex];
        lyricAfter.textContent = lyrics[(lyricIndex + 1) % lyrics.length];
        lyricStage.classList.remove("is-changing");
      }, 320);
    }
    frame = requestAnimationFrame(render);
  };
  toggle?.addEventListener("click", async () => {
    if (playing) {
      engine?.stop();
      elapsed = (elapsed + (performance.now() - started) / 1000) % duration;
      playing = false;
      player.classList.remove("is-playing");
      icon.textContent = "▶";
      cancelAnimationFrame(frame);
      return;
    }
    await engine?.start();
    playing = true;
    started = performance.now();
    player.classList.add("is-playing");
    icon.textContent = "❚❚";
    render();
  });
  collapse?.addEventListener("click", () => {
    const collapsed = !player.classList.contains("is-collapsed");
    player.classList.toggle("is-collapsed", collapsed);
    collapse.textContent = collapsed ? "+" : "−";
  });
  volume?.addEventListener("input", (event) => {
    currentVolume = Number(event.target.value) / 100;
    localStorage.setItem("player-volume", String(currentVolume));
    engine?.setVolume(currentVolume);
  });
}

const ambientVideo = document.querySelector(".vibe-video");
const vibeStage = document.querySelector("[data-vibe-stage]");
if (ambientVideo && vibeStage && "IntersectionObserver" in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) ambientVideo.play().catch(() => {});
      else ambientVideo.pause();
    });
  }, { threshold: 0.18 });
  videoObserver.observe(vibeStage);
}
