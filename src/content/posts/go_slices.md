---
title: Go语法解析-数组和切片
published: 2025-10-17
description: '数组，尤其是切片的使用方法和库函数'
image: ''
tags: [Golang]
category: 'Golang'
draft: false 
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
# 指针操作
- 与C语言等其他语言一样，Golang也支持通过指针操作切片或数组，这里仅讨论Golang中切片的特殊之处造成的BUG
## 问题根源：BUG情况
- 函数间传参未使用指针或无返回值的情况比较清晰，通常我们都可以及时发现问题，这里不做展示
- 另一种比较隐晦的情况是在实现类接口时，**错误地使用了值接收器在切片更新操作函数上**，所谓**切片更新操作**一般指的是**插入**和**删除**操作。
```go
type MySlice interface {
	myAppend()
}

type MyClass struct {
	value string
	arr   []string
}

func (ms MyClass) myAppend() {
	ms.arr = append(ms.arr, ms.value)
	//fmt.Printf("值接收器内: arr=%v, 地址=%p\n", ms.arr, &ms.arr)
}

func (ms *MyClass) myAppendWithPointer() {
	ms.arr = append(ms.arr, ms.value)
	//fmt.Printf("指针接收器内: arr=%v, 地址=%p\n", ms.arr, &ms.arr)
}

func main() {
	np := MyClass{}
	np.arr = make([]string, 0)

	p := &MyClass{}
	p.arr = make([]string, 0)

	for i := 0; i < 3; i++ {
		val := strconv.Itoa(i)
		np.value, p.value = val, val
		np.myAppend()
		p.myAppendWithPointer()
		fmt.Printf("数组首地址[%p],数组内容 %v\n", &np.arr, np.arr)
		fmt.Printf("指针数组首地址[%p],数组内容 %v\n", &p.arr, p.arr)
		fmt.Println("---")
	}
	fmt.Printf("数组首地址[%p],数组内容 %v <-----last\n", &np.arr, np.arr)
	fmt.Printf("指针数组首地址[%p],数组内容 %v <-----last\n", &p.arr, p.arr)
}
/* 输出
数组首地址[0xc0000a24c0],数组内容 []
指针数组首地址[0xc0000a24f0],数组内容 [0]
---
数组首地址[0xc0000a24c0],数组内容 []
指针数组首地址[0xc0000a24f0],数组内容 [0 1]
---
数组首地址[0xc0000a24c0],数组内容 []
指针数组首地址[0xc0000a24f0],数组内容 [0 1 2]
---
数组首地址[0xc0000a24c0],数组内容 [] <-----last
指针数组首地址[0xc0000a24f0],数组内容 [0 1 2] <-----last
*/
```
:::important
可以看到使用了面向对象写法后，甚至打印出来的数组首地址也不变，非常具有迷惑性。
这种情况很容易发生在需求迭代后新增方法时，往往因为参数膨胀或外部干扰导致忘记正确使用指针接收者
:::

