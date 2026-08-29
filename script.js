/* =========================================================
   CONFIG — point this at your running FastAPI server
   ========================================================= */
const CONFIG = {
  API_URL: "http://127.0.0.1:8000/predichttps://room-type-prediction-service-nyc-airbnb.onrender.com",
};

/* =========================================================
   BOROUGH → LINE COLOR
   ========================================================= */
const BOROUGH_COLORS = {
  "Manhattan":     "#2850ad",
  "Brooklyn":      "#00933c",
  "Queens":        "#b933ad",
  "Bronx":         "#ff6319",
  "Staten Island": "#808183",
};

const BOROUGH_NEIGHBOURHOODS = {
  "Manhattan":      ["Harlem", "Upper West Side", "Chelsea", "East Village", "Hell's Kitchen", "Financial District"],
  "Brooklyn":       ["Williamsburg", "Bushwick", "Bedford-Stuyvesant", "Park Slope", "Greenpoint", "Crown Heights"],
  "Queens":         ["Astoria", "Long Island City", "Flushing", "Ridgewood", "Jamaica", "Sunnyside"],
  "Bronx":          ["Fordham", "Riverdale", "Mott Haven", "Kingsbridge", "Concourse"],
  "Staten Island":  ["St. George", "Tompkinsville", "New Dorp", "Great Kills"],
};

/* Class colors for result bars — order assumed alphabetical
   (typical LabelEncoder ordering for this dataset). */
const CLASS_META = [
  { key: "Entire home/apt", color: "#2850ad" },
  { key: "Private room",    color: "#00933c" },
  { key: "Shared room",     color: "#fccc0a" },
];

/* =========================================================
   AMBIENT CANVAS — slow drifting "city light" dots
   ========================================================= */
(function ambientCanvas(){
  const canvas = document.getElementById("tunnelCanvas");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, dots = [];

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  function seed(){
    const count = Math.min(70, Math.floor((w * h) / 22000));
    dots = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4 + 0.4,
      vy: Math.random() * 0.12 + 0.03,
      alpha: Math.random() * 0.5 + 0.15,
      color: Math.random() > 0.85 ? "#fccc0a" : "#5b6478",
    }));
  }
  function draw(){
    ctx.clearRect(0, 0, w, h);
    for (const d of dots){
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.globalAlpha = d.alpha;
      ctx.fill();
      d.y -= d.vy;
      if (d.y < -5){ d.y = h + 5; d.x = Math.random() * w; }
    }
    ctx.globalAlpha = 1;
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  resize();
  seed();
  draw();
  window.addEventListener("resize", () => { resize(); seed(); });
})();

/* =========================================================
   ROUTE INDICATOR — highlights active form section on focus
   ========================================================= */
(function routeIndicator(){
  const form = document.getElementById("predictForm");
  const stops = Array.from(document.querySelectorAll(".stop"));
  const fill = document.getElementById("routeFill");
  const order = ["location", "pricing", "reviews", "availability", "predict"];

  function setActive(stopKey){
    const idx = order.indexOf(stopKey);
    stops.forEach((s) => {
      const sKey = s.dataset.stop;
      const sIdx = order.indexOf(sKey);
      s.classList.toggle("active", sKey === stopKey);
      s.classList.toggle("done", sIdx < idx);
    });
    const pct = ((idx + 1) / order.length) * 100;
    fill.style.width = pct + "%";
  }

  form.addEventListener("focusin", (e) => {
    const fieldset = e.target.closest("fieldset");
    if (fieldset && fieldset.dataset.stop) setActive(fieldset.dataset.stop);
  });

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.addEventListener("focus", () => setActive("predict"));

  setActive("location");
})();

/* =========================================================
   BOROUGH SELECT — recolor accent + populate neighbourhoods
   ========================================================= */
(function boroughAccent(){
  const select = document.getElementById("neighbourhood_group");
  const dot = document.getElementById("boroughDot");
  const heroAccent = document.getElementById("heroAccent");
  const neighbourhoodInput = document.getElementById("neighbourhood");
  const datalist = document.getElementById("neighbourhoodList");

  select.addEventListener("change", () => {
    const borough = select.value;
    const color = BOROUGH_COLORS[borough] || "#fccc0a";
    document.documentElement.style.setProperty("--accent", color);
    dot.style.background = color;
    dot.style.boxShadow = `0 0 8px ${color}`;
    if (heroAccent) heroAccent.style.color = color;

    datalist.innerHTML = "";
    (BOROUGH_NEIGHBOURHOODS[borough] || []).forEach((n) => {
      const opt = document.createElement("option");
      opt.value = n;
      datalist.appendChild(opt);
    });
    neighbourhoodInput.placeholder = (BOROUGH_NEIGHBOURHOODS[borough] || [])[0]
      ? `e.g. ${BOROUGH_NEIGHBOURHOODS[borough][0]}`
      : "e.g. Williamsburg";
  });
})();

/* =========================================================
   AVAILABILITY SLIDER — live readout
   ========================================================= */
(function availabilitySlider(){
  const slider = document.getElementById("availability_365");
  const readout = document.getElementById("availabilityVal");
  slider.addEventListener("input", () => { readout.textContent = slider.value; });
})();

