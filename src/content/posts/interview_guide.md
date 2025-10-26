---
title: Go后端开发面经总结
published: 2025-10-17
description: 'Golang面试时候相关的八股文总结'
image: ''
tags: [Interview,Golang]
category: 'Golang'
draft: false 
lang: ''
---

:::important
本文仅持续总结搜集到的Golang相关的面试题和解答要点，并不包括Golang的基础语法。当然，在阐述相关内容时，会附带解释一下基本的用法。
:::

# Golang相关问题

## 数组和切片slice

### 二者比较
- 数组和切片都是维护一组相同数据类型的数据结构
- 数组需要指定长度而切片不需要
- 数组是值类型，复制和传参时会复制整个数组
- 切片是引用类型，底层是对某个数组的引用
- 切片支持动态扩容

```go
// 切片的底层结构
type slice struct {
    array unsafe.Pointer // 指向底层数组的指针
    len   int           // 切片长度
    cap   int           // 切片容量
}
```
### 基本操作
- 初始化
```go
// 数组唯一要注意的就是值类型，
// 复制后修改新数组不影响原数组
arr:=[3]int{1,2,3}
arrCopy:=arr
arrCopy[0]=100
fmt.Println("原数组:", arr)      // [1 2 3]
fmt.Println("拷贝数组:", arrCopy) // [100 2 3]

// 切片初始化:
// 1.从数组切出来
arr := [5]int{1, 2, 3, 4, 5}
slice1 := arr[1:3] // 左闭右开 [2, 3]
// 2.直接声明
var slice2 []int
slice3 :=[]int{}
// 3.make函数
slice4 := make([]int, 3)     // 长度3，容量3
slice5 := make([]int, 3, 5)  // 长度3，容量5
// 4.从切片切出来
slice6 := slice1[1:2]// 左闭右开 [3]
```
- 常用操作
```go
// 创建切片
slice := make([]int, 3, 5)
fmt.Printf("长度:%d, 容量:%d, 值:%v\n", len(slice), cap(slice), slice)

// 追加元素
slice = append(slice, 1)
slice = append(slice, 2, 3, 4) // 触发扩容
fmt.Printf("追加后 - 长度:%d, 容量:%d, 值:%v\n", len(slice), cap(slice), slice)

// 复制切片
slice2 := make([]int, len(slice))
copy(slice2, slice)
fmt.Println("复制后的切片:", slice2)

// 切片操作
fmt.Println("slice[1:3]:", slice[1:3])   // [0 2]
fmt.Println("slice[:3]:", slice[:3])     // [0 0 0]
fmt.Println("slice[3:]:", slice[3:])     // [1 2 3 4]

// 删除元素
// 删除索引为2的元素
index := 2
slice = append(slice[:index], slice[index+1:]...)
fmt.Println("删除索引2后:", slice)

// 在中间插入元素
// 在索引1处插入99
slice = append(slice[:1], append([]int{99}, slice[1:]...)...)
fmt.Println("插入99后:", slice)
```
### 高频知识点
#### 关于删除
- 删除中间的元素会导致删除点之后的元素整体移动，导致O(n)的时间复杂度,其中n为删除点之后的元素数量
  - 对于数组来说，删除操作本质上是新建一个数组，或者移动元素覆盖
  - 对于切片来说，删除操作一般使用append方法来实现
  - 这两种方法都会导致数组/切片的整体移动
  ```go
    // 直接删除法
    func remove(slice []int, i int) []int {
        return append(slice[:i], slice[i+1:]...)
    }
    // 优化1：如果顺序不重要，可以用最后一个元素覆盖要删除的元素
    func fastDelete(slice []int, index int) []int {
        if index < 0 || index >= len(slice) {
            return slice
        }
        
        // 用最后一个元素覆盖要删除的元素
        slice[index] = slice[len(slice)-1]
        // 截断最后一个元素
        return slice[:len(slice)-1]
    }

    // 优化2：批量删除时先标记再统一删除
    func batchDelete(slice []int, shouldDelete func(int) bool) []int {
        result := make([]int, 0, len(slice))
        for _, v := range slice {
            if !shouldDelete(v) {
                result = append(result, v)
            }
        }
        return result
    }

    // 优化3: 使用链表等数据结构
    type Node struct {
        Value int
        Next  *Node
    }
  ```
#### 三索引切片
#### 扩容机制和内存对齐
## 通道channel

## 原子操作

## 多线程

## 运行时

## 接口和面向对象编程

## GC机制和GMP模型



# 数据库

# 网络

# 数据结构与算法