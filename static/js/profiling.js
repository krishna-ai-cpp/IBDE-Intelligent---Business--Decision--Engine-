(() => {
  const root = document.getElementById("profilingRoot");
  const dataset = IBDE.activeDataset();

  function unavailable() {
    root.innerHTML = `
      <div class="unavailable-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0; margin-top:1px;"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>
        <div>
          <strong>Profiling endpoint not available yet.</strong><br>
          The backend's profiling module (<code>data_profiling.py</code>) wasn't included in the
          project files, so <code>/profile</code> isn't registered on the API. This page is wired
          and ready — it will render automatically the moment that module is added.
        </div>
      </div>
      <div class="card-ibde">
        <div class="card-body-ibde">
          <div class="section-title" style="margin-top:0;">What this page will show</div>
          <div class="stat-grid">
            <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Rows</div><div class="stat-value">—</div></div>
            <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Columns</div><div class="stat-value">—</div></div>
            <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Missing values</div><div class="stat-value">—</div></div>
            <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Duplicate rows</div><div class="stat-value">—</div></div>
            <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Outliers</div><div class="stat-value">—</div></div>
            <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Skewness</div><div class="stat-value">—</div></div>
          </div>
        </div>
      </div>
    `;
  }

  async function load() {
    if (!dataset) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="icon-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 15l4-6 4 3 5-8"/></svg></div>
          <div class="title">No active dataset</div>
          <div class="sub">Upload a CSV first, then come back here to profile it.</div>
        </div>`;
      return;
    }
    try {
      const { body } = await IBDE.apiFetch(`${IBDE.ENDPOINTS.profile}?file_name=${encodeURIComponent(dataset)}`);
      if (!body) throw new Error("empty");
      const rows = [
        ["Rows", body.rows ?? body["Rows"]],
        ["Columns", body.columns ?? body["Columns"]],
        ["Missing values", body.missing_values ?? body["Missing values"]],
        ["Duplicate rows", body.duplicate_rows ?? body["Duplicate rows"]],
        ["Outliers", body.outliers ?? body["Outliers"]],
        ["Skewness", body.skewness ?? body["Skewness"]],
      ];
      root.innerHTML = `<div class="stat-grid">${rows
        .map(([label, val]) => `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${val ?? "—"}</div></div>`)
        .join("")}</div>`;
    } catch (err) {
      unavailable();
    }
  }

  load();
})();
