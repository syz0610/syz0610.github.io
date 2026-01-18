---
title: Python从入门到精通（八）：测试与调试
published: 2026-01-18
description: 'unittest/pytest、Mock 与调试技巧，保障代码质量'
image: ''
tags: [Python,Testing]
category: 'Python'
draft: false
lang: ''
---
:::note
本章覆盖 unittest/pytest、测试用例设计、Mock 依赖与基础调试。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## unittest 与 pytest

两者都能完成单元测试，pytest 更简洁。

示例代码（pytest）：
```python
import pytest

def add(a: int, b: int) -> int:
    return a + b

@pytest.mark.parametrize("a,b,expected", [(1, 2, 3), (0, 0, 0)])
def test_add(a, b, expected):
    assert add(a, b) == expected
```

:::note
- Do：用参数化覆盖边界。
- Don’t：把 IO 放入单元测试。
:::

:::important
- 测试依赖顺序会导致不稳定。
:::

## 测试用例设计

用边界值、异常路径与正常路径覆盖核心逻辑。

示例代码：
```python
def div(a: int, b: int) -> float:
    return a / b

def test_div_zero():
    try:
        div(1, 0)
    except ZeroDivisionError:
        assert True
```

:::note
- Do：覆盖正常与异常路径。
- Don’t：只测“快乐路径”。
:::

:::important
- 忽略异常路径容易在生产出错。
:::

## Mock 数据与依赖

用 Mock 隔离外部系统，保证测试稳定。

示例代码：
```python
from unittest.mock import patch

def fetch_user(user_id: int) -> dict:
    raise RuntimeError("network not allowed")

def get_name(user_id: int) -> str:
    return fetch_user(user_id)["name"]

def test_get_name():
    with patch(__name__ + ".fetch_user", return_value={"name": "alice"}):
        assert get_name(1) == "alice"
```

:::note
- Do：对外部依赖做 Mock。
- Don’t：测试依赖真实网络。
:::

:::important
- Mock 路径写错会导致未生效。
:::

## 基础调试技巧

先最小复现，再用断点或日志定位。

示例代码：
```python
def calc(a: int, b: int) -> int:
    return a // b

print(calc(10, 3))
```

:::note
- Do：先复现再定位。
- Don’t：只凭猜测改代码。
:::

:::important
- 无复现很难验证修复是否有效。
:::


