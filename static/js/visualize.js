(() => {
  const vizFile = document.getElementById("vizFile");

  function requireFile() {
    const f = vizFile.files[0];
    if (!f) IBDE.toast("Choose a CSV file first.", "error");
    return f;
  }

  async function loadImage(button, endpoint, wrapEl, label) {
    const file = requireFile();
    if (!file) return;
    IBDE.setBusy(button, true, "Generating…");
    wrapEl.innerHTML = `<div class="empty-state"><div class="icon-wrap"><span class="spinner-ibde dark"></span></div><div class="sub">Rendering ${label}…</div></div>`;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) {
        let detail = `Request failed (${res.status})`;
        try {
          const j = await res.json();
          detail = j.detail || detail;
        } catch (e) {}
        throw new Error(detail);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      wrapEl.innerHTML = `<img src="${url}" class="result-img" alt="${label}">`;
      IBDE.toast(`${label} generated.`, "success");
    } catch (err) {
      wrapEl.innerHTML = `<div class="unavailable-banner"><span>${IBDE.escapeHtml(err.message)}</span></div>`;
      IBDE.toast(err.message, "error");
    } finally {
      IBDE.setBusy(button, false);
    }
  }

  document.getElementById("btnSummary").addEventListener("click", async () => {
    const file = requireFile();
    if (!file) return;
    const btn = document.getElementById("btnSummary");
    const wrap = document.getElementById("summaryWrap");
    IBDE.setBusy(btn, true, "Summarizing…");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { body } = await IBDE.apiFetch(IBDE.ENDPOINTS.vizSummary, { method: "POST", body: formData });
      wrap.innerHTML = `
        <div class="stat-grid" style="margin-bottom:20px;">
          <div class="stat-card"><div class="stat-label">Rows</div><div class="stat-value">${body["No. of rows"]}</div></div>
          <div class="stat-card"><div class="stat-label">Columns</div><div class="stat-value">${body["No. of columns"]}</div></div>
          <div class="stat-card"><div class="stat-label">Missing values</div><div class="stat-value">${body["No. of missing values"]}</div></div>
          <div class="stat-card"><div class="stat-label">Data types</div><div class="stat-value" style="font-size:12px;">${(body["Data types"] || []).join(", ")}</div></div>
        </div>`;
      IBDE.toast("Summary ready.", "success");
    } catch (err) {
      wrap.innerHTML = `<div class="unavailable-banner"><span>${IBDE.escapeHtml(err.message)}</span></div>`;
      IBDE.toast(err.message, "error");
    } finally {
      IBDE.setBusy(btn, false);
    }
  });

  document.getElementById("btnHeatmap").addEventListener("click", (e) =>
    loadImage(e.currentTarget, IBDE.ENDPOINTS.vizHeatmap, document.getElementById("heatmapWrap"), "heatmap")
  );
  document.getElementById("btnDistribution").addEventListener("click", (e) =>
    loadImage(e.currentTarget, IBDE.ENDPOINTS.vizDistribution, document.getElementById("distributionWrap"), "distribution plot")
  );
  document.getElementById("btnScatter").addEventListener("click", (e) =>
    loadImage(e.currentTarget, IBDE.ENDPOINTS.vizScatter, document.getElementById("scatterWrap"), "scatter plot")
  );

  document.getElementById("btnFtImp").addEventListener("click", async () => {
    const file = requireFile();
    if (!file) return;
    const btn = document.getElementById("btnFtImp");
    const wrap = document.getElementById("ftImpWrap");
    IBDE.setBusy(btn, true, "Computing…");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { body } = await IBDE.apiFetch(IBDE.ENDPOINTS.vizFeatureImportance, { method: "POST", body: formData });
      const rows = body["Feature importances"] || [];
      if (rows.length === 0) {
        wrap.innerHTML = `<div class="empty-state"><div class="sub">No feature importances returned.</div></div>`;
        return;
      }
      let html = '<div class="table-scroll"><table class="table-ibde"><thead><tr><th>Feature</th><th>Importance</th></tr></thead><tbody>';
      rows.forEach((r) => {
        html += `<tr><td>${IBDE.escapeHtml(r.Feature)}</td><td>${Number(r.Importance).toFixed(4)}</td></tr>`;
      });
      html += "</tbody></table></div>";
      wrap.innerHTML = html;
      IBDE.toast("Feature importance ready.", "success");
    } catch (err) {
      wrap.innerHTML = `<div class="unavailable-banner"><span>${IBDE.escapeHtml(err.message)}</span></div>`;
      IBDE.toast(err.message, "error");
    } finally {
      IBDE.setBusy(btn, false);
    }
  });
})();
