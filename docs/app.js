const state = {
  products: [],
  metadata: null,
  selectedIds: new Set(),
  filters: {
    category: "all",
    brand: "all",
    search: ""
  }
};

const categoryFilter = document.querySelector("#categoryFilter");
const brandFilter = document.querySelector("#brandFilter");
const searchInput = document.querySelector("#searchInput");
const productList = document.querySelector("#productList");
const resultSummary = document.querySelector("#resultSummary");
const emptyState = document.querySelector("#emptyState");
const comparisonWrapper = document.querySelector("#comparisonWrapper");
const comparisonTable = document.querySelector("#comparisonTable");
const comparisonMeta = document.querySelector("#comparisonMeta");
const exportExcelBtn = document.querySelector("#exportExcelBtn");
const exportPdfBtn = document.querySelector("#exportPdfBtn");
const clearSelectionBtn = document.querySelector("#clearSelectionBtn");

const productCount = document.querySelector("#productCount");
const brandCount = document.querySelector("#brandCount");
const selectedCount = document.querySelector("#selectedCount");
const syncMode = document.querySelector("#syncMode");
const lastUpdated = document.querySelector("#lastUpdated");
const sourceCount = document.querySelector("#sourceCount");
const syncNote = document.querySelector("#syncNote");

const baseFields = [
  { key: "brand", label: "品牌" },
  { key: "category", label: "类别" },
  { key: "series", label: "系列" },
  { key: "model", label: "型号" },
  { key: "application", label: "应用场景" }
];

const categoryLabels = {
  module: "模组",
  cabinet: "箱体",
  controller: "控制器"
};

init();

async function init() {
  const [productsResponse, metadataResponse] = await Promise.all([
    fetch("./data/products.json"),
    fetch("./data/crawl-meta.json")
  ]);

  state.products = await productsResponse.json();
  state.metadata = await metadataResponse.json();

  bindEvents();
  populateFilters();
  render();
}

function bindEvents() {
  categoryFilter.addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    render();
  });

  brandFilter.addEventListener("change", (event) => {
    state.filters.brand = event.target.value;
    render();
  });

  searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    render();
  });

  exportExcelBtn.addEventListener("click", exportExcel);
  exportPdfBtn.addEventListener("click", () => window.print());
  clearSelectionBtn.addEventListener("click", () => {
    state.selectedIds.clear();
    render();
  });
}

function populateFilters() {
  const categories = ["all", ...new Set(state.products.map((item) => item.category))];
  const brands = ["all", ...new Set(state.products.map((item) => item.brand))];

  categoryFilter.innerHTML = categories
    .map((value) => `<option value="${value}">${value === "all" ? "全部类型" : categoryLabels[value]}</option>`)
    .join("");

  brandFilter.innerHTML = brands
    .map((value) => `<option value="${value}">${value === "all" ? "全部品牌" : value}</option>`)
    .join("");
}

function render() {
  renderHeroStats();
  renderProductList();
  renderComparison();
}

function renderHeroStats() {
  const brands = new Set(state.products.map((product) => product.brand));
  productCount.textContent = String(state.products.length);
  brandCount.textContent = String(brands.size);
  selectedCount.textContent = String(state.selectedIds.size);

  if (!state.metadata) {
    return;
  }

  syncMode.textContent = state.metadata.syncMode;
  lastUpdated.textContent = formatDate(state.metadata.lastUpdatedAt);
  sourceCount.textContent = `${state.metadata.sourceCount} 个来源`;
  syncNote.textContent = state.metadata.note;
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    const matchesCategory = state.filters.category === "all" || product.category === state.filters.category;
    const matchesBrand = state.filters.brand === "all" || product.brand === state.filters.brand;
    const haystack = [
      product.brand,
      product.model,
      product.series,
      product.summary,
      product.application,
      ...product.tags
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !state.filters.search || haystack.includes(state.filters.search);
    return matchesCategory && matchesBrand && matchesSearch;
  });
}

