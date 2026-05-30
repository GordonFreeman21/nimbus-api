/* ═══════════════════════════════════════════
   NIMBUS — Application Logic v2
   ═══════════════════════════════════════════ */

const API_BASE = "https://nimbus-api-gxuc.onrender.com";
const API_TIMEOUT = 3500;

let entranceComplete = false;
let isRaining = false;
let rainParticles = [];
let shootingStars = [];

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
        triggerEntrance();
    } catch(e) { console.error(e); }
}

// Run immediately — script is at bottom of body, DOM is ready
setTimeout(hidePreloader, 300);
// Absolute safety: force-hide after 2s no matter what
setTimeout(hidePreloader, 2000);

function triggerEntrance() {
    const cL = document.getElementById("cloudLeft");
    const cR = document.getElementById("cloudRight");
    cL.style.opacity = "0.95";
    cR.style.opacity = "0.95";
    isRaining = true;

    setTimeout(() => {
        const flash = document.getElementById("lightningFlash");
        const bolt = document.getElementById("lightningBolt");
        if (flash) flash.classList.add("flash");
        if (bolt) bolt.classList.add("active");

        // Camera shake
        document.getElementById("hero").style.animation = "cameraShake 0.5s ease-out";
        setTimeout(() => { document.getElementById("hero").style.animation = ""; }, 500);

        setTimeout(() => {
            document.getElementById("nav").classList.add("revealed");
            cL.classList.add("revealed");
            cR.classList.add("revealed");
            const sg = document.getElementById("sunGroup");
            if (sg) sg.classList.add("revealed");

            setTimeout(() => {
                document.getElementById("titleReveal").classList.add("visible");
                document.getElementById("scrollHint").classList.add("visible");
                entranceComplete = true;
            }, 800);
        }, 500);
    }, 700);
}

// ─── Sun Rays ───────────────────────────────
(function () {
    const r = document.getElementById("sunRays");
    if (!r) return;
    for (let i = 0; i < 18; i++) {
        const d = document.createElement("div");
        d.style.transform = "rotate(" + i * 20 + "deg)";
        r.appendChild(d);
    }
})();

// ─── Hero Canvas: Stars, Rain, Aurora, Shooting Stars ──
const starCanvas = document.getElementById("particles-canvas");
const starCtx = starCanvas ? starCanvas.getContext("2d") : null;
let stars = [];
const mouse = { x: null, y: null, radius: 160 };

function resizeStarCanvas() {
    if (!starCanvas) return;
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    buildStars();
}

function buildStars() {
    stars = [];
    if (!starCanvas) return;
    const count = Math.min(Math.floor(starCanvas.width / 10), 160);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * starCanvas.width,
            y: Math.random() * starCanvas.height,
            size: Math.random() * 1.8 + 0.3,
            speed: Math.random() * 0.4 + 0.05,
            density: Math.random() * 25 + 15,
            opacity: Math.random() * 0.7 + 0.1,
            hue: Math.random() * 60 + 200,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
        });
    }
}

