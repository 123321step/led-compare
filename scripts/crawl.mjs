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
      const product = await crawlSource(source);
      generatedProducts.push(product);
      console.log(`Fetched ${source.brand}: ${source.model}`);
    } catch (error) {
      failures.push({
        brand: source.brand,
        model: source.model,
        message: error.message
      });
      console.warn(`Failed ${source.brand} ${source.model}: ${error.message}`);
    }
  }

  const now = new Date().toISOString();
  const normalizedManualProducts = manualProducts.map((product) => ({
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
      liveSourceCount: generatedProducts.length,
      failedSourceCount: failures.length,
      note:
        failures.length > 0
          ? `已成功抓取 ${generatedProducts.length} 个真实来源，${failures.length} 个来源抓取失败并保留种子数据。`
          : `已成功抓取 ${generatedProducts.length} 个真实来源，其他品牌继续使用人工维护种子数据。`,
      failures
    })
  );

  console.log(
    `Crawl completed. Generated ${generatedProducts.length} live products and kept ${normalizedManualProducts.length} seed products.`
  );
}

async function crawlSource(source) {
  if (source.type === "hikvisionProductPage") {
    return crawlHikvisionProduct(source);
  }

  if (source.type === "uniluminProductPage") {
    return crawlUniluminProduct(source);
  }

  throw new Error(`Unsupported source type: ${source.type}`);
}

async function crawlHikvisionProduct(source) {
  const html = await fetchText(source.url);
  const specs = extractLabeledSpecsFromHikvision(html);

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
      "箱体尺寸": readRequiredSpec(specs, "Dimensions (W × H × D)"),
      "分辨率": readRequiredSpec(specs, "Resolution"),
      "亮度": readRequiredSpec(specs, "White Balance Brightness"),
      "刷新率": readRequiredSpec(specs, "Refresh Rate"),
      "防护等级": readRequiredSpec(specs, "Protection Level", "Front Protection Level", "Rear Protection Level")
    }
  };
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
      "箱体尺寸": readRequiredSpec(specs, "Cabinet Size(W x H x D)", "Cabinet Size(W x H x D)", "Cabinet Size(W x H x D)"),
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

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; LEDCompareBot/1.0; +https://github.com/123321step/led-compare)"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
