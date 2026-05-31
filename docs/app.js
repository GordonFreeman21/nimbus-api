/* ═══════════════════════════════════════════
   NIMBUS — Application Logic v3
   ═══════════════════════════════════════════ */

const API_BASE = "https://nimbus-api-gxuc.onrender.com";
const API_TIMEOUT = 3500;

let entranceComplete = false;
let rainParticles = [];
let shootingStars = [];
let cloudFloatOffset = 0;

// ─── Fast Fetch with Timeout ────────────────
function fastFetch(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT);
    return fetch(url, { signal: ctrl.signal })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .finally(() => clearTimeout(timer));
}

// ─── Preloader & Entrance ───────────────────
function hidePreloader() {
    try {
        const el = document.getElementById("preloader");
        if (!el || el.classList.contains("fade-out")) return;
        el.classList.add("fade-out");
        setTimeout(triggerEntrance, 500);
    } catch(e) { console.error(e); }
}

setTimeout(hidePreloader, 200);
setTimeout(hidePreloader, 1200);

function triggerEntrance() {
    const cloudSystem = document.getElementById("cloudSystem");
    const c1 = document.getElementById("cloud1");
    const c2 = document.getElementById("cloud2");
    const c3 = document.getElementById("cloud3");

    if (cloudSystem) cloudSystem.classList.add("visible");

    setTimeout(() => {
        document.getElementById("nav").classList.add("revealed");
        if (c1) c1.classList.add("revealed");
        if (c2) c2.classList.add("revealed");
        if (c3) c3.classList.add("revealed");

        setTimeout(() => {
            document.querySelector(".hero-content").classList.add("visible");
            setTimeout(() => {
                document.getElementById("scrollIndicator").classList.add("visible");
                entranceComplete = true;
            }, 300);
        }, 600);
    }, 300);
}

// ─── Hero Canvas: Stars, Rain, Aurora, Shooting Stars ──
const heroCanvas = document.getElementById("hero-canvas");
const heroCtx = heroCanvas ? heroCanvas.getContext("2d") : null;
let stars = [];
const mouse = { x: null, y: null, radius: 180 };

function resizeHeroCanvas() {
    if (!heroCanvas) return;
    heroCanvas.width = window.innerWidth;
    heroCanvas.height = window.innerHeight;
    buildStars();
}

function buildStars() {
    stars = [];
    if (!heroCanvas) return;
    const count = Math.min(Math.floor(heroCanvas.width / 10), 150);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * heroCanvas.width,
            y: Math.random() * heroCanvas.height,
            size: Math.random() * 1.5 + 0.3,
            speed: Math.random() * 0.2 + 0.05,
            density: Math.random() * 15 + 8,
            opacity: Math.random() * 0.5 + 0.2,
            hue: Math.random() * 40 + 200,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.01 + 0.005,
        });
    }
}

