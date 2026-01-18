---
title: Python从入门到精通（二）：进阶语法与代码能力提升
published: 2026-01-18
description: '写得更好、更稳：lambda、装饰器、生成器、上下文与类型提示'
image: ''
tags: [Python]
category: 'Python'
draft: false
lang: ''
---
:::note
本章覆盖 lambda、装饰器、生成器、上下文管理器、类型提示与反射边界。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## lambda 表达式（轻量表达）

lambda 适合短小表达式与排序 key，不用来承载复杂逻辑。

示例代码：
```python
users = [
    {"name": "alice", "score": 91},
    {"name": "bob", "score": 88},
]
users.sort(key=lambda x: x["score"])
print(users)
```

:::note
- Do：用于排序、过滤等轻量场景。
- Don’t：在 lambda 里写复杂分支。
:::

:::important
- lambda 可读性差时应改为命名函数。
:::

## 装饰器（为函数增加能力）

装饰器用于统一日志、计时、权限等横切逻辑，避免重复代码。

示例代码：
```python
import time

def timed(fn):
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            print(f"{fn.__name__} cost={time.perf_counter()-start:.3f}s")
    return wrapper

@timed
def work():
    for _ in range(100000):
        pass

work()
```

:::note
- Do：装饰器里保证返回原函数结果。
- Don’t：吞掉异常。
:::

:::important
- 未保留函数元信息可用 `functools.wraps` 修复。
:::

## 生成器（按需处理数据）

生成器适合大文件或流式数据处理，避免一次性加载。

示例代码：
```python
def read_lines(path: str):
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.strip()

for line in read_lines("data.txt"):
    if line:
        print(line)
```

:::note
- Do：用于大数据逐行处理。
- Don’t：把生成器当作可重复容器。
:::

:::important
- 生成器遍历一次后会耗尽。
:::

## 上下文管理器（安全使用资源）

上下文管理器确保资源按时释放，适用于文件、锁、连接。

示例代码：
```python
from contextlib import contextmanager

@contextmanager
def safe_open(path: str):
    f = open(path, encoding="utf-8")
    try:
        yield f
    finally:
        f.close()

with safe_open("data.txt") as f:
    print(f.readline())
```

:::note
- Do：用 `with` 管理资源生命周期。
- Don’t：手工 `open` 后忘记关闭。
:::

:::important
- 异常发生时仍需确保资源释放。
:::

## 类型提示（提升可读性）

类型提示帮助阅读与静态检查，降低误用风险。

示例代码：
```python
def add(a: int, b: int) -> int:
    return a + b

print(add(1, 2))
```

:::note
- Do：在公共函数上标注类型。
- Don’t：把类型提示当作运行时校验。
:::

:::important
- 类型提示不会阻止错误值传入。
:::

## 反射与简单元编程（了解边界）

反射可以提高灵活性，但会降低可读性与可维护性，应谨慎使用。

示例代码：
```python
def run(name: str):
    func = globals().get(name)
    if callable(func):
        return func()
    return None

def hello():
    return "hi"

print(run("hello"))
```

:::note
- Do：只在明确可维护的场景使用反射。
- Don’t：把核心业务逻辑交给反射。
:::

:::important
- 反射使代码难以静态分析与调试。
:::


