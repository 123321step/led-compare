const TRANSLATIONS = {
  zh: {
    pageTitle: "LED 产品参数对比平台",
    pageDescription: "支持 LED 模组、箱体、控制器的品牌筛选、参数对比、Excel 导出与免费定时更新。",
    heroEyebrow: "LED Product Intelligence",
    heroTitle: "把不同品牌 LED 产品参数放在一张表里看清楚",
    heroText: "面向 LED 模组、箱体、控制器的在线参数情报站。你可以按品牌快速筛选产品，跨厂家横向对比核心规格，并导出 Excel 或打印为 PDF。",
    startButton: "开始选产品",
    statusButton: "查看同步状态",
    statProducts: "收录产品",
    statBrands: "品牌数量",
    statSelected: "当前已选",
    statusEyebrow: "Data Status",
    statusTitle: "同步状态",
    statusModeLabel: "同步模式",
    statusUpdatedLabel: "最近更新",
    statusSourceLabel: "数据来源",
    statusNoteLabel: "同步说明",
    sourceScope: "当前前台只展示海外官网真实抓取产品: 海康威视、洲明、诺瓦、卡莱特。强力巨彩、艾比森暂未接入海外官网目录，已从前台隐藏。",
    useCaseEyebrow: "Use Case",
    useCaseTitle: "售前报价更快",
    useCaseText: "把同点间距、同亮度、同带载能力的方案放在一个页面里快速比差异。",
    outputEyebrow: "Output",
    outputTitle: "导出给客户或团队",
    outputText: "导出 Excel 给业务同事整理方案，也能直接打印成 PDF 做会议资料。",
    stackEyebrow: "Global Sources",
    stackTitle: "只保留海外官网目录",
    stackText: "当前前台只展示海外官网真实抓取产品，未接入海外目录的品牌暂不显示。",
    catalogEyebrow: "Catalog",
    catalogTitle: "按品牌浏览产品库",
    categoryLabel: "产品类型",
    brandLabel: "品牌",
    searchLabel: "搜索产品",
    searchPlaceholder: "输入型号、系列、品牌或关键词",
    exportExcel: "导出 Excel",
    exportPdf: "导出 PDF",
    clearCompare: "清空对比",
    pitchFilterTitle: "点间距筛选",
    clearPitch: "清空点间距",
    treeEyebrow: "Tree",
    treeTitle: "品牌导航",
    comparisonEyebrow: "Comparison",
    comparisonTitle: "参数对比",
    comparisonText: "支持跨品牌勾选多个产品，自动合并字段形成统一对比表。",
    emptyTitle: "还没有选中产品",
    emptyText: "从左侧至少选择 2 个产品，即可生成统一参数对比表。",
    collectorEyebrow: "Collector",
    collectorTitle: "免费数据更新方案",
    collectorText: "适合 GitHub Pages 的免费架构，不需要单独购买服务器。",
    roadmap1Title: "1. 品牌采集配置",
    roadmap1Text: "为每个品牌维护公开来源地址、产品类别、字段映射与解析策略。",
    roadmap2Title: "2. GitHub Actions 定时更新",
    roadmap2Text: "定时运行采集脚本，输出标准化 JSON，并自动提交回仓库。",
    roadmap3Title: "3. Pages 自动发布",
    roadmap3Text: "GitHub Pages 直接读取最新 docs 数据目录，让网址始终展示最新结果。",
    allCategories: "全部类型",
    allBrands: "全部品牌",
    category: {
      module: "模组",
      cabinet: "箱体",
      controller: "控制器"
    },
    fields: {
      brand: "品牌",
      category: "类别",
      series: "系列",
      model: "型号",
      application: "应用场景"
    },
    bucketSeries: "系列",
    bucketPitch: "点间距",
    brandCatalog: "产品目录",
    productUnit: "个产品",
    currentResult: "当前显示 {count} 个产品，分布在 {brands} 个品牌下",
    noResultTitle: "没有匹配结果",
    noResultText: "可以更换筛选条件，或继续补充新的品牌产品目录。",
    compareToggle: "加入对比",
    appPrefix: "应用",
    sourcePage: "来源页面",
    updatedAt: "更新",
    sourceBadgeOfficial: "海外官网",
    selectedProducts: "已选产品",
    selectedBrands: "品牌数",
    selectedTypes: "类型",
    compareParam: "参数项",
    compareNeedMore: "请至少选择 2 个产品后再导出。",
    excelSheet: "LED对比",
    excelFile: "led-compare",
    noPitch: "未标注",
    loading: "加载中",
    sourceCountUnit: "个来源"
  },
  en: {
    pageTitle: "LED Product Comparison Platform",
    pageDescription: "Compare LED modules, cabinets, and controllers with exportable Excel/PDF reports and free scheduled sync.",
    heroEyebrow: "LED Product Intelligence",
    heroTitle: "Compare LED products from different brands in one structured table",
    heroText: "An online intelligence workspace for LED modules, cabinets, and controllers. Filter by brand, compare key specs across vendors, and export to Excel or PDF.",
    startButton: "Browse Catalog",
    statusButton: "Data Status",
    statProducts: "Products",
    statBrands: "Brands",
    statSelected: "Selected",
    statusEyebrow: "Data Status",
    statusTitle: "Sync Status",
    statusModeLabel: "Sync Mode",
    statusUpdatedLabel: "Last Update",
    statusSourceLabel: "Sources",
    statusNoteLabel: "Sync Note",
    sourceScope: "The live catalog currently shows only products crawled from official global sites: Hikvision, Unilumin, NovaStar, and Colorlight. Qiangli and Absen stay hidden until their overseas catalogs are connected.",
    useCaseEyebrow: "Use Case",
    useCaseTitle: "Faster pre-sales quoting",
    useCaseText: "Put products with the same pitch, brightness, and loading capacity on one page and compare them quickly.",
    outputEyebrow: "Output",
    outputTitle: "Export for clients or teams",
    outputText: "Export Excel for sales workflows or print the comparison page as PDF for meetings.",
    stackEyebrow: "Global Sources",
    stackTitle: "Only global-site catalogs stay live",
    stackText: "The front-end now keeps only products crawled from official global sites. Brands without overseas catalogs stay hidden for now.",
    catalogEyebrow: "Catalog",
    catalogTitle: "Browse by Brand",
    categoryLabel: "Category",
    brandLabel: "Brand",
    searchLabel: "Search",
    searchPlaceholder: "Search by model, series, brand, or keyword",
    exportExcel: "Export Excel",
    exportPdf: "Export PDF",
    clearCompare: "Clear Comparison",
    pitchFilterTitle: "Pitch Filter",
    clearPitch: "Clear Pitch",
    treeEyebrow: "Tree",
    treeTitle: "Brand Navigation",
    comparisonEyebrow: "Comparison",
    comparisonTitle: "Specification Comparison",
    comparisonText: "Select products across brands and merge their fields into one aligned comparison table.",
    emptyTitle: "No products selected yet",
    emptyText: "Pick at least 2 products from the catalog to generate a unified comparison table.",
    collectorEyebrow: "Collector",
    collectorTitle: "Free Update Workflow",
    collectorText: "A free architecture designed for GitHub Pages, without needing a paid server.",
    roadmap1Title: "1. Brand source config",
    roadmap1Text: "Maintain source URLs, product classes, field mapping, and parsing logic for each brand.",
    roadmap2Title: "2. Scheduled GitHub Actions",
    roadmap2Text: "Run crawlers on schedule, generate normalized JSON, and commit updates back to the repo.",
    roadmap3Title: "3. Automatic Pages publishing",
    roadmap3Text: "GitHub Pages reads the latest docs data directory and keeps the public site updated.",
    allCategories: "All Categories",
    allBrands: "All Brands",
    category: {
      module: "Module",
      cabinet: "Cabinet",
      controller: "Controller"
    },
    fields: {
      brand: "Brand",
      category: "Category",
      series: "Series",
      model: "Model",
      application: "Application"
    },
    bucketSeries: "Series",
    bucketPitch: "Pitch",
    brandCatalog: "Catalog",
    productUnit: "products",
    currentResult: "Showing {count} products across {brands} brands",
    noResultTitle: "No matching products",
    noResultText: "Try different filters or keep expanding the official brand catalogs.",
    compareToggle: "Compare",
    appPrefix: "Use",
    sourcePage: "Source Page",
    updatedAt: "Updated",
    sourceBadgeOfficial: "Global Site",
    selectedProducts: "Selected Products",
    selectedBrands: "Brands",
    selectedTypes: "Types",
    compareParam: "Field",
    compareNeedMore: "Select at least 2 products before exporting.",
    excelSheet: "LED Compare",
    excelFile: "led-compare",
    noPitch: "Not Tagged",
    loading: "Loading",
    sourceCountUnit: "sources"
  }
};

