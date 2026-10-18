# Scientific Workbench

**让科学建模，变得更从容。**

Scientific Workbench（COMSOL Scientific Workbench）是一款正在研发中的、本地优先的 AI 科学仿真工作台。项目探索从自然语言生成可审核的科学计划，辅助用户在 COMSOL 中建立、修改与求解模型，并利用**真实读回、数值验证和可追溯证据**来判断执行结果。

本仓库仅用于 **Scientific Workbench 邀请制内测官网**，不包含桌面应用源代码、COMSOL 模型、私有知识库或测试人员数据库。

**[访问官网](https://lovesky514514-cmd.github.io/scientific-workbench-beta/)** · **[查看网站源码](https://github.com/lovesky514514-cmd/scientific-workbench-beta)**

> **当前状态：官网预览（Preview）**  
> 网页静态源码已发布到 GitHub 仓库。申请表、邀请码验证、问题反馈和受控下载仍需独立的 Cloudflare Worker / D1 / Turnstile 服务完成部署和线上验收；在此之前，这些入口**不会实际接收申请，也不会发放下载资格**。官网上线不代表桌面软件已通过公众正式发行验收。

## 我们在做什么？

- **从研究问题开始**：将需求整理为 Scientific Plan，明确几何、材料、物理接口、边界条件与待确认假设。
- **查看真实模型**：通过 COMSOL 模型构建与读回核对实际状态；模型生成成功不等于物理条件已经生效。
- **保留人工决策**：关键修改可以审查、纠正，再交由运行时执行。
- **让证据决定可信度**：区分命令成功、模型状态验证、科学验证和证据合同。人工批准或求解器收敛本身不代表科学认证通过。

以上是产品的设计目标与已研发方向，**不表示所有 COMSOL Physics、安装环境或工作流都已经通过当前公开安装包验收**。

## 邀请制内测

我们计划以小规模、人工批准的方式邀请测试者使用候选版本并反馈问题。

| 项目 | 规则 |
| --- | --- |
| 测试编号 | `001` 至 `999`，每个编号唯一 |
| 名额分配 | **仅管理员手动签发或审批后分配** |
| 熟人邀请 | 管理员可直接发放独立邀请码 |
| 公开申请 | 申请者提供联系邮箱，人工审核；申请不保证获得资格 |
| 邀请码 | 使用独立随机凭证；三位编号只是展示标识，不是登录密码 |
| 测试反馈 | 计划收集版本、问题分类、错误代码与复现步骤，避免索取敏感资料 |
| 下载入口 | 仅在私有后端和发布版本通过相关验收后开放 |

**请勿在公开 GitHub Issue、网页反馈或申请邮件中提交** COMSOL 许可证、密钥、私有模型、完整系统日志、个人身份信息或含敏感路径的截图。

无姓名和手机号收集的设计并不等于绝对匿名：邮箱、测试编号和服务商处理的连接信息仍需依照届时上线的隐私说明管理。

## 网站结构

```text
.
├── index.html              # 官网入口与各页面内容
├── config.js               # 仅包含可公开的浏览器端配置
├── assets/
│   ├── app.js              # 前端导航、表单和接口交互
│   ├── style.css           # 暖米白视觉样式与响应式布局
│   └── brand-icon.png      # 官方品牌图标
├── .nojekyll               # GitHub Pages 静态资源配置
├── .gitignore
└── README.md
```

技术方案：**原生 HTML / CSS / JavaScript + GitHub Pages**。无前端打包依赖。网站采用暖米白、低干扰的科研产品视觉风格，并对桌面与移动端布局进行适配。

## 部署官网（GitHub Pages）

1. 打开仓库的 [Settings → Pages](https://github.com/lovesky514514-cmd/scientific-workbench-beta/settings/pages)。
2. 在 **Build and deployment** 选择 **Deploy from a branch**。
3. 选择 **`main`** 分支以及 **`/(root)`** 文件夹，保存。
4. 等待 GitHub Pages 完成部署，再访问 [官网](https://lovesky514514-cmd.github.io/scientific-workbench-beta/)。

网页本身可以作为项目介绍页独立上线；这一步**不会**自动部署邀请码数据库、管理员后台或下载权限服务。

## 后续接入内测系统

建议将含个人邮箱和测试记录的服务与本公开仓库隔离：

```text
GitHub Pages（公开官网）
       │
       └── HTTPS → Cloudflare Worker（认证 / 接口）
                         │
                         ├── D1（申请、测试编号、反馈）
                         └── Turnstile（请求人机验证）
```

接入前需完成 Worker 部署、数据库迁移、管理员权限、Turnstile 服务端校验、跨域来源限制、速率限制、撤销邀请码/会话、数据删除和真实线上安全测试。只有完成后，才应在 `config.js` 中填写**公开**的 Worker API 地址和 Turnstile **公开 site key**。

**绝不将**管理员密钥、Turnstile secret key、邀请码明文、测试人员邮箱、D1 内容或私有下载地址写入这个仓库。

下载是否开放、测试者资格如何签发、数据保留多久，均由实际部署的私有后端和最终政策决定；静态网页中的按钮不构成权限控制。

## 桌面软件与依赖

Scientific Workbench 桌面版仍处于候选版本测试阶段。部分功能需要用户自行具备适用的 **COMSOL 安装与许可**；本地 AI 功能可能需要额外安装 **Ollama** 和相应模型。官网仓库不包含这些第三方软件、许可证或模型权重。

候选版本将依据实际安装包、真实 COMSOL 执行、科学证据及安全验收结果决定何时向获邀测试者开放。

## 声明

- 网站展示的模型及热场示意图仅作产品概念演示，**不是可用于研究结论的科学数据**。
- 本网站与 COMSOL 软件及其授权分发是不同事项；COMSOL 软件及商标归其权利人所有。
- 目前不提供公众正式发行保证；测试资格及功能开放状态以站内正式公告为准。

---

<sub>Scientific Workbench · Local-first · Evidence-aware · Human-in-the-loop</sub>
