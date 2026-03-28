import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { PDFParse } from "pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const sourcesFile = path.join(rootDir, "config", "sources.json");
const manualProductsFile = path.join(rootDir, "data", "manual-products.json");
const publicDataDir = path.join(rootDir, "public", "data");
const productsFile = path.join(publicDataDir, "products.json");
const metadataFile = path.join(publicDataDir, "crawl-meta.json");

async function main() {
  const [sources, manualProducts] = await Promise.all([
    readJson(sourcesFile),
    readJson(manualProductsFile)
  ]);

  const enabledSources = sources.filter((source) => source.enabled);
  const generatedProducts = [];
  const failures = [];

  for (const source of enabledSources) {
    if (source.type === "manualSeed") {
      continue;
    }

    try {
      const products = await crawlSource(source);
      generatedProducts.push(...products);
      console.log(`Fetched ${source.brand}: ${products.length} products`);
    } catch (error) {
      failures.push({
        brand: source.brand,
        model: source.model || source.id,
        message: error.message
      });
      console.warn(`Failed ${source.brand} ${source.id}: ${error.message}`);
    }
  }

  const now = new Date().toISOString();
  const liveBrands = new Set(generatedProducts.map((product) => product.brand));
  const normalizedManualProducts = manualProducts
    .filter((product) => !liveBrands.has(product.brand))
    .map((product) => ({
      ...product,
      lastSeenAt: product.lastSeenAt || now
    }));

  const allProducts = [...generatedProducts, ...normalizedManualProducts].sort((left, right) => {
    if (left.brand === right.brand) {
      if (left.category === right.category) {
        return left.model.localeCompare(right.model, "zh-CN");
      }
      return left.category.localeCompare(right.category);
    }
    return left.brand.localeCompare(right.brand, "zh-CN");
  });

  await fs.writeFile(productsFile, stringify(allProducts));
  await fs.writeFile(
    metadataFile,
    stringify({
      syncMode: "GitHub Actions 定时同步",
      lastUpdatedAt: now,
      sourceCount: enabledSources.length,
      liveSourceCount: enabledSources.filter((source) => source.type !== "manualSeed").length,
      liveProductCount: generatedProducts.length,
      failedSourceCount: failures.length,
      note:
        failures.length > 0
          ? `已成功抓取 ${generatedProducts.length} 个真实产品，${failures.length} 个来源抓取失败。`
          : `已成功抓取 ${generatedProducts.length} 个真实产品，并自动替换同品牌种子数据。`,
      failures
    })
  );

  console.log(
    `Crawl completed. Generated ${generatedProducts.length} live products and kept ${normalizedManualProducts.length} seed products.`
  );
}

async function crawlSource(source) {
  if (source.type === "hikvisionLedDisplaysCatalog") {
    return crawlHikvisionLedDisplaysCatalog(source);
  }

  if (source.type === "uniluminLedProductsCatalog") {
    return crawlUniluminLedProductsCatalog(source);
  }

  if (source.type === "novastarCatalog") {
    return crawlNovaStarCatalog(source);
  }

  if (source.type === "colorlightCatalog") {
    return crawlColorlightCatalog(source);
  }

  throw new Error(`Unsupported source type: ${source.type}`);
}

async function crawlHikvisionLedDisplaysCatalog(source) {
  const listingEndpoints = await discoverHikvisionListingEndpoints(source.rootUrl);
  const allProducts = [];

  for (const endpoint of listingEndpoints) {
    const data = await fetchJson(`https://display.hikvision.com${endpoint}.json`);
    for (const item of data.products || []) {
      const detailUrl = toHikvisionDetailUrl(item.detailPath);
      const detailHtml = await fetchText(detailUrl);
      const detailSpecs = extractLabeledSpecsFromHikvision(detailHtml);
      allProducts.push(
        normalizeHikvisionProduct({
          endpoint,
          item,
          detailUrl,
          detailSpecs
        })
      );
    }
  }

  return dedupeProducts(allProducts);
}

async function crawlUniluminLedProductsCatalog(source) {
  const productUrls = await discoverUniluminProductUrls(source.rootUrl);
  const allProducts = [];

  for (const productUrl of productUrls) {
    const html = await fetchText(productUrl);
    const variants = extractUniluminVariants(productUrl, html);
    allProducts.push(...variants);
  }

  return dedupeProducts(allProducts);
}

async function crawlNovaStarCatalog(source) {
  const catalogEntries = [];

  for (const listUrl of source.listUrls || []) {
    const html = await fetchText(listUrl);
    catalogEntries.push(...extractNovaCatalogEntries(listUrl, html));
  }

  const products = [];

  for (const entry of catalogEntries) {
    const html = await fetchText(entry.detailUrl);
    const variants = extractNovaVariants(html, entry);
    products.push(...variants);
  }

  return dedupeProducts(products);
}

