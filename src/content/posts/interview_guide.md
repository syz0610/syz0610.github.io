---
title: Go语法解析-数组和切片
published: 2025-10-17
description: 'Golang面试时候相关的八股文总结'
image: ''
tags: [Golang]
category: 'Golang'
draft: true 
lang: ''
---

:::important
数组和切片作为最常见的数据结构之一，在任何语言中都非常重要。在Golang中，熟练掌握切片操作是进阶为高级开发的必须技能。
:::

# 数组和切片的区别

- 数组和切片都是维护一组相同数据类型的数据结构
- 数组具有固定的长度而切片并不是
- 在golang中，数组是值类型，复制和传参时会传递整个数组
- 在golang中，切片是引用类型，本质是对底层数组的引用，支持动态扩容
  - 修改切片元素的值会修改底层数组
  - 同样地，修改底层数组也会影响引用它的切片
  - 向切片追加值时，如果触发了动态扩容，则不会影响底层数组，因为动态扩容本质上是值拷贝了一份原切片的值
  ```go
  func main() {
        arr := [3]int{1, 2, 3}
        slice := arr[:] //初始化slice为arr的切片引用
        fmt.Printf("原始值: arr=%v,slice=%v\n", arr, slice)//原始值: arr=[1 2 3],slice=[1 2 3]

        // 修改slice的元素
        slice[0] = 0
        fmt.Printf("修改slice元素后: arr=%v,slice=%v\n", arr, slice)//修改slice元素后: arr=[0 2 3],slice=[0 2 3]

        // 修改底层数组的元素
        arr[0] = 6
        fmt.Printf("修改底层数组元素后: arr=%v,slice=%v\n", arr, slice)//修改底层数组元素后: arr=[6 2 3],slice=[6 2 3]

        // 向切片追加元素，注意这里触发了扩容,因此原数组未被修改
        slice = append(slice, 4)
        fmt.Printf("向切片追加元素后: arr=%v,slice=%v\n", arr, slice)//向切片追加元素后: arr=[6 2 3],slice=[6 2 3 4]

        // 向切片追加元素，注意这里没有触发扩容，因此原数组被修改了
        arr2 := [10]int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
        slice2 := arr2[:3]//从原数组切一小块下来
        fmt.Printf("slice2 修改前: arr2=%v,slice2=%v\n", arr2, slice2)//slice2 修改前: arr2=[1 2 3 4 5 6 7 8 9 10],slice2=[1 2 3]
        slice2 = append(slice2, 99)
        fmt.Printf("slice2 修改后: arr2=%v,slice2=%v\n", arr2, slice2)//slice2 修改后: arr2=[1 2 3 99 5 6 7 8 9 10],slice2=[1 2 3 99]
        // 注意原数组第四位元素变成了99，覆盖了原来4的位置，这是一个很重要的语法陷阱！！！
    }
  ```
- 因此，在golang中，数组的操作相对简单，主要是需要掌握切片的操作技巧

# 初始化

## 基本概念

- 在了解切片初始化方式前，首先要了解golang中切片的底层数据结构：
  ```go
    // 切片的底层结构,运行时可见
    type slice struct {
        array unsafe.Pointer    // 指向底层数组的指针
        len   int               // 切片长度
        cap   int               // 切片容量
    }
  ```
- 指针决定了切片是引用类型的本质
- 切片长度用`len()`方法来获取，代表了当前切片中存放了多少个元素
- 切片容量用`cap()`方法来获取，代表了当前切片的最大容量

- 当追加元素后长度超过容量时触发扩容
  - 扩容规则：
    - 如果所需容量 > 原容量×2，则新容量 = 所需容量
    - Go 1.18之前：
      - 原容量 < 1024：新容量 = 原容量×2
      - 原容量 ≥ 1024：新容量 = 原容量×1.25
    - Go 1.18及之后：
      - 原容量 < 256：新容量 = 原容量×2
      - 原容量 ≥ 256：新容量 = 原容量 + (原容量 + 3×256) / 4

- 触发扩容后，切片会指向新的底层数组，与原数组分离
- 使用make()创建切片会分配新的底层数组
- 使用copy()复制数据到目标切片，不共享底层数组
- 只有通过切片表达式创建的切片才会共享底层数组

## 具体方式

