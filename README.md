# Scientific Workbench · 内测发放官网

一个用于 **COMSOL Scientific Workbench 邀请制内测** 的单页站点：领取测试版、邮箱申请、使用帮助。不承担软件源码托管或科学认证。

**[打开官网](https://lovesky514514-cmd.github.io/scientific-workbench-beta/)** · **[测试者使用帮助](./HELP.md)**

> **当前状态：静态预览。** 本仓库仅发布网站前端。Cloudflare Worker、D1 数据库与 Turnstile 尚未完成独立部署和线上验证，因此邀请码验证、邮箱申请、反馈提交与下载均未开放；页面在服务未配置时不会上传用户邮箱。

## 流程

- **已获邀请**：点击「领取测试版」，输入负责人私下发放的随机邀请码 → 后端验证 → 显示测试者编号（001–999）与可用安装包信息。
- **没有邀请**：在「申请测试资格」填写邮箱 → 管理员审核 → 管理员私下签发三位编号及独立邀请码。申请不自动批准。
- **发现问题**：验证邀请码后提交错误码、版本号和复现步骤，获取反馈回执。

显示编号不是密码；私有下载链接与提取码只通过受权限控制的后端返回，不能写进静态网站仓库。

## 网站源码

\`\`\`text
.
├── index.html            # 单页内测发放、申请、帮助
├── HELP.md               # 测试者完整使用帮助
├── config.js             # 仅放公开配置（默认 API 为空）
├── assets/
│   ├── app.js            # 浏览器交互与私有 API 客户端
│   ├── style.css         # 统一暖米白样式
│   └── brand-icon.png    # 已批准的品牌图标
├── .nojekyll
└── README.md
\`\`\`

无需 Node / Python 即可查看页面。静态资源托管于 GitHub Pages，正式功能需要另外部署私有 API。

## GitHub Pages

在 **Settings → Pages → Build and deployment** 中选择 **Deploy from a branch**、分支 \`main\`、目录 \`/(root)\`。

## 私有服务（尚未上线）

计划使用 Cloudflare Worker + D1 + Turnstile。内测后台上线且经过真实安全验收之后，只在 \`config.js\` 配置公开的 HTTPS API 地址和 Turnstile **site key**。绝对不要写入以下数据：管理员秘钥、Turnstile secret key、邀请码、申请邮箱、数据库内容、内部知识库或私有下载链接。

测试编号只有在管理员人工签发时才分配。实际资格判断与撤销由后端执行，静态网页不能替代访问控制。

## 产品边界

这是**受控测试发行入口**，不是公众正式版。COMSOL 与相应模块许可证、Ollama 和本地模型（取决于测试版）由测试者自备。网站的科学示例及说明不应代替真实模型读回和数值证据。