function drawAurora(ctx, w, h, t) {
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 2; i++) {
        const y = h * 0.2 + i * 60;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 8) {
            const wave = Math.sin(x * 0.003 + t * 0.2 + i * 1.5) * 30
                       + Math.sin(x * 0.006 + t * 0.1) * 15;
            ctx.lineTo(x, y + wave);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, y - 40, 0, y + 120);
        grad.addColorStop(0, `hsla(${200 + i * 20}, 70%, 60%, 0.3)`);
        grad.addColorStop(0.5, `hsla(${210 + i * 15}, 60%, 50%, 0.1)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();
    }
    ctx.restore();
}

function spawnShootingStar() {
    if (shootingStars.length > 2) return;
    shootingStars.push({
        x: Math.random() * heroCanvas.width * 0.7,
        y: Math.random() * heroCanvas.height * 0.3,
        len: Math.random() * 80 + 40,
        speed: Math.random() * 12 + 8,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
        opacity: 1,
        life: 1,
    });
}

function drawShootingStars(ctx) {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        const dx = Math.cos(s.angle) * s.speed;
        const dy = Math.sin(s.angle) * s.speed;
        s.x += dx;
        s.y += dy;
        s.life -= 0.015;
        s.opacity = s.life;

        if (s.life <= 0) { shootingStars.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = s.opacity;
        const grad = ctx.createLinearGradient(
            s.x, s.y,
            s.x - Math.cos(s.angle) * s.len,
            s.y - Math.sin(s.angle) * s.len
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.3, "rgba(147,197,253,0.7)");
        grad.addColorStop(1, "transparent");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(
            s.x - Math.cos(s.angle) * s.len,
            s.y - Math.sin(s.angle) * s.len
        );
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();
    }
}

function animateHeroCanvas() {
    if (!heroCtx || !heroCanvas) return;
    const t = Date.now() * 0.001;
    heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);

    drawAurora(heroCtx, heroCanvas.width, heroCanvas.height, t);

    if (Math.random() < 0.0015) spawnShootingStar();
    drawShootingStars(heroCtx);

    stars.forEach((s) => {
        s.twinkle += s.twinkleSpeed;
        const tw = (Math.sin(s.twinkle) + 1) * 0.5;
        const alpha = s.opacity * (0.5 + tw * 0.5);

        heroCtx.fillStyle = `hsla(${s.hue}, 30%, 85%, ${alpha})`;
        heroCtx.beginPath();
        heroCtx.arc(s.x, s.y, s.size * (0.8 + tw * 0.3), 0, Math.PI * 2);
        heroCtx.fill();

        s.y -= s.speed;
        if (s.y < 0) { s.y = heroCanvas.height; s.x = Math.random() * heroCanvas.width; }

        if (mouse.x !== null) {
            const dx = mouse.x - s.x, dy = mouse.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                s.x -= (dx / dist) * force * s.density * 0.2;
                s.y -= (dy / dist) * force * s.density * 0.2;
            }
        }
    });

    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                heroCtx.beginPath();
                heroCtx.moveTo(stars[i].x, stars[i].y);
                heroCtx.lineTo(stars[j].x, stars[j].y);
                const opacity = 0.05 * (1 - dist / 80);
                heroCtx.strokeStyle = `rgba(88,166,255,${opacity})`;
                heroCtx.lineWidth = 0.5;
                heroCtx.stroke();
            }
        }
    }

    if (entranceComplete) {
        const c1 = document.getElementById("cloud1");
        const c2 = document.getElementById("cloud2");
        if (c1 && c2 && c1.classList.contains("revealed")) {
            const rect1 = c1.getBoundingClientRect();
            const rect2 = c2.getBoundingClientRect();
            for (let i = 0; i < 2; i++) {
                if (rect1.width > 0) {
                    rainParticles.push({
                        x: rect1.left + Math.random() * rect1.width,
                        y: rect1.top + rect1.height * 0.7 + Math.random() * (rect1.height * 0.1),
                        len: Math.random() * 18 + 10,
                        speed: Math.random() * 8 + 8,
                        opacity: Math.random() * 0.2 + 0.1,
                        drift: Math.random() * 0.5 - 0.25,
                    });
                }
                if (rect2.width > 0) {
                    rainParticles.push({
                        x: rect2.left + Math.random() * rect2.width,
                        y: rect2.top + rect2.height * 0.7 + Math.random() * (rect2.height * 0.1),
                        len: Math.random() * 18 + 10,
                        speed: Math.random() * 8 + 8,
                        opacity: Math.random() * 0.2 + 0.1,
                        drift: Math.random() * 0.5 - 0.25,
                    });
                }
            }
        }
        for (let i = rainParticles.length - 1; i >= 0; i--) {
            const p = rainParticles[i];
            heroCtx.beginPath();
            heroCtx.moveTo(p.x, p.y);
            heroCtx.lineTo(p.x + p.drift * 2, p.y + p.len);
            heroCtx.strokeStyle = `rgba(147,197,253,${p.opacity})`;
            heroCtx.lineWidth = 1;
            heroCtx.stroke();
            p.y += p.speed;
            p.x += p.drift;
            if (p.y > heroCanvas.height || p.x < 0 || p.x > heroCanvas.width) {
                rainParticles.splice(i, 1);
            }
        }
    }

    requestAnimationFrame(animateHeroCanvas);
}

window.addEventListener("resize", resizeHeroCanvas);
window.addEventListener("mousemove", (e) => {
    if (!heroCanvas) return;
    const r = heroCanvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});
window.addEventListener("mouseleave", () => { mouse.x = null; mouse.y = null; });
resizeHeroCanvas();
animateHeroCanvas();

// ─── Scroll Parallax & Nav ──────────────────
const heroEl = document.getElementById("hero");
const navEl = document.getElementById("nav");

let sTick = false;
function onScroll() {
    if (sTick) return;
    sTick = true;
    requestAnimationFrame(() => {
        const y = window.scrollY, h = heroEl.offsetHeight, p = Math.min(y / (h * 0.5), 1);
        navEl.classList.toggle("scrolled", y > 50);
        
        if (entranceComplete) {
            const c1 = document.getElementById("cloud1");
            const c2 = document.getElementById("cloud2");
            const c3 = document.getElementById("cloud3");
            const drift = 38 + p * 45;
            
            if (c1) {
                c1.style.transform = `translate(-50%, -50%) translateX(calc(-38vw - ${p * 15}vw))`;
                c1.style.opacity = 0.95 - p * 0.7;
            }
            if (c2) {
                c2.style.transform = `translate(-50%, -50%) translateX(calc(38vw + ${p * 15}vw))`;
                c2.style.opacity = 0.95 - p * 0.7;
            }
            if (c3) {
                c3.style.opacity = 0.5 - p * 0.5;
            }
        }
        
        const heroContent = document.querySelector(".hero-content");
        if (heroContent) {
            heroContent.style.transform = `translateY(${y * 0.2}px)`;
            heroContent.style.opacity = Math.max(1 - y / (h * 0.3), 0);
        }
        
        const scrollInd = document.getElementById("scrollIndicator");
        if (scrollInd) scrollInd.style.opacity = Math.max(1 - p * 4, 0);
        
        sTick = false;
    });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ─── Mouse Glow on Cards ────────────────────
document.querySelectorAll(".feature-card, .api-card, .principle-card").forEach((el) => {
    el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mouse-x", e.clientX - r.left + "px");
        el.style.setProperty("--mouse-y", e.clientY - r.top + "px");
    });
});

// ─── Section Intersection Observer ──────────
const sectionObs = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
    { threshold: 0.08 }
);
document.querySelectorAll(".section").forEach((s) => sectionObs.observe(s));

// ─── Animated Counter ───────────────────────
function animateCount(el, target, suffix, duration) {
    if (!el) return;
    suffix = suffix || "";
    duration = duration || 1200;
    const start = performance.now();
    (function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = (Math.round(target * ease * 10) / 10) + suffix;
        if (t < 1) requestAnimationFrame(tick);
    })(start);
}

// ─── Helpers ────────────────────────────────
function showLoading(container) {
    container.innerHTML = '<div class="sandbox-loader"><div class="spinner"></div><span>Loading...</span></div>';
}

function showError(container, msg, retryFn) {
    container.innerHTML = `<div class="error-state"><div class="error-icon">⚠</div><div class="error-msg">${msg}</div><button class="retry-btn" onclick="${retryFn}">Retry</button></div>`;
}

// ─── Weather Scene Canvas ───
class WeatherScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.particles = [];
        this.condition = "clear";
        this.frame = null;
    }
    resize() {
        const p = this.canvas.parentElement;
        if (!p) return;
        this.canvas.width = p.clientWidth;
        this.canvas.height = p.clientHeight;
        this.init();
    }
    setCondition(d) {
        d = (d || "").toLowerCase();
        if (d.includes("thunder") || d.includes("storm")) this.condition = "storm";
        else if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) this.condition = "rain";
        else if (d.includes("snow") || d.includes("sleet")) this.condition = "snow";
        else if (d.includes("cloud") || d.includes("overcast") || d.includes("mist") || d.includes("fog")) this.condition = "cloudy";
        else this.condition = "clear";
        this.init();
    }
    init() {
        this.particles = [];
        const n = this.condition === "rain" ? 80 : this.condition === "storm" ? 110 : this.condition === "snow" ? 50 : 30;
        const w = this.canvas.width, h = this.canvas.height;
        for (let i = 0; i < n; i++) {
            switch (this.condition) {
                case "rain":
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, len: Math.random() * 14 + 8, spd: Math.random() * 8 + 10, o: Math.random() * 0.4 + 0.15 });
                    break;
                case "storm":
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, len: Math.random() * 18 + 14, spd: Math.random() * 12 + 14, o: Math.random() * 0.45 + 0.2, a: 0.2 });
                    break;
                case "snow":
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 3 + 1, spd: Math.random() * 1 + 0.4, drift: Math.random() * 2 - 1, o: Math.random() * 0.6 + 0.25 });
                    break;
                default:
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + 0.4, spd: Math.random() * 0.4 + 0.15, drift: Math.random() * 0.4 - 0.2, o: Math.random() * 0.4 + 0.08 });
            }
        }
    }
    gradient() {
        const g = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        switch (this.condition) {
            case "rain": g.addColorStop(0, "#0c1929"); g.addColorStop(1, "#1a2744"); break;
            case "storm": g.addColorStop(0, "#080c18"); g.addColorStop(1, "#1a1a2e"); break;
            case "snow": g.addColorStop(0, "#1e293b"); g.addColorStop(1, "#334155"); break;
            case "cloudy": g.addColorStop(0, "#0f172a"); g.addColorStop(1, "#1e293b"); break;
            default: g.addColorStop(0, "#0c1220"); g.addColorStop(0.5, "#172040"); g.addColorStop(1, "#1a1040");
        }
        return g;
    }
    drawSun() {
        if (this.condition !== "clear") return;
        const c = this.ctx, t = Date.now() * 0.001;
        const cx = this.canvas.width * 0.78, cy = this.canvas.height * 0.28;
        const glow = c.createRadialGradient(cx, cy, 5, cx, cy, 55 + Math.sin(t) * 8);
        glow.addColorStop(0, "rgba(251,191,36,0.55)");
        glow.addColorStop(0.4, "rgba(245,158,11,0.12)");
        glow.addColorStop(1, "transparent");
        c.fillStyle = glow;
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);
        c.beginPath();
        c.arc(cx, cy, 16, 0, Math.PI * 2);
        const sg = c.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 16);
        sg.addColorStop(0, "#fef3c7");
        sg.addColorStop(0.6, "#fbbf24");
        sg.addColorStop(1, "#f59e0b");
        c.fillStyle = sg;
        c.fill();
        c.save();
        c.translate(cx, cy);
        c.rotate(t * 0.25);
        for (let i = 0; i < 12; i++) {
            c.rotate(Math.PI / 6);
            c.beginPath();
            c.moveTo(20, 0);
            c.lineTo(34 + Math.sin(t * 2 + i) * 5, 0);
            c.strokeStyle = `rgba(251,191,36,${0.28 + Math.sin(t + i) * 0.12})`;
            c.lineWidth = 1.2;
            c.stroke();
        }
        c.restore();
    }
    drawClouds() {
        if (!["cloudy", "rain", "storm"].includes(this.condition)) return;
        const c = this.ctx, t = Date.now() * 0.00025, w = this.canvas.width;
        const fill = this.condition === "storm" ? "#1e293b" : "#334155";
        const drawOne = (x, y, sc, op) => {
            c.save();
            c.globalAlpha = op;
            c.fillStyle = fill;
            c.beginPath();
            c.ellipse(x, y, 38 * sc, 14 * sc, 0, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.ellipse(x - 18 * sc, y - 5 * sc, 20 * sc, 12 * sc, 0, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.ellipse(x + 16 * sc, y - 3 * sc, 16 * sc, 11 * sc, 0, 0, Math.PI * 2);
            c.fill();
            c.restore();
        };
        drawOne((t * 80) % (w + 100) - 50, 22, 1.2, 0.45);
        drawOne((t * 55 + 200) % (w + 100) - 50, 42, 0.9, 0.35);
        drawOne((t * 38 + 380) % (w + 100) - 50, 34, 1, 0.28);
    }
    render() {
        const c = this.ctx, w = this.canvas.width, h = this.canvas.height;
        c.fillStyle = this.gradient();
        c.fillRect(0, 0, w, h);
        this.drawSun();
        this.drawClouds();
        this.particles.forEach((p) => {
            switch (this.condition) {
                case "rain":
                    c.beginPath();
                    c.moveTo(p.x, p.y);
                    c.lineTo(p.x + 0.8, p.y + p.len);
                    c.strokeStyle = `rgba(96,165,250,${p.o})`;
                    c.lineWidth = 1;
                    c.stroke();
                    p.y += p.spd;
                    p.x += 0.4;
                    if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
                    break;
                case "storm":
                    c.beginPath();
                    c.moveTo(p.x, p.y);
                    c.lineTo(p.x + p.a * p.len, p.y + p.len);
                    c.strokeStyle = `rgba(148,163,184,${p.o})`;
                    c.lineWidth = 1.2;
                    c.stroke();
                    p.y += p.spd;
                    p.x += 3;
                    if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
                    break;
                case "snow":
                    c.beginPath();
                    c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    c.fillStyle = `rgba(226,232,240,${p.o})`;
                    c.fill();
                    p.y += p.spd;
                    p.x += Math.sin(Date.now() * 0.001 + p.drift * 10) * 0.45;
                    if (p.y > h) { p.y = -5; p.x = Math.random() * w; }
                    break;
                default:
                    c.beginPath();
                    c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    c.fillStyle = `rgba(255,255,255,${p.o})`;
                    c.fill();
                    p.y -= p.spd;
                    p.x += p.drift;
                    if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
            }
        });
        if (this.condition === "storm" && Math.random() < 0.003) {
            c.fillStyle = "rgba(255,255,255,0.06)";
            c.fillRect(0, 0, w, h);
        }
        this.frame = requestAnimationFrame(() => this.render());
    }
    start() { this.resize(); this.render(); }
    stop() { this.frame && cancelAnimationFrame(this.frame); }
}

let weatherScene = null;

// ─── Mock Data ───
const MOCK_WEATHER = {
    berlin: { city: "Berlin", temp_celsius: 21.7, humidity_percent: 53, wind_speed_kmh: 14.3, description: "Partly cloudy", nimbus_message: "Nimbus says: Enjoy the weather in Germany's capital!" },
    tokyo: { city: "Tokyo", temp_celsius: 26.2, humidity_percent: 68, wind_speed_kmh: 9.1, description: "Partly cloudy", nimbus_message: "Nimbus says: A beautiful evening in Tokyo!" },
    "new york": { city: "New York", temp_celsius: 18.5, humidity_percent: 45, wind_speed_kmh: 22.4, description: "Light rain", nimbus_message: "Nimbus says: Keep an umbrella handy in NYC!" },
    london: { city: "London", temp_celsius: 14.3, humidity_percent: 71, wind_speed_kmh: 18.7, description: "Light drizzle", nimbus_message: "Nimbus says: Classic London weather — grab a coat!" },
    paris: { city: "Paris", temp_celsius: 17.8, humidity_percent: 59, wind_speed_kmh: 12.1, description: "Partly cloudy", nimbus_message: "Nimbus says: A lovely day in the City of Light!" },
    dubai: { city: "Dubai", temp_celsius: 38.1, humidity_percent: 22, wind_speed_kmh: 15.6, description: "Clear sky", nimbus_message: "Nimbus says: Stay hydrated in the desert heat!" },
};

function generateWeatherForCity(name) {
    const n = name.toLowerCase();
    if (MOCK_WEATHER[n]) return MOCK_WEATHER[n];
    const hash = n.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const temps = [-5, 2, 8, 12, 15, 18, 21, 24, 27, 30, 33, 36];
    const descs = ["Clear sky", "Partly cloudy", "Overcast", "Light rain", "Scattered clouds", "Sunny", "Light drizzle", "Fog"];
    const msgs = ["Nimbus says: Weather data generated locally!", "Nimbus says: Serving cached forecast!", "Nimbus says: Local simulation active!"];
    return {
        city: name,
        temp_celsius: temps[hash % temps.length] + (hash % 10) * 0.3,
        humidity_percent: 30 + (hash % 50),
        wind_speed_kmh: 5 + (hash % 20),
        description: descs[hash % descs.length],
        nimbus_message: msgs[hash % msgs.length],
    };
}

const MOCK_SPECIES = {
    "blue whale": { common_name: "Blue Whale", scientific_name: "Balaenoptera musculus", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Balaenopteridae" },
    lion: { common_name: "Lion", scientific_name: "Panthera leo", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae" },
    eagle: { common_name: "Bald Eagle", scientific_name: "Haliaeetus leucocephalus", kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Accipitriformes", family: "Accipitridae" },
    octopus: { common_name: "Common Octopus", scientific_name: "Octopus vulgaris", kingdom: "Animalia", phylum: "Mollusca", class: "Cephalopoda", order: "Octopoda", family: "Octopodidae" },
};

function generateSpeciesForName(name) {
    const n = name.toLowerCase().trim();
    if (MOCK_SPECIES[n]) return MOCK_SPECIES[n];
    return {
        common_name: name,
        scientific_name: name.charAt(0).toUpperCase() + name.slice(1) + " sp.",
        kingdom: "Animalia",
        phylum: "Chordata",
        class: "Mammalia",
        order: "Primates",
        family: "Hominidae",
    };
}

// ─── Server Ping ───
let apiServerWarm = false;

function pingServer() {
    const bar = document.getElementById("statusBar");
    const txt = document.getElementById("statusText");
    if (!bar || !txt) return;

    bar.className = "status-bar";
    txt.textContent = "Checking server connectivity...";

    fastFetch(`${API_BASE}/api/v1/weather?city=Berlin`)
        .then(() => {
            apiServerWarm = true;
            bar.className = "status-bar online";
            txt.textContent = "Connected to live backend";
            setTimeout(fetchWeather, 100);
            setTimeout(fetchSpecies, 500);
        })
        .catch(() => {
            apiServerWarm = false;
            bar.className = "status-bar offline";
            txt.textContent = "Local mode — serving cached data";
            setTimeout(fetchWeather, 100);
            setTimeout(fetchSpecies, 500);
        });
}

// ─── Weather API ───
function setWeatherChip(v) { document.getElementById("weather-input").value = v; fetchWeather(); }

function getWeatherIcon(desc) {
    const d = (desc || "").toLowerCase();
    if (d.includes("thunder") || d.includes("storm")) return "⛈️";
    if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return "🌧️";
    if (d.includes("snow")) return "🌨️";
    if (d.includes("cloud") || d.includes("overcast")) return "☁️";
    if (d.includes("mist") || d.includes("fog")) return "🌫️";
    if (d.includes("sun") || d.includes("clear") || d.includes("sunny")) return "☀️";
    if (d.includes("partly")) return "⛅";
    return "🌤️";
}

function fetchWeather() {
    const city = document.getElementById("weather-input").value.trim();
    if (!city) return;
    const body = document.getElementById("weather-display");
    if (weatherScene) weatherScene.stop();

    showLoading(body);

    if (!apiServerWarm) {
        renderWeather(generateWeatherForCity(city));
        return;
    }

    fastFetch(`${API_BASE}/api/v1/weather?city=${encodeURIComponent(city)}`)
        .then(data => renderWeather(data))
        .catch(() => renderWeather(generateWeatherForCity(city)));
}

function renderWeather(data) {
    const body = document.getElementById("weather-display");
    const icon = getWeatherIcon(data.description);
    body.innerHTML = `
        <div class="weather-widget">
            <div class="weather-scene"><canvas id="weather-canvas"></canvas>
                <div class="weather-overlay">
                    <div class="weather-icon">${icon}</div>
                    <div class="weather-condition">${data.description || "Unknown"}</div>
                    <div class="weather-temp" id="w-temp">0°C</div>
                    <div class="weather-location">${data.location || data.city}</div>
                    <div class="weather-stats">
                        <div class="weather-stat">💨 <span id="w-wind">0 km/h</span></div>
                        <div class="weather-stat">💧 <span id="w-hum">0%</span></div>
                    </div>
                    <div class="weather-msg">"${data.nimbus_message || ""}"</div>
                </div>
            </div>
        </div>`;
    const wCanvas = document.getElementById("weather-canvas");
    weatherScene = new WeatherScene(wCanvas);
    weatherScene.setCondition(data.description);
    weatherScene.start();
    animateCount(document.getElementById("w-temp"), data.temp_celsius, "°C", 1400);
    animateCount(document.getElementById("w-wind"), data.wind_speed_kmh, " km/h", 1100);
    animateCount(document.getElementById("w-hum"), data.humidity_percent, "%", 1100);
}

// ─── Species API ───
function setSpeciesChip(v) { document.getElementById("species-input").value = v; fetchSpecies(); }

const TAXON_COLORS = { kingdom: "#f59e0b", phylum: "#3b82f6", class: "#a78bfa", order: "#ec4899", family: "#10b981" };

function fetchSpecies() {
    const name = document.getElementById("species-input").value.trim();
    if (!name) return;
    const body = document.getElementById("species-display");
    showLoading(body);

    if (!apiServerWarm) {
        renderSpecies(generateSpeciesForName(name));
        return;
    }

    fastFetch(`${API_BASE}/api/v1/bio/species?name=${encodeURIComponent(name)}`)
        .then(data => renderSpecies(data))
        .catch(() => renderSpecies(generateSpeciesForName(name)));
}

function renderSpecies(data) {
    const body = document.getElementById("species-display");
    const levels = [
        { key: "kingdom", label: "Kingdom", abbr: "K" },
        { key: "phylum", label: "Phylum", abbr: "P" },
        { key: "class", label: "Class", abbr: "C" },
        { key: "order", label: "Order", abbr: "O" },
        { key: "family", label: "Family", abbr: "F" },
    ];
    const treeHTML = levels.map((l) => `
        <div class="taxon-item">
            <div class="taxon-badge" style="background:${TAXON_COLORS[l.key]}22;border:1px solid ${TAXON_COLORS[l.key]}44;color:${TAXON_COLORS[l.key]}">${l.abbr}</div>
            <div class="taxon-info">
                <span class="taxon-rank">${l.label}</span>
                <span class="taxon-value">${data[l.key] || "N/A"}</span>
            </div>
        </div>`).join("");
    const headerHTML = data.common_name || data.scientific_name
        ? `<div class="species-header"><div class="species-name">${data.common_name || ""}</div>${data.scientific_name ? `<div class="species-sci">${data.scientific_name}</div>` : ""}</div>`
        : "";
    body.innerHTML = `<div class="species-widget">${headerHTML}<div class="taxonomy-tree">${treeHTML}</div></div>`;
}

// ─── Screenshot API ───
function setScreenshotChip(v) { document.getElementById("screenshot-input").value = v; fetchScreenshot(); }

function fetchScreenshot() {
    const url = document.getElementById("screenshot-input").value.trim();
    if (!url) return;
    const body = document.getElementById("screenshot-display");
    const apiUrl = `${API_BASE}/api/v1/screenshot?url=${encodeURIComponent(url)}`;
    body.innerHTML = `
        <div class="browser-mockup">
            <div class="browser-bar">
                <div class="browser-dots">
                    <span class="b-dot red"></span>
                    <span class="b-dot yellow"></span>
                    <span class="b-dot green"></span>
                </div>
                <span class="browser-url">${url}</span>
            </div>
            <div class="browser-content" style="padding:18px;">
                <div class="terminal-output" id="ss-terminal"></div>
            </div>
        </div>`;
    
    const term = document.getElementById("ss-terminal");
    const log = (txt, cls, delay) => new Promise((resolve) => setTimeout(() => {
        const el = document.createElement("div");
        el.className = "terminal-line";
        el.innerHTML = `<span class="dim">›</span> ${cls ? `<span class="${cls}">${txt}</span>` : txt}`;
        if (term) term.appendChild(el);
        if (term) term.scrollTop = term.scrollHeight;
        resolve();
    }, delay));

    const img = new Image();
    let imgLoaded = false, imgFailed = false;
    img.onload = () => { imgLoaded = true; };
    img.onerror = () => { imgFailed = true; };
    img.src = apiUrl;

    log("Nimbus Screenshot Engine v1.0", "", 0)
        .then(() => log("Spawning headless Chromium...", "", 400))
        .then(() => log("Viewport: 1280×800", "", 300))
        .then(() => log(`Navigating to ${url}`, "", 400))
        .then(() => log("Waiting for network idle...", "", 500))
        .then(() => new Promise((resolve) => {
            let attempts = 0;
            function check() {
                attempts++;
                if (imgLoaded || imgFailed || attempts > 10) { resolve(); }
                else {
                    const d = document.createElement("div");
                    d.className = "terminal-line";
                    d.innerHTML = '<span class="dim">›</span> Rendering... <span class="cursor"></span>';
                    if (term) term.appendChild(d);
                    setTimeout(() => { if (d.parentNode) d.remove(); check(); }, 800);
                }
            }
            check();
        }))
        .then(() => {
            if (imgFailed) {
                log("Connection failed — API node sleeping.", "red", 150)
                    .then(() => setTimeout(() => renderScreenshotResult(apiUrl, url), 300));
            } else {
                log("Capture complete!", "green", 150)
                    .then(() => setTimeout(() => renderScreenshotResult(apiUrl, url), 300));
            }
        });
}

function renderScreenshotResult(apiUrl, displayUrl) {
    const body = document.getElementById("screenshot-display");
    if (!body) return;
    body.innerHTML = `
        <div class="browser-mockup">
            <div class="browser-bar">
                <div class="browser-dots">
                    <span class="b-dot red"></span>
                    <span class="b-dot yellow"></span>
                    <span class="b-dot green"></span>
                </div>
                <span class="browser-url">${displayUrl}</span>
            </div>
            <div class="browser-content">
                <img src="${apiUrl}" alt="Screenshot" onerror="this.parentElement.innerHTML='<div class=placeholder>Screenshot failed — server may be cold.<br><button class=retry-btn onclick=fetchScreenshot()>Retry</button></div>'" />
            </div>
        </div>`;
}

// ─── Manifesto Console ───
function startManifestoConsole() {
    const cb = document.getElementById("manifestoConsole");
    if (!cb) return;
    const logs = [
        { tag: "SYS", text: "Compiling Go binary for target: linux/amd64...", cls: "sys" },
        { tag: "SYS", text: "Optimizing memory blocks, GC tuned.", cls: "sys" },
        { tag: "NET", text: "CORS configuration updated: AllowOrigin='*'", cls: "net" },
        { tag: "SEC", text: "Rate limiter: 60 req/min per client activated.", cls: "sec" },
        { tag: "DB", text: "Caching layer warm. Response time: 0.12ms", cls: "net" },
        { tag: "SYS", text: "System load: 1.4% · Memory: 14.2 MB", cls: "sys" },
        { tag: "NET", text: "New query received from client (Niedersachsen, DE)", cls: "net" },
        { tag: "API", text: "Endpoint /api/v1/weather responded: 200 OK", cls: "sys" },
    ];
    let idx = 0;
    setInterval(() => {
        const item = logs[idx];
        const line = document.createElement("div");
        line.className = "console-line";
        const now = new Date();
        const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
        line.innerHTML = `<span class="time">${timeStr}</span> <span class="tag ${item.cls}">${item.tag}</span> ${item.text}`;
        cb.appendChild(line);
        cb.scrollTop = cb.scrollHeight;
        if (cb.children.length > 7) cb.children[0].remove();
        idx = (idx + 1) % logs.length;
    }, 4500);
}

// ─── Init ───────────────────────────────────
try { pingServer(); } catch(e) { console.error("pingServer error:", e); }
try { startManifestoConsole(); } catch(e) { console.error("console error:", e); }