## 解决之道：正确使用指针
- 前面已经提到，一些操作方法比如append可能触发切片扩容，导致底层数组改变，进而导致在共享切片时，有些变量保存的依旧是旧切片的拷贝
- 因此，对于**需要全局共享切片**的场景，或者**大切片需要在函数间传递**的场景中，使用指针操作切片是比较合理的选择
```go
func main() {
    var arr = make([]string, 0)
    p := &arr
    for i := 0; i < 10; i++ {
      *p = append(*p, strconv.Itoa(i))
      fmt.Printf("指针地址[%p],切片首地址[%p],数组内容 %v\n", &p, arr, *p)
    }
    fmt.Printf("指针地址[%p],切片首地址[%p],数组内容 %v  <-----最终结果\n", &p, arr, *p)
  }
/* 输出
  指针地址[0xc00000a028],切片首地址[0xc000072250],数组内容 [0]
  指针地址[0xc00000a028],切片首地址[0xc0000743e0],数组内容 [0 1]
  指针地址[0xc00000a028],切片首地址[0xc00007e040],数组内容 [0 1 2]
  指针地址[0xc00000a028],切片首地址[0xc00007e040],数组内容 [0 1 2 3]
  指针地址[0xc00000a028],切片首地址[0xc0000b4000],数组内容 [0 1 2 3 4]
  指针地址[0xc00000a028],切片首地址[0xc0000b4000],数组内容 [0 1 2 3 4 5]
  指针地址[0xc00000a028],切片首地址[0xc0000b4000],数组内容 [0 1 2 3 4 5 6]
  指针地址[0xc00000a028],切片首地址[0xc0000b4000],数组内容 [0 1 2 3 4 5 6 7]
  指针地址[0xc00000a028],切片首地址[0xc0000b6000],数组内容 [0 1 2 3 4 5 6 7 8]
  指针地址[0xc00000a028],切片首地址[0xc0000b6000],数组内容 [0 1 2 3 4 5 6 7 8 9]
  指针地址[0xc00000a028],切片首地址[0xc0000b6000],数组内容 [0 1 2 3 4 5 6 7 8 9]  <-----最终结果 
*/
```
:::important
可以看到，我们最初是初始化了一个容量为0的切片，意图使其不断扩容。
事实也是如此，随着切片扩容，切片首地址不停变化，代表编译器在不停地迁移旧切片内容到新切片中。
但是作为指向数组首地址的指针本身的地址并没有改变，起到了一个锚点的作用。
在实际的项目中，当存在需要通过全局切片来共享内容的场合，由于切片大小不可预期，因此如果仅仅是共享切片本身，很可能获取不到变化后的新内容。
因此需要在上下文中传递指针来保证切片内容的时效性。此外，持续增长的切片也会对内存造成压力，使用指针也可以完美解决这一问题，类似于操作大结构体。
当然正如前文所述，共享指针意味着程序员自身要对代码的内存管理负责
:::
# go-slices库(需求Go1.21|1.22版本)
:::note
掌握基础的操作语法自然是必不可少，但实际工程中如果可以妥善使用库函数，无论是代码鲁棒性，抑或是可读性，乃至于执行效率，也许能起到事半功倍的效果
Go 1.21开始新增slices包，提供了许多针对slice操作的便捷函数调用，无论是刷算法题还是实际工程中都非常受用
Go 1.22对slices包又做了许多重大更新
:::

:::important
注意，本节内容需要Golang版本大于等于1.21，部分内容要求1.22版本，因此如果当前维护的Go版本低于1.21，那么本节可能不适用，请注意甄别
但是如果工程版本大于等于1.18，那么`github.com/samber/lo`库以及它的一些子库，尤其是并行库`github.com/samber/lo/parallel`是一个很不错的替代品，提供了`Lodash`风格的、基于Go泛型特性的高效工具
:::

## **Sort 递增排序**
- `Sort` 对切片中的元素进行升序排序
  - **对于浮点数排序，NaN视为最小**
  - 统一了之前版本的`sort.Ints`或者`sort.Strings`等排序函数为一个接口
- `SortFunc` 使用自定义比较函数对复合数据类型数组进行排序，例如结构体
- `SortStableFunc` `SortFunc`的另一个版本，当遇到两个相等的元素时，保持他们原始的索引大小关系
```go
fmt.Println("排序前：", arr1)
slices.Sort(arr1)
fmt.Println("排序后：", arr1)
// slices.SortFunc(arr2, func(a, b E) int {})
// slices.SortStableFunc(arr2, func(a, b E) int {})
```