const state = {
  locale: localStorage.getItem("led-compare-locale") || "zh",
  products: [],
  metadata: null,
  selectedIds: new Set(),
  filters: {
    category: "all",
    brand: "all",
    search: "",
    pitches: []
  },
  navigation: {
    selectedBrand: "all"
  }
};

const categoryFilter = document.querySelector("#categoryFilter");
const brandFilter = document.querySelector("#brandFilter");
const searchInput = document.querySelector("#searchInput");
const productList = document.querySelector("#productList");
const resultSummary = document.querySelector("#resultSummary");
const brandSummary = document.querySelector("#brandSummary");
const brandTree = document.querySelector("#brandTree");
const pitchFilterSection = document.querySelector("#pitchFilterSection");
const pitchFilterList = document.querySelector("#pitchFilterList");
const clearPitchFilterBtn = document.querySelector("#clearPitchFilterBtn");
const emptyState = document.querySelector("#emptyState");
const comparisonWrapper = document.querySelector("#comparisonWrapper");
const comparisonTable = document.querySelector("#comparisonTable");
const comparisonMeta = document.querySelector("#comparisonMeta");
const exportExcelBtn = document.querySelector("#exportExcelBtn");
const exportPdfBtn = document.querySelector("#exportPdfBtn");
const clearSelectionBtn = document.querySelector("#clearSelectionBtn");
const sourceScope = document.querySelector("#sourceScope");
const langZhBtn = document.querySelector("#langZh");
const langEnBtn = document.querySelector("#langEn");

