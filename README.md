<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AICTE Activity Tracker</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/html5-qrcode"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>

<header class="topbar">
  <div class="brand"><span class="brand-mark">A</span> AICTE Activity Tracker</div>
  <div class="role-switch" role="tablist">
    <button id="studentBtn" class="active" onclick="switchRole('student')">Student</button>
    <button id="facultyBtn" onclick="switchRole('faculty')">Faculty / Mentor</button>
  </div>
</header>

<!-- STUDENT -->
<main id="studentView">
  <section class="hero">
    <div>
      <p class="hero-sub">Welcome back, Aditi</p>
      <h1>You're <span id="remaining">25</span> points away from your 100-point target.</h1>
      <p class="hero-note">Check in at events with GPS, QR and a photo to earn points.</p>
    </div>
    <div class="progress-ring">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ff9933"/><stop offset="100%" stop-color="#fcd34d"/>
          </linearGradient>
        </defs>
        <circle class="progress-bg" cx="90" cy="90" r="70"/>
        <circle id="progressCircle" class="progress-value" cx="90" cy="90" r="70"/>
      </svg>
      <div class="progress-text"><strong id="pointsValue">0</strong><span>of 100</span></div>
    </div>
  </section>

  <section class="cards">
    <div class="card c-blue"><span class="card-icon">🎯</span><p class="card-label">Points left</p><p class="big-number" id="pointsLeft">25</p></div>
    <div class="card c-green"><span class="card-icon">✅</span><p class="card-label">Approved activities</p><p class="big-number" id="activityCount">0</p></div>
    <div class="card c-amber"><span class="card-icon">🚦</span><p class="card-label">Semester status</p><div id="statusBadge" class="status green">On track</div></div>
  </section>

  <div class="grid-2">
    <section class="panel">
      <h2>📍 Venue check-in</h2>
      <p class="muted">Allow location access to confirm you're inside the event venue.</p>
      <button class="primary-btn" onclick="startLocation()">Start GPS tracking</button>
      <div id="locationStatus" class="info-box">Location not started.</div>
      <div id="geoBadge" class="geo-badge hidden"></div>
      <div id="map"></div>
    </section>

    <div class="stack">
      <section class="panel">
        <h2>📱 QR check-in</h2>
        <p class="muted">Scan the event QR code shown at the venue.</p>
        <div id="reader"></div>
        <button class="primary-btn" onclick="startQRScanner()">Start QR scanner</button>
        <div id="qrResult" class="info-box">QR scanner inactive.</div>
      </section>

      <section class="panel">
        <h2>📷 Venue photo</h2>
        <p class="muted">Take a live photo at the venue as proof of attendance.</p>
        <video id="camera" autoplay playsinline></video>
        <canvas id="snapshotCanvas"></canvas>
        <div class="button-group">
          <button class="primary-btn" onclick="startCamera()">Start camera</button>
          <button class="secondary-btn" onclick="takeSnapshot()">Take photo</button>
        </div>
        <img id="snapshot" alt="">
        <p id="exifStatus" class="muted"></p>
      </section>
    </div>
  </div>

  <div class="grid-2 wide-left">
    <section class="panel">
      <h2>📋 Activity point ledger</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Activity</th><th>Category</th><th>Points</th><th>Status</th></tr></thead>
          <tbody id="activityTable"></tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h2>📊 Points by category</h2>
      <canvas id="activityChart"></canvas>
      <button class="primary-btn full" onclick="generatePDF()">Download transcript (PDF)</button>
    </section>
  </div>
</main>

<!-- FACULTY -->
<main id="facultyView" class="hidden">
  <section class="hero single">
    <div>
      <p class="hero-sub">Faculty / Mentor</p>
      <h1>Review attendance and approve OD requests.</h1>
      <p class="hero-note"><span id="pendingCount">2</span> requests waiting for your decision.</p>
    </div>
  </section>

  <div class="grid-2 wide-left">
    <section class="panel">
      <h2>📋 OD approval queue</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Student</th><th>Event</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            <tr><td>Aditi Singh</td><td>Innovation Workshop</td><td>02 Oct 2026</td>
              <td><button class="approve" onclick="decideOD(this,true)">Approve</button><button class="reject" onclick="decideOD(this,false)">Reject</button></td></tr>
            <tr><td>Rahul Sharma</td><td>NSS Activity</td><td>02 Oct 2026</td>
              <td><button class="approve" onclick="decideOD(this,true)">Approve</button><button class="reject" onclick="decideOD(this,false)">Reject</button></td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <h2>👥 Event attendees</h2>
      <ul id="attendeeList">
        <li><span class="avatar">AS</span>Aditi Singh<em class="pill ok">Checked in</em></li>
        <li><span class="avatar">RS</span>Rahul Sharma<em class="pill ok">Checked in</em></li>
        <li><span class="avatar">PP</span>Priya Patel<em class="pill ok">Checked in</em></li>
        <li><span class="avatar">KS</span>Karan Shah<em class="pill wait">Pending</em></li>
      </ul>
    </section>
  </div>