## **Insert 插入元素**
- `Insert` 在索引i处插入一个或多个元素，返回修改后的切片，多个元素插入时支持...操作符
- 时间复杂度为O(原数组元素个数 + 插入的元素个数)
- 注意**Go1.22之前**，**如果指定的位置越界，当没有指定插入元素的情况下，不会触发panic**
- **Go1.22之后**，**如果指定的位置越界，无论是否指定了插入元素的，都会触发panic**
```go
arr1 := []int{1, 2, 3, 4, 5}
arr1 = slices.Insert(arr1, len(arr1), 0) // [1 2 3 4 5 0]
arr1 = slices.Insert(arr1, 1, []int{-1, -2, -3, -4}...)
fmt.Println("插入一组后arr1：", arr1) // 插入一组后arr1： [1 -1 -2 -3 -4 2 3 4 5 0]
```

## **查找元素**
### **Contains 是否包含**
- `Contains` 查找切片中是否包含指定元素，返回`bool`类型
- `ContainsFunc` 使用自定义函数比较器查找切片中是否包含指定元素，返回`bool`类型
```go
arr1 := []int{1, 2, 3, 4, 5}
fmt.Println(slices.Contains(arr1, 3))// true
fmt.Println(slices.ContainsFunc(arr1, func(n int) bool {
	return n%3 == 0
}))// true
```

### **Index 返回第一次出现的位置**
- `Index` 查找元素v在数组arr中第一次出现的位置并返回索引，若找不到则返回-1
- `IndexFunc` 使用自定义函数查找元素v在数组arr中第一次出现的位置并返回索引，若找不到则返回-1
```go
	fmt.Println(slices.Index(arr1, 3)) // 2
	fmt.Println(slices.Index(arr2, 3)) // -1
	fmt.Println(slices.IndexFunc(arr1, func(n int) bool {
		return n%7 == 0
	})) // -1
```
### **BinarySearch 二分查找递增序列**
- `BinarySearch` 二分查找一个**递增**的序列
  - 如果找到则返回索引和true
  - 否则返回如果要插入应该放置的位置和false，即不破坏递增的情况下待查元素应在的最小索引
- `BinarySearchFunc` 使用自定义函数二分查找一个**递增**的序列
  - 通常用于结构体数组按某个字段排序等**不能直接比较大小**的场合
:::important
注意二分查找方法并不会校验序列是否递增，如非递增序列，则返回的结果不确定
:::
```go
	arr1 := []int{1, 2, 3, 4, 5}
	// 二分查找一个递增的序列,如果找到则返回元素索引和true，否则返回如果要插入应该放置的位置和false
	fmt.Println(slices.BinarySearch(arr1, 2)) // 2 true
	// 二分查找一个递增的序列,如果找到则返回元素索引和true，否则返回如果要插入应该放置的位置和false
	type User struct {
		User string
		Age  int
	}
	uses := []User{
		{User: "Alice", Age: 10}, {User: "Boy", Age: 20}, {User: "Cat", Age: 30}, {User: "Dog", Age: 40},
	}
	fmt.Println(slices.BinarySearchFunc(uses, User{Age: 27}, func(src User, dst User) int {
		return cmp.Compare(src.Age, dst.Age)
	})) // 2 false  这里false是找不到，2意思是如果要插入应该放置的位置
```

### **Max|Min 查找最大|最小值**
- `Max`|`Min` 查找给定切片中的最大|最小值，空切片触发panic
  - 对于浮点类型，如果包含NaN则返回NaN，因为NaN不可比大小，表示不是一个数字或无效数字
- `MaxFunc`|`MinFunc` 使用自定义函数查找给定切片中的最大|最小值，空切片触发panic
  - 其余规则同基础方法
```go
	arrFloat1 := []float64{1.2, 3.4, 5.6, 7.8}
	arrFloat2 := []float64{.2, 3.4, 5.6, 7.8, math.NaN()}
  fmt.Println(slices.Max(arrFloat2))
	fmt.Println(slices.MaxFunc(arrFloat1, func(a, b float64) int {
		return int(a - b)
	}))
```