function drawAurora(ctx, w, h, t) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 3; i++) {
        const y = h * 0.2 + i * 40;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= w; x += 8) {
            const wave = Math.sin(x * 0.003 + t * 0.4 + i * 1.5) * 30
                       + Math.sin(x * 0.007 + t * 0.2) * 15;
            ctx.lineTo(x, y + wave);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, y - 40, 0, y + 120);
        grad.addColorStop(0, `hsla(${160 + i * 30}, 80%, 60%, 0.4)`);
        grad.addColorStop(0.5, `hsla(${200 + i * 20}, 70%, 50%, 0.15)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fill();
    }
    ctx.restore();
}

function spawnShootingStar() {
    if (shootingStars.length > 2) return;
    shootingStars.push({
        x: Math.random() * starCanvas.width * 0.8,
        y: Math.random() * starCanvas.height * 0.4,
        len: Math.random() * 80 + 40,
        speed: Math.random() * 12 + 8,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
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
        grad.addColorStop(0, "#fff");
        grad.addColorStop(0.3, "rgba(147,197,253,0.8)");
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

        // Head glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();
    }
}

function animateHeroCanvas() {
    if (!starCtx || !starCanvas) return;
    const t = Date.now() * 0.001;
    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);

    // Aurora
    drawAurora(starCtx, starCanvas.width, starCanvas.height, t);

    // Shooting stars (random chance)
    if (Math.random() < 0.003) spawnShootingStar();
    drawShootingStars(starCtx);

    // Stars with twinkle
    stars.forEach((s) => {
        s.twinkle += s.twinkleSpeed;
        const tw = (Math.sin(s.twinkle) + 1) * 0.5;
        const alpha = s.opacity * (0.5 + tw * 0.5);
        const hue = s.hue;
        starCtx.fillStyle = `hsla(${hue}, 20%, 90%, ${alpha})`;
        starCtx.beginPath();
        starCtx.arc(s.x, s.y, s.size * (0.8 + tw * 0.4), 0, Math.PI * 2);
        starCtx.fill();

        s.y -= s.speed;
        if (s.y < 0) { s.y = starCanvas.height; s.x = Math.random() * starCanvas.width; }

        if (mouse.x !== null) {
            const dx = mouse.x - s.x, dy = mouse.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                s.x -= (dx / dist) * force * s.density * 0.3;
                s.y -= (dy / dist) * force * s.density * 0.3;
            }
        }
    });

    // Particle network: connect nearby stars
    for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 90) {
                starCtx.beginPath();
                starCtx.moveTo(stars[i].x, stars[i].y);
                starCtx.lineTo(stars[j].x, stars[j].y);
                starCtx.strokeStyle = `rgba(100,160,250,${0.06 * (1 - dist / 90)})`;
                starCtx.lineWidth = 0.5;
                starCtx.stroke();
            }
        }
    }

    // Rain
    if (isRaining) {
        const cL = document.getElementById("cloudLeft");
        const cR = document.getElementById("cloudRight");
        if (cL && cR) {
            const rectL = cL.getBoundingClientRect();
            const rectR = cR.getBoundingClientRect();
            for (let i = 0; i < 3; i++) {
                if (rectL.width > 0 && cL.style.opacity !== "0") {
                    rainParticles.push({
                        x: rectL.left + Math.random() * rectL.width,
                        y: rectL.top + rectL.height * 0.65 + Math.random() * (rectL.height * 0.15),
                        len: Math.random() * 22 + 10,
                        speed: Math.random() * 10 + 12,
                        opacity: Math.random() * 0.3 + 0.1,
                        drift: Math.random() * 0.8 - 0.4,
                    });
                }
                if (rectR.width > 0 && cR.style.opacity !== "0") {
                    rainParticles.push({
                        x: rectR.left + Math.random() * rectR.width,
                        y: rectR.top + rectR.height * 0.65 + Math.random() * (rectR.height * 0.15),
                        len: Math.random() * 22 + 10,
                        speed: Math.random() * 10 + 12,
                        opacity: Math.random() * 0.3 + 0.1,
                        drift: Math.random() * 0.8 - 0.4,
                    });
                }
            }
        }
        for (let i = rainParticles.length - 1; i >= 0; i--) {
            const p = rainParticles[i];
            starCtx.beginPath();
            starCtx.moveTo(p.x, p.y);
            starCtx.lineTo(p.x + p.drift * 3, p.y + p.len);
            starCtx.strokeStyle = `rgba(147,197,253,${p.opacity})`;
            starCtx.lineWidth = 1.2;
            starCtx.stroke();
            p.y += p.speed;
            p.x += p.drift;
            if (p.y > starCanvas.height || p.x < 0 || p.x > starCanvas.width) {
                rainParticles.splice(i, 1);
            }
        }
    }

    requestAnimationFrame(animateHeroCanvas);
}

window.addEventListener("resize", resizeStarCanvas);
window.addEventListener("mousemove", (e) => {
    if (!starCanvas) return;
    const r = starCanvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});
window.addEventListener("mouseleave", () => { mouse.x = null; mouse.y = null; });
resizeStarCanvas();
animateHeroCanvas();

// ─── Scroll Parallax & Nav ──────────────────
const cL = document.getElementById("cloudLeft"),
    cR = document.getElementById("cloudRight"),
    titleEl = document.getElementById("titleReveal"),
    hintEl = document.getElementById("scrollHint"),
    heroEl = document.getElementById("hero"),
    navEl = document.getElementById("nav");

let sTick = false;
function onScroll() {
    if (sTick) return;
    sTick = true;
    requestAnimationFrame(() => {
        const y = window.scrollY, h = heroEl.offsetHeight, p = Math.min(y / (h * 0.5), 1);
        navEl.classList.toggle("scrolled", y > 60);
        if (entranceComplete) {
            const drift = 24 + p * 38;
            cL.style.transform = `translateY(-50%) translateX(calc(-50% - ${drift}vw))`;
            cR.style.transform = `translateY(-50%) translateX(calc(-50% + ${drift}vw))`;
            cL.style.opacity = 0.95 - p * 0.65;
            cR.style.opacity = 0.95 - p * 0.65;
            isRaining = p <= 0.4;
        }
        titleEl.style.transform = `translateY(${y * 0.25}px)`;
        titleEl.style.opacity = Math.max(1 - y / (h * 0.35), 0);
        hintEl.style.opacity = Math.max(1 - p * 4, 0);
        sTick = false;
    });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ─── Mouse Glow on Cards ────────────────────
document.querySelectorAll(".glass-card, .product-panel, .codex-card").forEach((el) => {
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

// ─── Tab Switching ──────────────────────────
function switchTab(product, type) {
    const pBtn = document.getElementById(`${product}-tab-prev`);
    const cBtn = document.getElementById(`${product}-tab-code`);
    const pPane = document.getElementById(`${product}-pane-prev`);
    const cPane = document.getElementById(`${product}-pane-code`);
    if (!pBtn || !cBtn) return;
    if (type === "prev") {
        pBtn.classList.add("active"); cBtn.classList.remove("active");
        pPane.classList.add("active"); cPane.classList.remove("active");
    } else {
        cBtn.classList.add("active"); pBtn.classList.remove("active");
        cPane.classList.add("active"); pPane.classList.remove("active");
    }
}

// ─── JSON Syntax Highlighting ───────────────
function highlightJSON(obj) {
    const raw = JSON.stringify(obj, null, 4)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return raw.replace(
        /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
        (m) => {
            if (/^"/.test(m)) {
                if (/:$/.test(m)) return `<span class="json-key">${m.replace(/:$/, "")}</span>:`;
                return `<span class="json-string">${m}</span>`;
            }
            if (/true|false/.test(m)) return `<span class="json-boolean">${m}</span>`;
            if (/null/.test(m)) return `<span class="json-null">${m}</span>`;
            return `<span class="json-number">${m}</span>`;
        }
    );
}

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
    container.innerHTML = '<div class="sandbox-loader"><div class="spinner"></div><span>Loading…</span></div>';
}
function showError(container, msg, retryFn) {
    container.innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><div class="error-msg">${msg}</div><button class="retry-btn" onclick="${retryFn}">Retry</button></div>`;
}