async function crawlColorlightCatalog(source) {
  const homeHtml = await fetchText(source.rootUrl);
  const catalogEntries = dedupeColorlightEntries(extractColorlightCatalogEntries(source.rootUrl, homeHtml));
  const pdfTextCache = new Map();
  const products = [];

  for (const entry of catalogEntries) {
    try {
      const [featureHtml, downloadHtml] = await Promise.all([fetchText(entry.detailUrl), fetchText(entry.downloadUrl)]);
      const summary = extractColorlightSummary(featureHtml, entry);
      const specPdfUrl = extractColorlightSpecPdfUrl(downloadHtml);
      const pdfText = specPdfUrl ? await getColorlightPdfText(specPdfUrl, pdfTextCache) : "";

      for (const model of splitColorlightModels(entry.model)) {
        products.push({
          id: `colorlight-${slugify(model)}`,
          brand: "卡莱特",
          category: "controller",
          series: entry.series,
          model,
          application: inferColorlightApplication(entry.series, model),
          summary,
          tags: unique(["真实抓取", entry.topCategory, entry.series]),
          originUrl: entry.detailUrl,
          lastSeenAt: new Date().toISOString(),
          specs: normalizeColorlightSpecs(parseColorlightPdfSpecs(pdfText, entry, specPdfUrl))
        });
      }
    } catch (error) {
      console.warn(`Skipped Colorlight ${entry.model}: ${error.message}`);
    }
  }

  return dedupeProducts(products);
}