## **Replace 替换元素**
- `Replace` 替换给定下标区间内的元素为指定值，区间为**左闭右开**，返回修改后的切片，**支持...表达式**
- **注意替换的话可能使得原数组缩短或变长**
- **Go 1.22**对Replace系列函数做了改进，对于被移除的元素，在原切片中被**标记为零值**(即第二次出现的位置开始置零)
```go
fmt.Println("替换前arr1：", arr1)
arr1 = slices.Replace(arr1, 2, 4, []int{2, 2}...)
fmt.Println("替换后arr1：", arr1)
```

## **Reverse 反转切片**
- **注意没有返回值**
```go
slices.Reverse(arr1)
```

## **Delete 删除元素**
- `Delete` 删除给定区间的元素，区间为**左闭右开**
  - **如果给定的区间无效则会panic**
  - 时间复杂度O(len(s)-j)，因此如果必须删除许多项，**最好调用一次删除全部**
  - 注意，如果要删除的元素包含**指针**，可以考虑将这些元素**归零**，以便它们引用的对象可以被垃圾回收
  - **Go 1.22**对Delete系列函数做了改进，对于被移除的元素，在原切片中被**标记为零值**(即第二次出现的位置开始置零)
- `DeleteFunc` 为自定义函数版本，不再重复
```go
fmt.Println("删除前arr1：", arr1)
arr1 = slices.Delete(arr1, 0, 1) // 这里等于全部删除
fmt.Println("删除后arr1：", arr1)
arr1 = slices.DeleteFunc(arr1, func(n int) bool {
	return n%2 != 0 // 删除奇数
})
fmt.Println("自定义删除后arr1：", arr1)
```

## **Equal 是否相等**
- `Equal` **逐项比对**元素是否相等，如**不相等则立刻退出**并返回false，否则返回true
- `EqualFunc` 使用自定义函数来逐项比对元素是否相等，如不相等则立刻退出并返回false，否则返回true
  - 一般用来比较不能直接判定相等的复合数据类型，比如结构体数组
```go
fmt.Println(slices.Equal(arr1, arr2)) // false
fmt.Println(slices.EqualFunc(arr1, arr2, func(a, b int) bool {
	return a == b // false,
}))
```

## **IsSorted 是否递增**
- `IsSorted` 判断给定切片是否**递增**
- `IsSortedFunc` 使用自定义函数判断给定切片是否递增
  - 一般用来比较不能直接判定相等的复合数据类型，比如结构体数组
```go
fmt.Println(slices.IsSorted(arr1))
fmt.Println(slices.IsSortedFunc(arr3, func(a, b string) int {
	return cmp.Compare(a, b)
}))
```

## **Grow 扩展容量**
- 扩容n个元素，**n为负值或太大爆内存了则panic**，
  - **注意扩容后length不变，切片当前内容不变（即没有额外的0）**
```go
fmt.Printf("Before Grow,cap is:%d,len is %d, arr is %v\n", cap(arr1), len(arr1), arr1)
arr1 = slices.Grow(arr1, 21)
fmt.Printf("After Grow,cap is:%d,len is %d, arr is %v\n", cap(arr1), len(arr1), arr1)
```

## **Clip 回收容量**
- `Clip` 回收(删除)切片中**未使用的容量**，执行后切片的长度等于切片的容量
```go
arr1 = slices.Clip(arr1)
fmt.Printf("After Clip,cap is:%d,len is %d, arr is %v\n", cap(arr1), len(arr1), arr1)
```

## **Compact 压缩(去重)**
- `Compact` 压缩连续相同的元素为1个，**保留在第一次出现的位置**
  - 注意该压缩**不改变底层数组**，因此被压缩的元素仍然占用内存，可考虑设置为nil
  - **Go 1.22**对Compact系列函数做了改进，对于被移除的元素，在原切片中被**标记为零值**(即第二次出现的位置开始置零)
- `CompactFunc` 使用自定义函数的版本
```go
fmt.Println("压缩前：", arr4)
arr4 = slices.Compact(arr4)
fmt.Println("压缩后：", arr4)
arr5 = slices.CompactFunc(arr5, func(n, k int) bool {
	return k%8 == 0
})
fmt.Println("自定义压缩后：", arr5)
```

