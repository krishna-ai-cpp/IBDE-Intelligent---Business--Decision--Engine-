(() => {
  const fileName = document.getElementById("fileName");
  const targetCol = document.getElementById("targetCol");
  const runBtn = document.getElementById("runBtn");
  const resultWrap = document.getElementById("resultWrap");

  const remembered = IBDE.activeDataset();
  if (remembered) fileName.value = remembered;

  function renderClustering(body) {
    resultWrap.innerHTML = `
      <span class="badge-ibde badge-neutral">Problem type · Clustering</span>
      <h5 style="margin:12px 0 4px;">${IBDE.escapeHtml(body["BEST MODEL"] ?? "—")}</h5>
      <p style="font-size:12.5px; color:var(--text-muted);">
        No target column was given, so the engine grouped similar records together instead of
        predicting a value. It compared clustering algorithms by silhouette score — how well-separated
        the resulting groups are — and returned the strongest one.
      </p>
      <div class="kv-row"><span class="k">Silhouette score</span><span class="v">${body["silhouette score"] ?? body["BEST SCORE"] ?? "—"}</span></div>
      <div class="kv-row"><span class="k">Records clustered</span><span class="v">${(body["Kmeans prediction"] || []).length}</span></div>
      <div class="divider"></div>
      <div class="section-title" style="margin-top:0;">Business read</div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:0;">
        Use these clusters as customer, product, or transaction segments — a starting point for
        targeted strategy rather than a single predicted outcome.
      </p>
    `;
  }

  function renderRegression(body) {
    resultWrap.innerHTML = `
      <span class="badge-ibde badge-neutral">Problem type · Regression</span>
      <h5 style="margin:12px 0 4px;">Regression model</h5>
      <p style="font-size:12.5px; color:var(--text-muted);">
        The target column holds numeric values, so the engine trained a regressor to predict that
        number directly from the other columns.
      </p>
      <div class="kv-row"><span class="k">MAE</span><span class="v">${body["MAE"]?.toFixed ? body["MAE"].toFixed(4) : body["MAE"]}</span></div>
      <div class="kv-row"><span class="k">MSE</span><span class="v">${body["MSE"]?.toFixed ? body["MSE"].toFixed(4) : body["MSE"]}</span></div>
      <div class="kv-row"><span class="k">RMSE</span><span class="v">${body["RMSE"]?.toFixed ? body["RMSE"].toFixed(4) : body["RMSE"]}</span></div>
      <div class="kv-row"><span class="k">R² score</span><span class="v">${body["R^2 SCORE"]?.toFixed ? body["R^2 SCORE"].toFixed(4) : body["R^2 SCORE"]}</span></div>
      <div class="divider"></div>
      <div class="section-title" style="margin-top:0;">Business read</div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:0;">
        R² closer to 1 means the model explains most of the variation in the target — a strong basis
        for forecasting; closer to 0 means the relationship is weak and other data may be needed.
      </p>
    `;
  }

  function renderClassification(body) {
    resultWrap.innerHTML = `
      <span class="badge-ibde badge-neutral">Problem type · Classification</span>
      <h5 style="margin:12px 0 4px;">${IBDE.escapeHtml(body["Best Model"] ?? "—")}</h5>
      <p style="font-size:12.5px; color:var(--text-muted);">
        The target column holds categories, so the engine raced Logistic Regression, a Decision Tree,
        and a Random Forest against each other and kept the one with the best precision.
      </p>
      <div class="kv-row"><span class="k">Precision (weighted)</span><span class="v">${(body["precision"] * 100).toFixed(2)}%</span></div>
      <div class="progress-ibde" style="margin-top:6px;"><div class="bar" style="width:${(body["precision"] * 100).toFixed(1)}%;"></div></div>
      <div class="divider"></div>
      <div class="section-title" style="margin-top:0;">Business read</div>
      <p style="font-size:12.5px; color:var(--text-muted); margin-bottom:0;">
        Precision tells you how often a positive prediction is actually correct — important when
        acting on a prediction (like flagging churn) carries a real cost if it's wrong.
      </p>
    `;
  }

  runBtn.addEventListener("click", async () => {
    const fname = fileName.value.trim();
    const target = targetCol.value.trim();
    if (!fname) {
      IBDE.toast("Enter a dataset filename.", "error");
      return;
    }

    IBDE.setBusy(runBtn, true, "Analyzing…");
    try {
      const { body } = await IBDE.apiFetch(IBDE.ENDPOINTS.recommend(fname, target));
      if ("BEST MODEL" in body) renderClustering(body);
      else if ("MAE" in body) renderRegression(body);
      else if ("Best Model" in body) renderClassification(body);
      else {
        resultWrap.innerHTML = `<pre class="mono" style="white-space:pre-wrap; font-size:12px;">${IBDE.escapeHtml(JSON.stringify(body, null, 2))}</pre>`;
      }
      IBDE.toast("Recommendation ready.", "success");
    } catch (err) {
      resultWrap.innerHTML = `<div class="unavailable-banner"><span>${IBDE.escapeHtml(err.message)}</span></div>`;
      IBDE.toast(err.message, "error");
    } finally {
      IBDE.setBusy(runBtn, false);
    }
  });
})();