async function discoverHikvisionListingEndpoints(rootUrl) {
  const pageHtml = await fetchText(rootUrl);
  const categoryPaths = unique(
    [...pageHtml.matchAll(/href="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((url) => url.startsWith("/display-en/products/led-displays/") && url.split("/").filter(Boolean).length === 4)
  );

  const endpoints = [];

  for (const categoryPath of categoryPaths) {
    const categoryHtml = await fetchText(toHikvisionPublicPageUrl(categoryPath));
    endpoints.push(...extractSearchListUrls(categoryHtml));

    const seriesLinks = unique(
      [...categoryHtml.matchAll(/href="([^"]+)"/g)]
        .map((match) => match[1])
        .filter(
          (url) =>
            url.startsWith(`/content/hikvision/display-en/products/led-displays/${categoryPath.split("/").filter(Boolean).pop()}/`) &&
            url.endsWith(".html")
        )
    );

    for (const seriesLink of seriesLinks) {
      const seriesHtml = await fetchText(toHikvisionPublicPageUrl(seriesLink));
      endpoints.push(...extractSearchListUrls(seriesHtml));
    }
  }

  return unique(endpoints);
}

async function discoverUniluminProductUrls(rootUrl) {
  const pages = [rootUrl, ...Array.from({ length: 5 }, (_, index) => `${rootUrl}?pagenum=${index + 1}`)];
  const urls = new Set();

  for (const pageUrl of pages) {
    const html = await fetchText(pageUrl);
    const links = [...html.matchAll(/href="(https:\/\/www\.unilumin\.com\/products\/[^"]+)"/g)]
      .map((match) => match[1])
      .filter((url) => /\/products\/[^/]+\/[^/]+\.html$/.test(url));

    links.forEach((url) => urls.add(url));
  }

  return [...urls];
}

function extractSearchListUrls(html) {
  return unique([...html.matchAll(/data-url="([^"]*search_list[^"]*)"/g)].map((match) => match[1]));
}

function normalizeHikvisionProduct({ endpoint, item, detailUrl, detailSpecs }) {
  const category = inferHikvisionCategory(endpoint);
  const pointPitch = readRequiredSpec(detailSpecs, "Pixel Pitch", "Pixel Pitch Category");
  const baseTags = [
    "真实抓取",
    item.series,
    item.subcategory,
    endpoint.includes("/rental-led/") ? "租赁" : "",
    endpoint.includes("/creative-led/") ? "创意显示" : "",
    endpoint.includes("/outdoor-led/") ? "户外" : "",
    endpoint.includes("/indoor-led/") ? "室内" : ""
  ].filter(Boolean);

  return {
    id: `hikvision-${slugify(item.title)}`,
    brand: "海康威视",
    category,
    series: item.series || "未分组",
    model: item.title,
    application: inferHikvisionApplication(endpoint, item.subcategory),
    summary: item.description || `${item.series || "LED Displays"} 产品，来自海康威视官方 LED Displays 目录。`,
    tags: unique(baseTags),
    originUrl: detailUrl,
    lastSeenAt: new Date().toISOString(),
    specs: {
      ...(category !== "controller" && pointPitch !== "-" ? { "点间距": pointPitch } : {}),
      ...(category !== "controller"
        ? {
            "箱体尺寸": readRequiredSpec(detailSpecs, "Dimensions (W × H × D)", "Dimensions (W x H x D)", "Dimensions"),
            "分辨率": readRequiredSpec(detailSpecs, "Resolution"),
            "亮度": readRequiredSpec(detailSpecs, "White Balance Brightness", "Brightness"),
            "刷新率": readRequiredSpec(detailSpecs, "Refresh Rate"),
            "维护方式": readRequiredSpec(detailSpecs, "Maintenance Method"),
            "防护等级": readRequiredSpec(detailSpecs, "Protection Level")
          }
        : {
            "输入接口": joinSpecValues(detailSpecs, ["Input Interface", "Input Signal", "Input"]),
            "输出接口": joinSpecValues(detailSpecs, ["Output Interface", "Output Signal", "Output"]),
            "控制网口": joinSpecValues(detailSpecs, ["Network Interface", "Ethernet Port"]),
            "最大带载": joinSpecValues(detailSpecs, ["Loading Capacity", "Maximum Capacity"]),
            "工作电压": joinSpecValues(detailSpecs, ["Power Supply", "Input Voltage"])
          }),
      "海康子类": item.subcategory || "-"
    }
  };
}

function extractUniluminVariants(productUrl, html) {
  const pageTitle = extractMetaContent(html, "og:title") || extractTitle(html) || "Unilumin Product";
  const summary = extractMetaContent(html, "description") || `${pageTitle}，来自洲明官网产品目录。`;
  const series = pageTitle.replace(/\s*[–-]\s*Unilumin$/i, "").trim();
  const category = inferUniluminCategory(productUrl, series, html);
  const application = inferUniluminApplication(productUrl);
  const tables = extractUniluminParameterTables(html);
  const modelsTable = tables.find(
    (table) =>
      table.some((row) => /^model$/i.test(row[0] || "")) ||
      (/^pixel pitch$/i.test(table[1]?.[0] || "") && table[0]?.length > 1)
  );

  if (!modelsTable) {
    const specs = tableRowsToSingleSpecs(tables.at(-1) || []);
    return [
      {
        id: `unilumin-${slugify(series)}`,
        brand: "洲明",
        category,
        series,
        model: series,
        application,
        summary,
        tags: unique(["真实抓取", extractUniluminSegment(productUrl)]),
        originUrl: productUrl,
        lastSeenAt: new Date().toISOString(),
        specs: normalizeUniluminSpecs(specs)
      }
    ];
  }

  const variantSpecsList = tableRowsToVariantSpecs(modelsTable);
  return variantSpecsList
    .filter((variantSpecs) => shouldKeepUniluminVariant(variantSpecs.Model || ""))
    .map((variantSpecs) => ({
      id: `unilumin-${slugify(variantSpecs.Model || `${series}-${variantSpecs["Pixel Pitch"] || ""}`)}`,
      brand: "洲明",
      category,
      series,
      model: variantSpecs.Model || series,
      application,
      summary,
      tags: unique(["真实抓取", extractUniluminSegment(productUrl)]),
      originUrl: productUrl,
      lastSeenAt: new Date().toISOString(),
      specs: normalizeUniluminSpecs(variantSpecs)
    }));
}

function extractUniluminParameterTables(html) {
  const markerIndex = html.indexOf("Product Parameter");
  if (markerIndex === -1) {
    return [];
  }

  const sectionHtml = html.slice(markerIndex);
  const tableMatches = [...sectionHtml.matchAll(/<table[\s\S]*?<\/table>/g)].map((match) => match[0]);

  return tableMatches.map((tableHtml) =>
    [...tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((rowMatch) =>
      [...rowMatch[1].matchAll(/<td[\s\S]*?>([\s\S]*?)<\/td>/g)]
        .map((cell) => normalizeWhitespace(decodeHtml(stripTags(cell[1]))))
        .filter(Boolean)
    )
  );
}

function tableRowsToVariantSpecs(rows) {
  if (!rows.length) {
    return [];
  }

  if (/^model$/i.test(rows[0][0] || "")) {
    if (isLikelySpecLabel(rows[1]?.[0] || "")) {
      return parseColumnVariantTable(rows);
    }
    return parseRowVariantTable(rows);
  }

  if (!isLikelySpecLabel(rows[0][0] || "") && /^pixel pitch$/i.test(rows[1]?.[0] || "")) {
    return parseHeaderlessModelTable(rows);
  }

  return [];
}

function parseColumnVariantTable(rows) {
  const specsList = [];
  const modelRow = rows.find((row) => /^model$/i.test(row[0] || ""));
  let count = Math.max(0, modelRow.length - 1);
  let modelNames = modelRow.slice(1);

  if (modelRow.length === 2) {
    const pitchRow = rows.find((row) => /pixel pitch/i.test(row[0] || ""));
    if (pitchRow && pitchRow.length > 2) {
      count = pitchRow.length - 1;
      modelNames = pitchRow.slice(1).map((pitch) => `${modelRow[1]} ${pitch}`.trim());
    }
  }

  for (let column = 1; column <= count; column += 1) {
    const specs = {
      Model: modelNames[column - 1] || modelNames[0] || "-"
    };

    for (const row of rows) {
      const key = row[0];
      const value = resolveVariantCellValue(row, column, count);
      specs[key] = value;
    }
    specsList.push(specs);
  }

  return specsList.filter((specs) => specs.Model && !isLikelySpecLabel(specs.Model));
}

function parseRowVariantTable(rows) {
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const specs = {};
    headers.forEach((header, index) => {
      specs[header || `field_${index}`] = row[index] || "-";
    });
    return specs;
  });
}

function parseHeaderlessModelTable(rows) {
  const specsList = [];
  const count = rows[0].length;

  for (let column = 0; column < count; column += 1) {
    const specs = {
      Model: rows[0][column]
    };

    for (const row of rows.slice(1)) {
      const key = row[0];
      const value = row[column + 1] || row[row.length - 1] || "-";
      specs[key] = value;
    }

    specsList.push(specs);
  }

  return specsList.filter((specs) => specs.Model && !isLikelySpecLabel(specs.Model));
}

function resolveVariantCellValue(row, column, count) {
  let values = row.slice(1);

  if (values.length === count + 1 && isLikelySpecLabel(values[0])) {
    values = values.slice(1);
  }

  if (values.length === count) {
    return values[column - 1] || "-";
  }

  if (values.length > count && values.length % count === 0) {
    const groupSize = values.length / count;
    const start = (column - 1) * groupSize;
    return values.slice(start, start + groupSize).join(" / ");
  }

  if (values.length === 1) {
    return values[0];
  }

  return values[column - 1] || values[values.length - 1] || "-";
}

function tableRowsToSingleSpecs(rows) {
  const specs = {};

  for (const row of rows) {
    if (row.length >= 2) {
      specs[row[0]] = row[1];
    }
  }

  return specs;
}

function isLikelySpecLabel(value) {
  const normalized = String(value).trim().toLowerCase();
  return [
    "pixel pitch",
    "brightness",
    "resolution",
    "dimension",
    "dimensions",
    "maintenance",
    "weight",
    "cabinet",
    "cabinet size",
    "module size",
    "ip rating",
    "parameter",
    "viewing angle",
    "contrast ratio",
    "led",
    "pixel density",
    "module",
    "panel",
    "power",
    "color",
    "protection",
    "driver",
    "installation",
    "frame rate",
    "gray scale",
    "input",
    "processing",
    "certification",
    "material",
    "planeness",
    "product"
  ].some((keyword) => normalized.startsWith(keyword));
}

function shouldKeepUniluminVariant(model) {
  const normalized = String(model || "").trim();
  if (!normalized) {
    return false;
  }

  if (isLikelySpecLabel(normalized)) {
    return false;
  }

  if (/^(u|x|f-|uc-|upad|ugm|ugn|urm|umini|umicro|umate|usurface|uslim|uhf|uda|uky|u-)/i.test(normalized)) {
    return true;
  }

  return /\d/.test(normalized);
}

function normalizeUniluminSpecs(specs) {
  return {
    ...(readRequiredSpec(specs, "Pixel Pitch") !== "-" ? { "点间距": readRequiredSpec(specs, "Pixel Pitch") } : {}),
    "箱体尺寸": readRequiredSpec(specs, "Cabinet Size(W x H x D)", "Cabinet Size(W x H x D)", "Cabinet Size"),
    "模组尺寸": readRequiredSpec(specs, "Module Size"),
    "亮度": readRequiredSpec(specs, "Brightness"),
    "箱体重量": readRequiredSpec(specs, "Cabinet Weight"),
    "维护方式": readRequiredSpec(specs, "Maintenance Method"),
    "防护等级": readRequiredSpec(specs, "IP Rating")
  };
}

function normalizeNovaSpecs(specs, firstLabel) {
  const normalized = {
    "最大带载": readRequiredSpec(specs, "Max. Loading Capacity", "Loading Capacity", "Max Width (pixels)"),
    "输入接口": readRequiredSpec(specs, "Input Options", "Input", "Inputs", "Input Connectors"),
    "输出接口": readRequiredSpec(specs, "Output Options", "Outputs", "Output", "Output Connectors"),
    "控制网口": readRequiredSpec(specs, "Control Interface", "Ethernet Port", "Control Connectors"),
    "图层数": readRequiredSpec(specs, "Layers"),
    "备份机制": readRequiredSpec(specs, "Device Backup", "Backup"),
    "工作电压": readRequiredSpec(specs, "Power Supply", "Input Voltage", "Output Voltage"),
    "机箱规格": readRequiredSpec(specs, "Chassis"),
    "CPU": readRequiredSpec(specs, "CPU"),
    "内存": readRequiredSpec(specs, "RAM"),
    "存储": readRequiredSpec(specs, "Storage")
  };

  const productType = readRequiredSpec(specs, "Product Type");
  if (productType !== "-") {
    normalized["产品类型"] = productType;
  }

  if (firstLabel && !normalized["软件类型"]) {
    normalized["产品类型"] = firstLabel;
  }

  return Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [key, value === "/" ? "-" : value])
  );
}

