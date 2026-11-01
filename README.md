<p align="center"><img src="assets/brand-icon.png" width="96" alt="SKY Workbench logo"></p>

# SKY Workbench 官方网站与文档中心

SKY Workbench 3.1 面向有限元、分子动力学、第一性原理与数学计算，将自然语言草案、候选参数审核、受控执行和结果证据放在同一工作空间。

- [官方网站](https://lovesky514514-cmd.github.io/scientific-workbench-beta/)
- [3.1 版本更新与验证记录](https://lovesky514514-cmd.github.io/scientific-workbench-beta/releases/3.1/)
- [使用文档](https://lovesky514514-cmd.github.io/scientific-workbench-beta/docs/) · [知识库](https://lovesky514514-cmd.github.io/scientific-workbench-beta/knowledge-base/)
- [软件源码](https://github.com/lovesky514514-cmd/sky-workbench) · [公开发行记录](https://github.com/lovesky514514-cmd/sky-workbench/releases)

## 3.1 更新

真实 DeepSeek 接入、模糊指令候选补参、单位检查、独立能量积分与三维资源预估均已完善。最终验证包括 51 份真实 AI 结构化草案、冻结运行时的三个实际 COMSOL 6.3 求解，以及受限的 LAMMPS 和 Mathics 执行检查。草案覆盖率、接口连通与科学求解结果分别判断。

后端 1415 项测试通过、14 项历史打包辅助测试跳过，前端 108 项通过。MATLAB、VASP、Materials Studio 本轮缺少实际环境，真实计算尚未验证；复杂物理和目标电脑安装需分别验收。细节与公开的结构化摘要见 [版本说明](releases/3.1/index.html) 与 [verification.json](releases/3.1/verification.json)。

Windows 安装包已构建，官网暂不托管安装文件；获取方式见文档。软件仓库的源码标签与官网产品版本分别查看，既有 v3.0.0 标签保留历史含义。

## 网站维护

这是 GitHub Pages 静态站，不需要 Node 构建或在线求解服务。修改后运行 `node --test test_site.mjs`，检查站内链接、版本说明、真实截图哈希及发行信息。首页保留 RC5.1 历史实机截图，不把它们标为 3.1 截图或科学验收证据。

| 路径 | 用途 |
| --- | --- |
| `index.html` | 产品首页 |
| `docs/index.html` | 3.1 使用文档 |
| `releases/3.1/` | 更新说明与验证摘要 |
| `knowledge-base/index.html` | 可搜索知识库 |
| `assets/` | 站点样式、原始截图与轮播脚本 |

## Copyright & permissions / 版权与使用权限

**Copyright © 2026 SuKoYa. All rights reserved. / 保留所有权利。**

本仓库用于展示 SKY Workbench 官网和文档。对于 SuKoYa 有权授权的原创网站代码、文字及其他原创内容，**不提供通用的复制、修改、再发布、独立托管或商业使用许可**。未经事先书面授权，请勿将本站内容用于其他网站、软件或商业项目。公开可浏览并不代表允许任意复用。

This public website repository does **not** grant a general license to copy, modify, redistribute, independently host, or commercially exploit its owner-controlled original website source and documentation. Prior written permission is required, except where applicable law or an existing license permits otherwise.

**Existing licenses remain in effect / 既有授权不受影响：**

- [SKY Workbench 软件主仓库](https://github.com/lovesky514514-cmd/sky-workbench)中的代码另依其适用的 Apache-2.0 及保留的历史、第三方许可处理；本站的版权声明不改变这些授权。
- 官网使用的原创品牌图标沿用主仓库公布的 [CC BY 4.0 素材授权说明](https://github.com/lovesky514514-cmd/sky-workbench/blob/main/docs/ASSET_LICENSE.md)。该许可允许在满足条件时进行商业使用，不能通过本站声明撤销已经授予的权利。
- 桌面界面截图仅用于本项目展示；其中涉及的第三方商标、组件和其他已授权素材仍受各自权利与许可约束。
- GitHub 平台条款及适用法律所赋予的查看、Fork 等权利不受此声明排除。

商业合作或其他使用授权请联系 [swbtest001@yeah.net](mailto:swbtest001@yeah.net)。

## Important notes / 使用边界

真实 COMSOL 建模与求解要求用户自行安装并合法授权适用的 COMSOL 版本及模块。3.1 的冻结运行时已用 6.3 完成本次三个实际求解案例；其他版本与目标环境需分别验证。SKY Workbench 是独立第三方项目，不隶属于 COMSOL AB，也不包含 COMSOL、许可文件、私有模型或公开下载的 Windows 安装程序。命令执行成功不等于模型状态已验证，更不等于科学结论通过验证。

网站内容用于介绍软件和提供文档；功能是否可用，以实际环境、受支持的工作流与逐次运行的证据为准。

<p align="center">
  Made by <strong>SuKoYa</strong> · © 2026<br>
  <a href="https://lovesky514514-cmd.github.io/scientific-workbench-beta/">Website</a> ·
  <a href="https://github.com/lovesky514514-cmd/sky-workbench">Source</a> ·
  <a href="mailto:swbtest001@yeah.net">Contact</a>
</p>
