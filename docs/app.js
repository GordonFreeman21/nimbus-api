/* ═══════════════════════════════════════════
   NIMBUS — Application Logic
   ═══════════════════════════════════════════ */

const API_BASE = "https://nimbus-api-gxuc.onrender.com";

// Animation State Variables
let entranceComplete = false;
let isRaining = false;
let rainParticles = [];

// ─── Preloader & Entrance ───────────────────
window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("preloader").classList.add("fade-out");
        triggerEntrance();
    }, 500);
});

function triggerEntrance() {
    const cL = document.getElementById("cloudLeft");
    const cR = document.getElementById("cloudRight");
    
    // 1. Instantly fade in the overlapping clouds in their central starting positions
    cL.style.opacity = "0.95";
    cR.style.opacity = "0.95";
    
    // Start rain particles
    isRaining = true;
    
    // 2. Trigger electrical storm flash (Blitz) after 800ms
    setTimeout(() => {
        const flash = document.getElementById("lightningFlash");
        const bolt = document.getElementById("lightningBolt");
        
        if (flash) flash.classList.add("flash");
        if (bolt) bolt.classList.add("active");
        
        // 3. Part clouds and reveal the sun after the flash fades
        setTimeout(() => {
            document.getElementById("nav").classList.add("revealed");
            cL.classList.add("revealed");
            cR.classList.add("revealed");
            
            const sunGroup = document.getElementById("sunGroup");
            if (sunGroup) sunGroup.classList.add("revealed");
            
            // 4. Reveal the typography and scroll hints
            setTimeout(() => {
                const titleReveal = document.getElementById("titleReveal");
                const scrollHint = document.getElementById("scrollHint");
                if (titleReveal) titleReveal.classList.add("visible");
                if (scrollHint) scrollHint.classList.add("visible");
                
                entranceComplete = true; // Unlock scroll parallax
            }, 800);
        }, 500);
    }, 800);
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

// ─── Starfield & Rain Canvas ────────────────
const starCanvas = document.getElementById("particles-canvas");
const starCtx = starCanvas.getContext("2d");
let stars = [];
const mouse = { x: null, y: null, radius: 140 };

function resizeStarCanvas() {
    starCanvas.width = window.innerWidth;
    starCanvas.height = window.innerHeight;
    buildStars();
}

function buildStars() {
    stars = [];
    const count = Math.min(Math.floor(starCanvas.width / 14), 110);
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * starCanvas.width,
            y: Math.random() * starCanvas.height,
            size: Math.random() * 1.4 + 0.4,
            speed: Math.random() * 0.3 + 0.08,
            density: Math.random() * 20 + 15,
            opacity: Math.random() * 0.55 + 0.15,
        });
    }
}

function animateHeroCanvas() {
    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    
    // 1. Draw Starfield
    stars.forEach((s) => {
        starCtx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        starCtx.beginPath();
        starCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        starCtx.fill();

        s.y -= s.speed;
        if (s.y < 0) {
            s.y = starCanvas.height;
            s.x = Math.random() * starCanvas.width;
        }

        if (mouse.x !== null) {
            const dx = mouse.x - s.x,
                dy = mouse.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
                const force = (mouse.radius - dist) / mouse.radius;
                s.x -= (dx / dist) * force * s.density * 0.35;
                s.y -= (dy / dist) * force * s.density * 0.35;
            }
        }
    });

    // 2. Draw Dynamic Rain falling FROM the sliding clouds
    if (isRaining) {
        const cL = document.getElementById("cloudLeft");
        const cR = document.getElementById("cloudRight");
        if (cL && cR) {
            const rectL = cL.getBoundingClientRect();
            const rectR = cR.getBoundingClientRect();
            
            // Spawn rain particles from under each cloud's bounding area
            for (let i = 0; i < 2; i++) {
                if (rectL.width > 0 && cL.style.opacity !== "0") {
                    rainParticles.push({
                        x: rectL.left + Math.random() * rectL.width,
                        y: rectL.top + rectL.height * 0.65 + Math.random() * (rectL.height * 0.15),
                        len: Math.random() * 20 + 12,
                        speed: Math.random() * 8 + 14,
                        opacity: Math.random() * 0.35 + 0.15,
                        drift: Math.random() * 0.6 - 0.3
                    });
                }
                if (rectR.width > 0 && cR.style.opacity !== "0") {
                    rainParticles.push({
                        x: rectR.left + Math.random() * rectR.width,
                        y: rectR.top + rectR.height * 0.65 + Math.random() * (rectR.height * 0.15),
                        len: Math.random() * 20 + 12,
                        speed: Math.random() * 8 + 14,
                        opacity: Math.random() * 0.35 + 0.15,
                        drift: Math.random() * 0.6 - 0.3
                    });
                }
            }
        }

        // Draw and update rain particles
        for (let i = rainParticles.length - 1; i >= 0; i--) {
            const p = rainParticles[i];
            
            starCtx.beginPath();
            starCtx.moveTo(p.x, p.y);
            starCtx.lineTo(p.x + p.drift * 2.5, p.y + p.len);
            starCtx.strokeStyle = `rgba(147, 197, 253, ${p.opacity})`;
            starCtx.lineWidth = 1.3;
            starCtx.stroke();

            // Update particle
            p.y += p.speed;
            p.x += p.drift;

            // Remove if off screen
            if (p.y > starCanvas.height || p.x < 0 || p.x > starCanvas.width) {
                rainParticles.splice(i, 1);
            }
        }
    }
    
    requestAnimationFrame(animateHeroCanvas);
}