### 直接初始化(字面量方式初始化)
```go
/* 方式1：直接初始化 */
s1 := []int{}                                        //直接初始化
s2 := []int{1, 2, 3}                                 //直接初始化并赋值
s22 := []int{0: 1, 2: 3, 1: 2}                       //[1 2 3],带索引初始化,注意看这里索引可以不按顺序来
s23 := []int{0: 1, 4: 5}                             //[1 0 0 0 5],部分初始化

var s3 []int                                         //注意,这里是nil切片！！！
fmt.Println(s1, s2, s3, reflect.ValueOf(s3).IsNil()) //[] [1 2 3] [] true
fmt.Println(s22, s23)                                //[1 2 3] [1 0 0 0 5]
```

### 冒号表达式初始化(切取法)
- 通过冒号表达式或者直接切片相等的方式创建的切片共享底层数组
- 注意冒号表达式支持如下写法：
  - arr[:] 缺省，缺省情况下等于整体引用
  - arr[1:] 从arr[1]开始引用到末尾
  - arr[:4] 从开头引用到arr[3]为止（索引3，不包括4，左闭右开区间）
  - arr[1:3] 引用arr[1]到arr[2]为止2个元素（不包括索引3）
  - arr[1:3:4] `三索引表达式`,arr[low:high:max],引用arr[1]到arr[2]为止2个元素，**容量为max-low=3**
    - 当缺省`max`参数时**退化**为普通冒号表达式
    - 此时`max`默认为**从low开始的原数组的子数组长度`len(arr)-low`或原切片的子切片容量`cap(slice)-low`**
```go
/* 方式3： 冒号表达式 */
arr := [5]int{1, 2, 3, 4, 5} //数组,演示用，非空切片可以从数组或其他切片中切出一块
s7 := arr[:]                 //[1 2 3 4 5] 全切片,这个技巧可以用于创建临时切片！！！
s71 := arr                   //[1 2 3 4 5],直接赋值法，等价于arr[:] 
s8 := arr[:3]                //[1 2 3] 切arr0-3的部分，左闭右开，等于切出来0、1、2号元素
s9 := s5[:1]                 //[1] 切s5 0-1的部分，左闭右开，等于切出来0号元素
s10 := arr[1:3:5]            //三索引表达式[low:high:max],len为high-low，最大cap为max-low
fmt.Println(s7, s8, s9)
fmt.Printf("三索引表达式s7=%v,len=%d,cap=%d\n", s10, len(s10), cap(s10)) //三索引表达式s7=[2 3],len=2,cap=4
```

### make方法初始化
- 使用make()创建切片时，会分配新的底层数组，因此不会与其他切片共享
```go
/* 方式2： make方法初始化 */
// 2-1:make动态扩容，此时长度容量均为0，但注意不是nil切片
s4 := make([]int, 0) //[]
// 2-2:make指定长度
s5 := make([]int, 10) //[0 0 0 0 0 0 0 0 0 0] 这里初始化了长度容量都是10的切片，因此有10个0
// 2-3:make指定长度和容量(推荐)
s6 := make([]int, 0, 10) //[],这里初始化了长度0容量10的数组，因此没有初始化元素
fmt.Println(s4, s5, s6)
//s11 := make([]int, 10, 3)// invalid argument: length and capacity swapped 非法，容量应当大于等于长度
```

### append方法初始化
```go
/* 方式4：append方法初始化,搭配切片展开操作符... */
source := []int{1, 2, 3}
appended1 := append([]int(nil), source...)         // 从nil切片append
appended2 := append(make([]int, 0, 10), source...) // 预分配容量
fmt.Println(appended1, appended2)
source2 := [3]int{1, 2, 3}
//appended3 := append(make([]int, 0, 10), source2...) // 错误,source2为数组，不支持...操作符
append3 := append(make([]int, 0, 10), source2[:]...) // 正确，创建临时切片并且展开
// append操作可以向自己append，也可以向空切片或nil切片append,但是要注意扩容引起性能下降的问题
// 多个append可以写成循环形式，但是非常不推荐，可能会造成频繁扩容导致性能下降！！！
append4 := make([]int, 0)
append4 = append(append4, 1)
append4 = append(append4, 2)
append4 = append(append4, 3)
fmt.Println(append3, append4) //[1 2 3] [1 2 3]
```

