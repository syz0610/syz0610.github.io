---
title: Python从入门到精通（四）：日志系统与运行时可观测性
published: 2026-01-18
description: '出了问题能看懂、能追踪：日志级别、格式与配置'
image: ''
tags: [Python]
category: 'Python'
draft: true
lang: ''
---
:::note
本章覆盖 logging 模块基础、日志级别与格式、日志与异常协作、服务端日志实践。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## logging 模块基础

日志应统一入口配置，避免`print`影响可观测性。

示例代码：

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")
logger.info("service start")
```

:::note

- Do：统一使用`logging`。
- Don’t：用`print`代替日志。

:::

:::important

- 多处配置 logger 会导致重复输出。

:::

## 日志级别与格式

合理选择级别与格式，保证可检索与可读。

示例代码：

```python
import logging

logging.basicConfig(
 level=logging.INFO,
 format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logging.getLogger("app").warning("cache miss")
```

:::note

- Do：用统一格式；区分 INFO/WARNING/ERROR。
- Don’t：所有日志都打 INFO。

:::

:::important

- 日志过多会淹没关键错误。

:::

## 日志与异常配合

异常场景用`logger.exception`保留堆栈信息。

示例代码：

```python
import logging
logger = logging.getLogger("svc")

try:
 1 / 0
except ZeroDivisionError:
 logger.exception("calc failed")
```

:::note

- Do：异常时记录堆栈。
- Don’t：只记录异常信息字符串。

:::

:::important

- 无堆栈时很难定位根因。

:::

## 服务端日志实践

服务端建议同时输出控制台与文件，便于排障与归档。

示例代码：

```python
import logging

logging.basicConfig(
 level=logging.INFO,
 handlers=[
  logging.StreamHandler(),
  logging.FileHandler("app.log", encoding="utf-8"),
 ],
)
logging.getLogger("svc").info("ready")
```

:::note

- Do：服务端日志同时落盘。
- Don’t：只写控制台日志。

:::

:::important

- 未指定编码可能导致 Windows 乱码。

:::
