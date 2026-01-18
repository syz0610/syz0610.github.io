---
title: Python从入门到精通（三）：异常处理与程序健壮性
published: 2026-01-18
description: '出错可控、可恢复、可定位：异常模型与边界设计'
image: ''
tags: [Python]
category: 'Python'
draft: false
lang: ''
---
:::note
本章覆盖异常模型、try/except/finally、自定义异常与异常边界设计。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## 异常模型（传播与边界）

异常会沿调用栈向上传播，边界层决定如何处理与转换。

示例代码：
```python
def inner():
    raise ValueError("bad input")

def outer():
    try:
        inner()
    except ValueError as e:
        raise RuntimeError("outer failed") from e

outer()
```

:::note
- Do：在边界层统一处理异常。
- Don’t：在深层函数里直接吞掉异常。
:::

:::important
- 不保留异常链会丢失根因信息。
:::

## try / except / finally（资源与恢复）

保证资源释放并记录错误，避免系统处于不一致状态。

示例代码：
```python
f = None
try:
    f = open("data.txt", encoding="utf-8")
    print(f.readline())
except OSError:
    print("read failed")
finally:
    if f:
        f.close()
```

:::note
- Do：必要时使用 finally 释放资源。
- Don’t：忽略异常导致数据损坏。
:::

:::important
- 未关闭文件在 Windows 上可能导致锁文件。
:::

## 自定义异常（业务与系统区分）

自定义异常让调用方更清楚错误类型与处理方式。

示例代码：
```python
class BusinessError(RuntimeError):
    pass

def parse_age(value: str) -> int:
    try:
        age = int(value)
        if not (0 <= age <= 120):
            raise ValueError("out of range")
        return age
    except Exception as e:
        raise BusinessError(f"invalid age: {value}") from e
```

:::note
- Do：定义清晰的业务异常类型。
- Don’t：所有错误都抛 `Exception`。
:::

:::important
- 异常消息过于含糊会增加排障成本。
:::

## 异常边界与职责

边界层负责异常转换与日志记录，内部函数只做业务逻辑。

示例代码：
```python
def create_user(name: str, age_str: str) -> dict:
    if not name:
        raise ValueError("name required")
    return {"name": name, "age": int(age_str)}

try:
    print(create_user("alice", "18"))
except Exception as e:
    print(f"create failed: {e}")
```

:::note
- Do：边界层记录错误与转换异常。
- Don’t：把日志散落在业务函数中。
:::

:::important
- 边界不清会导致重复处理或漏处理。
:::


