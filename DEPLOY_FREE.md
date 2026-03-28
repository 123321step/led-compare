# 免费部署说明

当前项目已经准备好静态部署目录：

- [docs](C:\Users\Administrator\Documents\LED相关\docs)

最适合的免费方案是 `GitHub Pages`，因为：

- 完全免费
- 会得到固定公网网址
- 后续更新方便

## 方案一：GitHub Pages

1. 在 GitHub 新建一个公开仓库
2. 把当前目录代码上传到该仓库
3. 进入仓库 `Settings -> Pages`
4. 在 `Build and deployment` 中选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/docs`
5. 保存后等待 1 到 3 分钟
6. 访问 GitHub 提供的网址

最终网址通常会是：

`https://你的GitHub用户名.github.io/仓库名/`

## 方案二：Cloudflare Pages

1. 注册并登录 Cloudflare
2. 进入 Pages
3. 选择 `Upload assets`
4. 上传整个 `docs` 文件夹内容
5. 发布后会得到一个 `*.pages.dev` 固定网址

## 当前目录说明

- [public](C:\Users\Administrator\Documents\LED相关\public)：本地开发使用
- [docs](C:\Users\Administrator\Documents\LED相关\docs)：免费静态部署使用

## 更新站点时

如果你修改了 `public` 目录内容，需要同步复制到 `docs` 目录再重新发布。