window.addEventListener("resize", resizeStarCanvas);
window.addEventListener("mousemove", (e) => {
    const r = starCanvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
});
window.addEventListener("mouseleave", () => {
    mouse.x = null;
    mouse.y = null;
});
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
        const y = window.scrollY,
            h = heroEl.offsetHeight,
            p = Math.min(y / (h * 0.5), 1);
            
        navEl.classList.toggle("scrolled", y > 60);
        
        // Gate cloud movement on scroll until the entry animation completes
        if (entranceComplete) {
            const drift = 24 + p * 38;
            cL.style.transform = `translateY(-50%) translateX(calc(-50% - ${drift}vw))`;
            cR.style.transform = `translateY(-50%) translateX(calc(-50% + ${drift}vw))`;
            cL.style.opacity = 0.95 - p * 0.65;
            cR.style.opacity = 0.95 - p * 0.65;
            
            // Rain fades away slowly as we scroll down
            if (p > 0.4) {
                isRaining = false;
            } else {
                isRaining = true;
            }
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
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
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
    suffix = suffix || "";
    duration = duration || 1200;
    const start = performance.now();
    (function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * ease) + suffix;
        if (t < 1) requestAnimationFrame(tick);
    })(start);
}

// ─── Helper: show loading ───────────────────
function showLoading(container) {
    container.innerHTML =
        '<div class="sandbox-loader"><div class="spinner"></div><span>Fetching from API…</span></div>';
}