const productCount = document.querySelector("#productCount");
const brandCount = document.querySelector("#brandCount");
const selectedCount = document.querySelector("#selectedCount");
const syncMode = document.querySelector("#syncMode");
const lastUpdated = document.querySelector("#lastUpdated");
const sourceCount = document.querySelector("#sourceCount");
const syncNote = document.querySelector("#syncNote");

init();

async function init() {
  const [productsResponse, metadataResponse] = await Promise.all([fetch("./data/products.json"), fetch("./data/crawl-meta.json")]);
  state.products = await productsResponse.json();
  state.metadata = await metadataResponse.json();
  bindEvents();
  populateFilters();
  applyStaticTranslations();
  render();
}

function bindEvents() {
  categoryFilter.addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    render();
  });

  brandFilter.addEventListener("change", (event) => {
    state.filters.brand = event.target.value;
    state.navigation.selectedBrand = event.target.value;
    render();
  });

  searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    render();
  });

  clearPitchFilterBtn.addEventListener("click", () => {
    state.filters.pitches = [];
    render();
  });

  clearSelectionBtn.addEventListener("click", () => {
    state.selectedIds.clear();
    render();
  });

  exportExcelBtn.addEventListener("click", exportExcel);
  exportPdfBtn.addEventListener("click", () => window.print());
  langZhBtn.addEventListener("click", () => setLocale("zh"));
  langEnBtn.addEventListener("click", () => setLocale("en"));
}

function setLocale(locale) {
  state.locale = locale;
  localStorage.setItem("led-compare-locale", locale);
  applyStaticTranslations();
  populateFilters();
  render();
}