// ═══════════════════════════════════════════
//  WEATHER SCENE — Animated Canvas
// ═══════════════════════════════════════════
class WeatherScene {
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext("2d"); this.particles = []; this.condition = "clear"; this.frame = null; }
    resize() { const p = this.canvas.parentElement; if (!p) return; this.canvas.width = p.clientWidth; this.canvas.height = p.clientHeight; this.init(); }
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
        const n = this.condition === "rain" ? 90 : this.condition === "storm" ? 120 : this.condition === "snow" ? 55 : 35;
        const w = this.canvas.width, h = this.canvas.height;
        for (let i = 0; i < n; i++) {
            switch (this.condition) {
                case "rain": this.particles.push({ x: Math.random() * w, y: Math.random() * h, len: Math.random() * 14 + 8, spd: Math.random() * 8 + 10, o: Math.random() * .4 + .15 }); break;
                case "storm": this.particles.push({ x: Math.random() * w, y: Math.random() * h, len: Math.random() * 18 + 14, spd: Math.random() * 12 + 14, o: Math.random() * .45 + .2, a: 0.2 }); break;
                case "snow": this.particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 3 + 1, spd: Math.random() * 1 + .4, drift: Math.random() * 2 - 1, o: Math.random() * .6 + .25 }); break;
                default: this.particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .4, spd: Math.random() * .4 + .15, drift: Math.random() * .4 - .2, o: Math.random() * .4 + .08 });
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
            default: g.addColorStop(0, "#0c1220"); g.addColorStop(.5, "#172040"); g.addColorStop(1, "#1a1040");
        }
        return g;
    }
    drawSun() {
        if (this.condition !== "clear") return;
        const c = this.ctx, t = Date.now() * .001;
        const cx = this.canvas.width * .78, cy = this.canvas.height * .28;
        const glow = c.createRadialGradient(cx, cy, 5, cx, cy, 55 + Math.sin(t) * 8);
        glow.addColorStop(0, "rgba(251,191,36,.55)");
        glow.addColorStop(.4, "rgba(245,158,11,.12)");
        glow.addColorStop(1, "transparent");
        c.fillStyle = glow; c.fillRect(0, 0, this.canvas.width, this.canvas.height);
        c.beginPath(); c.arc(cx, cy, 16, 0, Math.PI * 2);
        const sg = c.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 16);
        sg.addColorStop(0, "#fef3c7"); sg.addColorStop(.6, "#fbbf24"); sg.addColorStop(1, "#f59e0b");
        c.fillStyle = sg; c.fill();
        c.save(); c.translate(cx, cy); c.rotate(t * .25);
        for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(20, 0); c.lineTo(34 + Math.sin(t * 2 + i) * 5, 0); c.strokeStyle = `rgba(251,191,36,${.28 + Math.sin(t + i) * .12})`; c.lineWidth = 1.2; c.stroke(); }
        c.restore();
    }
    drawClouds() {
        if (this.condition !== "cloudy" && this.condition !== "rain" && this.condition !== "storm") return;
        const c = this.ctx, t = Date.now() * .00025, w = this.canvas.width;
        const fill = this.condition === "storm" ? "#1e293b" : "#334155";
        const drawOne = (x, y, sc, op) => { c.save(); c.globalAlpha = op; c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, 38 * sc, 14 * sc, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(x - 18 * sc, y - 5 * sc, 20 * sc, 12 * sc, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(x + 16 * sc, y - 3 * sc, 16 * sc, 11 * sc, 0, 0, Math.PI * 2); c.fill(); c.restore(); };
        drawOne((t * 80) % (w + 100) - 50, 22, 1.2, .45);
        drawOne((t * 55 + 200) % (w + 100) - 50, 42, .9, .35);
        drawOne((t * 38 + 380) % (w + 100) - 50, 34, 1, .28);
    }
    render() {
        const c = this.ctx, w = this.canvas.width, h = this.canvas.height;
        c.fillStyle = this.gradient(); c.fillRect(0, 0, w, h);
        this.drawSun(); this.drawClouds();
        this.particles.forEach((p) => {
            switch (this.condition) {
                case "rain": c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + .8, p.y + p.len); c.strokeStyle = `rgba(96,165,250,${p.o})`; c.lineWidth = 1; c.stroke(); p.y += p.spd; p.x += .4; if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; } break;
                case "storm": c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.a * p.len, p.y + p.len); c.strokeStyle = `rgba(148,163,184,${p.o})`; c.lineWidth = 1.2; c.stroke(); p.y += p.spd; p.x += 3; if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; } break;
                case "snow": c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fillStyle = `rgba(226,232,240,${p.o})`; c.fill(); p.y += p.spd; p.x += Math.sin(Date.now() * .001 + p.drift * 10) * .45; if (p.y > h) { p.y = -5; p.x = Math.random() * w; } break;
                default: c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fillStyle = `rgba(255,255,255,${p.o})`; c.fill(); p.y -= p.spd; p.x += p.drift; if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
            }
        });
        if (this.condition === "storm" && Math.random() < .003) { c.fillStyle = "rgba(255,255,255,.06)"; c.fillRect(0, 0, w, h); }
        this.frame = requestAnimationFrame(() => this.render());
    }
    start() { this.resize(); this.render(); }
    stop() { this.frame && cancelAnimationFrame(this.frame); }
}

let weatherScene = null;