// ─── Helper: show error ─────────────────────
function showError(container, msg, retryFn) {
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <div class="error-msg">${msg}</div>
            <button class="retry-btn" onclick="${retryFn}">Retry</button>
        </div>`;
}

// ═══════════════════════════════════════════
//  WEATHER SCENE — Animated Canvas
// ═══════════════════════════════════════════

class WeatherScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.particles = [];
        this.condition = "clear";
        this.frame = null;
    }

    resize() {
        const parent = this.canvas.parentElement;
        if (!parent) return;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        this.init();
    }

    setCondition(desc) {
        const d = (desc || "").toLowerCase();
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
                case "rain":
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, len: Math.random() * 14 + 8, spd: Math.random() * 8 + 10, o: Math.random() * .4 + .15 }); break;
                case "storm":
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, len: Math.random() * 18 + 14, spd: Math.random() * 12 + 14, o: Math.random() * .45 + .2, a: 0.2 }); break;
                case "snow":
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 3 + 1, spd: Math.random() * 1 + .4, drift: Math.random() * 2 - 1, o: Math.random() * .6 + .25 }); break;
                default:
                    this.particles.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + .4, spd: Math.random() * .4 + .15, drift: Math.random() * .4 - .2, o: Math.random() * .4 + .08 });
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
        // glow
        const glow = c.createRadialGradient(cx, cy, 5, cx, cy, 55 + Math.sin(t) * 8);
        glow.addColorStop(0, "rgba(251,191,36,.55)");
        glow.addColorStop(.4, "rgba(245,158,11,.12)");
        glow.addColorStop(1, "transparent");
        c.fillStyle = glow;
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // body
        c.beginPath(); c.arc(cx, cy, 16, 0, Math.PI * 2);
        const sg = c.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 16);
        sg.addColorStop(0, "#fef3c7"); sg.addColorStop(.6, "#fbbf24"); sg.addColorStop(1, "#f59e0b");
        c.fillStyle = sg; c.fill();
        // rays
        c.save(); c.translate(cx, cy); c.rotate(t * .25);
        for (let i = 0; i < 12; i++) {
            c.rotate(Math.PI / 6);
            c.beginPath(); c.moveTo(20, 0); c.lineTo(34 + Math.sin(t * 2 + i) * 5, 0);
            c.strokeStyle = `rgba(251,191,36,${.28 + Math.sin(t + i) * .12})`;
            c.lineWidth = 1.2; c.stroke();
        }
        c.restore();
    }

    drawClouds() {
        if (this.condition !== "cloudy" && this.condition !== "rain" && this.condition !== "storm") return;
        const c = this.ctx, t = Date.now() * .00025, w = this.canvas.width;
        const fill = this.condition === "storm" ? "#1e293b" : "#334155";
        const drawOne = (x, y, sc, op) => {
            c.save(); c.globalAlpha = op; c.fillStyle = fill;
            c.beginPath(); c.ellipse(x, y, 38 * sc, 14 * sc, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(x - 18 * sc, y - 5 * sc, 20 * sc, 12 * sc, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.ellipse(x + 16 * sc, y - 3 * sc, 16 * sc, 11 * sc, 0, 0, Math.PI * 2); c.fill();
            c.restore();
        };
        drawOne((t * 80) % (w + 100) - 50, 22, 1.2, .45);
        drawOne((t * 55 + 200) % (w + 100) - 50, 42, .9, .35);
        drawOne((t * 38 + 380) % (w + 100) - 50, 34, 1, .28);
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
                    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + .8, p.y + p.len);
                    c.strokeStyle = `rgba(96,165,250,${p.o})`; c.lineWidth = 1; c.stroke();
                    p.y += p.spd; p.x += .4;
                    if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
                    break;
                case "storm":
                    c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + p.a * p.len, p.y + p.len);
                    c.strokeStyle = `rgba(148,163,184,${p.o})`; c.lineWidth = 1.2; c.stroke();
                    p.y += p.spd; p.x += 3;
                    if (p.y > h) { p.y = -p.len; p.x = Math.random() * w; }
                    break;
                case "snow":
                    c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    c.fillStyle = `rgba(226,232,240,${p.o})`; c.fill();
                    p.y += p.spd; p.x += Math.sin(Date.now() * .001 + p.drift * 10) * .45;
                    if (p.y > h) { p.y = -5; p.x = Math.random() * w; }
                    break;
                default:
                    c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    c.fillStyle = `rgba(255,255,255,${p.o})`; c.fill();
                    p.y -= p.spd; p.x += p.drift;
                    if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
            }
        });

        // Lightning flash
        if (this.condition === "storm" && Math.random() < .003) {
            c.fillStyle = "rgba(255,255,255,.06)";
            c.fillRect(0, 0, w, h);
        }

        this.frame = requestAnimationFrame(() => this.render());
    }

    start() { this.resize(); this.render(); }
    stop() { this.frame && cancelAnimationFrame(this.frame); }
}

let weatherScene = null;

// ─── High-Fidelity Mock Fallback Data ────────
const MOCK_WEATHER = {
    berlin: {
        city: "Berlin",
        temp_celsius: 21.7,
        humidity_percent: 53,
        wind_speed_kmh: 14.3,
        description: "Mainly clear, partly cloudy, or overcast",
        nimbus_message: "🌤️ Nimbus says: Enjoy the weather in Germany's capital!"
    },
    tokyo: {
        city: "Tokyo",
        temp_celsius: 26.2,
        humidity_percent: 68,
        wind_speed_kmh: 9.1,
        description: "Partly cloudy",
        nimbus_message: "🗼 Nimbus says: A beautiful evening in Tokyo!"
    },
    "new york": {
        city: "New York",
        temp_celsius: 18.5,
        humidity_percent: 45,
        wind_speed_kmh: 22.4,
        description: "Light rain or shower",
        nimbus_message: "🗽 Nimbus says: Keep an umbrella handy in NYC today!"
    },
    sydney: {
        city: "Sydney",
        temp_celsius: 15.0,
        humidity_percent: 82,
        wind_speed_kmh: 11.2,
        description: "Overcast",
        nimbus_message: "🐨 Nimbus says: Cloudy skies over Sydney Harbour!"
    }
};

const MOCK_SPECIES = {
    "blue whale": {
        common_name: "Blue Whale",
        scientific_name: "Balaenoptera musculus",
        kingdom: "Animalia",
        phylum: "Chordata",
        class: "Mammalia",
        order: "Artiodactyla",
        family: "Balaenopteridae"
    },
    redwood: {
        common_name: "Coast Redwood",
        scientific_name: "Sequoia sempervirens",
        kingdom: "Plantae",
        phylum: "Tracheophyta",
        class: "Pinopsida",
        order: "Pinales",
        family: "Cupressaceae"
    },
    "monarch butterfly": {
        common_name: "Monarch Butterfly",
        scientific_name: "Danaus plexippus",
        kingdom: "Animalia",
        phylum: "Arthropoda",
        class: "Insecta",
        order: "Lepidoptera",
        family: "Nymphalidae"
    }
};

// ─── API Warmup & Connection Pinger ──────────
let apiServerWarm = false;

function pingServer(retryCount = 0) {
    const bar = document.getElementById("apiStatusBar");
    const txt = document.getElementById("statusText");
    if (!bar || !txt) return;
    
    bar.className = "api-status-bar waking";
    txt.textContent = "PING: Waking up Render server (cold-start takes 30-50s)...";
    
    fetch(`${API_BASE}/api/v1/weather?city=Berlin`)
        .then(r => {
            if (!r.ok) throw new Error();
            return r.json();
        })
        .then(() => {
            apiServerWarm = true;
            bar.className = "api-status-bar online";
            txt.textContent = "ONLINE: Connected to Render backend node";
            
            // Server is active! Trigger serial API queries for standard view
            setTimeout(fetchWeather, 200);
            setTimeout(fetchSpecies, 800);
        })
        .catch(() => {
            if (retryCount < 4) {
                const nextRetry = 5;
                txt.textContent = `WAKING: Server cold-start... retrying in ${nextRetry}s`;
                
                let countdown = nextRetry;
                const timer = setInterval(() => {
                    countdown--;
                    if (countdown <= 0) clearInterval(timer);
                }, 1000);
                
                setTimeout(() => pingServer(retryCount + 1), nextRetry * 1000);
            } else {
                bar.className = "api-status-bar offline";
                txt.textContent = "OFFLINE: Backend asleep. Serving high-fidelity cached local data.";
                
                // Fallback to high-fidelity mock pings
                setTimeout(fetchWeather, 200);
                setTimeout(fetchSpecies, 800);
            }
        });
}

// ─── Smart Robust Fetch with Countdown Timer ───
function robustFetch(url, displayContainer, successCallback, errorCallback, retryFnCallStr, maxRetries = 2) {
    let attempt = 0;
    
    function execute() {
        attempt++;
        showLoading(displayContainer);
        
        fetch(url)
            .then(r => {
                if (!r.ok) throw new Error(r.status);
                return r.json();
            })
            .then(data => successCallback(data))
            .catch(err => {
                if (attempt <= maxRetries) {
                    let secondsLeft = 5;
                    displayContainer.innerHTML = `
                        <div class="error-state">
                            <div class="error-icon">⏳</div>
                            <div class="error-msg">Connection failed. Backend is cold-starting... Retrying in <strong id="countdown-timer">${secondsLeft}</strong>s</div>
                            <button class="retry-btn" onclick="${retryFnCallStr}">Force Retry</button>
                        </div>`;
                    
                    const interval = setInterval(() => {
                        secondsLeft--;
                        const timerEl = document.getElementById("countdown-timer");
                        if (timerEl) timerEl.textContent = secondsLeft;
                        if (secondsLeft <= 0) {
                            clearInterval(interval);
                            execute();
                        }
                    }, 1000);
                } else {
                    errorCallback(err);
                }
            });
    }
    
    execute();
}

// ═══════════════════════════════════════════
//  WEATHER API
// ═══════════════════════════════════════════

function setWeatherChip(v) {
    document.getElementById("weather-input").value = v;
    fetchWeather();
}

function getWeatherIcon(desc) {
    const d = (desc || "").toLowerCase();
    if (d.includes("thunder") || d.includes("storm")) return "⛈️";
    if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return "🌧️";
    if (d.includes("snow")) return "🌨️";
    if (d.includes("cloud") || d.includes("overcast")) return "☁️";
    if (d.includes("mist") || d.includes("fog")) return "🌫️";
    if (d.includes("sun") || d.includes("clear")) return "☀️";
    if (d.includes("partly")) return "⛅";
    return "🌤️";
}

function fetchWeather() {
    const city = document.getElementById("weather-input").value.trim();
    if (!city) return;

    const body = document.getElementById("weather-display");
    
    // Stop any existing weather scene
    if (weatherScene) weatherScene.stop();

    const url = `${API_BASE}/api/v1/weather?city=${encodeURIComponent(city)}`;
    
    robustFetch(
        url,
        body,
        (data) => renderWeather(data),
        (err) => {
            // Serve high-fidelity mock fallback if query matches mock cities
            const queryClean = city.toLowerCase();
            if (MOCK_WEATHER[queryClean]) {
                renderWeather(MOCK_WEATHER[queryClean]);
                // Highlight fallback
                const statusText = document.getElementById("statusText");
                if (statusText) statusText.textContent = `SIMULATED: Serving local cache for city '${city}'`;
            } else {
                showError(body,
                    "Weather API could not be reached. The server may be offline or undergoing cold-starts on Render.",
                    "fetchWeather()"
                );
            }
        },
        "fetchWeather()"
    );
}

function renderWeather(data) {
    const body = document.getElementById("weather-display");
    const icon = getWeatherIcon(data.description);

    body.innerHTML = `
        <div class="tab-pane active" id="weather-pane-prev">
            <div class="weather-scene">
                <canvas id="weather-canvas"></canvas>
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
        <div class="tab-pane" id="weather-pane-code">
            <pre class="code-pane"><code>${highlightJSON(data)}</code></pre>
        </div>`;

    // Animated weather canvas
    const wCanvas = document.getElementById("weather-canvas");
    weatherScene = new WeatherScene(wCanvas);
    weatherScene.setCondition(data.description);
    weatherScene.start();

    // Counter animations
    animateCount(document.getElementById("w-temp-counter"), data.temp_celsius, "°C", 1400);
    animateCount(document.getElementById("w-wind-counter"), data.wind_speed_kmh, " km/h", 1100);
    animateCount(document.getElementById("w-hum-counter"), data.humidity_percent, "%", 1100);

    // Preserve active tab
    const activeTab = document.getElementById("weather-tab-prev").classList.contains("active") ? "prev" : "code";
    switchTab("weather", activeTab);
}

// ═══════════════════════════════════════════
//  SPECIES API
// ═══════════════════════════════════════════

function setSpeciesChip(v) {
    document.getElementById("species-input").value = v;
    fetchSpecies();
}

const TAXON_COLORS = {
    kingdom: "#f59e0b",
    phylum: "#3b82f6",
    class: "#a78bfa",
    order: "#ec4899",
    family: "#10b981",
};

function fetchSpecies() {
    const name = document.getElementById("species-input").value.trim();
    if (!name) return;

    const body = document.getElementById("species-display");
    const url = `${API_BASE}/api/v1/bio/species?name=${encodeURIComponent(name)}`;
    
    robustFetch(
        url,
        body,
        (data) => renderSpecies(data),
        (err) => {
            // Serve high-fidelity mock fallback if query matches standard chips
            const queryClean = name.toLowerCase();
            if (MOCK_SPECIES[queryClean]) {
                renderSpecies(MOCK_SPECIES[queryClean]);
                const statusText = document.getElementById("statusText");
                if (statusText) statusText.textContent = `SIMULATED: Serving local cache for species '${name}'`;
            } else {
                showError(body,
                    "Species API could not be reached. The server may be offline or undergoing cold-starts on Render.",
                    "fetchSpecies()"
                );
            }
        },
        "fetchSpecies()"
    );
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
            <div class="taxon-info">
                <span class="taxon-rank">${l.label}</span>
                <span class="taxon-value">${data[l.key] || "N/A"}</span>
            </div>
        </div>`).join("");

    const headerHTML = data.common_name || data.scientific_name
        ? `<div style="margin-bottom:14px;padding:0 14px;">
            <div style="font-family:var(--display);font-size:1.1rem;font-weight:700;color:var(--text-white);">${data.common_name || ""}</div>
            ${data.scientific_name ? `<div style="font-size:.78rem;font-style:italic;color:var(--text-dim);">${data.scientific_name}</div>` : ""}
           </div>`
        : "";

    body.innerHTML = `
        <div class="tab-pane active" id="species-pane-prev" style="flex-direction:column;justify-content:center;">
            ${headerHTML}
            <div class="taxonomy-tree">${treeHTML}</div>
        </div>
        <div class="tab-pane" id="species-pane-code">
            <pre class="code-pane"><code>${highlightJSON(data)}</code></pre>
        </div>`;

    const activeTab = document.getElementById("species-tab-prev").classList.contains("active") ? "prev" : "code";
    switchTab("species", activeTab);
}

