# LED 行业产品参数对比平台

这是一个适合免费部署的 LED 产品参数对比网站原型，支持：

- 模组、箱体、控制器三类产品
- 品牌筛选、关键词搜索、跨厂家参数对比
- Excel 导出与打印为 PDF
- GitHub Pages 固定网址访问
- GitHub Actions 定时更新公开数据

## 本地运行

```bash
node server.js
```

打开 `http://localhost:3000`

## 数据结构

核心展示数据位于 [public/data/products.json](C:\Users\Administrator\Documents\LED相关\public\data\products.json)。

```json
{
  "id": "unique-id",
  "brand": "品牌",
  "category": "module | cabinet | controller",
  "series": "系列",
  "model": "型号",
  "application": "应用场景",
  "summary": "简介",
  "originUrl": "来源地址",
  "lastSeenAt": "最近更新时间",
  "tags": ["标签"],
  "specs": {
    "参数名": "参数值"
  }
}
```

同步元数据位于 [public/data/crawl-meta.json](C:\Users\Administrator\Documents\LED相关\public\data\crawl-meta.json)。

## 免费自动更新架构

### 前台

- `GitHub Pages`
- 直接读取 `docs` 目录发布

### 数据同步

- [scripts/crawl.mjs](C:\Users\Administrator\Documents\LED相关\scripts\crawl.mjs)
- [config/sources.json](C:\Users\Administrator\Documents\LED相关\config\sources.json)
- [.github/workflows/free-sync.yml](C:\Users\Administrator\Documents\LED相关\.github\workflows\free-sync.yml)

### 发布同步

- [scripts/sync-docs.mjs](C:\Users\Administrator\Documents\LED相关\scripts\sync-docs.mjs)

## 命令

```bash
npm run crawl
npm run sync:docs
npm run build
```

## 下一步如何接真实品牌采集

建议按品牌逐个补适配器：

1. 先确定每个品牌的公开产品页、详情页或公开 JSON 数据源
2. 给每个品牌增加专属解析器，把字段映射到统一结构
3. 将解析结果写回 `public/data/products.json`
4. 让 GitHub Actions 每 6 小时自动刷新一次

## 限制

- `GitHub Pages` 只能托管静态前端，不能直接执行实时后端爬虫
- 免费方案更适合“定时更新”，不适合“每次用户打开页面时即时爬取”
- 真正商用时，建议升级成独立后端服务加数据库
