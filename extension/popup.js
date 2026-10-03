const DEFAULT_API = "http://127.0.0.1:8000/api/v1";

const $ = (id) => document.getElementById(id);
let currentUrl = "";

async function loadSettings() {
  const data = await chrome.storage.local.get(["apiBaseUrl", "token"]);
  return {
    apiBaseUrl: (data.apiBaseUrl || DEFAULT_API).replace(/\/+$/, ""),
    token: data.token || "",
  };
}

async function getCurrentTabUrl() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url || "";
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("This page does not expose an HTTP(S) URL that CyberShield can analyze.");
  }
  return url;
}

function showStatus(message, isError = false) {
  $("status").textContent = message;
  $("status").style.color = isError ? "#fb7185" : "#9db3c0";
}

function renderResult(data) {
  $("score").textContent = data.risk_score ?? "—";
  $("level").textContent = data.risk_level || "UNKNOWN";
  $("category").textContent = data.threat_category || "UNKNOWN";
  $("confidence").textContent = data.confidence == null ? "—" : data.confidence + "%";

  const recommendation =
    data.analysis_details?.recommendation ||
    data.analysis_details?.recommendations?.[0] ||
    (data.risk_level === "LOW"
      ? "No high-risk evidence was identified. Continue normal browser hygiene."
      : "Treat this URL cautiously and review the indicators before proceeding.");
  $("recommendation").textContent = recommendation;

  const list = $("indicators");
  list.replaceChildren();
  for (const indicator of data.indicators || []) {
    const item = document.createElement("li");
    item.textContent = indicator.name + (indicator.description ? ": " + indicator.description : "");
    list.appendChild(item);
  }
  $("result").classList.remove("hidden");
}

async function scan() {
  const button = $("scan");
  button.disabled = true;
  $("result").classList.add("hidden");
  showStatus("Sending the current URL to CyberShield…");

  try {
    const settings = await loadSettings();
    if (!settings.token) {
      throw new Error("Add your CyberShield JWT in Extension settings before scanning.");
    }

    const response = await fetch(settings.apiBaseUrl + "/analysis/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + settings.token,
      },
      body: JSON.stringify({ input_type: "URL", content: currentUrl }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.detail || "CyberShield rejected the URL analysis request.");
    }

    renderResult(payload);
    showStatus("Analysis completed.");
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "Unable to analyze this URL.", true);
  } finally {
    button.disabled = false;
  }
}

$("settings").addEventListener("click", () => chrome.runtime.openOptionsPage());
$("scan").addEventListener("click", scan);

(async () => {
  try {
    currentUrl = await getCurrentTabUrl();
    $("current-url").textContent = currentUrl;
  } catch (error) {
    $("current-url").textContent = error instanceof Error ? error.message : "Unsupported page.";
    $("scan").disabled = true;
  }
})();