/* =========================================================
   SPLIT-FLAP BOARD
   ========================================================= */
const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ/ ";

function buildFlipboard(text){
  const board = document.getElementById("flipboard");
  board.innerHTML = "";
  const chars = text.toUpperCase().split("");
  const tiles = chars.map((ch) => {
    const tile = document.createElement("div");
    tile.className = "flap-tile" + (ch === " " ? " is-space" : "");
    const face = document.createElement("div");
    face.className = "flap-face";
    face.textContent = ch === " " ? "" : "";
    tile.appendChild(face);
    board.appendChild(tile);
    return { tile, face, target: ch };
  });
  return tiles;
}

function animateFlipboard(tiles){
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tiles.forEach((t, i) => {
    if (t.target === " "){ return; }
    if (reduceMotion){
      t.face.textContent = t.target;
      return;
    }
    const cycles = 5 + Math.floor(Math.random() * 5);
    let step = 0;
    const delay = i * 55;
    setTimeout(() => {
      const iv = setInterval(() => {
        step++;
        t.tile.classList.remove("flip");
        void t.tile.offsetWidth; /* restart animation */
        t.tile.classList.add("flip");
        if (step >= cycles){
          clearInterval(iv);
          t.face.textContent = t.target;
        } else {
          t.face.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
        }
      }, 70);
    }, delay);
  });
}

/* =========================================================
   RESULT RENDERING
   ========================================================= */
function renderResult(predictedLabel, probabilities){
  const resultSection = document.getElementById("resultSection");
  resultSection.hidden = false;

  const tiles = buildFlipboard(predictedLabel);
  animateFlipboard(tiles);

  const maxProb = Array.isArray(probabilities) && probabilities.length
    ? Math.max(...probabilities)
    : null;

  const confidenceFill = document.getElementById("confidenceFill");
  const confidenceValue = document.getElementById("confidenceValue");
  confidenceFill.style.width = "0%";
  requestAnimationFrame(() => {
    if (maxProb !== null){
      confidenceFill.style.width = (maxProb * 100).toFixed(1) + "%";
      confidenceValue.textContent = (maxProb * 100).toFixed(1) + "% confident";
    } else {
      confidenceFill.style.width = "0%";
      confidenceValue.textContent = "—";
    }
  });

  const probaBars = document.getElementById("probaBars");
  probaBars.innerHTML = "";
  if (Array.isArray(probabilities) && probabilities.length === CLASS_META.length){
    CLASS_META.forEach((cls, i) => {
      const pct = probabilities[i] * 100;
      const row = document.createElement("div");
      row.className = "proba-row" + (cls.key === predictedLabel ? " winner" : "");
      row.innerHTML = `
        <span class="proba-name">${cls.key}</span>
        <span class="proba-track"><span class="proba-fill" style="background:${cls.color}"></span></span>
        <span class="proba-pct">${pct.toFixed(1)}%</span>
      `;
      probaBars.appendChild(row);
      requestAnimationFrame(() => {
        row.querySelector(".proba-fill").style.width = pct + "%";
      });
    });
  }

  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* =========================================================
   FORM SUBMISSION
   ========================================================= */
(function formSubmit(){
  const form = document.getElementById("predictForm");
  const submitBtn = document.getElementById("submitBtn");
  const errorMsg = document.getElementById("errorMsg");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.hidden = true;

    if (!form.checkValidity()){
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const payload = {
      neighbourhood_group: data.get("neighbourhood_group"),
      neighbourhood: data.get("neighbourhood"),
      latitude: parseFloat(data.get("latitude")),
      longitude: parseFloat(data.get("longitude")),
      price: parseFloat(data.get("price")),
      minimum_nights: parseInt(data.get("minimum_nights"), 10),
      number_of_reviews: parseInt(data.get("number_of_reviews"), 10),
      reviews_per_month: parseFloat(data.get("reviews_per_month")),
      calculated_host_listings_count: parseInt(data.get("calculated_host_listings_count"), 10),
      availability_365: parseInt(data.get("availability_365"), 10),
    };

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    statusDot.style.background = "#fccc0a";
    statusDot.style.boxShadow = "0 0 8px #fccc0a";
    statusText.textContent = "PROCESSING…";

    try {
      const res = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok){
        const errBody = await res.json().catch(() => null);
        const detail = errBody && errBody.detail
          ? (Array.isArray(errBody.detail) ? errBody.detail.map(d => d.msg).join("; ") : errBody.detail)
          : `Request failed with status ${res.status}`;
        throw new Error(detail);
      }

      const result = await res.json();
      renderResult(result.Predicted_room_type, result.Probability);

      statusDot.style.background = "#00933c";
      statusDot.style.boxShadow = "0 0 8px #00933c";
      statusText.textContent = "SYSTEM ONLINE";
    } catch (err){
      errorMsg.textContent = "SERVICE ALERT — " + (err.message || "Could not reach the prediction service.");
      errorMsg.hidden = false;
      statusDot.style.background = "#ee352e";
      statusDot.style.boxShadow = "0 0 8px #ee352e";
      statusText.textContent = "CONNECTION ERROR";
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    document.getElementById("resultSection").hidden = true;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
})();
