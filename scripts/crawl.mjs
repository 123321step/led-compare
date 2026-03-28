import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

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

  if (source.type === "uniluminProductPage") {
    return [await crawlUniluminProduct(source)];
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

  const seenIds = new Set();
  return allProducts.filter((product) => {
    if (seenIds.has(product.id)) {
      return false;
    }
    seenIds.add(product.id);
    return true;
  });
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
    const directDataUrls = extractSearchListUrls(categoryHtml);
    endpoints.push(...directDataUrls);

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

function extractSearchListUrls(html) {
  return unique([...html.matchAll(/data-url="([^"]*search_list[^"]*)"/g)].map((match) => match[1]));
}

function normalizeHikvisionProduct({ endpoint, item, detailUrl, detailSpecs }) {
  const category = inferHikvisionCategory(endpoint, item);
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
    application: inferHikvisionApplication(endpoint, item),
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

function inferHikvisionCategory(endpoint, item) {
  if (endpoint.includes("/led-modules/")) {
    return "module";
  }
  if (endpoint.includes("/led-controllers/") || endpoint.includes("/video-wall-controllers/")) {
    return "controller";
  }
  return "cabinet";
}

function inferHikvisionApplication(endpoint, item) {
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
  return item.subcategory || "LED 显示";
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

async function crawlUniluminProduct(source) {
  const html = await fetchText(source.url);
  const specs = extractProductParameterTable(html);

  return {
    id: source.id,
    brand: source.brand,
    category: source.category,
    series: source.series,
    model: source.model,
    application: source.application,
    summary: source.summary,
    tags: source.tags,
    originUrl: source.url,
    lastSeenAt: new Date().toISOString(),
    specs: {
      "点间距": readRequiredSpec(specs, "Pixel Pitch"),
      "箱体尺寸": readRequiredSpec(specs, "Cabinet Size(W x H x D)", "Cabinet Size(W x H x D)"),
      "亮度": readRequiredSpec(specs, "Brightness"),
      "箱体重量": readRequiredSpec(specs, "Cabinet Weight"),
      "维护方式": readRequiredSpec(specs, "Maintenance Method"),
      "防护等级": readRequiredSpec(specs, "IP Rating")
    }
  };
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

function extractProductParameterTable(html) {
  const marker = "Product Parameter";
  const startIndex = html.indexOf(marker);
  if (startIndex === -1) {
    throw new Error("Unilumin product parameter table not found");
  }

  const tableStart = html.indexOf("<table", startIndex);
  const tableEnd = html.indexOf("</table>", tableStart);
  const tableHtml = html.slice(tableStart, tableEnd + "</table>".length);
  const rowMatches = [...tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
  const specs = {};

  for (const rowMatch of rowMatches) {
    const cells = [...rowMatch[1].matchAll(/<td[\s\S]*?>([\s\S]*?)<\/td>/g)]
      .map((cell) => normalizeWhitespace(decodeHtml(stripTags(cell[1]))))
      .filter(Boolean);

    if (cells.length >= 2) {
      specs[cells[0]] = cells[1];
    }
  }

  return specs;
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

async function fetchWithRetry(url, mode, attempt = 1) {
  await sleep(180);
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36",
      accept: mode === "json" ? "application/json,text/plain,*/*" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (response.ok) {
    return mode === "json" ? response.json() : response.text();
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
