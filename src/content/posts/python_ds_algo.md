---
title: Python从入门到精通（五）：常见数据结构与算法
published: 2026-01-18
description: '工程常用结构与内置排序函数的正确使用'
image: ''
tags: [Python]
category: 'Python'
draft: false
lang: ''
---
:::note
本章覆盖常见线性结构、树与图的工程概念、排序与搜索需求，以及内置排序函数的使用。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## 常见线性结构

`list` 适合顺序访问，`deque` 适合队列与双端操作。

示例代码：
```python
from collections import deque

q = deque([1, 2, 3])
q.append(4)
q.popleft()
print(q)
```

:::note
- Do：队列场景优先用 `deque`。
- Don’t：用 `list.pop(0)` 实现队列。
:::

:::important
- `list.pop(0)` 是 $O(n)$，会慢。
:::

## 树与图的工程概念

树用于层级结构（目录、组织架构），图用于关系网络（推荐、依赖）。

示例代码：
```python
tree = {"root": ["a", "b"], "a": ["a1"], "b": []}
print(tree["root"])
```

:::note
- Do：优先用字典表达关系。
- Don’t：为简单关系引入复杂库。
:::

:::important
- 过度建模会增加维护成本。
:::

## 排序与搜索需求

工程中排序与查找常见，优先使用内置能力。

示例代码：
```python
from bisect import bisect_left

scores = [70, 88, 91, 91, 95]
pos = bisect_left(scores, 91)
print(pos)
```

:::note
- Do：有序列表查找用 `bisect`。
- Don’t：对无序数据使用二分。
:::

:::important
- `bisect` 仅适用于已排序数据。
:::

## 内置排序函数

使用 `sorted()` 或 `list.sort()` 搭配 `key`。

示例代码：
```python
users = [
    {"name": "alice", "score": 91},
    {"name": "bob", "score": 88},
    {"name": "cindy", "score": 91},
]
users.sort(key=lambda x: (x["score"], x["name"]))
print(users)
```

:::note
- Do：用 `key` 指定排序规则。
- Don’t：手写排序算法。
:::

:::important
- 忘记 `key` 容易导致结果不符合业务预期。
:::


