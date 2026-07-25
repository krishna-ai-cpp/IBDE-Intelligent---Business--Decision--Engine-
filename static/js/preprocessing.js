(() => {
  const fileName = document.getElementById("fileName");
  const targetCol = document.getElementById("targetCol");
  const runBtn = document.getElementById("runBtn");
  const resultWrap = document.getElementById("resultWrap");

  const remembered = IBDE.activeDataset();
  if (remembered) fileName.value = remembered;

  runBtn.addEventListener("click", async () => {
    const fname = fileName.value.trim();
    const target = targetCol.value.trim();
    if (!fname || !target) {
      IBDE.toast("Enter both a dataset filename and a target column.", "error");
      return;
    }

    IBDE.setBusy(runBtn, true, "Processing…");
    try {
      const { body } = await IBDE.apiFetch(IBDE.ENDPOINTS.preprocess(fname), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: target }),
      });
      IBDE.toast("Preprocessing completed.", "success");
      resultWrap.innerHTML = `
        <div class="stat-grid" style="margin-bottom:16px;">
          <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Rows</div><div class="stat-value">${body.rows}</div></div>
          <div class="stat-card" style="box-shadow:none;"><div class="stat-label">Transformed columns</div><div class="stat-value">${body.columns}</div></div>
        </div>
        <div class="badge-ibde badge-success">${IBDE.escapeHtml(body.message)}</div>
      `;
    } catch (err) {
      resultWrap.innerHTML = `<div class="unavailable-banner"><span>${IBDE.escapeHtml(err.message)}</span></div>`;
      IBDE.toast(err.message, "error");
    } finally {
      IBDE.setBusy(runBtn, false);
    }
  });
})();