// ═══════════════════════════════════════════
//  SCREENSHOT API
// ═══════════════════════════════════════════

function setScreenshotChip(v) {
    document.getElementById("screenshot-input").value = v;
    fetchScreenshot();
}

function fetchScreenshot() {
    const url = document.getElementById("screenshot-input").value.trim();
    if (!url) return;

    const body = document.getElementById("screenshot-display");
    const apiUrl = `${API_BASE}/api/v1/screenshot?url=${encodeURIComponent(url)}`;

    // Show terminal loading animation in the browser mockup
    body.innerHTML = `
        <div class="tab-pane active" id="screenshot-pane-prev" style="height:100%;">
            <div class="browser-mockup">
                <div class="browser-header">
                    <div class="browser-dots"><div class="b-dot red"></div><div class="b-dot yellow"></div><div class="b-dot green"></div></div>
                    <div class="browser-bar">${url}</div>
                </div>
                <div class="browser-view" style="padding:18px;align-items:flex-start;justify-content:flex-start;">
                    <div class="terminal-wrap" id="ss-terminal"></div>
                </div>
            </div>
        </div>
        <div class="tab-pane" id="screenshot-pane-code">
            <div class="terminal-wrap" id="ss-log-pane"></div>
        </div>`;
    switchTab("screenshot", "prev");

    const term = document.getElementById("ss-terminal");
    const logPane = document.getElementById("ss-log-pane");
    const log = (txt, cls, delay) =>
        new Promise((resolve) =>
            setTimeout(() => {
                const el = document.createElement("div");
                el.className = "terminal-line";
                el.innerHTML = `<span class="dim">›</span> ${cls ? `<span class="${cls}">${txt}</span>` : txt}`;
                if (term) term.appendChild(el);
                const el2 = el.cloneNode(true);
                if (logPane) logPane.appendChild(el2);
                if (term) term.scrollTop = term.scrollHeight;
                resolve();
            }, delay)
        );

    // Pre-load the screenshot image while terminal animation plays
    const img = new Image();
    let imgLoaded = false;
    let imgFailed = false;

    img.onload = () => { imgLoaded = true; };
    img.onerror = () => { imgFailed = true; };
    img.src = apiUrl;

    log("Nimbus Screenshot Engine v1.0", "", 0)
        .then(() => log("Spawning headless Chromium instance…", "", 500))
        .then(() => log("Viewport configured: 1280×800", "", 400))
        .then(() => log(`Navigating to ${url}`, "", 600))
        .then(() => log("Waiting for network idle…", "", 700))
        .then(() => {
            return new Promise((resolve) => {
                let attemptsCount = 0;
                function check() {
                    attemptsCount++;
                    if (imgLoaded || imgFailed || attemptsCount > 15) {
                        resolve();
                    } else {
                        // Keep typing dots to show we're waiting
                        const dot = document.createElement("div");
                        dot.className = "terminal-line";
                        dot.innerHTML = '<span class="dim">›</span> Rendering page view… <span class="terminal-cursor"></span>';
                        if (term) term.appendChild(dot);
                        if (term) term.scrollTop = term.scrollHeight;
                        setTimeout(() => {
                            if (dot.parentNode) dot.remove();
                            check();
                        }, 1200);
                    }
                }
                check();
            });
        })
        .then(() => {
            if (imgFailed) {
                log("Connection failed — API node may be sleeping.", "red", 200).then(() => {
                    setTimeout(() => renderScreenshotResult(apiUrl, url), 400);
                });
            } else {
                log("Capture complete! Rasterising PNG…", "green", 200).then(() => {
                    setTimeout(() => renderScreenshotResult(apiUrl, url), 400);
                });
            }
        });
}

