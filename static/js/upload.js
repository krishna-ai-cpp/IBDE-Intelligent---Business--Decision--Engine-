(() => {
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileChosen = document.getElementById("fileChosen");
  const fileChosenName = document.getElementById("fileChosenName");
  const fileChosenSize = document.getElementById("fileChosenSize");
  const progressWrap = document.getElementById("progressWrap");
  const progressBar = document.getElementById("progressBar");
  const datasetInfo = document.getElementById("datasetInfo");
  const previewWrap = document.getElementById("previewWrap");

  let selectedFile = null;

  function renderPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split(/\r?\n/).filter((l) => l.length > 0).slice(0, 6);
      if (lines.length === 0) return;
      const rows = lines.map((l) => l.split(","));
      const header = rows[0];
      const body = rows.slice(1);
      let html = '<div class="table-scroll"><table class="table-ibde"><thead><tr>';
      header.forEach((h) => (html += `<th>${IBDE.escapeHtml(h)}</th>`));
      html += "</tr></thead><tbody>";
      body.forEach((r) => {
        html += "<tr>";
        r.forEach((c) => (html += `<td>${IBDE.escapeHtml(c)}</td>`));
        html += "</tr>";
      });
      html += "</tbody></table></div>";
      previewWrap.innerHTML = html;
    };
    reader.readAsText(file.slice(0, 50000)); // small slice is plenty for a preview
  }

  function onFileChosen(file) {
    selectedFile = file;
    fileChosen.style.display = "flex";
    fileChosenName.textContent = file.name;
    fileChosenSize.textContent = IBDE.fileSizeLabel(file.size);
    uploadBtn.disabled = false;
    renderPreview(file);
  }

  IBDE.bindDropzone(dropzone, fileInput, onFileChosen);

  uploadBtn.addEventListener("click", async () => {
    if (!selectedFile) return;
    IBDE.setBusy(uploadBtn, true, "Uploading…");
    progressWrap.style.display = "block";
    progressBar.style.width = "20%";

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      progressBar.style.width = "55%";
      const { body } = await IBDE.apiFetch(IBDE.ENDPOINTS.upload, {
        method: "POST",
        body: formData,
      });
      progressBar.style.width = "100%";

      if (!body) {
        throw new Error("Upload finished but the server returned no data.");
      }

      IBDE.rememberDataset(selectedFile.name);
      IBDE.toast("Dataset uploaded successfully.", "success");

      const rows = body["No. of rows: "];
      const cols = body["No. of columns: "];
      const colNames = body["Columns name: "] || [];
      const dtypes = body["Data types: "] || [];

      let colsHtml = colNames
        .map((c, i) => `<div class="kv-row"><span class="k">${IBDE.escapeHtml(c)}</span><span class="v">${IBDE.escapeHtml(dtypes[i] ?? "")}</span></div>`)
        .join("");

      datasetInfo.innerHTML = `
        <div class="stat-grid" style="grid-template-columns:1fr 1fr; margin-bottom:16px;">
          <div class="stat-card" style="box-shadow:none;">
            <div class="stat-label">Rows</div>
            <div class="stat-value">${rows}</div>
          </div>
          <div class="stat-card" style="box-shadow:none;">
            <div class="stat-label">Columns</div>
            <div class="stat-value">${cols}</div>
          </div>
        </div>
        <div class="section-title" style="margin-top:0;">Columns &amp; types</div>
        ${colsHtml}
      `;
    } catch (err) {
      IBDE.toast(err.message, "error");
      progressBar.style.width = "0%";
    } finally {
      IBDE.setBusy(uploadBtn, false);
    }
  });
})();