## **Clone 克隆(浅拷贝)**
- ***克隆一个切片并返回它的副本，是浅拷贝，比较危险, 这个函数建议别用了***
```go
tmp := slices.Clone(arr1)
fmt.Println("Clone arr:", tmp)
```

## **Compare 比较大小**
- `Compare` **逐项比较**两个切片`s1`和`s2`，直到有一对值不相等，返回该次比较结果
  - 如果一个切片是另一个切片的子集，则视为该切片小于父切片（即子切片先于父切片遍历完毕且已遍历的部分完全相等）
  - 如果`s1==s2`则返回`0`
  - 如果`s1<s2`则返回`-1`
  - 如果`s1>s2`则返回`1`
- `CompareFunc` 用自定义函数来比较两个切片，一般用来比较不能直接判定相等的复合数据类型，比如结构体数组
```go
fmt.Println(slices.Compare(s1, arr7))
// slices.CompareFunc(arr1,arr2,func(first,second)int) 
```

## **Repeat 复制N次元素生成新切片**
- `Repeat` 对于给定的数据，重复指定的次数，返回一个新切片
  - **如果次数为负数或者重复后爆内存，则返回panic**
  - **如果次数为0则返回一个空切片**
  - **该函数不会返回nil切片**
```go
fmt.Println(slices.Repeat([]float64{3.14}, 3))
```

## **Concat 拼接(需要Go1.22)**
- `Concat` **Go 1.22**版本新增Concat函数，用于高效拼接多个切片
```go
fmt.Println(slices.Concat([]int{11, 22, 33}, []int{44, 55, 66, 0}, []int{100, 200, 300}))
```

## **迭代器函数(需要Go1.23~远期1.26)**
:::important
请注意，这一部分目前官方还在持续调整中，内容随时可能会发生改变，仅供参考
:::
- **Go1.23**版本开始官方正式将`迭代器`加入标准库，但是预计要到`1.26`版本才会完善支持
- 以下函数存在于`iter.go`中，它们均返回一个`迭代器`
  - `slices.All()`
  - `slices.AppendSeq()`
  - `slices.Backward()`
  - `slices.Chunk()`
  - `slices.Collect()`
  - `slices.Values()`
  - `slices.Sorted()`
  - `slices.SortedFunc()`
  - `slices.SortedStableFunc()`
- 当前版本(Go1.25.4)迭代器主要有两种
  - `Pull` 签名为`func Pull[V any](seq Seq[V]) (next func() (V, bool), stop func())`
    - 适用于迭代切片、通道等单值序列
    - 每轮迭代都输出`值v`和`执行结果ok`
  - `Pull2` 签名为`func Pull2[K, V any](seq Seq2[K, V]) (next func() (K, V, bool), stop func())`
    - 适用于迭代map、带索引的序列等双值序列
    - 每轮迭代都输出`索引i`、`值v`和`执行结果ok`
  - 两种迭代器均提供`next()`方法用于遍历给定的序列，`stop()`方法用于终止迭代
    - 注意在执行`next()`过程中一定要随时判断`ok`标志位，判断是否要终止迭代
    - 通常在构造迭代器后，使用`defer stop()`语句保证不会忘记关闭迭代器，否则会造成内存泄露
    - 尽管库函数中提供了竟态检测，但**迭代器是非并发安全的，不可以在多个协程间共享，请分别构造迭代器**

- 在了解完迭代器的用法后，下面给出具体用法
- 
### **Values 获取包含序列所有值的迭代器**
- 使用单值迭代器获取给定序列的值
- 这里用切片所以效果和`All()`方法差不多，对于比如map类型的话可以很方便获取所有值
```go
func main() {
	names := []string{"Alice", "Bob", "Vera"}
	values := make([]string, 0, len(names))
	seq := slices.Values(names)  // 构造迭代器
	next, stop := iter.Pull(seq) // 构造迭代工具
	defer stop()                 // 不要忘记关闭迭代器

	for { // 开始迭代
		v, ok := next()
		if !ok { // 不要忘记随时判断是否迭代成功
			break
		}
		fmt.Println(v)
		values = append(values, v)
	}
	fmt.Println("values数组:", values)
}
/* 输出
Alice
Bob
Vera
values数组: [Alice Bob Vera]
*/
```

