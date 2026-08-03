# 素材与第三方许可清单

## 视觉素材

| 素材 | 来源 | 许可证/权利 | 使用位置 |
| --- | --- | --- | --- |
| 充电宝静物 SVG | 本项目原创 | 项目方自有 | `public/demos/power-bank.svg` |
| 黄铜钥匙静物 SVG | 本项目原创 | 项目方自有 | `public/demos/brass-key.svg` |
| 保温杯静物 SVG | 本项目原创 | 项目方自有 | `public/demos/thermos.svg` |
| 卡片纹理、扫描线、边框与印章 | 本项目 CSS/SVG 原创 | 项目方自有 | `src/app/globals.css` |

项目未使用 AI 生成图片、第三方照片、游戏截图、现有 IP 图标或第三方字体文件。

## 字体

仅引用用户操作系统已安装字体的降级栈：`STKaiti`、`KaiTi`、`Noto Serif SC`、`Songti SC`、`Microsoft YaHei`、`Noto Sans SC`、`Segoe UI`、`Cascadia Mono`、`Consolas`。仓库不分发字体文件；最终显示字体取决于设备。

## 主要软件依赖

以下信息读取自本次锁定安装包的 `package.json`。完整传递依赖与许可证文本以 `package-lock.json`、各包内 LICENSE 及最终制品的软件成分分析结果为准。

| 包 | 版本 | 许可证 | 用途 |
| --- | --- | --- | --- |
| Next.js | 16.3.0 | MIT | 全栈框架 |
| React / React DOM | 19.2.8 | MIT | UI |
| Zod | 4.4.3 | MIT | 数据校验 |
| Dexie | 4.4.4 | Apache-2.0 | IndexedDB |
| html-to-image | 1.11.13 | MIT | PNG 导出 |
| Sharp | 0.35.3 | Apache-2.0 | 发布图片压缩 |
| AWS SDK S3 Client | 3.1102.0 | Apache-2.0 | S3-compatible 存储 |
| Tailwind CSS | 4.3.3 | MIT | CSS 构建工具 |
| Playwright Test | 1.62.1 | Apache-2.0 | E2E 测试 |
| Vitest | 4.1.10 | MIT | 单元/组件测试 |

MIT 与 Apache-2.0 均允许商业使用、修改与分发，但分发软件时仍需保留各自要求的版权与许可证声明。正式参赛提交或商业发布前，应生成一次完整依赖许可证报告并与赛事规则复核。
