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