### **All 获取序列的索引和值**
- 使用单值迭代器获取给定序列的索引和值
- 这里用切片所以效果和`for...range()`方法差不多，但对于比如map类型的话可以很方便剥离所有的键值对
```go
func main() {
	names := []string{"Alice", "Bob", "Vera"}
	seq := slices.All(names)      // 构造迭代器
	next, stop := iter.Pull2(seq) // 构造迭代工具
	defer stop()                  // 不要忘记关闭迭代器

	for { // 开始迭代
		i, v, ok := next()
		if !ok { // 不要忘记随时判断是否迭代成功
			break
		}
		fmt.Println(i, ":", v)
	}
}
/* 输出
	0 : Alice
	1 : Bob
	2 : Vera
*/
```

### **AppendSeq 迭代版本的append**
- `AppendSeq` 把迭代器的内容追加到已有切片中
  - 注意这里是配合`Values()`方法使用，直接从`Values()`方法获取到的迭代器中获取值，相当于迭代版本的`append()`方法
```go
func main() {
	data := []int{1, 2, 3}
	seq := slices.Values([]int{4, 5, 6})
	data = slices.AppendSeq(data, seq)
	fmt.Println(data) // [1 2 3 4 5 6]
}
/* 输出
[1 2 3 4 5 6]
*/
```

### **Backward 倒序输出**
- 倒序输出切片的索引和值
```go
func main() {
	names := []string{"Alice", "Bob", "Vera"}
	seq := slices.Backward(names) // 构造迭代器
	next, stop := iter.Pull2(seq) // 构造迭代工具
	defer stop()                  // 不要忘记关闭迭代器

	for { // 开始迭代
		i, v, ok := next()
		if !ok { // 不要忘记随时判断是否迭代成功
			break
		}
		fmt.Printf("%d:%s\n", i, v)
	}
}
/* 输出
2:Vera
1:Bob
0:Alice
*/
```

### **Chunk 切分序列**
- `Chunk` 将给定的序列按照每份n个切分
  - 如果某一份不足n个则直接返回实际个数
```go
func main() {
	names := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	seq := slices.Chunk(names, 3) // 构造迭代器,给定每一份数量
	next, stop := iter.Pull(seq)  // 构造迭代工具
	defer stop()                  // 不要忘记关闭迭代器

	for { // 开始迭代
		chunk, ok := next()
		if !ok { // 不要忘记随时判断是否迭代成功
			break
		}
		fmt.Println(chunk)
	}
}

/* 输出
[1 2 3]
[4 5 6]
[7 8 9]
[10]
*/
```

### **Collect 迭代版本的构造切片**
- `Collect` 从迭代器收集所有值构造一个切片
```go
func main() {
	seq := func(yield func(int) bool) { // 注意这里序列用匿名函数构造
		for i := 0; i < 5; i++ {
			yield(i)
		}
	}
	vals := slices.Collect(seq)
	fmt.Println(vals) // [0 1 2 3 4]
}

/* 输出
[0 1 2 3 4]
*/
```


### **Sorted 迭代版本的排序**
- `Sorted` 迭代版本的排序方法，入参为`Values()`方法返回的迭代器
- `slices.SortedFunc()` 使用自定义函数排序，依旧是迭代版本的
- `slices.SortedStableFunc()` 使用自定义函数排序，依旧是迭代版本的，对于相等的元素保持它们排序前的相对顺序不变
```go
func main() {
	nums := []int{5, 2, 8, 1}
	sorted := slices.Sorted(slices.Values(nums))
	fmt.Println(sorted) // [1 2 5 8]
}
/* 输出
[1 2 5 8]
*/
```
