const API = "http://localhost:8080/api";
const TOKEN_KEY = "aicte_token";

const $ = (id) => document.getElementById(id);

const loginView = $("login-view");
const dashboardView = $("dashboard-view");
const loginForm = $("login-form");
const loginBtn = $("login-btn");
const loginError = $("login-error");
const passwordInput = $("password");
const checkinBtn = $("checkin-btn");

/* ---------- Helpers ---------- */

let toastTimer;
function showToast(message, type = "success") {
  const toast = $("toast");
  toast.textContent = message;
  toast.className = "toast show " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.className = "toast"), 2800);
}

function showView(loggedIn) {
  loginView.hidden = loggedIn;
  dashboardView.hidden = !loggedIn;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function api(path, options = {}) {
  const res = await fetch(API + path, options);
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  return res.json();
}

/* ---------- Login ---------- */

$("toggle-password").addEventListener("click", () => {
  const show = passwordInput.type === "password";
  passwordInput.type = show ? "text" : "password";
  $("toggle-password").textContent = show ? "Hide" : "Show";
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.hidden = true;

  const username = $("username").value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    loginError.textContent = "Please enter both username and password.";
    loginError.hidden = false;
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in…";

  try {
    const data = await api("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    loginForm.reset();
    openDashboard();
  } catch (err) {
    loginError.textContent = "Could not log in. Is the backend running on port 8080?";
    loginError.hidden = false;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Log in";
  }
});

$("logout-btn").addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  showView(false);
});

/* ---------- Dashboard ---------- */

function renderStatus(d) {
  $("student-name").textContent = d.student;
  $("points").textContent = d.points;
  $("target").textContent = d.target;
  $("checkin-count").textContent = d.checkins;

  const percent = Math.min(100, Math.round((d.points / d.target) * 100));
  $("bar").style.width = percent + "%";
  $("bar").classList.toggle("done", percent >= 100);
  $("progress").setAttribute("aria-valuenow", percent);
  $("goal-message").hidden = percent < 100;

  const list = $("recent-list");
  list.innerHTML = "";
  if (!d.recent || d.recent.length === 0) {
    list.innerHTML = '<li class="empty">No check-ins yet.</li>';
  } else {
    d.recent.forEach((time) => {
      const li = document.createElement("li");
      li.textContent = "✅ " + formatTime(time);
      list.appendChild(li);
    });
  }
}

async function loadStatus() {
  try {
    renderStatus(await api("/status"));
  } catch (err) {
    showToast("Could not load status. Is the server running?", "error");
  }
}

function openDashboard() {
  showView(true);
  loadStatus();
}

checkinBtn.addEventListener("click", async () => {
  checkinBtn.disabled = true;
  checkinBtn.textContent = "Checking in…";

  try {
    await api("/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: new Date().toISOString() }),
    });
    showToast("Check-in recorded ✅");
    await loadStatus();
  } catch (err) {
    showToast("Check-in failed. Please try again.", "error");
  } finally {
    checkinBtn.disabled = false;
    checkinBtn.textContent = "Check in";
  }
});

/* ---------- Start ---------- */

if (localStorage.getItem(TOKEN_KEY)) {
  openDashboard();
} else {
  showView(false);
}