function renderProductList() {
  const filteredProducts = getFilteredProducts();
  resultSummary.textContent = `当前显示 ${filteredProducts.length} 个产品`;

  if (!filteredProducts.length) {
    productList.innerHTML = `
      <div class="empty-state compact-empty">
        <h3>没有匹配结果</h3>
        <p>可以更换筛选条件，或继续补充新的品牌采集源。</p>
      </div>
    `;
    return;
  }

  productList.innerHTML = filteredProducts
    .map((product) => {
      const checked = state.selectedIds.has(product.id) ? "checked" : "";
      const paramsPreview = Object.entries(product.specs)
        .slice(0, 4)
        .map(([key, value]) => `<span class="meta-chip">${key}: ${value}</span>`)
        .join("");

      return `
        <article class="product-card">
          <div class="product-top">
            <div>
              <span class="brand-badge">${product.brand}</span>
              <h3 class="product-title">${product.model}</h3>
              <p class="product-subtitle">${product.series} · ${categoryLabels[product.category]}</p>
            </div>
            <label class="compare-toggle">
              <input type="checkbox" data-id="${product.id}" ${checked} />
              加入对比
            </label>
          </div>
          <p class="product-summary">${product.summary}</p>
          <div class="product-meta">
            <span class="meta-chip">应用: ${product.application}</span>
            ${product.originUrl ? `<a class="meta-link" href="${product.originUrl}" target="_blank" rel="noreferrer">来源页面</a>` : ""}
            ${product.lastSeenAt ? `<span class="meta-chip">更新: ${formatDate(product.lastSeenAt)}</span>` : ""}
          </div>
          <div class="product-tags">${paramsPreview}</div>
          <div class="product-tags secondary-tags">
            ${product.tags.map((tag) => `<span class="tag-chip">${tag}</span>`).join("")}
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll('input[type="checkbox"][data-id]').forEach((checkbox) => {
    checkbox.addEventListener("change", (event) => {
      const productId = event.target.dataset.id;
      if (event.target.checked) {
        state.selectedIds.add(productId);
      } else {
        state.selectedIds.delete(productId);
      }
      render();
    });
  });
}

function renderComparison() {
  const selectedProducts = state.products.filter((product) => state.selectedIds.has(product.id));
  const allFieldLabels = collectComparisonFields(selectedProducts);
  selectedCount.textContent = String(selectedProducts.length);

  if (selectedProducts.length < 2) {
    emptyState.classList.remove("hidden");
    comparisonWrapper.classList.add("hidden");
    comparisonTable.innerHTML = "";
    comparisonMeta.innerHTML = "";
    return;
  }

  emptyState.classList.add("hidden");
  comparisonWrapper.classList.remove("hidden");

  comparisonMeta.innerHTML = [
    `<span class="meta-chip">已选产品: ${selectedProducts.length}</span>`,
    `<span class="meta-chip">品牌数: ${new Set(selectedProducts.map((item) => item.brand)).size}</span>`,
    `<span class="meta-chip">类型: ${Array.from(new Set(selectedProducts.map((item) => categoryLabels[item.category]))).join(" / ")}</span>`
  ].join("");

  const headerCells = selectedProducts.map((product) => `<th>${product.brand}<br />${product.model}</th>`).join("");
  const rows = allFieldLabels
    .map(({ key, label }) => {
      const cells = selectedProducts
        .map((product) => `<td>${escapeHtml(readFieldValue(product, key))}</td>`)
        .join("");
      return `<tr><td class="parameter-name">${label}</td>${cells}</tr>`;
    })
    .join("");

  comparisonTable.innerHTML = `
    <thead>
      <tr>
        <th>参数项</th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  `;
}

function collectComparisonFields(products) {
  const dynamicKeys = new Set();
  products.forEach((product) => {
    Object.keys(product.specs).forEach((key) => dynamicKeys.add(key));
  });

  return [
    ...baseFields,
    ...Array.from(dynamicKeys).map((key) => ({
      key: `specs.${key}`,
      label: key
    }))
  ];
}

function readFieldValue(product, key) {
  if (key.startsWith("specs.")) {
    return product.specs[key.replace("specs.", "")] || "-";
  }

  if (key === "category") {
    return categoryLabels[product.category] || product.category;
  }

  return product[key] || "-";
}

function exportExcel() {
  const selectedProducts = state.products.filter((product) => state.selectedIds.has(product.id));
  if (selectedProducts.length < 2) {
    window.alert("请至少选择 2 个产品后再导出。");
    return;
  }

  const fields = collectComparisonFields(selectedProducts);
  const rows = [
    ["参数项", ...selectedProducts.map((item) => `${item.brand} ${item.model}`)],
    ...fields.map(({ key, label }) => [label, ...selectedProducts.map((item) => readFieldValue(item, key))])
  ];

  const tableRows = rows
    .map(
      (row) =>
        `<Row>${row
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXml(String(cell))}</Data></Cell>`)
          .join("")}</Row>`
    )
    .join("");

  const content = `<?xml version="1.0"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Worksheet ss:Name="LED对比">
      <Table>${tableRows}</Table>
    </Worksheet>
  </Workbook>`;

  downloadFile(content, `led-compare-${Date.now()}.xls`, "application/vnd.ms-excel");
}

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}