function extractNovaCatalogEntries(listUrl, html) {
  return [...html.matchAll(/<li[^>]*products_list_col1[^>]*>([\s\S]*?)<\/li>/gi)].flatMap((match) => {
    const cardHtml = match[1];
    const primaryHeading = normalizeWhitespace(
      decodeHtml(stripTags(cardHtml.match(/products_list_card_text11">([\s\S]*?)<\/div>/i)?.[1] || ""))
    );
    const secondaryHeading = normalizeWhitespace(
      decodeHtml(stripTags(cardHtml.match(/products_list_card_text12">([\s\S]*?)<\/div>/i)?.[1] || ""))
    );
    const productType = secondaryHeading || primaryHeading || "NovaStar";

    return [...cardHtml.matchAll(/<a[^>]*products_list_card_link1[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
      .map((linkMatch) => {
        const linkText = normalizeNovaModelName(decodeHtml(stripTags(linkMatch[2])));
        const model = /learn more/i.test(linkText) ? normalizeNovaModelName(primaryHeading || secondaryHeading) : linkText;
        if (!model) {
          return null;
        }

        return {
          detailUrl: new URL(linkMatch[1], listUrl).toString(),
          model,
          series: inferNovaSeriesFromCatalog(model, productType),
          productType,
          pageCategory: /catid=2/.test(listUrl) ? "LED Control System" : "Processors"
        };
      })
      .filter(Boolean);
  });
}

function extractNovaVariants(html, entry) {
  const rows = extractNovaTableRows(html);
  const category = "controller";
  const title = normalizeNovaModelName(entry.model || extractNovaTitle(html) || "NovaStar Product");
  const summary = `${title}，来自诺瓦官方产品目录。`;
  const headerRow = rows[0] || [];
  const nextRow = rows[1] || [];

  if (isNovaVariantHeaderRow(headerRow, nextRow)) {
    const startIndex = isExplicitNovaHeaderLabel(headerRow[0]) ? 1 : 0;
    const models = headerRow.slice(startIndex).map(normalizeNovaModelName).filter(Boolean);
    return models.map((model, index) => {
      const specs = buildNovaVariantSpecs(rows.slice(1), index, startIndex);
      return buildNovaProduct({
        model,
        entry,
        category,
        summary: `${model}，来自诺瓦官方产品目录。`,
        specs
      });
    });
  }

  const specs = Object.fromEntries(rows.map((row) => [row[0], row[1] || "-"]));
  const resolvedModel = resolveNovaSingleModel(entry, specs, title);
  return [
    buildNovaProduct({
      model: resolvedModel,
      entry,
      category,
      summary: `${resolvedModel}，来自诺瓦官方产品目录。`,
      specs
    })
  ];
}

function buildNovaProduct({ model, entry, category, summary, specs }) {
  return {
    id: `novastar-${slugify(model)}`,
    brand: "诺瓦",
    category,
    series: entry.series,
    model,
    application: inferNovaApplication(entry.productType, entry.series, model),
    summary,
    tags: unique(["真实抓取", "控制器", entry.productType, entry.pageCategory]),
    originUrl: entry.detailUrl,
    lastSeenAt: new Date().toISOString(),
    specs: normalizeNovaSpecs({
      ...specs,
      "Product Type": entry.productType
    })
  };
}

function isNovaVariantHeaderRow(row, nextRow) {
  if (row.length < 2) {
    return false;
  }

  if (row.length >= 3 && isExplicitNovaHeaderLabel(row[0])) {
    return true;
  }

  return row.length >= 3 && row.every(looksLikeNovaModel) && isLikelyNovaSpecLabel(nextRow[0] || "");
}

function isExplicitNovaHeaderLabel(value = "") {
  return /^(type|product|model|device model)$/i.test(value);
}

function buildNovaVariantSpecs(rows, variantIndex, startIndex = 1) {
  return Object.fromEntries(
    rows
      .filter((row) => row[0])
      .map((row) => [row[0], row[variantIndex + startIndex] || "-"])
  );
}

function resolveNovaSingleModel(entry, specs, fallbackTitle) {
  const detailModel = readRequiredSpec(specs, "Model", "Type", "Product", "Device Model");
  const normalizedDetailModel = normalizeNovaModelName(detailModel);

  if (normalizedDetailModel !== "-" && (looksLikeGenericNovaSeries(entry.model) || isWeakNovaModel(fallbackTitle))) {
    return normalizedDetailModel;
  }

  return fallbackTitle;
}

function inferNovaSeriesFromCatalog(model, productType) {
  if (/series/i.test(model)) {
    return model;
  }

  if (/kompass/i.test(model)) {
    return "Kompass";
  }

  const prefixMatch = model.match(/^([A-Z]{1,6})[\s-]?\d/i);
  if (prefixMatch) {
    return `${prefixMatch[1]} Series`;
  }

  return productType || "NovaStar";
}

function inferNovaApplication(productType, series, model) {
  const text = [productType, series, model].join(" ");
  if (/media server/i.test(text)) {
    return "媒体服务器 / 舞台播控";
  }
  if (/software/i.test(text)) {
    return "内容编辑 / 播控软件";
  }
  if (/receiving card/i.test(text)) {
    return "接收卡 / 屏体控制";
  }
  if (/resolution|mctrl|coex|controller/i.test(text)) {
    return "发送控制 / 视频处理";
  }
  return "LED 控制 / 视频处理";
}

function normalizeNovaModelName(value) {
  return normalizeWhitespace(value)
    .replace(/\s+Comparison\s+Downloads$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractColorlightCatalogEntries(rootUrl, html) {
  const productNavHtml = html.slice(html.indexOf('<div class="ProductNav">'), html.indexOf('<div class="ProductNavOff"'));
  const tabTitles = [...productNavHtml.matchAll(/<div class="tabTerm[^"]*">([\s\S]*?)<\/div>/gi)].map((match) =>
    normalizeWhitespace(decodeHtml(stripTags(match[1])))
  );
  const tabItems = productNavHtml.split(/<div class="tabItem[^"]*">/i).slice(1, tabTitles.length + 1);

  return tabItems.flatMap((tabHtml, tabIndex) => {
    const topCategory = tabTitles[tabIndex] || "Colorlight";
    const boxes = [...tabHtml.matchAll(/<h5>([\s\S]*?)<\/h5>[\s\S]*?<div class="li">([\s\S]*?)<\/div>/gi)].map((match) => ({
      series: normalizeWhitespace(decodeHtml(stripTags(match[1]))),
      linksHtml: match[2]
    }));

    return boxes.flatMap((box) => {
      const series = box.series || topCategory;
      const links = [...box.linksHtml.matchAll(/<a[^>]*href="([^"]*\/product\/special\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

      return links.map((linkMatch) => {
        const detailUrl = new URL(linkMatch[1].replace(/\/{2,}/g, "/"), rootUrl).toString();
        const detailId = detailUrl.match(/\/product\/special\/(\d+)/)?.[1] || slugify(detailUrl);
        const model = normalizeWhitespace(decodeHtml(stripTags(linkMatch[2])));

        return {
          id: detailId,
          topCategory,
          series,
          model,
          detailUrl,
          downloadUrl: detailUrl.replace("/product/special/", "/product/download/"),
          specUrl: detailUrl.replace("/product/special/", "/product/routine/")
        };
      });
    });
  });
}

function dedupeColorlightEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.id}:${entry.model}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function splitColorlightModels(value) {
  const normalized = normalizeWhitespace(value).replace(/\s*\/\s*/g, "/");
  const parts = normalized.split("/").map((item) => item.trim()).filter(Boolean);
  return parts.length ? parts : [normalized];
}

function extractColorlightSummary(featureHtml, entry) {
  const metaDescription = extractMetaContent(featureHtml, "description");
  if (metaDescription && metaDescription !== "- Video processors · LED control system · ColorlightCloud · Media Server · Solutions · Downloads · News · About Colorlight") {
    return metaDescription;
  }

  const paragraphs = [...featureHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => normalizeWhitespace(decodeHtml(stripTags(match[1]))))
    .filter((text) => text.length > 30 && !/Copyright|Colorlight|English/i.test(text));

  return paragraphs[0] || `${entry.model}，来自卡莱特官方产品目录。`;
}

function extractColorlightSpecPdfUrl(downloadHtml) {
  const pdfLinks = [...downloadHtml.matchAll(/href="([^"]+\.pdf)"/gi)].map((match) => match[1]);
  const specLink =
    pdfLinks.find((link) => /spec/i.test(link)) ||
    pdfLinks.find((link) => /quick.?start/i.test(link)) ||
    pdfLinks[0];

  if (!specLink) {
    return "";
  }

  const normalized = decodeHtml(specLink).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  return new URL(normalized, "https://en.colorlightinside.com").toString();
}

async function getColorlightPdfText(pdfUrl, cache) {
  if (!pdfUrl) {
    return "";
  }

  if (!cache.has(pdfUrl)) {
    const pdfData = fetchBinary(pdfUrl);
    cache.set(
      pdfUrl,
      pdfData.then(async (buffer) => {
        const parser = new PDFParse({ data: buffer });
        try {
          const result = await parser.getText();
          return normalizeColorlightPdfText(result.text);
        } finally {
          await parser.destroy();
        }
      })
    );
  }

  return cache.get(pdfUrl);
}

function normalizeColorlightPdfText(text) {
  const shifted = Array.from(text)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 33 && code <= 126) {
        return String.fromCharCode(code - 1);
      }
      return ch;
    })
    .join("");

  const controlMap = {
    "\u0010": "0",
    "\u0011": "0",
    "\u0012": "1",
    "\u0013": "2",
    "\u0014": "3",
    "\u0015": "4",
    "\u0016": "5",
    "\u0017": "6",
    "\u0018": "7",
    "\u0019": "8",
    "\u001a": "9",
    "\u000f": "."
  };

  return shifted
    .replace(/[\u000f-\u001a]/g, (match) => controlMap[match] || " ")
    .replace(/\u0007/g, "&")
    .replace(//g, "x")
    .replace(/[\u0000-\u0008\u000b-\u000e\u001b-\u001f]/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/[\uE000-\uF8FF]/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseColorlightPdfSpecs(text, entry, specPdfUrl) {
  const specs = {
    "产品类型": entry.series,
    "规格书": specPdfUrl || "-"
  };

  if (!text) {
    return specs;
  }

  const loadingMatch =
    text.match(/LOADING CAPACITY OF ([0-9.\s]+MILLION PIXELS)/i) ||
    text.match(/SUPPORTS UP TO ([0-9.\s]+MILLION PIXELS)/i);
  if (loadingMatch) {
    specs["最大带载"] = normalizeWhitespace(loadingMatch[1]);
  }

  const widthHeightMatch = text.match(/([0-9\s]+) PIXELS IN WIDTH OR ([0-9\s]+) PIXELS IN HEIGHT/i);
  if (widthHeightMatch) {
    specs["分辨率"] = `${compactDigits(widthHeightMatch[1])} x ${compactDigits(widthHeightMatch[2])}`;
  }

  const layerMatch = text.match(/([0-9]+)[^\n]{0,20}LAYER(?: SPLICING DISPLAY)?/i);
  if (layerMatch) {
    specs["图层数"] = `${layerMatch[1]} layers`;
  }

  const inputLines = collectColorlightLines(text, /(INPUT BOARDS?|INPUTS? UP TO|HDMI|DP 1\.|SDI|ST2110)/i, 5);
  if (inputLines.length) {
    specs["输入接口"] = unique(inputLines).join(" ");
  }

  const outputLines = collectColorlightLines(text, /(OUTPUT BOARD|ETHERNET PORT OUTPUT|FIBER PORTS|LOOP REDUNDANCY)/i, 5);
  if (outputLines.length) {
    specs["输出接口"] = unique(outputLines).join(" ");
  }

  const voltageMatch = text.match(/INPUT VOLTAGE[:\s]+([A-Z0-9.\-\/\s()]+)/i);
  if (voltageMatch) {
    specs["工作电压"] = normalizeWhitespace(voltageMatch[1]);
  }

  const backupMatch = text.match(/(BACKUP PORTS?[^\n.]+|LOOP REDUNDANCY[^\n.]+)/i);
  if (backupMatch) {
    specs["备份机制"] = normalizeWhitespace(backupMatch[1]);
  }

  return specs;
}

function collectColorlightLines(text, pattern) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  return unique(
    lines
      .filter((line) => pattern.test(line))
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter((line) => line.length <= 220)
  );
}

function compactDigits(value = "") {
  return normalizeWhitespace(value).replace(/\s+/g, "");
}

function normalizeColorlightSpecs(specs) {
  const normalized = {
    "最大带载": specs["最大带载"] || "-",
    "输入接口": specs["输入接口"] || "-",
    "输出接口": specs["输出接口"] || "-",
    "图层数": specs["图层数"] || "-",
    "工作电压": specs["工作电压"] || "-",
    "备份机制": specs["备份机制"] || "-",
    "分辨率": specs["分辨率"] || "-",
    "产品类型": specs["产品类型"] || "-",
    "规格书": specs["规格书"] || "-"
  };

  return normalized;
}

function inferColorlightApplication(series, model) {
  const text = `${series} ${model}`;
  if (/media server|cloud/i.test(text)) {
    return "媒体播控 / 云平台";
  }
  if (/calibration|software/i.test(text)) {
    return "校正管理 / 软件控制";
  }
  if (/processor|splicer|av over ip|meeting/i.test(text)) {
    return "视频处理 / 拼控 / 会议";
  }
  return "LED 控制 / 视频处理";
}

function looksLikeGenericNovaSeries(value = "") {
  return /series|software|resolution|processor|controller|receiving card|video controller/i.test(value);
}

function isWeakNovaModel(value = "") {
  return !value || /^v[\d.]+$/i.test(value) || /global leading/i.test(value);
}

function looksLikeNovaModel(value = "") {
  if (!value || value.length > 40) {
    return false;
  }

  if (isLikelyNovaSpecLabel(value)) {
    return false;
  }

  return /[A-Z]/.test(value) && (/\d/.test(value) || /series|plus|pro|kompass|unico|visual/i.test(value));
}

function isLikelyNovaSpecLabel(value = "") {
  return /loading|capacity|connector|voltage|bandwidth|layers|presets|control|output|input|monitor|backup|calibration|latency|chassis|ram|cpu|storage|graphics|decoding|programs|product type|device model|model$/i.test(
    value
  );
}

function inferHikvisionCategory(endpoint) {
  if (endpoint.includes("/led-modules/")) {
    return "module";
  }
  if (endpoint.includes("/led-controllers/") || endpoint.includes("/video-wall-controllers/")) {
    return "controller";
  }
  return "cabinet";
}

function inferHikvisionApplication(endpoint, subcategory) {
  if (endpoint.includes("/indoor-led/")) {
    return "室内显示 / 会议 / 展厅";
  }
  if (endpoint.includes("/outdoor-led/")) {
    return "户外广告 / 固装显示";
  }
  if (endpoint.includes("/rental-led/")) {
    return "租赁演出 / 活动显示";
  }
  if (endpoint.includes("/creative-led/")) {
    return "创意显示 / 一体机 / 海报屏";
  }
  if (endpoint.includes("/led-modules/")) {
    return "模组配套 / 项目集成";
  }
  if (endpoint.includes("/video-wall-controllers/")) {
    return "拼控 / 视频墙";
  }
  if (endpoint.includes("/led-controllers/")) {
    return "发送控制 / 屏体控制";
  }
  return subcategory || "LED 显示";
}

function inferUniluminCategory(productUrl, series, html) {
  if (/module/i.test(productUrl) || /module/i.test(series)) {
    return "module";
  }
  if (/controller/i.test(productUrl) || /controller/i.test(series)) {
    return "controller";
  }
  if (html.includes("Video Processor") || html.includes("Controller")) {
    return "controller";
  }
  return "cabinet";
}

function inferUniluminApplication(productUrl) {
  if (productUrl.includes("/professional/")) {
    return "专业显示 / 指挥中心 / 演播";
  }
  if (productUrl.includes("/commercial/")) {
    return "商业显示 / 会议 / 展厅";
  }
  if (productUrl.includes("/dooh/")) {
    return "户外广告 / DOOH";
  }
  if (productUrl.includes("/rental/")) {
    return "租赁演出 / XR / 活动显示";
  }
  if (productUrl.includes("/creative/")) {
    return "创意显示 / 异形显示";
  }
  if (productUrl.includes("/utv-cinema/")) {
    return "影院 / 一体化显示";
  }
  return "LED 显示";
}

function inferNovaCategory(detailUrl, rows, model) {
  if (/catid=3/.test(detailUrl)) {
    return "controller";
  }

  const firstLabel = rows[0]?.[0] || "";
  if (/software/i.test(firstLabel) || /kompass/i.test(model)) {
    return "controller";
  }

  return "controller";
}

function inferNovaSeries(detailUrl, model) {
  if (/catid=3/.test(detailUrl)) {
    return /MX|CX/i.test(model) ? "COEX / MX Series" : /VX/i.test(model) ? "VX Series" : "Video Controller";
  }
  return /H/i.test(model) ? "H Series" : /Kompass/i.test(model) ? "Kompass" : "NovaStar";
}

function extractUniluminSegment(productUrl) {
  const match = productUrl.match(/\/products\/([^/]+)\//);
  return match ? match[1] : "unilumin";
}

function toHikvisionDetailUrl(detailPath = "") {
  return `https://display.hikvision.com${detailPath.replace("/display-en/", "/en/")}`;
}

function toHikvisionPublicPageUrl(pathname = "") {
  if (pathname.startsWith("/content/hikvision/")) {
    return `https://www.hikvision.com${pathname.replace("/content/hikvision", "").replace(/\.html$/, "/")}`;
  }
  if (pathname.startsWith("/display-en/")) {
    return `https://www.hikvision.com${pathname}`;
  }
  if (pathname.startsWith("/en/")) {
    return `https://display.hikvision.com${pathname}`;
  }
  return pathname;
}

function extractLabeledSpecsFromHikvision(html) {
  const specs = {};
  const pattern =
    /tech-specs-items-description__title(?:--heading)?">([^<]+)<\/span><span class="tech-specs-items-description__title-details">([\s\S]*?)<\/span>/g;

  for (const match of html.matchAll(pattern)) {
    const label = decodeHtml(stripTags(match[1])).trim();
    const value = normalizeWhitespace(decodeHtml(stripTags(match[2])));
    if (label && value) {
      specs[label] = value;
    }
  }

  return specs;
}

function extractMetaContent(html, propertyName) {
  const escaped = propertyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const byProperty = html.match(new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"));
  const byName = html.match(new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"));
  return decodeHtml(byProperty?.[1] || byName?.[1] || "");
}

function extractTitle(html) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return decodeHtml(match?.[1] || "");
}

function extractNovaTitle(html) {
  const headers = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((match) => normalizeWhitespace(stripTags(match[1])))
    .filter(Boolean);

  return headers.find((text) => /[A-Z]{1,4}\d|Kompass|COEX|VX|MX|CX|H/i.test(text)) || extractTitle(html);
}

function extractNovaTableRows(html) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((rowMatch) =>
      [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
        .map((cell) => normalizeWhitespace(decodeHtml(stripTags(cell[1]))))
        .filter(Boolean)
    )
    .filter((row) => row.length >= 2);
}

function readRequiredSpec(specs, ...keys) {
  for (const key of keys) {
    if (specs[key]) {
      return specs[key];
    }
  }
  return "-";
}

function joinSpecValues(specs, keys) {
  return keys.map((key) => specs[key]).filter(Boolean).join(" / ") || "-";
}

async function fetchText(url) {
  return fetchWithRetry(url, "text");
}

async function fetchJson(url) {
  return fetchWithRetry(url, "json");
}

async function fetchBinary(url) {
  return fetchWithRetry(url, "binary");
}

async function fetchWithRetry(url, mode, attempt = 1) {
  await sleep(180);
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36",
      accept:
        mode === "json"
          ? "application/json,text/plain,*/*"
          : mode === "binary"
            ? "application/pdf,application/octet-stream,*/*"
            : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      referer: "https://en.colorlightinside.com/"
    }
  });

  if (response.ok) {
    if (mode === "json") {
      return response.json();
    }
    if (mode === "binary") {
      return Buffer.from(await response.arrayBuffer());
    }
    return response.text();
  }

  if ((response.status === 403 || response.status === 429) && attempt < 4) {
    await sleep(500 * attempt);
    return fetchWithRetry(url, mode, attempt + 1);
  }

  throw new Error(`HTTP ${response.status} for ${url}`);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, " ");
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function decodeHtml(value) {
  return value
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&times;/g, "×")
    .replace(/&#215;/g, "×")
    .replace(/&#176;/g, "°")
    .replace(/&#178;/g, "²")
    .replace(/&#13217;/g, "㎡")
    .replace(/&nbsp;/g, " ");
}

function stringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function unique(items) {
  return [...new Set(items)];
}

function dedupeProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    if (seen.has(product.id)) {
      return false;
    }
    seen.add(product.id);
    return true;
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
