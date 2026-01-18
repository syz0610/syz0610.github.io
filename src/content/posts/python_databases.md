---
title: Python从入门到精通（七）：数据库与数据访问
published: 2026-01-18
description: 'SQL/ORM、连接与事务，组织数据访问层'
image: ''
tags: [Python,Database]
category: 'Python'
draft: false
lang: ''
---
:::note
本章覆盖 SQL 基础、ORM 使用边界、连接与事务、数据访问层组织。

语言版本：Python 3.14.2（CPython，基于Windows 10）
:::

## SQL 基础（工程向）

掌握表结构、查询与索引是数据访问的基本功。

示例代码：
```python
import sqlite3

conn = sqlite3.connect("app.db")
cur = conn.cursor()
cur.execute("create table if not exists kv (k text primary key, v text)")
cur.execute("select * from kv")
print(cur.fetchall())
conn.close()
```

:::note
- Do：为常用查询添加索引。
- Don’t：在没有索引时做大表扫描。
:::

:::important
- 索引过多会影响写入性能。
:::

## ORM 的基本使用与边界

ORM 降低样板代码，但复杂查询仍需 SQL。

示例代码（概念示意）：
```python
# 伪代码示意 ORM 调用方式
class User:
    pass

# User.query.filter(...).all()
```

:::note
- Do：CRUD 使用 ORM 提升效率。
- Don’t：复杂报表强行 ORM。
:::

:::important
- ORM 滥用会导致性能不可控。
:::

## 连接与事务

事务边界清晰，失败必须回滚。

示例代码：
```python
import sqlite3

conn = sqlite3.connect("app.db")
try:
    cur = conn.cursor()
    cur.execute("insert into kv (k, v) values (?, ?)", ("name", "alice"))
    conn.commit()
except Exception:
    conn.rollback()
    raise
finally:
    conn.close()
```

:::note
- Do：显式提交/回滚。
- Don’t：忽略异常。
:::

:::important
- 连接未关闭会导致资源耗尽。
:::

## 数据访问层组织

把 SQL/ORM 放到独立层，避免业务与数据强耦合。

示例代码：
```python
def get_user_by_id(user_id: int) -> dict:
    # 查询逻辑集中在数据访问层
    return {"id": user_id}
```

:::note
- Do：集中管理数据访问。
- Don’t：在路由/控制器里写 SQL。
:::

:::important
- 数据访问分散会导致难以维护。
:::


