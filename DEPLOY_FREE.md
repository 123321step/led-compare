# 免费部署说明

当前项目已经适配 `GitHub Pages` 免费部署。

## 线上网址

配置完成后，固定网址通常为：

`https://123321step.github.io/led-compare/`

## 当前发布结构

- [public](C:\Users\Administrator\Documents\LED相关\public)：开发源文件
- [docs](C:\Users\Administrator\Documents\LED相关\docs)：GitHub Pages 发布目录

## Pages 设置

在 GitHub 仓库的 `Settings -> Pages` 中：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/docs`

## 免费自动更新

本项目已经内置 GitHub Actions 工作流：

- [.github/workflows/free-sync.yml](C:\Users\Administrator\Documents\LED相关\.github\workflows\free-sync.yml)

默认每 6 小时运行一次：

1. 执行采集脚本
2. 更新 `public/data`
3. 同步到 `docs`
4. 自动提交回仓库

## 注意

- GitHub Actions 的定时任务可能有延迟
- 如果仓库长期没有活动，定时任务可能被 GitHub 暂停
- 如果以后要做真正实时爬虫，建议迁移到独立后端