function renderScreenshotResult(apiUrl, displayUrl) {
    const body = document.getElementById("screenshot-display");
    if (!body) return;
    body.innerHTML = `
        <div class="tab-pane active" id="screenshot-pane-prev" style="height:100%;">
            <div class="browser-mockup">
                <div class="browser-header">
                    <div class="browser-dots"><div class="b-dot red"></div><div class="b-dot yellow"></div><div class="b-dot green"></div></div>
                    <div class="browser-bar">${displayUrl}</div>
                </div>
                <div class="browser-view">
                    <img src="${apiUrl}"
                         alt="Screenshot of ${displayUrl}"
                         onerror="this.parentElement.innerHTML='<div class=screenshot-placeholder>Screenshot failed to load.<br>The Render server may need 30-60s to cold-start.<br><br><button class=retry-btn onclick=fetchScreenshot()>Retry Capture</button></div>'" />
                </div>
            </div>
        </div>
        <div class="tab-pane" id="screenshot-pane-code">
            <div class="terminal-wrap">
                <div class="terminal-line"><span class="green">› GET 200 OK</span></div>
                <div class="terminal-line">Content-Type: image/png</div>
                <div class="terminal-line">Viewport: 1280×800</div>
                <div class="terminal-line">Engine: Headless Chromium</div>
                <div class="terminal-line">Endpoint: ${apiUrl}</div>
            </div>
        </div>`;
    switchTab("screenshot", "prev");
}