</main>

<div id="toast" class="toast" role="status"></div>
<footer><p>© 2026 AICTE Activity Tracker</p></footer>
<script src="script.js"></script>
</body>
</html>
:root{
  --navy:#0f1b4d; --navy-2:#1e2f7a; --blue:#2f5bea;
  --saffron:#ff9933; --saffron-soft:#fff1e0;
  --green:#138808; --green-soft:#e3f6e1;
  --amber-soft:#fef3c7; --red:#d92d20; --red-soft:#fde8e6;
  --bg:#f3f5fb; --card:#fff; --text:#16203a; --muted:#64708f; --line:#e6e9f4;
  --shadow:0 10px 30px rgba(15,27,77,.08);
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5}
.hidden{display:none!important}
.muted{color:var(--muted);font-size:14px}
:focus-visible{outline:3px solid var(--saffron);outline-offset:2px}

/* Header: tricolour stripe on top */
.topbar{background:linear-gradient(120deg,var(--navy),var(--navy-2));color:#fff;padding:16px 6%;
  display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:20;
  border-top:5px solid;border-image:linear-gradient(90deg,var(--saffron) 33%,#fff 33% 66%,var(--green) 66%) 1}
.brand{font-size:20px;font-weight:800;display:flex;align-items:center;gap:10px}
.brand-mark{width:34px;height:34px;border-radius:10px;background:var(--saffron);color:var(--navy);display:grid;place-items:center;font-weight:800}
.role-switch{display:flex;gap:4px;background:rgba(255,255,255,.12);padding:4px;border-radius:12px}
.role-switch button{border:0;padding:9px 16px;border-radius:9px;cursor:pointer;background:transparent;color:#dfe5ff;font:600 14px inherit;font-family:inherit}
.role-switch button.active{background:#fff;color:var(--navy)}

/* Hero */
.hero{margin:28px 6% 0;padding:34px 40px;border-radius:24px;color:#fff;
  background:radial-gradient(circle at 90% 10%,rgba(255,153,51,.35),transparent 45%),linear-gradient(120deg,var(--navy),var(--blue));
  display:flex;justify-content:space-between;align-items:center;gap:24px;box-shadow:var(--shadow)}
.hero h1{font-size:30px;line-height:1.25;max-width:520px;margin:6px 0 10px}
.hero-sub{color:#ffd9a8;font-weight:600}
.hero-note{color:#d6defc}
.hero.single{padding:28px 40px}

/* Ring */
.progress-ring{position:relative;width:180px;height:180px;flex-shrink:0}
.progress-ring svg{transform:rotate(-90deg)}
.progress-bg,.progress-value{fill:none;stroke-width:14}
.progress-bg{stroke:rgba(255,255,255,.18)}
.progress-value{stroke:url(#ringGrad);stroke-linecap:round;stroke-dasharray:440;stroke-dashoffset:440;transition:stroke-dashoffset 1s ease}
.progress-text{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center}
.progress-text strong{font-size:40px;line-height:1}
.progress-text span{font-size:13px;color:#d6defc}

/* Stat cards */
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:22px 6%}
.card{background:var(--card);border-radius:18px;padding:22px;box-shadow:var(--shadow);border-left:6px solid var(--blue)}
.c-green{border-left-color:var(--green)} .c-amber{border-left-color:var(--saffron)}
.card-icon{font-size:22px}
.card-label{color:var(--muted);font-size:14px;font-weight:600;margin-top:6px}
.big-number{font-size:40px;font-weight:800;line-height:1.2}

.status{display:inline-block;margin-top:10px;padding:8px 14px;border-radius:999px;font-weight:700;font-size:14px}
.status.green{background:var(--green-soft);color:var(--green)}
.status.amber{background:var(--amber-soft);color:#92400e}
.status.red{background:var(--red-soft);color:var(--red)}

/* Layout */
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:0 6% 20px;align-items:start}
.grid-2.wide-left{grid-template-columns:1.4fr 1fr}
.stack{display:grid;gap:20px}
.panel{background:var(--card);padding:26px;border-radius:20px;box-shadow:var(--shadow)}
.panel h2{font-size:19px;margin-bottom:6px}
.panel .muted{margin-bottom:12px}

/* Buttons */
.primary-btn,.secondary-btn,.approve,.reject{border:0;padding:11px 18px;border-radius:10px;cursor:pointer;font:600 14px inherit;font-family:inherit;margin:8px 8px 8px 0;transition:transform .12s,box-shadow .12s}
.primary-btn{background:linear-gradient(120deg,var(--blue),var(--navy-2));color:#fff;box-shadow:0 6px 14px rgba(47,91,234,.3)}
.primary-btn.full{width:100%;margin-top:18px;background:linear-gradient(120deg,var(--saffron),#ff7a00);box-shadow:0 6px 14px rgba(255,122,0,.3)}
.secondary-btn{background:#eef1fb;color:var(--navy)}
.approve{background:var(--green);color:#fff}.reject{background:var(--red);color:#fff}
.primary-btn:hover,.secondary-btn:hover,.approve:hover,.reject:hover{transform:translateY(-1px)}

/* Info */
.info-box{margin-top:10px;padding:14px;border-radius:12px;background:#eef3ff;color:#1e3a8a;font-size:14px}
.info-box.ok{background:var(--green-soft);color:var(--green)}
.info-box.err{background:var(--red-soft);color:var(--red)}
.geo-badge{margin-top:10px;padding:12px 14px;border-radius:12px;font-weight:700}
.geo-badge.in{background:var(--green-soft);color:var(--green)}
.geo-badge.out{background:var(--red-soft);color:var(--red)}
#map{height:320px;margin-top:14px;border-radius:14px;z-index:1}
#reader{width:100%;max-width:420px;margin:10px auto}
#camera{width:100%;max-width:420px;border-radius:14px;background:#0b1220;display:block;margin:10px auto}
#snapshotCanvas{display:none}
#snapshot{display:block;max-width:420px;width:100%;margin:10px auto;border-radius:14px}
#snapshot:not([src]){display:none}

/* Table */
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;margin-top:8px}
th,td{padding:13px 12px;border-bottom:1px solid var(--line);text-align:left;font-size:14px}
th{color:var(--muted);font-weight:700;background:#f8f9fe}
.pill{font-style:normal;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px}
.pill.ok{background:var(--green-soft);color:var(--green)}
.pill.wait{background:var(--amber-soft);color:#92400e}
.pill.bad{background:var(--red-soft);color:var(--red)}

/* Attendees */
#attendeeList{list-style:none}
#attendeeList li{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-weight:600}
#attendeeList .pill{margin-left:auto}
.avatar{width:36px;height:36px;border-radius:50%;background:var(--saffron-soft);color:#b45309;display:grid;place-items:center;font-size:13px;font-weight:800}

/* Toast */
.toast{position:fixed;bottom:24px;left:50%;transform:translate(-50%,120px);background:var(--navy);color:#fff;padding:12px 20px;border-radius:12px;box-shadow:var(--shadow);transition:transform .3s;z-index:50;font-weight:600}
.toast.show{transform:translate(-50%,0)}

footer{text-align:center;padding:28px;color:var(--muted);font-size:14px}

@media (max-width:900px){
  .grid-2,.grid-2.wide-left,.cards{grid-template-columns:1fr}
  .hero{flex-direction:column;text-align:center;padding:28px 20px}
  .hero h1{font-size:24px}
  .topbar{flex-direction:column;gap:12px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
/* ===== CONFIG ===== */
const API = "http://localhost:8080/api";
const TARGET_POINTS = 100;
const EVENT = { lat: 19.0760, lng: 72.8777, radius: 100 }; // replace with your venue

/* ===== STATE ===== */
let activities = [
  { name: "NSS Camp", category: "NSS", points: 20, status: "Approved" },
  { name: "Sports Event", category: "Sports", points: 15, status: "Approved" },
  { name: "Innovation Workshop", category: "Innovation", points: 25, status: "Approved" },
  { name: "Technical Seminar", category: "Technical", points: 15, status: "Pending" }
];
let map, studentMarker, watchID, cameraStream, qrScanner, chart;
let insideVenue = false, qrDone = false;

const $ = id => document.getElementById(id);
const approvedPoints = () => activities.filter(a => a.status === "Approved").reduce((s, a) => s + a.points, 0);

/* ===== UI HELPERS ===== */
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

function switchRole(role) {
  const student = role === "student";
  $("studentView").classList.toggle("hidden", !student);
  $("facultyView").classList.toggle("hidden", student);
  $("studentBtn").classList.toggle("active", student);
  $("facultyBtn").classList.toggle("active", !student);
  if (student && map) setTimeout(() => map.invalidateSize(), 100);
}

/* ===== PROGRESS / LEDGER / CHART ===== */
function refreshDashboard() {
  const pts = Math.min(approvedPoints(), TARGET_POINTS);
  $("progressCircle").style.strokeDashoffset = 440 - (pts / TARGET_POINTS) * 440;
  $("pointsValue").textContent = pts;
  $("pointsLeft").textContent = Math.max(TARGET_POINTS - pts, 0);
  $("remaining").textContent = Math.max(TARGET_POINTS - pts, 0);
  $("activityCount").textContent = activities.filter(a => a.status === "Approved").length;

  const badge = $("statusBadge");
  if (pts >= 75) { badge.className = "status green"; badge.textContent = "On track"; }
  else if (pts >= 50) { badge.className = "status amber"; badge.textContent = "Nearing deadline"; }
  else { badge.className = "status red"; badge.textContent = "Graduation risk"; }

  const cls = { Approved: "ok", Pending: "wait", Rejected: "bad" };
  $("activityTable").innerHTML = activities.map(a => `
    <tr><td>${a.name}</td><td>${a.category}</td><td><b>${a.points}</b></td>
    <td><span class="pill ${cls[a.status]}">${a.status}</span></td></tr>`).join("");

  const totals = {};
  activities.filter(a => a.status === "Approved")
    .forEach(a => totals[a.category] = (totals[a.category] || 0) + a.points);
  chart.data.labels = Object.keys(totals);
  chart.data.datasets[0].data = Object.values(totals);
  chart.update();
}

function createChart() {
  chart = new Chart($("activityChart"), {
    type: "doughnut",
    data: { labels: [], datasets: [{
      data: [], borderWidth: 3, borderColor: "#fff",
      backgroundColor: ["#2f5bea", "#ff9933", "#138808", "#8b5cf6", "#ec4899"]
    }] },
    options: { cutout: "65%", plugins: { legend: { position: "bottom" } } }
  });
}

/* ===== MAP & GPS ===== */
function initializeMap() {
  map = L.map("map").setView([EVENT.lat, EVENT.lng], 16);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
  L.marker([EVENT.lat, EVENT.lng]).addTo(map).bindPopup("📍 Event venue");
  L.circle([EVENT.lat, EVENT.lng], { radius: EVENT.radius, color: "#138808", fillColor: "#138808", fillOpacity: .2 }).addTo(map);
}

function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function startLocation() {
  const status = $("locationStatus");
  if (!navigator.geolocation) { status.className = "info-box err"; status.textContent = "Location isn't supported on this device."; return; }
  if (watchID) return toast("GPS tracking is already running");
  status.textContent = "Searching for your location…";

  watchID = navigator.geolocation.watchPosition(pos => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    if (!studentMarker) studentMarker = L.marker([lat, lng]).addTo(map).bindPopup("🎓 You");
    else studentMarker.setLatLng([lat, lng]);
    map.setView([lat, lng]);

    const d = distanceM(lat, lng, EVENT.lat, EVENT.lng);
    insideVenue = d <= EVENT.radius;
    status.className = "info-box";
    status.innerHTML = `Lat ${lat.toFixed(5)} · Lng ${lng.toFixed(5)}<br>Accuracy ±${accuracy.toFixed(0)} m · ${d.toFixed(0)} m from venue`;
    const badge = $("geoBadge");
    badge.className = "geo-badge " + (insideVenue ? "in" : "out");
    badge.textContent = insideVenue ? "🟢 You are inside the venue" : "🔴 You are outside the venue";
  }, err => {
    status.className = "info-box err";
    status.textContent = "Location error: " + err.message + ". Allow location access and try again.";
    watchID = null;
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 });
}

/* ===== QR ===== */
function startQRScanner() {
  const result = $("qrResult");
  if (qrScanner) return toast("Scanner is already running");
  if (qrDone) return toast("You've already checked in for this event");
  qrScanner = new Html5Qrcode("reader");
  qrScanner.start({ facingMode: "environment" }, { fps: 10, qrbox: 250 }, async code => {
    await qrScanner.stop().catch(() => {});
    qrScanner = null; qrDone = true;
    result.className = "info-box ok";
    result.innerHTML = `Checked in. Event code: <b>${code}</b>`;
    if (!insideVenue) toast("Note: GPS has not confirmed you are at the venue");
    activities.push({ name: "QR check-in: " + code, category: "Event", points: 10, status: "Pending" });
    queueCheckin({ eventCode: code, points: 10, insideVenue });
    refreshDashboard();
    toast("Check-in sent for approval");
  }).catch(e => {
    qrScanner = null;
    result.className = "info-box err";
    result.textContent = "Couldn't open the camera. Allow camera access and try again.";
    console.error(e);
  });
}

/* ===== CAMERA ===== */
async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    $("camera").srcObject = cameraStream;
  } catch (e) { toast("Camera permission denied"); console.error(e); }
}

function takeSnapshot() {
  if (!cameraStream) return toast("Start the camera first");
  const v = $("camera"), c = $("snapshotCanvas");
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  $("snapshot").src = c.toDataURL("image/jpeg", .9);
  $("exifStatus").textContent = "Photo captured at " + new Date().toLocaleString("en-IN") + ".";
  toast("Photo captured");
}

/* ===== PDF ===== */
function generatePDF() {
  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(20); doc.text("AICTE Activity Transcript", 20, 20);
  doc.setFontSize(12);
  doc.text("Student: Aditi Singh", 20, 35);
  doc.text(`Approved points: ${approvedPoints()} / ${TARGET_POINTS}`, 20, 43);
  doc.autoTable({
    startY: 55, headStyles: { fillColor: [15, 27, 77] },
    head: [["Activity", "Category", "Points", "Status"]],
    body: activities.map(a => [a.name, a.category, a.points, a.status])
  });
  doc.save("AICTE-Activity-Transcript.pdf");
}

/* ===== FACULTY ===== */
function decideOD(btn, approved) {
  btn.parentElement.innerHTML = approved
    ? '<span class="pill ok">Approved</span>' : '<span class="pill bad">Rejected</span>';
  const left = document.querySelectorAll("#facultyView .approve").length;
  $("pendingCount").textContent = left;
  toast(approved ? "Request approved" : "Request rejected");
}

/* ===== OFFLINE QUEUE + BACKEND SYNC ===== */
function queueCheckin(item) {
  const q = JSON.parse(localStorage.getItem("offlineCheckins") || "[]");
  q.push({ ...item, timestamp: new Date().toISOString() });
  localStorage.setItem("offlineCheckins", JSON.stringify(q));
  if (navigator.onLine) syncCheckins();
}

async function syncCheckins() {
  const q = JSON.parse(localStorage.getItem("offlineCheckins") || "[]");
  const remaining = [];
  for (const item of q) {
    try {
      const r = await fetch(API + "/checkin", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item)
      });
      if (!r.ok) remaining.push(item);
    } catch { remaining.push(item); }   // keep it for the next sync
  }
  localStorage.setItem("offlineCheckins", JSON.stringify(remaining));
}

window.addEventListener("online", syncCheckins);

/* ===== INIT ===== */
window.onload = () => {
  initializeMap();
  createChart();
  refreshDashboard();
  syncCheckins();
};
import com.sun.net.httpserver.Headers;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

public class Main {

    // In-memory store for the demo. Replace with a database later.
    private static final List<String> checkins = new CopyOnWriteArrayList<>();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api/checkin", Main::handleCheckin);
        server.createContext("/api/status", Main::handleStatus);
        server.start();
        System.out.println("AICTE Backend running on http://localhost:8080");
    }

    private static void handleCheckin(HttpExchange ex) throws IOException {
        addCors(ex);
        switch (ex.getRequestMethod().toUpperCase()) {
            case "OPTIONS" -> ex.sendResponseHeaders(204, -1);   // browser CORS preflight
            case "POST" -> {
                String body = new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                checkins.add(body);
                send(ex, 200, "{\"status\":\"success\",\"message\":\"Check-in recorded\"}");
            }
            default -> ex.sendResponseHeaders(405, -1);
        }
        ex.close();
    }

    private static void handleStatus(HttpExchange ex) throws IOException {
        addCors(ex);
        send(ex, 200, "{\"student\":\"Aditi Singh\",\"points\":75,\"target\":100,\"checkins\":"
                + checkins.size() + "}");
        ex.close();
    }

    private static void addCors(HttpExchange ex) {
        Headers h = ex.getResponseHeaders();
        h.set("Access-Control-Allow-Origin", "*");
        h.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        h.set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void send(HttpExchange ex, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);   // length in bytes, not chars
        ex.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        ex.sendResponseHeaders(code, bytes.length);
        ex.getResponseBody().write(bytes);
    }
}
