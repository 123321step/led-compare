# LED 行业产品参数对比平台原型

这是一个无需第三方依赖的本地原型，用于展示 LED 行业不同品牌产品的统一参数对比能力。

## 已实现能力

- 按产品类型筛选：模组、箱体、控制器
- 按品牌筛选和关键词搜索
- 跨品牌勾选多个产品进行统一参数对比
- 导出 Excel 兼容 `.xls` 文件
- 打印友好布局，可另存为 PDF
- 预留真实数据采集接入方式

## 本地运行

```bash
npm start
```

然后打开 `http://localhost:3000`

## 当前数据结构

样例数据位于 [public/data/products.json](public/data/products.json)，核心字段如下：

```json
{
  "id": "unique-id",
  "brand": "品牌",
  "category": "module | cabinet | controller",
  "series": "系列",
  "model": "型号",
  "application": "应用场景",
  "summary": "简介",
  "tags": ["标签1", "标签2"],
  "specs": {
    "参数名": "参数值"
  }
}
```

## 如果要接入实时爬虫

建议拆成三层：

1. `crawler` 采集层
   - 每个品牌一个适配器，负责抓官网或授权公开页面
   - 解析出型号、分类、参数、更新时间、原始链接

2. `normalize` 标准化层
   - 将不同品牌字段映射到统一结构
   - 例如“亮度”“刷新率”“防护等级”“最大带载”等做标准字段对齐

3. `api` 服务层
   - 提供 `/api/products`、`/api/compare`、`/api/export/excel`、`/api/export/pdf`
   - 加缓存和定时任务，避免每次打开页面都实时抓全网

## 更适合你的下一步

如果你准备把它做成正式商用系统，下一阶段建议我继续帮你做：

- 改造成 `Next.js + 数据库 + 定时采集任务` 的正式架构
- 加入品牌采集规则管理后台
- 做真实 Excel/PDF 生成
- 增加产品详情页、参数差异高亮、收藏方案、账号登录
