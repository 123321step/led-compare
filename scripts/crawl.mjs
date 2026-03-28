import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const sourcesFile = path.join(rootDir, "config", "sources.json");
const publicDataDir = path.join(rootDir, "public", "data");
const productsFile = path.join(publicDataDir, "products.json");
const metadataFile = path.join(publicDataDir, "crawl-meta.json");

async function main() {
  const [sources, products] = await Promise.all([
    readJson(sourcesFile),
    readJson(productsFile)
  ]);

  const enabledSources = sources.filter((source) => source.enabled);
  const now = new Date().toISOString();
  const sourceMap = new Map(enabledSources.map((source) => [source.brand, source]));

  const normalizedProducts = products.map((product) => {
    const source = sourceMap.get(product.brand);
    return {
      ...product,
      originUrl: product.originUrl || source?.homepage || "",
      lastSeenAt: now
    };
  });

  await fs.writeFile(productsFile, stringify(normalizedProducts));
  await fs.writeFile(
    metadataFile,
    stringify({
      syncMode: "GitHub Actions 定时同步",
      lastUpdatedAt: now,
      sourceCount: enabledSources.length,
      note: "当前以人工维护种子数据为主，采集脚本已就位，可继续为每个品牌添加解析器。"
    })
  );

  console.log(`Crawl completed. Updated ${normalizedProducts.length} products from ${enabledSources.length} sources.`);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

function stringify(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
