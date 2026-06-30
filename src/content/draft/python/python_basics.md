---
title: Python从入门到精通（一）：基础语法与程序结构
published: 2026-01-18
description: '入门即能写程序：变量、流程、函数、模块与基础 IO'
image: ''
tags: [Python]
category: 'Python'
draft: true
lang: ''
---

:::note
本章导览：程序结构、变量与对象、函数、控制流与模块导入。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## 程序结构（工程入口与组织）

- 一般使用`main()`作为代码入口，并用`if __name__ == "__main__":`控制脚本入口
- 如果是编写模块的话，根据调用方式不同，就未必是`main`作为入口了，例如`click`的命令函数、`pytest`的收集点、`uvicorn app:app`的`app`对象，都是通过框架约定而非函数名决定入口。
- 此外,这里的`__name__`用于判断是否是直接运行脚本，直接运行时为`"__main__"`，被导入时为模块路径（如`"pkg.module"`）；因此入口保护可以避免导入时执行副作用
  - 其实`main`也可以理解为一种特殊的模块名

```python
############## 直接执行 ##############
def greet(name: str) -> str:
    return f"Hello, {name}!"

def main() -> None:
    print(greet("world"))

if __name__ == "__main__":
    main()
############## 模块调用 ##############
# file: tools/convert.py
def convert() -> None:
    print("convert running...")

print(f"module name = {__name__}")

if __name__ == "__main__":
    convert()
```

- 在上述示例中，直接运行`python tools/convert.py`会打印模块名`__main__`，并执行`convert()`。
- 在其他模块`import tools.convert`时，`__name__`为`tools.convert`，不会触发入口代码。

:::note

- Do：入口放在`main()`；将逻辑拆成函数。
- Don’t：把所有逻辑写在全局；把工具函数写在入口里。

:::

:::important

- 忘记入口保护导致模块被导入时误执行。

:::

## 变量与对象（名称绑定）

初学者常把“变量等于值”理解为复制，实际是“名称指向对象”。

- 赋值是名称绑定，可变对象共享会带来副作用。

示例代码：

```python
a = [1, 2]
b = a
b.append(3)
print(a)  # [1, 2, 3]
```

:::note

- Do：需要独立副本时使用`list(a)`或`a.copy()`。
- Don’t：误以为`b = a`会复制对象。

:::

:::important

- 共享可变对象导致状态被意外修改。

:::

## 函数定义与调用

函数是复用与测试的最小单元。

- 用明确的参数与返回值组织逻辑。
- 避免在函数内依赖全局变量。

示例代码：

```python
def add(a: int, b: int) -> int:
    return a + b

print(add(2, 3))
```

:::note

- Do：参数清晰，返回值明确。
- Don’t：把逻辑散落在全局。

:::

:::important

- 忽略返回值，导致调用链断裂。

:::

## 控制流（if / for / while）

业务逻辑离不开条件与循环。

-`if`处理分支；`for`处理迭代；`while`处理条件循环。

示例代码：

```python
total = 0
for i in range(1, 4):
    total += i
print(total)  # 6
```

:::note

- Do：用`for`遍历序列；用`range`控制次数。
- Don’t：用`while True`且没有退出条件。

:::

:::important

- 循环边界错误导致少算或死循环。

:::

## 模块与 import（组织代码）

代码变多后必须拆分模块才能维护。

- 用`import`引用模块；避免循环依赖。
- 在模块内提供函数，调用方只导入需要的内容。

示例代码：

```python
# utils.py
def to_upper(s: str) -> str:
    return s.upper()

# main.py
from utils import to_upper
print(to_upper("hello"))
```

:::note

- Do：按职责拆分模块；只暴露必要函数。
- Don’t：模块互相导入形成循环依赖。

:::

:::important

- 模块名与内置模块冲突导致导入错误。

:::

## 输入输出（文件与命令行）

工程脚本通常需要读取文件与解析参数，才能在不同环境下重复使用。

- 文件 IO 推荐用`pathlib.Path`；文本读写需指定编码。
- 命令行参数使用`argparse`，避免手工解析。

示例代码（解决“读取文件+命令行参数+生成结果”问题）：

```python
from __future__ import annotations
import argparse
from pathlib import Path

def load_numbers(path: Path) -> list[int]:
    return [int(x) for x in path.read_text(encoding="utf-8").split()]

def summarize(nums: list[int]) -> dict[str, int]:
    return {"count": len(nums), "max": max(nums), "min": min(nums)}

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    args = parser.parse_args()
    result = summarize(load_numbers(Path(args.file)))
    print(result)

if __name__ == "__main__":
    main()
```

:::note

- Do：用`Path`处理路径；显式声明`encoding`；用`argparse`管理参数。
- Don’t：用字符串拼接路径；忽略参数校验；不处理空文件。

:::

:::important

- Windows 路径分隔符处理不当导致文件找不到。
- 忘记`encoding="utf-8"`导致中文读取失败。

:::

## 字符串处理（清洗与格式化）

日志、文本文件与接口输入大多是字符串，必须会清洗与格式化。

-`strip/split/join/replace`是最常用组合。

- 使用 f-string 做可读的字符串拼接。

示例代码：

```python
raw = "  Alice, Bob ,Cindy  "
names = [x.strip() for x in raw.split(",") if x.strip()]
joined = "|".join(names)
msg = f"users={joined}".replace(" ", "")
print(msg)
```

:::note

- Do：先`strip`再`split`；用 f-string。
- Don’t：大量`+`拼接字符串；忽略空白与大小写。

:::

:::important
-`split()`分隔符设置不当导致多余空串。

- 忽略前后空白导致匹配失败。

:::

## 基础调试（最小复现与断点）

新手最常见的问题是“代码不按预期运行但不知道为什么”。

- 用`print`或`breakpoint()`观察变量与执行流程。
- 先做最小复现，再定位问题点。

示例代码：

```python
def divide(a: int, b: int) -> float:
    return a / b

def main() -> None:
    a, b = 10, 0
    # 观察变量值或使用 breakpoint() 调试
    print(f"a={a}, b={b}")
    print(divide(a, b))

if __name__ == "__main__":
    main()
```

:::note

- Do：先复现问题再定位；用`print`/`breakpoint`看变量。
- Don’t：在未知状态下继续执行；跳过复现直接猜。

:::

:::important

- 变量在循环中被覆盖，导致调试信息误导。
- 忽略异常堆栈，错过关键线索。

:::
