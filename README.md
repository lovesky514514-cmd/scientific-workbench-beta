# Scientific Workbench 产品官网与文档中心（待发布静态稿）

此目录是 GitHub Pages 可直接托管的纯静态站点。它不请求旧 Cloudflare API，不包含内测发放入口、下载令牌或 D1 数据。当前内容用于本地审核；**不要在发行审批前部署或公开安装包链接**。

页面：`index.html`（产品）和 `docs/index.html`（文档中心）。无需 Node、Worker 或动态服务。站点沿用原暖米白、深绿色视觉与已批准品牌图标，文档采用分类导航、页内目录和章节锚点；未复制参考网站的内容或素材。

首页右侧轮播使用四张真实 RC5.1 已安装桌面程序截图，均来自既有安装版 smoke 记录 `packaging/smoke_rc51_final_52d83/`。分别展示新建任务与导入 MPH、首次使用引导、设置、未验证的结果证据；未使用设计预览或模拟科学结果。图片保持原始字节，没有伪造或编辑，人工目视检查未见私人路径、密钥、邀请码或个人模型数据。截图仅用于界面展示，不代表当前 RC5.2 安装包或科学验收。

| 文件 | 原图 SHA-256 |
|---|---|
| `assets/workbench-desktop-rc51.png` | `2DCF7B8C9C952A5E2B48BB7B0A844D03DF0572666AB16565BB7D751609F62220` |
| `assets/workbench-onboarding-rc51.png` | `7D02E5954D59D8279C5FEE0D25223B81D85208E7BA32FA30BC46AB138CE011FA` |
| `assets/workbench-settings-rc51.png` | `D62664D2A613A77E88EE5D6035DA26C7264AA3F8A6D2CA52F3143C7F13E30708` |
| `assets/workbench-results-rc51.png` | `649F9CA6BAE4AE981AD87F1DD8673F848C838BA69ABAE3CD21D5534CE9C32462` |

轮播由 `assets/gallery.js` 驱动，每五秒换页，可手动上一张/下一张、直接选页、暂停；鼠标悬停、键盘焦点、隐藏标签页和系统减少动态效果设置都会暂停自动换页。无 JavaScript 时仍显示第一张真实截图。点击图片可查看原始尺寸。

本目录可作为静态站点根目录：保留 `index.html`、`docs/`、`assets/` 和 `.nojekyll`，直接部署到 GitHub Pages 或普通静态文件服务器即可。轮播 JavaScript 只操作本地图片，不请求后端或外部服务；`test_site.mjs` 是本地 Node 检查脚本，不需要服务器执行。上线前请由负责人比较当前远端 Pages 版本并审批，不要用此 ZIP 自动覆盖线上站点。

发布前负责人应确认：项目仓库与 Pages 路径、源码及图标权属、COMSOL 商标措辞、第三方许可证、当前 Windows 发行状态、旧 Cloudflare Worker 停用及 D1 唯一备份保全。静态站点部署不等于 EXE 发行许可。
