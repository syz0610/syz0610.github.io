---
title: Python从入门到精通（九）：工程组织与交付实践
published: 2026-01-18
description: '从能跑到能维护：项目结构、依赖、CI/CD、部署与监控'
image: ''
tags: [Python]
category: 'Python'
draft: false
lang: ''
---
:::note
本章覆盖项目结构、依赖与虚拟环境、CI/CD、容器化部署与监控思路。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## 项目目录结构

推荐 `src/` 结构，避免导入歧义。

示例代码（结构示意）：
```python
# project/
#   src/app/
#   tests/
print("src layout")
```

:::note
- Do：按模块分层组织代码。
- Don’t：所有代码堆在根目录。
:::

:::important
- 结构混乱会降低维护效率。
:::

## 依赖管理与虚拟环境

用 `pyproject.toml` 与虚拟环境锁定依赖。

示例代码：
```python
import sys
print(sys.version)
```

:::note
- Do：锁定依赖版本。
- Don’t：在不同环境随意升级依赖。
:::

:::important
- 版本漂移会导致不可复现问题。
:::

## CI/CD 基础

自动化执行测试、构建与发布。

示例代码（流程示意）：
```python
steps = ["lint", "test", "build", "deploy"]
print(steps)
```

:::note
- Do：在 CI 中运行测试。
- Don’t：手工发布绕过流水线。
:::

:::important
- 无 CI 易引入回归问题。
:::

## 容器化与部署流程

容器化便于一致性部署与回滚。

示例代码（概念示意）：
```python
image = "app:latest"
print(f"deploy {image}")
```

:::note
- Do：容器化保持环境一致。
- Don’t：手工修改线上环境。
:::

:::important
- 环境不一致会导致线上问题难复现。
:::

## 监控与优化思路

日志、指标与告警是运维基础。

示例代码：
```python
metrics = {"latency_ms": 120, "error_rate": 0.01}
print(metrics)
```

:::note
- Do：为核心路径建立监控。
- Don’t：无告警策略直接上线。
:::

:::important
- 无监控会导致故障发现滞后。
:::