function applyStaticTranslations() {
  const text = TRANSLATIONS[state.locale];
  document.documentElement.lang = state.locale === "zh" ? "zh-CN" : "en";
  document.title = text.pageTitle;
  document.querySelector('meta[name="description"]').setAttribute("content", text.pageDescription);
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;
    if (text[key]) {
      element.textContent = text[key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (text[key]) {
      element.setAttribute("placeholder", text[key]);
    }
  });
  langZhBtn.classList.toggle("is-active", state.locale === "zh");
  langEnBtn.classList.toggle("is-active", state.locale === "en");
}

function populateFilters() {
  const text = TRANSLATIONS[state.locale];
  const categories = ["all", ...new Set(state.products.map((item) => item.category))];
  const brands = ["all", ...new Set(state.products.map((item) => item.brand))];

  categoryFilter.innerHTML = categories
    .map((value) => `<option value="${value}" ${state.filters.category === value ? "selected" : ""}>${value === "all" ? text.allCategories : categoryLabel(value)}</option>`)
    .join("");

  brandFilter.innerHTML = brands
    .map((value) => `<option value="${value}" ${state.filters.brand === value ? "selected" : ""}>${value === "all" ? text.allBrands : value}</option>`)
    .join("");
}

function render() {
  renderHeroStats();
  renderPitchFilters();
  renderBrandTree();
  renderProductList();
  renderComparison();
}

function renderHeroStats() {
  const text = TRANSLATIONS[state.locale];
  const brands = new Set(state.products.map((product) => product.brand));
  productCount.textContent = String(state.products.length);
  brandCount.textContent = String(brands.size);
  selectedCount.textContent = String(state.selectedIds.size);
  sourceScope.textContent = text.sourceScope;

  if (!state.metadata) {
    return;
  }

  syncMode.textContent = state.metadata.syncMode;
  lastUpdated.textContent = formatDate(state.metadata.lastUpdatedAt);
  sourceCount.textContent = `${state.metadata.sourceCount} ${text.sourceCountUnit}`;
  syncNote.textContent = state.metadata.note;
}

function getActiveBrand() {
  return state.navigation.selectedBrand !== "all" ? state.navigation.selectedBrand : state.filters.brand;
}

function getFilteredProducts() {
  return state.products.filter((product) => {
    const activeBrand = getActiveBrand();
    const matchesCategory = state.filters.category === "all" || product.category === state.filters.category;
    const matchesBrand = activeBrand === "all" || product.brand === activeBrand;
    const haystack = [product.brand, product.model, product.series, product.summary, product.application, ...product.tags]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !state.filters.search || haystack.includes(state.filters.search);
    const pitchValue = normalizePitchValue(product.specs["点间距"] || product.specs["像素间距"] || "");
    const needsPitchFilter = product.category === "module" || product.category === "cabinet";
    const matchesPitch = !needsPitchFilter || !state.filters.pitches.length || state.filters.pitches.includes(pitchValue);
    return matchesCategory && matchesBrand && matchesSearch && matchesPitch;
  });
}

function renderPitchFilters() {
  const text = TRANSLATIONS[state.locale];
  const pitchProducts = state.products.filter((product) => {
    const activeBrand = getActiveBrand();
    const matchesBrand = activeBrand === "all" || product.brand === activeBrand;
    const matchesCategory =
      state.filters.category === "all"
        ? product.category === "module" || product.category === "cabinet"
        : product.category === state.filters.category;
    const haystack = [product.brand, product.model, product.series, product.summary, product.application, ...product.tags]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !state.filters.search || haystack.includes(state.filters.search);
    return matchesBrand && matchesCategory && matchesSearch && (product.category === "module" || product.category === "cabinet");
  });

  const pitches = [...new Set(pitchProducts.map((product) => normalizePitchValue(product.specs["点间距"] || product.specs["像素间距"] || "")))]
    .filter((value) => value && value !== text.noPitch)
    .sort((left, right) => parsePitch(left) - parsePitch(right));

  const shouldShow =
    pitches.length > 0 && (state.filters.category === "all" || state.filters.category === "module" || state.filters.category === "cabinet");

  pitchFilterSection.classList.toggle("hidden", !shouldShow);

  if (!shouldShow) {
    state.filters.pitches = [];
    pitchFilterList.innerHTML = "";
    return;
  }

  state.filters.pitches = state.filters.pitches.filter((pitch) => pitches.includes(pitch));

  pitchFilterList.innerHTML = pitches
    .map(
      (pitch) => `
        <label class="pitch-option">
          <input type="checkbox" value="${pitch}" ${state.filters.pitches.includes(pitch) ? "checked" : ""} />
          <span>${pitch}</span>
        </label>
      `
    )
    .join("");

  pitchFilterList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const next = new Set(state.filters.pitches);
      if (checkbox.checked) {
        next.add(checkbox.value);
      } else {
        next.delete(checkbox.value);
      }
      state.filters.pitches = [...next];
      render();
    });
  });
}

