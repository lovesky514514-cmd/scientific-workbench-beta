# Scientific Workbench — Website & Documentation

静态 GitHub Pages 官网，采用暖米白 + 深绿色视觉风格。**本仓库是官网和文档，不包含 Scientific Workbench 完整软件源码，也不提供未经审批的 EXE。**

- 网站：https://lovesky514514-cmd.github.io/scientific-workbench-beta/
- 文档：https://lovesky514514-cmd.github.io/scientific-workbench-beta/docs/
- 维护标识：SuKoYa
- 联系邮箱：swbtest001@yeah.net

## 内容目录

- `index.html`：产品首页、核心能力、工作流程、文档及发行状态。
- `docs/`：独立的中文文档页面，包括快速开始、工作流、验证、兼容性、排障、研究和 FAQ。
- `assets/style.css`：统一排版与响应式样式。
- `assets/app.js`：仅处理移动端导航；没有网络请求。

## 本地预览

可以用任意静态 HTTP 文件服务器预览。例如：

```bash
python -m http.server 8000
```

之后访问 `http://localhost:8000/`。不需要 API、邀请码、Cloudflare 或 D1。

## 发布方式

此仓库以 `main` 的仓库根目录作为 GitHub Pages 静态站点源码。按 `Settings -> Pages` 确认已启用该来源。网站没有下载二进制，也不收集申请邮箱。

## 原测试发放功能

已从网站代码移除邀请码、VIP 资格、申请表单、Turnstile、API 调用和受控下载链接。**GitHub 删除相关源码不代表 Cloudflare 线上 Worker 或 D1 已停止运行**，须在 Cloudflare 管理端独立核实、停止路由/Worker，按数据保留决策处理 D1。

## 研究与发行边界

当前 RC5.2 的最终 Windows Setup 尚未经过发行审批、安装/卸载验收；完整软件与 COMSOL API 集成源码的开源许可问题也尚待确认。网站不会将其描述为已发布。需要自行合法安装并授权 COMSOL。

## 许可证

此仓库暂不代表完整 Workbench 应用程序的开源许可。对网站源码的再次使用，应由权利人另行确定适用许可。