### copy方法初始化
- 使用copy()方法可以将一个切片的数据复制到另一个已存在的切片中
- 语法为`n=copy(dst,src)`
  - `src`为源数组/切片
  - `dst`为目标切片
  - `n`为复制的元素个数,可忽略
```go
source := []int{1, 2, 3, 4, 5}
// 等长复制
dest1 := make([]int, len(source))
nums1 := copy(dest1, source)        // 复制所有元素
fmt.Println("dest1:", dest1, nums1) // dest1: [1 2 3 4 5] 5
// 目标切片较短,只复制前部分元素
dest2 := make([]int, 3)
n2 := copy(dest2, source)        // 只复制前3个元素
fmt.Println("dest2:", dest2, n2) // dest2: [1 2 3] 3
// 目标切片较长,源切片元素覆盖前段，剩余保持零值
dest3 := make([]int, 7)
n3 := copy(dest3, source)        // 复制5个元素，后面2个保持0
fmt.Println("dest3:", dest3, n3) // dest3: [1 2 3 4 5 0 0] 5
// 从数组复制，需要先转换为切片
arr := [4]int{10, 20, 30, 40}
dest4 := make([]int, 4)
n4 := copy(dest4, arr[:])
fmt.Println("dest4:", dest4, n4) // dest4: [10 20 30 40] 4
// 部分复制，使用切片表达式，复制的部分等长
dest5 := make([]int, 3)
n5 := copy(dest5, source[1:4])   // 只复制源切片的第2-4个元素
fmt.Println("dest5:", dest5, n5) // dest5: [2 3 4] 3
// 自复制（重叠复制）
slice := []int{1, 2, 3, 4, 5}
n6 := copy(slice[2:], slice[1:4]) // 目标与源有重叠，用[2,3,4]去覆盖目标切片[3,4,5]所在的位置
fmt.Println("dest6:", slice, n6)  // dest6: [1 2 2 3 4] 3
```
## 赋值陷阱

- 由于slice是引用类型，有可能存在多个切片引用同一个数组或切片的可能性，因此在这种情况下操作不慎可能会产生一些奇特BUG

### 场景1：共享底层数组
```go
arr := [5]int{1, 2, 3, 4, 5}
slice1 := arr[1:4]                           // [2, 3, 4], len=3, cap=4，注意这里max容量等于原数组长度5
slice2 := arr[:]                             // [2, 3, 4], 与slice1共享底层数组
fmt.Println("before: ", arr, slice1, slice2) // before:  [1 2 3 4 5] [2 3 4] [2 3 4]

slice1 = append(slice1, 6)// 向slice1追加元素，但不触发扩容（max cap是5，追加后是4个）
fmt.Println("after: ", arr, slice1, slice2) // after:  [1 2 3 4 6] [2 3 4 6] [2 3 4]
// 注意到slice2改变了,slice1的append操作导致原数组4号位从5变成了6
// 可以类比内联函数的机制来理解，slice1相当于拿着arr的[2,3,4]在到处跑
// 这时候在slice1后面追加6，相当于slice1现在拿着[2,3,4,6]，同步改动到arr中就是6顶替了5的位置而非挤开
```
### 场景2：子切片存在重叠部分
```go
arr2 := [5]int{10, 20, 30, 40, 50}
part1 := arr2[0:3] // [10, 20, 30]
part2 := arr2[2:5] // [30, 40, 50] - 与part1在索引2处重叠
// 初始: arr2=[10 20 30 40 50], part1=[10 20 30], part2=[30 40 50]
fmt.Printf("初始: arr2=%v, part1=%v, part2=%v\n", arr2, part1, part2)
part1[2] = 999
// 修改part1[2]后: arr2=[10 20 999 40 50], part1=[10 20 999], part2=[999 40 50]
fmt.Printf("修改part1[2]后: arr2=%v, part1=%v, part2=%v\n", arr2, part1, part2)
```
### 场景3：append覆盖后续元素
```go
arr3 := [5]int{1, 2, 3, 0, 0}
base := arr3[0:3]     // [1, 2, 3], cap=5
extended := arr3[3:5] // [0, 0]
// 初始: arr3=[1 2 3 0 0], base=[1 2 3], extended=[0 0]
fmt.Printf("初始: arr3=%v, base=%v, extended=%v\n", arr3, base, extended)
// base追加元素，覆盖了extended的位置
base = append(base, 4, 5)
// base追加后: arr3=[1 2 3 4 5], base=[1 2 3 4 5], extended=[4 5]
// extended现在显示[4, 5]而不是原来的[0, 0]
fmt.Printf("base追加后: arr3=%v, base=%v, extended=%v\n", arr3, base, extended)
```
### 解决方法
- 可以看到其实三种场景类似，都是因为一起共享同一个数组导致会互相影响，这也是golang中切片使用时常见的语法陷阱，常见的规避方式如下：
  - 方法1，使用完整的切片表达式，即三索引表达式限制切片的最大容量,此时`append`新元素会导致扩容，从而解除和原数组的连接，规避风险：
    ```go
        arr := [5]int{1, 2, 3, 4, 5}
        slice1 := arr[1:4:4]  // [2, 3, 4], len=3, cap=3（限制容量）
        copy(slice, arr2[1:4]) // 复制数据到新切片
        slice1 = append(slice1, 6)//arr=[1 2 3 4 5], slice1=[2 3 4 6]
    ```
  - 方法2,使用`copy()`方法创建一个内存独立的切片
    ```go
        arr := [5]int{10, 20, 30, 40, 50}
        slice := make([]int, 3)
        copy(slice, arr2[1:4]) //arr=[10 20 30 40 50], slice=[20 30 40]
        slice = append(slice, 60)//arr=[10 20 30 40 50], slice=[20 30 40 60]
    ```