// ─── Simulated Manifesto Kernel Log Console ───
function startManifestoConsole() {
    const consoleBody = document.getElementById("manifesto-console-body");
    if (!consoleBody) return;
    
    const logs = [
        { tag: "SYS", text: "Compiling Go binary for target: linux/amd64...", cls: "green" },
        { tag: "SYS", text: "Optimizing memory blocks, garbage collection tuned.", cls: "green" },
        { tag: "NET", text: "CORS configuration updated: AllowOrigin='*'", cls: "blue" },
        { tag: "SEC", text: "Rate limiter: 60 requests/minute per client activated.", cls: "purple" },
        { tag: "DB", text: "Caching layer warm. Redis response time: 0.12ms", cls: "blue" },
        { tag: "SYS", text: "System load: 1.4% · Memory used: 14.2 MB", cls: "green" },
        { tag: "NET", text: "New query received from client IP (Niedersachsen, DE)", cls: "blue" },
        { tag: "API", text: "Endpoint /api/v1/weather responded: 200 OK (0.24ms)", cls: "green" }
    ];
    
    let index = 0;
    setInterval(() => {
        const item = logs[index];
        const line = document.createElement("div");
        line.className = "console-line";
        
        const now = new Date();
        const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
        
        line.innerHTML = `<span class="c-time">${timeStr}</span> <span class="c-tag ${item.cls}">${item.tag}</span> ${item.text}`;
        consoleBody.appendChild(line);
        consoleBody.scrollTop = consoleBody.scrollHeight;
        
        // Remove oldest log to prevent infinite growth
        if (consoleBody.children.length > 7) {
            consoleBody.children[0].remove();
        }
        
        index = (index + 1) % logs.length;
    }, 4500);
}

// ─── Auto-fire & warm-up sequence ─────────────
pingServer();
startManifestoConsole();
