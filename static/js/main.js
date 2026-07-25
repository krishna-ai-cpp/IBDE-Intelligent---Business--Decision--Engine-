/* ==========================================================================
   IBDE shared front-end utilities
   Talks only to the existing FastAPI routers — no new backend endpoints.
   ========================================================================== */

const IBDE = (() => {
  const ENDPOINTS = {
    // NOTE: the upload router's own prefix contains a literal space
    // ("/dataset upload") in the backend — preserved as-is, just encoded.
    upload: "/dataset%20upload/upload",
    preprocess: (fileName) => `/preprocessing/preprocess?file_name=${encodeURIComponent(fileName)}`,
    recommend: (fileName, target) => {
      let url = `/recomendtion/rec?file_name=${encodeURIComponent(fileName)}`;
      if (target) url += `&target=${encodeURIComponent(target)}`;
      return url;
    },
    singlePredict: "/predictionAPI/single_predict",
    batchPredict: "/predictionAPI/batch_predict",
    docsDataset: "/documentation/dataset",
    docsModels: "/documentation/models",
    docsPreprocess: "/documentation/s_preprocess",
    docsVisuals: "/documentation/v_visual",
    vizSummary: "/summary/summary",
    vizHeatmap: "/summary/heatmap",
    vizDistribution: "/summary/distribution",
    vizScatter: "/summary/scatter",
    vizFeatureImportance: "/summary/ft_imp",
    profile: "/profile", // not registered in this build — data_profiling.py wasn't provided
    health: "/health",
  };

  function toastStack() {
    let el = document.querySelector(".toast-stack");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast-stack";
      document.body.appendChild(el);
    }
    return el;
  }

  function toast(message, type = "info", timeout = 4200) {
    const stack = toastStack();
    const node = document.createElement("div");
    node.className = `toast-ibde ${type}`;
    node.innerHTML = `<span>${message}</span>`;
    stack.appendChild(node);
    setTimeout(() => {
      node.style.opacity = "0";
      node.style.transition = "opacity .2s ease";
      setTimeout(() => node.remove(), 200);
    }, timeout);
  }

  async function apiFetch(url, options = {}) {
    let res;
    try {
      res = await fetch(url, options);
    } catch (err) {
      throw new Error("Could not reach the server. Confirm the FastAPI app is running.");
    }
    let body = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await res.json().catch(() => null);
    }
    if (!res.ok) {
      const detail = (body && body.detail) ? body.detail : `Request failed (${res.status})`;
      const err = new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return { response: res, body };
  }

  function setBusy(button, busy, busyLabel = "Working…") {
    if (!button) return;
    if (busy) {
      button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner-ibde"></span> ${busyLabel}`;
    } else {
      button.disabled = false;
      if (button.dataset.label) button.innerHTML = button.dataset.label;
    }
  }

  function bindDropzone(dropzoneEl, inputEl, onFile) {
    if (!dropzoneEl || !inputEl) return;
    dropzoneEl.addEventListener("click", () => inputEl.click());
    inputEl.addEventListener("change", () => {
      if (inputEl.files[0]) onFile(inputEl.files[0]);
    });
    ["dragenter", "dragover"].forEach((evt) =>
      dropzoneEl.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzoneEl.classList.add("drag-over");
      })
    );
    ["dragleave", "drop"].forEach((evt) =>
      dropzoneEl.addEventListener(evt, (e) => {
        e.preventDefault();
        dropzoneEl.classList.remove("drag-over");
      })
    );
    dropzoneEl.addEventListener("drop", (e) => {
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    });
  }

  function rememberDataset(filename) {
    sessionStorage.setItem("ibde_active_dataset", filename);
  }
  function activeDataset() {
    return sessionStorage.getItem("ibde_active_dataset") || "";
  }

  async function pollHealth() {
    const pill = document.querySelector("[data-health-pill]");
    const dot = document.querySelector("[data-health-dot]");
    if (!pill && !dot) return;
    try {
      const { body } = await apiFetch(ENDPOINTS.health);
      const ok = body && (body.API === "Healthy" || body.Server === "Running");
      if (pill) {
        pill.textContent = ok ? "API online" : "API responding";
        pill.classList.toggle("pill-success", true);
        pill.classList.remove("pill-danger");
      }
      if (dot) { dot.classList.add("online"); dot.classList.remove("offline"); }
    } catch (e) {
      if (pill) {
        pill.textContent = "API unreachable";
        pill.classList.add("pill-danger");
        pill.classList.remove("pill-success");
      }
      if (dot) { dot.classList.add("offline"); dot.classList.remove("online"); }
    }
  }

  function initShell() {
    const toggle = document.querySelector("[data-sidebar-toggle]");
    const sidebar = document.querySelector(".sidebar");
    if (toggle && sidebar) {
      toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
      document.addEventListener("click", (e) => {
        if (window.innerWidth > 960) return;
        if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
          sidebar.classList.remove("open");
        }
      });
    }
    pollHealth();
    setInterval(pollHealth, 15000);
  }

  function fileSizeLabel(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  document.addEventListener("DOMContentLoaded", initShell);

  return { ENDPOINTS, toast, apiFetch, setBusy, bindDropzone, rememberDataset, activeDataset, fileSizeLabel, escapeHtml };
})();