# 插入元素

## 头部插入
- **在开头插入元素会导致内存的重新分配，而且会导致已有元素全部被复制一次，性能很差**
```go
base := []int{1, 2, 3}
fmt.Println("插入前base=", base) // [1 2 3]
k := 4
base = append([]int{k}, base...)
fmt.Println("头部插入后base=", base) // [4 1 2 3]
```

## 尾部插入
- **如果切片有充足的容量，那么append操作会非常快，因此要养成习惯初始化的时候给足容量**
```go
base := []int{1, 2, 3}
k := 4
//在末尾插入元素k
base = append(base, k)
fmt.Println("尾部插入后base=", base) // [1 2 3 4]
```

## 中间插入
```go
base := []int{1, 2, 3}
k,i := 4,2
// 扩展切片容量
base = append(base, 0) // base=[1 2 3 0]
// 将第i个元素之后的元素向后移动一位
copy(base[i+1:], base[i:]) // base=[1 2 3 3]
base[i] = k
fmt.Println("中间插入后base=", base) // [1 2 4 3]
//还有一种方式是append但是不推荐
//slice = append(slice[:i], append([]int{k}, slice[i:]...)...)
```

# 删除元素
- **删除中间的元素会导致删除点之后的元素整体移动，导致O(n)的时间复杂度,其中n为删除点之后的元素数量**
  - 对于数组来说，删除操作本质上是**新建一个数组**，或者**移动元素覆盖**
  - 对于切片来说，删除操作一般使用append方法来实现
  - 这两种方法都会导致数组/切片的**整体移动**

## 直接删除法
```go
func remove(slice []int, i int) []int {
    return append(slice[:i], slice[i+1:]...)
}
```

## 优化版本
- 优化1：如果顺序不重要，可以用最后一个元素覆盖要删除的元素
```go
func fastDelete(slice []int, index int) []int {
    if index < 0 || index >= len(slice) {
        return slice
    }
    
    // 用最后一个元素覆盖要删除的元素
    slice[index] = slice[len(slice)-1]
    // 截断最后一个元素
    return slice[:len(slice)-1]
}
```

- 优化2：延迟删除，即批量删除时先标记再统一删除
```go
func batchDelete(slice []int, shouldDelete func(int) bool) []int {
    result := make([]int, 0, len(slice))
    for _, v := range slice {
        if !shouldDelete(v) {
            result = append(result, v)
        }
    }
    return result
}
```

- 优化3: 使用其他数据结构辅助或替代数组，例如链表，但是不推荐
- 常用操作
```go
// 删除元素
// 删除索引为2的元素
index := 2
slice = append(slice[:index], slice[index+1:]...)
fmt.Println("删除索引2后:", slice)

```