const DEFAULT_API = "http://127.0.0.1:8000/api/v1";
const api = document.getElementById("api");
const token = document.getElementById("token");
const status = document.getElementById("status");

async function load() {
  const data = await chrome.storage.local.get(["apiBaseUrl", "token"]);
  api.value = data.apiBaseUrl || DEFAULT_API;
  token.value = data.token || "";
}

document.getElementById("save").addEventListener("click", async () => {
  const apiBaseUrl = api.value.trim().replace(/\/+$/, "");
  const jwt = token.value.trim();

  if (!/^https?:\/\//i.test(apiBaseUrl)) {
    status.textContent = "API base URL must use HTTP or HTTPS.";
    return;
  }
  if (!jwt) {
    status.textContent = "Enter your authenticated CyberShield JWT.";
    return;
  }

  await chrome.storage.local.set({ apiBaseUrl, token: jwt });
  status.textContent = "Settings saved.";
});

void load();
