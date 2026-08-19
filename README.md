# Helios

实时 3D 地球：当前太阳位置决定白天/夜晚，全球主流 AI 实验室按总部坐标钉在球面上。

Live site: [helios-earth.vercel.app](https://helios-earth.vercel.app)

## 里面有什么

- 按真实太阳直射点做 terminator（白天亮、夜晚城市灯光）
- 可拖时间轴、加速到 ×3600 看日夜交界扫过地球
- 26 个 AI 实验室（截至 2026 年 8 月），点列表会飞过去
- 桌面左侧列表 + 移动端菜单

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开提示的地址即可。滚轮缩放，拖动旋转，点左侧实验室飞向总部。
