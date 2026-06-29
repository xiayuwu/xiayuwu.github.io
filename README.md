# 夏雨屋

基于 Jekyll 与 GitHub Pages 的个人博客。

## 写一篇新文章

在 `_posts` 下新建 `YYYY-MM-DD-slug.md`，复制已有文章的头部信息并修改标题、日期、分类和正文。推送到 `main` 后，GitHub Pages 会自动更新。

## 迁移 WordPress

`scripts/migrate-wordpress.ps1` 会读取公开 WordPress REST API，把已发布文章保存到 `_posts`，并把文章图片下载到 `assets/images/imported`。