// ═══════════════════════════════════════════
//  EXPANDED MOCK DATA — Works instantly
// ═══════════════════════════════════════════
const MOCK_WEATHER = {
    berlin: { city: "Berlin", temp_celsius: 21.7, humidity_percent: 53, wind_speed_kmh: 14.3, description: "Mainly clear, partly cloudy, or overcast", nimbus_message: "Nimbus says: Enjoy the weather in Germany's capital!" },
    tokyo: { city: "Tokyo", temp_celsius: 26.2, humidity_percent: 68, wind_speed_kmh: 9.1, description: "Partly cloudy", nimbus_message: "Nimbus says: A beautiful evening in Tokyo!" },
    "new york": { city: "New York", temp_celsius: 18.5, humidity_percent: 45, wind_speed_kmh: 22.4, description: "Light rain or shower", nimbus_message: "Nimbus says: Keep an umbrella handy in NYC today!" },
    sydney: { city: "Sydney", temp_celsius: 15.0, humidity_percent: 82, wind_speed_kmh: 11.2, description: "Overcast", nimbus_message: "Nimbus says: Cloudy skies over Sydney Harbour!" },
    london: { city: "London", temp_celsius: 14.3, humidity_percent: 71, wind_speed_kmh: 18.7, description: "Light drizzle", nimbus_message: "Nimbus says: Classic London weather — grab a coat!" },
    paris: { city: "Paris", temp_celsius: 17.8, humidity_percent: 59, wind_speed_kmh: 12.1, description: "Partly cloudy", nimbus_message: "Nimbus says: A lovely day in the City of Light!" },
    rome: { city: "Rome", temp_celsius: 28.4, humidity_percent: 38, wind_speed_kmh: 8.5, description: "Clear sky", nimbus_message: "Nimbus says: Sunshine in the Eternal City!" },
    moscow: { city: "Moscow", temp_celsius: 5.2, humidity_percent: 78, wind_speed_kmh: 20.3, description: "Overcast", nimbus_message: "Nimbus says: Bundled up in Moscow today!" },
    dubai: { city: "Dubai", temp_celsius: 38.1, humidity_percent: 22, wind_speed_kmh: 15.6, description: "Clear sky", nimbus_message: "Nimbus says: Stay hydrated in the desert heat!" },
    mumbai: { city: "Mumbai", temp_celsius: 31.5, humidity_percent: 84, wind_speed_kmh: 13.2, description: "Heavy rain", nimbus_message: "Nimbus says: Monsoon season in full swing!" },
    singapore: { city: "Singapore", temp_celsius: 30.8, humidity_percent: 79, wind_speed_kmh: 7.4, description: "Partly cloudy", nimbus_message: "Nimbus says: Tropical warmth in the Lion City!" },
    "los angeles": { city: "Los Angeles", temp_celsius: 24.6, humidity_percent: 35, wind_speed_kmh: 10.8, description: "Clear sky", nimbus_message: "Nimbus says: Sunshine in LA as always!" },
    toronto: { city: "Toronto", temp_celsius: 12.1, humidity_percent: 62, wind_speed_kmh: 16.9, description: "Scattered clouds", nimbus_message: "Nimbus says: A crisp day in Toronto!" },
    amsterdam: { city: "Amsterdam", temp_celsius: 13.7, humidity_percent: 74, wind_speed_kmh: 19.2, description: "Light rain", nimbus_message: "Nimbus says: Rain in Amsterdam — nothing new!" },
    bangkok: { city: "Bangkok", temp_celsius: 33.4, humidity_percent: 71, wind_speed_kmh: 6.3, description: "Thunderstorm", nimbus_message: "Nimbus says: Storm brewing in Bangkok!" },
    cairo: { city: "Cairo", temp_celsius: 35.8, humidity_percent: 18, wind_speed_kmh: 14.1, description: "Clear sky", nimbus_message: "Nimbus says: Dry heat in the land of the pharaohs!" },
    istanbul: { city: "Istanbul", temp_celsius: 19.3, humidity_percent: 65, wind_speed_kmh: 13.7, description: "Partly cloudy", nimbus_message: "Nimbus says: Bosphorus breezes today!" },
    seoul: { city: "Seoul", temp_celsius: 16.9, humidity_percent: 55, wind_speed_kmh: 11.4, description: "Clear sky", nimbus_message: "Nimbus says: Pleasant spring in Seoul!" },
    beijing: { city: "Beijing", temp_celsius: 22.3, humidity_percent: 42, wind_speed_kmh: 17.8, description: "Haze", nimbus_message: "Nimbus says: Hazy skies over the capital!" },
    madrid: { city: "Madrid", temp_celsius: 26.7, humidity_percent: 30, wind_speed_kmh: 9.9, description: "Clear sky", nimbus_message: "Nimbus says: Spanish sunshine at its finest!" },
    lisbon: { city: "Lisbon", temp_celsius: 23.1, humidity_percent: 52, wind_speed_kmh: 14.5, description: "Partly cloudy", nimbus_message: "Nimbus says: Atlantic breezes in Lisbon!" },
    vienna: { city: "Vienna", temp_celsius: 15.8, humidity_percent: 61, wind_speed_kmh: 12.3, description: "Overcast", nimbus_message: "Nimbus says: A grey day in the City of Music!" },
    prague: { city: "Prague", temp_celsius: 14.2, humidity_percent: 67, wind_speed_kmh: 13.8, description: "Scattered clouds", nimbus_message: "Nimbus says: Castle views through the clouds!" },
    warsaw: { city: "Warsaw", temp_celsius: 13.5, humidity_percent: 69, wind_speed_kmh: 15.1, description: "Light rain", nimbus_message: "Nimbus says: Rainy day in Warsaw!" },
    athens: { city: "Athens", temp_celsius: 27.9, humidity_percent: 33, wind_speed_kmh: 11.6, description: "Clear sky", nimbus_message: "Nimbus says: Mediterranean sunshine in Athens!" },
    dublin: { city: "Dublin", temp_celsius: 11.8, humidity_percent: 80, wind_speed_kmh: 21.3, description: "Light drizzle", nimbus_message: "Nimbus says: Emerald isle living up to its name!" },
    oslo: { city: "Oslo", temp_celsius: 8.4, humidity_percent: 72, wind_speed_kmh: 16.7, description: "Overcast", nimbus_message: "Nimbus says: Nordic grey in Oslo!" },
    stockholm: { city: "Stockholm", temp_celsius: 9.7, humidity_percent: 68, wind_speed_kmh: 14.2, description: "Scattered clouds", nimbus_message: "Nimbus says: Swedish skies clearing up!" },
    helsinki: { city: "Helsinki", temp_celsius: 6.3, humidity_percent: 75, wind_speed_kmh: 17.9, description: "Overcast", nimbus_message: "Nimbus says: Finnish chill in the air!" },
    "sao paulo": { city: "São Paulo", temp_celsius: 22.4, humidity_percent: 64, wind_speed_kmh: 10.1, description: "Partly cloudy", nimbus_message: "Nimbus says: Brazilian warmth in São Paulo!" },
    "buenos aires": { city: "Buenos Aires", temp_celsius: 17.6, humidity_percent: 58, wind_speed_kmh: 13.4, description: "Clear sky", nimbus_message: "Nimbus says: Pleasant evening in Buenos Aires!" },
    "rio de janeiro": { city: "Rio de Janeiro", temp_celsius: 29.3, humidity_percent: 72, wind_speed_kmh: 8.8, description: "Sunny", nimbus_message: "Nimbus says: Beach weather in Rio!" },
    cape-town: { city: "Cape Town", temp_celsius: 18.9, humidity_percent: 55, wind_speed_kmh: 19.6, description: "Partly cloudy", nimbus_message: "Nimbus says: Table Mountain looks magnificent today!" },
    nairobi: { city: "Nairobi", temp_celsius: 21.5, humidity_percent: 50, wind_speed_kmh: 11.3, description: "Clear sky", nimbus_message: "Nimbus says: Perfect weather in the Green City!" },
    johannesburg: { city: "Johannesburg", temp_celsius: 19.8, humidity_percent: 45, wind_speed_kmh: 14.7, description: "Scattered clouds", nimbus_message: "Nimbus says: Highveld sunshine today!" },
    "hong kong": { city: "Hong Kong", temp_celsius: 28.7, humidity_percent: 81, wind_speed_kmh: 9.5, description: "Humid and cloudy", nimbus_message: "Nimbus says: Sticky in Hong Kong!" },
    taipei: { city: "Taipei", temp_celsius: 27.1, humidity_percent: 76, wind_speed_kmh: 8.2, description: "Light rain", nimbus_message: "Nimbus says: Afternoon showers in Taipei!" },
    "san francisco": { city: "San Francisco", temp_celsius: 16.3, humidity_percent: 70, wind_speed_kmh: 18.4, description: "Fog", nimbus_message: "Nimbus says: Karl the Fog is out today!" },
    chicago: { city: "Chicago", temp_celsius: 14.7, humidity_percent: 56, wind_speed_kmh: 22.1, description: "Windy", nimbus_message: "Nimbus says: The Windy City lives up to its name!" },
    "las vegas": { city: "Las Vegas", temp_celsius: 36.2, humidity_percent: 12, wind_speed_kmh: 11.9, description: "Clear sky", nimbus_message: "Nimbus says: Blazing heat in the desert!" },
    honolulu: { city: "Honolulu", temp_celsius: 29.5, humidity_percent: 68, wind_speed_kmh: 13.6, description: "Sunny", nimbus_message: "Nimbus says: Aloha from paradise!" },
    vancouver: { city: "Vancouver", temp_celsius: 11.9, humidity_percent: 77, wind_speed_kmh: 15.3, description: "Light rain", nimbus_message: "Nimbus says: Classic Vancouver drizzle!" },
    montreal: { city: "Montreal", temp_celsius: 10.2, humidity_percent: 63, wind_speed_kmh: 17.6, description: "Partly cloudy", nimbus_message: "Nimbus says: Cool day in Montreal!" },
    "Mexico City": { city: "Mexico City", temp_celsius: 21.8, humidity_percent: 52, wind_speed_kmh: 9.7, description: "Clear sky", nimbus_message: "Nimbus says: Perfect weather in CDMX!" },
    jakarta: { city: "Jakarta", temp_celsius: 31.2, humidity_percent: 78, wind_speed_kmh: 7.9, description: "Thunderstorm", nimbus_message: "Nimbus says: Tropical storm in Jakarta!" },
    kuala-lumpur: { city: "Kuala Lumpur", temp_celsius: 32.1, humidity_percent: 75, wind_speed_kmh: 6.8, description: "Partly cloudy", nimbus_message: "Nimbus says: Humid in KL!" },
    manila: { city: "Manila", temp_celsius: 30.4, humidity_percent: 77, wind_speed_kmh: 8.3, description: "Overcast", nimbus_message: "Nimbus says: Cloudy skies in Manila!" },
    lima: { city: "Lima", temp_celsius: 18.6, humidity_percent: 82, wind_speed_kmh: 12.4, description: "Overcast", nimbus_message: "Nimbus says: Grey but mild in Lima!" },
    bogota: { city: "Bogotá", temp_celsius: 14.8, humidity_percent: 70, wind_speed_kmh: 11.1, description: "Light rain", nimbus_message: "Nimbus says: Afternoon rain in the Andes!" },
    Santiago: { city: "Santiago", temp_celsius: 19.4, humidity_percent: 48, wind_speed_kmh: 13.5, description: "Clear sky", nimbus_message: "Nimbus says: Andean sunshine in Santiago!" },
    casablanca: { city: "Casablanca", temp_celsius: 20.1, humidity_percent: 66, wind_speed_kmh: 16.2, description: "Partly cloudy", nimbus_message: "Nimbus says: Atlantic breeze in Morocco!" },
    "tel aviv": { city: "Tel Aviv", temp_celsius: 25.8, humidity_percent: 55, wind_speed_kmh: 12.7, description: "Clear sky", nimbus_message: "Nimbus says: Mediterranean vibes in Tel Aviv!" },
    dubai: { city: "Dubai", temp_celsius: 38.1, humidity_percent: 22, wind_speed_kmh: 15.6, description: "Clear sky", nimbus_message: "Nimbus says: Stay hydrated in the desert heat!" },
};

