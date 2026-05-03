# Learning System v2 — 测试计划

**Author:** Sands
**Date:** 2026-05-03
**Reviewer:** Bay

## 测试架构

- `api-tests.sh` — Worker API 端点集成测试（纯 curl，无依赖）
- `site-tests.sh` — 网站页面结构与部署验证
- `data-integrity.sh` — 数据一致性检查（progress/highlights/activity）
- `run-all.sh` — 一键跑全部

## 约定

- 所有测试写入 `/tmp/learning-test-*` 临时数据，测试结束自动清理
- 用 `__test__` 前缀的 contentId 防止污染真实数据
- 每个测试输出 `✅ PASS` 或 `❌ FAIL: reason`
- 最终输出汇总：总数/通过/失败

## API 基地址
```
https://learning-system-api.majinghua02.workers.dev
```

## 网站地址
```
https://learning.marinago.one
```

## 已知 Cloudflare Pages 部署备注
Pages 项目名 = `podcast-viewer`（不是 `learning-system`），手动 wrangler deploy。
