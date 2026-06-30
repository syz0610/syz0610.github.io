---
title: Python从入门到精通（六）：Web 后端开发基础
published: 2026-01-18
description: 'HTTP、RESTful、请求流程与中间件的入门实践'
image: ''
tags: [Python,FastAPI]
category: 'Python'
draft: true
lang: ''
---
:::note
本章覆盖 HTTP 基础、RESTful 设计、Web 框架入门、请求处理流程与中间件思想。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

框架：FastAPI（可类比 Flask）

## HTTP 基础

理解方法、状态码与头部是后端服务的基础。

示例代码：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/ping")
def ping():
    return {"ok": True}
```

:::note

- Do：区分 GET 与 POST 语义。
- Don’t：用 GET 做写操作。

:::

:::important

- 不规范方法会导致接口不可维护。

:::

## RESTful API 设计

以资源为中心组织接口，使用标准动词。

示例代码：

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/items/{item_id}")
def get_item(item_id: int):
    return {"id": item_id}
```

:::note

- Do：路径表达资源，方法表达动作。
- Don’t：把动词写进路径。

:::

:::important

- 路径不清晰会增加客户端心智负担。

:::

## 请求处理流程

理解路由、校验、业务逻辑与响应。

示例代码：

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    price: float

@app.post("/items")
def create_item(item: Item):
    return {"ok": True, "name": item.name}
```

:::note

- Do：用模型校验请求体。
- Don’t：跳过校验直接写入。

:::

:::important

- 校验缺失会导致数据污染。

:::

## 中间件的基本思想

中间件用于日志、鉴权、追踪等横切需求。

示例代码：

```python
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def add_trace_id(request: Request, call_next):
    response = await call_next(request)
    response.headers["x-trace-id"] = "demo-trace"
    return response
```

:::note

- Do：用中间件统一处理横切需求。
- Don’t：在每个路由重复同样逻辑。

:::

:::important

- 中间件抛异常会影响全局请求。

:::
