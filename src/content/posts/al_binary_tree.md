---
title: 数据结构-二叉树
published: 2025-10-17
description: '二叉树的相关算法总结'
image: ''
tags: [算法]
category: '算法'
draft: true 
lang: ''
---

:::important
树是一类广泛应用于现代工程的数据结构之一，适用于分层次存取数据，尤其是在数据库相关的数据处理中发挥着重要的作用。
:::

# 基本概念

- 树(Tree)是一种分层存储的抽象数据结构，其中二叉树`binary tree`又最为常用
- 节点`node`是一棵树的基本组成单位，一个节点对象通常包含了本节点的值`value`和指向子树的指针
  - 例如，在`Leetcode`中，一棵树通常以以下形式给出,其他语言类似

  ```go
  /**
   * Definition for a binary tree node.
   * type TreeNode struct {
   *     Val int
   *     Left *TreeNode
   *     Right *TreeNode
   * }
   */
  ```

- 根节点`root`: 树`T`通常从根节点开始,根节点没有父节点
  - 如果根节点为空，则树`T`为空。
  - 每个非根节点都有一个**唯一**的`父节点`
- 节点的度`degree`：每个节点拥有的**子树的个数**
- 叶子节点`leaf`：**度为0**的节点，也称为**外部节点**`external node`
- 分支节点：**度不为0**的节点，也称为**内部节点**`internal node`
- 孩子节点`child`：某个节点的**直接后继**节点
- 父节点`parent`：孩子节点的上层节点，也称为**双亲节点**
- 兄弟节点`sibling`：具有**相同父节点**的节点
- 边`edge`：一对节点(u,v), u是v的父节点
- 路径`path`：一条从`u`到`v`的路径，其中u是v的父节点
  - 这里可以推广到任意两个相邻节点，前者是后者的父节点
- 祖先节点`ancestor`：从当前节点出发，直到根节点为止途经的所有父节点都是祖先节点
- 子孙节点`descendant`：当前节点的所有子树上的节点都是子孙节点
- 树的度：所有节点度的最大值
- 节点深度`depth`:节点祖先节点的个数，也称为层次`level`
- 节点高度`depth`：从当前节点出发，到达子孙节点中某个叶子节点的最长路径长度
- 树的高度：根节点的高度
- 有序/无序树：节点的子树从左到右是否有序/无序，各子树位置是否可以交换
- 森林`forest`：若干棵互相没有交集的树的集合

# 深度优先搜索DFS

# 广度优先搜索BFS(层序遍历)

- 层序遍历，顾名思义即优先遍历当前层所有节点，之后进入下一层
- 层序遍历分为单队列方式和双队列方式
- 下面以`Leetcode 1161`为例，给出层序遍历的实现方式

## 单队列方式(高性能)

- 使用一个队列，内部存放当前层和下一层数据，逐层维护当前层长度用于人为确定当前层元素边界

```go
func maxLevelSum(root *TreeNode) int {
 if root == nil {
  return 0
 }

 queue := []*TreeNode{}
 queue = append(queue, root) // BFS也好,程序遍历也好,需要使用队列维护待处理节点
 layer := 1                  // 初始化层数计数为1
 maxSum := root.Val          // 初始化默认层元素之和最大值为根节点值或者math.Int
 maxLayer := 1               // 初始化层元素之和最大层为第一层
 for len(queue) > 0 {        // 外层循环：逐层推进 BFS，直到队列(待处理节点)为空
  levelSize := len(queue) // 获取当前层长度
  levelSum := 0           // 初始化层元素之和
  // 内圈遍历每一层,注意最多遍历到当前层长度为止，队列中可能有下一层数据
  for i := 0; i < levelSize; i++ {
   node := queue[0]     // 取出当前待处理node节点
   queue = queue[1:]    // node从待处理队列中移除(出队)
   levelSum += node.Val // 累加层元素
   if node.Left != nil {
    queue = append(queue, node.Left) //追加左节点到下一层待处理队列
   }
   if node.Right != nil {
    queue = append(queue, node.Right) // 追加右节点到下一层待处理队列
   }
  }

  if levelSum > maxSum { // 只在严格更大时更新，若层和相等则保留较小层号（先出现的）
   maxLayer = layer
   maxSum = levelSum
  }

  layer++
 }
 return maxLayer
}
```

## 双队列方式(易读性)

- 双队列方式采用一个额外的队列用于缓存当前层的节点,原始队列清空用于接收下一层节点

```go
func maxLevelSum(root *TreeNode) int {
 queue := []*TreeNode{}
 queue = append(queue, root) // BFS也好,程序遍历也好,需要使用队列维护待处理节点
 maxSum := root.Val          // 初始化默认层元素之和最大值为根节点值或者math.Int
 maxLayer := 1               // 初始化层元素之和最大层为第一层

 //双队列法外层循环推进BFS, 控制层数
 // 条件 q != nil：只要当前层不为空，就继续遍历
 for layer := 1; queue != nil; layer++ {
  curQueue := queue // 缓存当前层待处理节点队列
  queue = nil       // 清空原始待处理节点队列，等待下一层节点入队
  sum := 0          // 初始化当前层元素之和

  for _, node := range curQueue { // 开始遍历当前层的每一个节点
   sum += node.Val

   if node.Left != nil { // 左子树节点入队
    queue = append(queue, node.Left)
   }

   if node.Right != nil { // 右子树节点入队
    queue = append(queue, node.Right)
   }
  }

  if sum > maxSum { // 判定逻辑
   maxSum = sum
   maxLayer = layer
  }
 }

 return maxLayer
}
```

# 中序遍历递增BST

# 特殊的树
