(() => {
  const spFile = document.getElementById("spFile");
  const spColumn = document.getElementById("spColumn");
  const spBtn = document.getElementById("spBtn");
  const spResult = document.getElementById("spResult");

  const bpFile = document.getElementById("bpFile");
  const bpBtn = document.getElementById("bpBtn");
  const bpResult = document.getElementById("bpResult");

  spBtn.addEventListener("click", async () => {
    const file = spFile.files[0];
    const column = spColumn.value.trim();
    if (!file || !column) {
      IBDE.toast("Choose a file and a column name.", "error");
      return;
    }
    IBDE.setBusy(spBtn, true, "Predicting…");
    spResult.innerHTML = "";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("input", column);
      const { body } = await IBDE.apiFetch(IBDE.ENDPOINTS.singlePredict, { method: "POST", body: formData });
      const preds = body.predictions || [];
      spResult.innerHTML = `
        <div class="badge-ibde badge-success">Prediction Result</div>
        <div class="kv-row"><span class="k">Rows scored</span><span class="v">${body.rows}</span></div>
        <div class="kv-row"><span class="k">Columns</span><span class="v">${body.columns}</span></div>
        <div style="margin-top:10px; max-height:180px; overflow:auto;" class="mono" >
          ${preds.slice(0, 50).map((p) => `<div class="kv-row"><span class="k">row</span><span class="v">${IBDE.escapeHtml(JSON.stringify(p))}</span></div>`).join("")}
        </div>
      `;
      IBDE.toast("Prediction complete.", "success");
    } catch (err) {
      spResult.innerHTML = `<div class="unavailable-banner"><span>${IBDE.escapeHtml(err.message)}</span></div>`;
      IBDE.toast(err.message, "error");
    } finally {
      IBDE.setBusy(spBtn, false);
    }
  });

  bpBtn.addEventListener("click", async () => {
    const file = bpFile.files[0];
    if (!file) {
      IBDE.toast("Choose a CSV file first.", "error");
      return;
    }
    IBDE.setBusy(bpBtn, true, "Scoring…");
    bpResult.innerHTML = "";
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { body } = await IBDE.apiFetch(IBDE.ENDPOINTS.batchPredict, { method: "POST", body: formData });
      const records = body.records || [];
      if (records.length === 0) {
        bpResult.innerHTML = `<div class="empty-state"><div class="sub">No records returned.</div></div>`;
        return;
      }
      const cols = Object.keys(records[0]);
      let html = '<div class="table-scroll" style="max-height:320px;"><table class="table-ibde"><thead><tr>';
      cols.forEach((c) => (html += `<th>${IBDE.escapeHtml(c)}</th>`));
      html += "</tr></thead><tbody>";
      records.slice(0, 100).forEach((r) => {
        html += "<tr>";
        cols.forEach((c) => (html += `<td>${IBDE.escapeHtml(r[c])}</td>`));
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      bpResult.innerHTML = html;
      IBDE.toast(`Scored ${records.length} record(s).`, "success");
    } catch (err) {
      bpResult.innerHTML = `<div class="unavailable-banner"><span>${IBDE.escapeHtml(err.message)}</span></div>`;
      IBDE.toast(err.message, "error");
    } finally {
      IBDE.setBusy(bpBtn, false);
    }
  });
})();