function renderBrandTree() {
  const browseableProducts = state.products.filter((product) => {
    const matchesCategory = state.filters.category === "all" || product.category === state.filters.category;
    const haystack = [product.brand, product.model, product.series, product.summary, product.application, ...product.tags]
      .join(" ")
      .toLowerCase();
    return matchesCategory && (!state.filters.search || haystack.includes(state.filters.search));
  });

  const groupedBrands = groupProductsByBrand(browseableProducts);
  brandTree.innerHTML = groupedBrands.map(renderTreeBrandGroup).join("");

  brandTree.querySelectorAll("[data-brand-select]").forEach((button) => {
    button.addEventListener("click", () => {
      const brand = button.dataset.brandSelect;
      state.navigation.selectedBrand = state.navigation.selectedBrand === brand ? "all" : brand;
      state.filters.brand = state.navigation.selectedBrand;
      brandFilter.value = state.navigation.selectedBrand;
      render();
    });
  });

  brandTree.querySelectorAll("[data-tree-category]").forEach((button) => {
    button.addEventListener("click", () => {
      const brand = button.dataset.brandJump;
      const category = button.dataset.treeCategory;
      state.navigation.selectedBrand = brand;
      state.filters.brand = brand;
      state.filters.category = category;
      state.filters.pitches = [];
      brandFilter.value = brand;
      categoryFilter.value = category;
      render();
      document.querySelector(`[data-brand-section="${brand}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderTreeBrandGroup({ brand, items }) {
  const categories = ["module", "cabinet", "controller"]
    .map((category) => {
      const categoryProducts = items.filter((item) => item.category === category);
      if (!categoryProducts.length) {
        return "";
      }
      return `
        <button class="tree-link tree-child" type="button" data-brand-jump="${brand}" data-tree-category="${category}">
          <span>${categoryLabel(category)}</span>
          <strong>${categoryProducts.length}</strong>
        </button>
      `;
    })
    .join("");

  return `
    <section class="tree-group ${state.navigation.selectedBrand === brand ? "selected" : ""}">
      <button class="tree-link tree-parent" type="button" data-brand-select="${brand}">
        <span>${brand}</span>
        <strong>${items.length}</strong>
      </button>
      <div class="tree-children">${categories}</div>
    </section>
  `;
}

function renderProductList() {
  const text = TRANSLATIONS[state.locale];
  const filteredProducts = getFilteredProducts();
  const groupedBrands = groupProductsByBrand(filteredProducts);

  resultSummary.textContent = formatMessage(text.currentResult, {
    count: filteredProducts.length,
    brands: groupedBrands.length
  });

  brandSummary.innerHTML = groupedBrands
    .map(
      ({ brand, items }) => `
        <button class="brand-pill" type="button" data-brand-jump="${brand}">
          ${brand}
          <span>${items.length}</span>
        </button>
      `
    )
    .join("");

  if (!filteredProducts.length) {
    productList.innerHTML = `
      <div class="empty-state compact-empty">
        <h3>${text.noResultTitle}</h3>
        <p>${text.noResultText}</p>
      </div>
    `;
    return;
  }

  productList.innerHTML = groupedBrands.map(renderBrandGroup).join("");

  document.querySelectorAll("[data-brand-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const brand = button.dataset.brandJump;
      state.navigation.selectedBrand = brand;
      state.filters.brand = brand;
      brandFilter.value = brand;
      render();
      document.querySelector(`[data-brand-section="${brand}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

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

function renderBrandGroup({ brand, items }) {
  const text = TRANSLATIONS[state.locale];
  const groupedByCategory = {
    module: items.filter((item) => item.category === "module"),
    cabinet: items.filter((item) => item.category === "cabinet"),
    controller: items.filter((item) => item.category === "controller")
  };

  const categoryBlocks = Object.entries(groupedByCategory)
    .filter(([, products]) => products.length > 0)
    .map(
      ([category, products]) => `
        <section class="brand-category-block">
          <div class="brand-category-head">
            <h4>${categoryLabel(category)}</h4>
            <span>${products.length} ${text.productUnit}</span>
          </div>
          ${renderCategoryBuckets(products, category)}
        </section>
      `
    )
    .join("");

  return `
    <section class="brand-group" data-brand-section="${brand}">
      <div class="brand-group-head">
        <div>
          <span class="brand-badge large">${brand}</span>
          <h3>${brand} ${text.brandCatalog}</h3>
        </div>
        <span class="brand-count">${items.length} ${text.productUnit}</span>
      </div>
      ${categoryBlocks}
    </section>
  `;
}

function renderCategoryBuckets(products, category) {
  const text = TRANSLATIONS[state.locale];
  return getBucketedProducts(products, category)
    .map(
      ({ bucketLabel, items }) => `
        <div class="pitch-group">
          <div class="pitch-group-head">
            <h5>${bucketLabel}</h5>
            <span>${items.length} ${text.productUnit}</span>
          </div>
          <div class="brand-product-grid">
            ${items.map(renderProductCard).join("")}
          </div>
        </div>
      `
    )
    .join("");
}

function getBucketedProducts(products, category) {
  const text = TRANSLATIONS[state.locale];
  const map = new Map();

  products.forEach((product) => {
    const bucketLabel =
      category === "controller"
        ? `${text.bucketSeries}: ${product.series || "-"}`
        : `${text.bucketPitch}: ${normalizePitchValue(product.specs["点间距"] || product.specs["像素间距"] || text.noPitch)}`;

    if (!map.has(bucketLabel)) {
      map.set(bucketLabel, []);
    }
    map.get(bucketLabel).push(product);
  });

  return Array.from(map.entries())
    .map(([bucketLabel, items]) => ({ bucketLabel, items }))
    .sort((left, right) => parsePitch(left.bucketLabel) - parsePitch(right.bucketLabel));
}

function renderProductCard(product) {
  const text = TRANSLATIONS[state.locale];
  const checked = state.selectedIds.has(product.id) ? "checked" : "";
  const paramsPreview = Object.entries(product.specs)
    .filter(([, value]) => value && value !== "-")
    .slice(0, 4)
    .map(([key, value]) => `<span class="meta-chip">${escapeHtml(key)}: ${escapeHtml(value)}</span>`)
    .join("");

  return `
    <article class="product-card">
      <div class="product-top">
        <div>
          <h3 class="product-title">${escapeHtml(product.model)}</h3>
          <p class="product-subtitle">${escapeHtml(product.series)} / ${categoryLabel(product.category)}</p>
        </div>
        <label class="compare-toggle">
          <input type="checkbox" data-id="${product.id}" ${checked} />
          ${text.compareToggle}
        </label>
      </div>
      <p class="product-summary">${escapeHtml(product.summary)}</p>
      <div class="product-meta">
        <span class="meta-chip">${text.appPrefix}: ${escapeHtml(product.application)}</span>
        <span class="meta-chip source-chip">${text.sourceBadgeOfficial}</span>
        ${product.originUrl ? `<a class="meta-link" href="${product.originUrl}" target="_blank" rel="noreferrer">${text.sourcePage}</a>` : ""}
        ${product.lastSeenAt ? `<span class="meta-chip">${text.updatedAt}: ${formatDate(product.lastSeenAt)}</span>` : ""}
      </div>
      <div class="product-tags">${paramsPreview}</div>
      <div class="product-tags secondary-tags">
        ${product.tags.map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </article>
  `;
}

function groupProductsByBrand(products) {
  const map = new Map();
  products.forEach((product) => {
    if (!map.has(product.brand)) {
      map.set(product.brand, []);
    }
    map.get(product.brand).push(product);
  });

  return Array.from(map.entries())
    .map(([brand, items]) => ({
      brand,
      items: items.sort((left, right) => {
        if (left.category === right.category) {
          return left.model.localeCompare(right.model, "en");
        }
        return left.category.localeCompare(right.category);
      })
    }))
    .sort((left, right) => right.items.length - left.items.length || left.brand.localeCompare(right.brand, "en"));
}

function renderComparison() {
  const text = TRANSLATIONS[state.locale];
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
    `<span class="meta-chip">${text.selectedProducts}: ${selectedProducts.length}</span>`,
    `<span class="meta-chip">${text.selectedBrands}: ${new Set(selectedProducts.map((item) => item.brand)).size}</span>`,
    `<span class="meta-chip">${text.selectedTypes}: ${Array.from(new Set(selectedProducts.map((item) => categoryLabel(item.category)))).join(" / ")}</span>`
  ].join("");

  const headerCells = selectedProducts.map((product) => `<th>${escapeHtml(product.brand)}<br />${escapeHtml(product.model)}</th>`).join("");
  const rows = allFieldLabels
    .map(({ key, label }) => {
      const cells = selectedProducts.map((product) => `<td>${escapeHtml(readFieldValue(product, key))}</td>`).join("");
      return `<tr><td class="parameter-name">${escapeHtml(label)}</td>${cells}</tr>`;
    })
    .join("");

  comparisonTable.innerHTML = `
    <thead>
      <tr>
        <th>${text.compareParam}</th>
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
    ...["brand", "category", "series", "model", "application"].map((key) => ({
      key,
      label: TRANSLATIONS[state.locale].fields[key]
    })),
    ...Array.from(dynamicKeys).map((key) => ({ key: `specs.${key}`, label: key }))
  ];
}

function readFieldValue(product, key) {
  if (key.startsWith("specs.")) {
    return product.specs[key.replace("specs.", "")] || "-";
  }
  if (key === "category") {
    return categoryLabel(product.category);
  }
  return product[key] || "-";
}

function exportExcel() {
  const text = TRANSLATIONS[state.locale];
  const selectedProducts = state.products.filter((product) => state.selectedIds.has(product.id));
  if (selectedProducts.length < 2) {
    window.alert(text.compareNeedMore);
    return;
  }

  const fields = collectComparisonFields(selectedProducts);
  const rows = [
    [text.compareParam, ...selectedProducts.map((item) => `${item.brand} ${item.model}`)],
    ...fields.map(({ key, label }) => [label, ...selectedProducts.map((item) => readFieldValue(item, key))])
  ];

  const tableRows = rows
    .map((row) => `<Row>${row.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(String(cell))}</Data></Cell>`).join("")}</Row>`)
    .join("");

  const content = `<?xml version="1.0"?>
  <?mso-application progid="Excel.Sheet"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
    <Worksheet ss:Name="${text.excelSheet}">
      <Table>${tableRows}</Table>
    </Worksheet>
  </Workbook>`;

  downloadFile(content, `${text.excelFile}-${Date.now()}.xls`, "application/vnd.ms-excel");
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

function categoryLabel(category) {
  return TRANSLATIONS[state.locale].category[category] || category;
}

function normalizePitchValue(value) {
  const text = TRANSLATIONS[state.locale];
  if (!value || value === text.noPitch) {
    return text.noPitch;
  }
  const match = String(value).match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return String(value);
  }
  const numeric = Number(match[1]);
  if (Number.isNaN(numeric)) {
    return String(value);
  }
  const rounded = numeric >= 10 ? numeric.toFixed(0) : numeric.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${rounded} mm`;
}

function parsePitch(value) {
  const match = String(value).match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(state.locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatMessage(template, values) {
  return template.replaceAll(/\{(\w+)\}/g, (_, key) => values[key] ?? "");
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