function generateWeatherForCity(name) {
    const n = name.toLowerCase();
    if (MOCK_WEATHER[n]) return MOCK_WEATHER[n];
    const hash = n.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const temps = [-5, 2, 8, 12, 15, 18, 21, 24, 27, 30, 33, 36];
    const descs = ["Clear sky", "Partly cloudy", "Overcast", "Light rain", "Scattered clouds", "Sunny", "Light drizzle", "Fog", "Mist"];
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
    redwood: { common_name: "Coast Redwood", scientific_name: "Sequoia sempervirens", kingdom: "Plantae", phylum: "Tracheophyta", class: "Pinopsida", order: "Pinales", family: "Cupressaceae" },
    "monarch butterfly": { common_name: "Monarch Butterfly", scientific_name: "Danaus plexippus", kingdom: "Animalia", phylum: "Arthropoda", class: "Insecta", order: "Lepidoptera", family: "Nymphalidae" },
    elephant: { common_name: "African Elephant", scientific_name: "Loxodonta africana", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Proboscidea", family: "Elephantidae" },
    lion: { common_name: "Lion", scientific_name: "Panthera leo", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae" },
    tiger: { common_name: "Bengal Tiger", scientific_name: "Panthera tigris tigris", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Felidae" },
    dolphin: { common_name: "Bottlenose Dolphin", scientific_name: "Tursiops truncatus", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Artiodactyla", family: "Delphinidae" },
    eagle: { common_name: "Bald Eagle", scientific_name: "Haliaeetus leucocephalus", kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Accipitriformes", family: "Accipitridae" },
    penguin: { common_name: "Emperor Penguin", scientific_name: "Aptenodytes forsteri", kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Sphenisciformes", family: "Spheniscidae" },
    octopus: { common_name: "Common Octopus", scientific_name: "Octopus vulgaris", kingdom: "Animalia", phylum: "Mollusca", class: "Cephalopoda", order: "Octopoda", family: "Octopodidae" },
    sunflower: { common_name: "Common Sunflower", scientific_name: "Helianthus annuus", kingdom: "Plantae", phylum: "Tracheophyta", class: "Magnoliopsida", order: "Asterales", family: "Asteraceae" },
    oak: { common_name: "English Oak", scientific_name: "Quercus robur", kingdom: "Plantae", phylum: "Tracheophyta", class: "Magnoliopsida", order: "Fagales", family: "Fagaceae" },
    fern: { common_name: "Lady Fern", scientific_name: "Athyrium filix-femina", kingdom: "Plantae", phylum: "Polypodiopsida", class: "Polypodiopsida", order: "Polypodiales", family: "Athyriaceae" },
    shark: { common_name: "Great White Shark", scientific_name: "Carcharodon carcharias", kingdom: "Animalia", phylum: "Chordata", class: "Chondrichthyes", order: "Lamniformes", family: "Lamnidae" },
    wolf: { common_name: "Grey Wolf", scientific_name: "Canis lupus", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Canidae" },
    bear: { common_name: "Brown Bear", scientific_name: "Ursus arctos", kingdom: "Animalia", phylum: "Chordata", class: "Mammalia", order: "Carnivora", family: "Ursidae" },
    falcon: { common_name: "Peregrine Falcon", scientific_name: "Falco peregrinus", kingdom: "Animalia", phylum: "Chordata", class: "Aves", order: "Falconiformes", family: "Falconidae" },
    snake: { common_name: "King Cobra", scientific_name: "Ophiophagus hannah", kingdom: "Animalia", phylum: "Chordata", class: "Reptilia", order: "Squamata", family: "Elapidae" },
    frog: { common_name: "Red-eyed Tree Frog", scientific_name: "Agalychnis callidryas", kingdom: "Animalia", phylum: "Chordata", class: "Amphibia", order: "Anura", family: "Phyllomedusidae" },
    turtle: { common_name: "Green Sea Turtle", scientific_name: "Chelonia mydas", kingdom: "Animalia", phylum: "Chordata", class: "Reptilia", order: "Testudines", family: "Cheloniidae" },
    cactus: { common_name: "Saguaro Cactus", scientific_name: "Carnegiea gigantea", kingdom: "Plantae", phylum: "Tracheophyta", class: "Magnoliopsida", order: "Caryophyllales", family: "Cactaceae" },
    orchid: { common_name: "Moon Orchid", scientific_name: "Phalaenopsis amabilis", kingdom: "Plantae", phylum: "Tracheophyta", class: "Liliopsida", order: "Asparagales", family: "Orchidaceae" },
    bamboo: { common_name: "Giant Bamboo", scientific_name: "Dendrocalamus giganteus", kingdom: "Plantae", phylum: "Tracheophyta", class: "Liliopsida", order: "Poales", family: "Poaceae" },
    mushroom: { common_name: "Fly Agaric", scientific_name: "Amanita muscaria", kingdom: "Fungi", phylum: "Basidiomycota", class: "Agaricomycetes", order: "Agaricales", family: "Amanitaceae" },
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

// ═══════════════════════════════════════════
//  API — Fast with instant fallback
// ═══════════════════════════════════════════
let apiServerWarm = false;

function pingServer() {
    const bar = document.getElementById("apiStatusBar");
    const txt = document.getElementById("statusText");
    if (!bar || !txt) return;

    bar.className = "api-status-bar waking";
    txt.textContent = "PING: Connecting to backend…";

    fastFetch(`${API_BASE}/api/v1/weather?city=Berlin`)
        .then(() => {
            apiServerWarm = true;
            bar.className = "api-status-bar online";
            txt.textContent = "ONLINE: Connected to live backend";
            setTimeout(fetchWeather, 100);
            setTimeout(fetchSpecies, 500);
        })
        .catch(() => {
            apiServerWarm = false;
            bar.className = "api-status-bar offline";
            txt.textContent = "LOCAL MODE: Serving cached data instantly";
            setTimeout(fetchWeather, 100);
            setTimeout(fetchSpecies, 500);
        });
}

// ═══════════════════════════════════════════
//  WEATHER API
// ═══════════════════════════════════════════
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
    if (d.includes("haze") || d.includes("humid")) return "🌤️";
    if (d.includes("windy")) return "💨";
    return "🌤️";
}

function fetchWeather() {
    const city = document.getElementById("weather-input").value.trim();
    if (!city) return;
    const body = document.getElementById("weather-display");
    if (weatherScene) weatherScene.stop();

    showLoading(body);

    if (!apiServerWarm) {
        // Server cold — use mock instantly
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
        <div class="tab-pane active" id="weather-pane-prev">
            <div class="weather-scene"><canvas id="weather-canvas"></canvas>
                <div class="weather-overlay">
                    <div class="weather-icon-display">${icon}</div>
                    <div class="weather-condition">${data.description || "Unknown"}</div>
                    <div class="weather-temp-big" id="w-temp-counter">0°C</div>
                    <div class="weather-location">${data.location || data.city}</div>
                    <div class="weather-stats">
                        <div class="weather-stat"><span class="weather-stat-icon">💨</span><span id="w-wind-counter">0 km/h</span></div>
                        <div class="weather-stat"><span class="weather-stat-icon">💧</span><span id="w-hum-counter">0%</span></div>
                    </div>
                    <div class="weather-msg">"${data.nimbus_message || ""}"</div>
                </div>
            </div>
        </div>
        <div class="tab-pane" id="weather-pane-code"><pre class="code-pane"><code>${highlightJSON(data)}</code></pre></div>`;
    const wCanvas = document.getElementById("weather-canvas");
    weatherScene = new WeatherScene(wCanvas);
    weatherScene.setCondition(data.description);
    weatherScene.start();
    animateCount(document.getElementById("w-temp-counter"), data.temp_celsius, "°C", 1400);
    animateCount(document.getElementById("w-wind-counter"), data.wind_speed_kmh, " km/h", 1100);
    animateCount(document.getElementById("w-hum-counter"), data.humidity_percent, "%", 1100);
    const activeTab = document.getElementById("weather-tab-prev").classList.contains("active") ? "prev" : "code";
    switchTab("weather", activeTab);
}

// ═══════════════════════════════════════════
//  SPECIES API
// ═══════════════════════════════════════════
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
        <div class="taxon-node">
            <div class="taxon-badge" style="background:${TAXON_COLORS[l.key]}22;border:1px solid ${TAXON_COLORS[l.key]}44;color:${TAXON_COLORS[l.key]}">${l.abbr}</div>
            <div class="taxon-info"><span class="taxon-rank">${l.label}</span><span class="taxon-value">${data[l.key] || "N/A"}</span></div>
        </div>`).join("");
    const headerHTML = data.common_name || data.scientific_name
        ? `<div style="margin-bottom:14px;padding:0 14px;"><div style="font-family:var(--display);font-size:1.1rem;font-weight:700;color:var(--text-white);">${data.common_name || ""}</div>${data.scientific_name ? `<div style="font-size:.78rem;font-style:italic;color:var(--text-dim);">${data.scientific_name}</div>` : ""}</div>`
        : "";
    body.innerHTML = `
        <div class="tab-pane active" id="species-pane-prev" style="flex-direction:column;justify-content:center;">${headerHTML}<div class="taxonomy-tree">${treeHTML}</div></div>
        <div class="tab-pane" id="species-pane-code"><pre class="code-pane"><code>${highlightJSON(data)}</code></pre></div>`;
    const activeTab = document.getElementById("species-tab-prev").classList.contains("active") ? "prev" : "code";
    switchTab("species", activeTab);
}

// ═══════════════════════════════════════════
//  SCREENSHOT API
// ═══════════════════════════════════════════
function setScreenshotChip(v) { document.getElementById("screenshot-input").value = v; fetchScreenshot(); }

function fetchScreenshot() {
    const url = document.getElementById("screenshot-input").value.trim();
    if (!url) return;
    const body = document.getElementById("screenshot-display");
    const apiUrl = `${API_BASE}/api/v1/screenshot?url=${encodeURIComponent(url)}`;
    body.innerHTML = `
        <div class="tab-pane active" id="screenshot-pane-prev" style="height:100%;">
            <div class="browser-mockup">
                <div class="browser-header"><div class="browser-dots"><div class="b-dot red"></div><div class="b-dot yellow"></div><div class="b-dot green"></div></div><div class="browser-bar">${url}</div></div>
                <div class="browser-view" style="padding:18px;align-items:flex-start;justify-content:flex-start;"><div class="terminal-wrap" id="ss-terminal"></div></div>
            </div>
        </div>
        <div class="tab-pane" id="screenshot-pane-code"><div class="terminal-wrap" id="ss-log-pane"></div></div>`;
    switchTab("screenshot", "prev");
    const term = document.getElementById("ss-terminal");
    const logPane = document.getElementById("ss-log-pane");
    const log = (txt, cls, delay) => new Promise((resolve) => setTimeout(() => {
        const el = document.createElement("div"); el.className = "terminal-line";
        el.innerHTML = `<span class="dim">›</span> ${cls ? `<span class="${cls}">${txt}</span>` : txt}`;
        if (term) term.appendChild(el);
        if (logPane) logPane.appendChild(el.cloneNode(true));
        if (term) term.scrollTop = term.scrollHeight;
        resolve();
    }, delay));

    const img = new Image(); let imgLoaded = false, imgFailed = false;
    img.onload = () => { imgLoaded = true; }; img.onerror = () => { imgFailed = true; }; img.src = apiUrl;

    log("Nimbus Screenshot Engine v1.0", "", 0)
        .then(() => log("Spawning headless Chromium…", "", 400))
        .then(() => log("Viewport: 1280×800", "", 300))
        .then(() => log(`Navigating to ${url}`, "", 400))
        .then(() => log("Waiting for network idle…", "", 500))
        .then(() => new Promise((resolve) => {
            let attempts = 0;
            function check() { attempts++; if (imgLoaded || imgFailed || attempts > 10) { resolve(); } else { const d = document.createElement("div"); d.className = "terminal-line"; d.innerHTML = '<span class="dim">›</span> Rendering… <span class="terminal-cursor"></span>'; if (term) term.appendChild(d); setTimeout(() => { if (d.parentNode) d.remove(); check(); }, 800); } }
            check();
        }))
        .then(() => {
            if (imgFailed) log("Connection failed — API node sleeping.", "red", 150).then(() => setTimeout(() => renderScreenshotResult(apiUrl, url), 300));
            else log("Capture complete!", "green", 150).then(() => setTimeout(() => renderScreenshotResult(apiUrl, url), 300));
        });
}

function renderScreenshotResult(apiUrl, displayUrl) {
    const body = document.getElementById("screenshot-display");
    if (!body) return;
    body.innerHTML = `
        <div class="tab-pane active" id="screenshot-pane-prev" style="height:100%;">
            <div class="browser-mockup">
                <div class="browser-header"><div class="browser-dots"><div class="b-dot red"></div><div class="b-dot yellow"></div><div class="b-dot green"></div></div><div class="browser-bar">${displayUrl}</div></div>
                <div class="browser-view"><img src="${apiUrl}" alt="Screenshot of ${displayUrl}" onerror="this.parentElement.innerHTML='<div class=screenshot-placeholder>Screenshot failed — server may be cold-starting.<br><br><button class=retry-btn onclick=fetchScreenshot()>Retry</button></div>'" /></div>
            </div>
        </div>
        <div class="tab-pane" id="screenshot-pane-code"><div class="terminal-wrap"><div class="terminal-line"><span class="green">› GET 200 OK</span></div><div class="terminal-line">Content-Type: image/png</div><div class="terminal-line">Engine: Headless Chromium</div></div></div>`;
    switchTab("screenshot", "prev");
}

// ─── Manifesto Console ──────────────────────
function startManifestoConsole() {
    const cb = document.getElementById("manifesto-console-body");
    if (!cb) return;
    const logs = [
        { tag: "SYS", text: "Compiling Go binary for target: linux/amd64...", cls: "green" },
        { tag: "SYS", text: "Optimizing memory blocks, garbage collection tuned.", cls: "green" },
        { tag: "NET", text: "CORS configuration updated: AllowOrigin='*'", cls: "blue" },
        { tag: "SEC", text: "Rate limiter: 60 requests/minute per client activated.", cls: "purple" },
        { tag: "DB", text: "Caching layer warm. Response time: 0.12ms", cls: "blue" },
        { tag: "SYS", text: "System load: 1.4% · Memory used: 14.2 MB", cls: "green" },
        { tag: "NET", text: "New query received from client IP (Niedersachsen, DE)", cls: "blue" },
        { tag: "API", text: "Endpoint /api/v1/weather responded: 200 OK (0.24ms)", cls: "green" },
    ];
    let idx = 0;
    setInterval(() => {
        const item = logs[idx];
        const line = document.createElement("div"); line.className = "console-line";
        const now = new Date();
        const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
        line.innerHTML = `<span class="c-time">${timeStr}</span> <span class="c-tag ${item.cls}">${item.tag}</span> ${item.text}`;
        cb.appendChild(line); cb.scrollTop = cb.scrollHeight;
        if (cb.children.length > 7) cb.children[0].remove();
        idx = (idx + 1) % logs.length;
    }, 4500);
}

// ─── Init ───────────────────────────────────
try { pingServer(); } catch(e) { console.error("pingServer error:", e); }
try { startManifestoConsole(); } catch(e) { console.error("console error:", e); }
