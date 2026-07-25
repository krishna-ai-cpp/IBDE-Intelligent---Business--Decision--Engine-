(() => {
  const root = document.getElementById("validateRoot");
  const reRunBtn = document.getElementById("reRunBtn");

  function statusIcon(ok) {
    return ok
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`;
  }

  function card(title, ok, bodyHtml) {
    return `
      <div class="col-lg-6">
        <div class="card-ibde" style="height:100%;">
          <div class="card-head">
            <h5>${title}</h5>
            <span class="badge-ibde ${ok ? "badge-success" : "badge-danger"}">${statusIcon(ok)} ${ok ? "Passed" : "Failed"}</span>
          </div>
          <div class="card-body-ibde">${bodyHtml}</div>
        </div>
      </div>`;
  }

  async function check(label, url, renderBody) {
    try {
      const { body } = await IBDE.apiFetch(url);
      return card(label, true, renderBody(body));
    } catch (err) {
      return card(label, false, `<p style="font-size:12.5px; color:var(--text-muted);">${IBDE.escapeHtml(err.message)}</p>`);
    }
  }

  function statusList(obj) {
    return Object.entries(obj)
      .map(([k, v]) => {
        const ok = String(v).toLowerCase().includes("found") && !String(v).toLowerCase().includes("not");
        return `<div class="kv-row"><span class="k">${IBDE.escapeHtml(k)}</span><span class="v" style="color:${ok ? "var(--success)" : "var(--danger)"};">${IBDE.escapeHtml(v)}</span></div>`;
      })
      .join("");
  }

  async function runAll() {
    root.innerHTML = `<div class="col-12"><div class="empty-state"><div class="icon-wrap"><span class="spinner-ibde dark"></span></div><div class="title">Running checks…</div></div></div>`;

    const [datasetCard, modelsCard, preprocessCard, visualsCard] = await Promise.all([
      check("Dataset check", IBDE.ENDPOINTS.docsDataset, (b) => `
        <div class="kv-row"><span class="k">Rows</span><span class="v">${b.rows}</span></div>
        <div class="kv-row"><span class="k">Columns</span><span class="v">${b.columns}</span></div>
        <div class="kv-row"><span class="k">Column names</span><span class="v" style="text-align:right; max-width:60%;">${(b.column_name || []).slice(0, 6).join(", ")}${(b.column_name || []).length > 6 ? "…" : ""}</span></div>
      `),
      check("Model artifacts", IBDE.ENDPOINTS.docsModels, statusList),
      check("Prediction pipeline", IBDE.ENDPOINTS.docsPreprocess, (b) => `
        <p style="font-size:12.5px; color:var(--text-muted);">${IBDE.escapeHtml(b.message)}</p>
        <div class="kv-row"><span class="k">Sample prediction</span><span class="v">${IBDE.escapeHtml(JSON.stringify(b.sample_prediction))}</span></div>
      `),
      check("Generated visuals", IBDE.ENDPOINTS.docsVisuals, statusList),
    ]);

    root.innerHTML = datasetCard + modelsCard + preprocessCard + visualsCard;
  }

  reRunBtn.addEventListener("click", runAll);
  runAll();
})();
