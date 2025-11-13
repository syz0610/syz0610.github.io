---
title: Go语法解析-并发编程
published: 2025-11-01
description: 'Go高并发编程相关的知识点'
image: ''
tags: [Golang]
category: 'Golang'
draft: false 
lang: ''
---

:::important
- 轻量化、高效的高并发模型是Golang最核心的风格，因此掌握这一部分是成为一个合格Gopher的必由之路
- 核心概念：
  - 五大参数：协程goroutine、通道channel、锁mutex、线程池pool、上下文context
  - 六大方法：多路复用select、同步原语sync|wait、原子操作atomic、竟态检测race、运行时分析runtime
  - 三大模式：生产者-消费者模式、扇入-扇出模式、超时控制模式
  - 回收机制：三色标记法
  - 设计模式：单例模式
- Go的多线程模型支持CSP(Communicating Sequential Processes),值可以在多个协程间传递，尽管大多数时候它被限制在单一实例中
:::

# 基础概念
:::note
- 基础概念讲解部分除最后一个大程序外,参考B站up主**TheCW**的教程编写,建议可以参考它的讲解来理解本文前半部分内容
- 针对教程没有提到的内容在正文作了补充
- 最后一个大程序我的实现和他不同，大家也可以参考并写出自己的实现方式
- 视频地址 <iframe width="100%" height="468" src="//player.bilibili.com/player.html?bvid=BV1qT4y1c77u&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"> </iframe>
:::
## 引子
- 假设我们有这么个场景：**每隔0.5s输出一次咩，输出5次**。我们很容易想到可以使用for循环来操作：
```go
func main() {
	print()
}

func print() {
	for i := 0; i < 5; i++ {
		fmt.Println("咩")
		time.Sleep(500 * time.Millisecond)
	}
}
```
- 现在我们还需要**每隔0.5秒汪一次，输出5次**，这样也很简单，只需要：
```go
func main() {
	printMie()
	printWang()
}

func printMie() {
	for i := 0; i < 5; i++ {
		fmt.Println("咩")
		time.Sleep(500 * time.Millisecond)
	}
}

func printWang() {
	for i := 0; i < 5; i++ {
		fmt.Println("汪")
		time.Sleep(500 * time.Millisecond)
	}
}
```
- 但是在汪之前需要等待咩结束，假如此时我们需要同时输出呢？
## 多线程
- 在golang中，如果我们需要同时执行多个任务，可以使用`go`关键字修饰一个函数，视为开辟一个新线程。开辟的新线程称之为`协程`
- `协程`是一种特殊的线程，具体的区别我们稍后再说，目前我们只要知道它是一种**轻量化的线程**，**启动快**且**调用开销比较小**
```go
func main() {
	go printMie()
	printWang()
}
```
- 在上述代码中，我们通过`go`关键字修饰了函数`printMie()`,使其可以在背景中运行，此时主线程继续执行`printWang`
- 通过观察输出，我们可以看到两个函数是一起执行的
- 如果尝试更改`go`关键字修饰的位置，我们还可以注意到如下两种情况：
  - `go`修饰`printWang()`,此时函数依旧会卡住执行`pringtMie()`，然而当`pringtMie()`执行完毕后**整个代码就直接退出了**
  - `go`**同时修饰两个函数**，此时我们会发现**很大概率什么都没有输出整个代码就直接退出了**
- 这是因为当我们创建一个线程后，主线程会将其挂到背景中执行，而自己继续往下执行
- **当主线程执行完毕后，无论子线程是否还在运行，整个程序都会立刻退出**
  - ***注意，这里为了方便读者理解，我们就还是按照`线程`的喊法来解释原理，后面再做区分***
- 为了等待子线程结束后再退出程序，我们自然而然想到可以让主线程等待一段时间后再退出
```go
func main() {
	go printMie()
	go printWang()
	time.Sleep(3 * time.Second) //这里估计下大概3s左右可以执行完毕
}
```
- 通过等待3秒再退出，我们完美地执行完了两个子线程
- 对于当前的示例代码，我们当然可以很方便地估计出它的大概执行时间并精确使用`Sleep()`函数，但实际工程中很少有机会如此
### 线程间同步
- 针对这种情况，golang提供了`sync`包用于解决该问题
- 为了等待子线程结束后再退出，我们可以使用`WaitGroup`方法
```go
func main() {
	var wg sync.WaitGroup //初始化信号量
	wg.Add(2)             //注册两个任务

	go func() { // 使用匿名函数包裹，可以不改动原函数
		defer wg.Done() // 执行完成后负责注销一个任务
    printMie()
	}()

	go printWang(&wg)// 注意不可以使用值传递传递锁或者信号量，必须用引用传递
	//wg.Done() // 执行完成后负责注销一个任务

	wg.Wait() // 等待任务全部完成
}

func printMie() {
	for i := 0; i < 5; i++ {
		fmt.Println("咩")
		time.Sleep(500 * time.Millisecond)
	}
}

func printWang(wg *sync.WaitGroup) {
	defer wg.Done() // defer 保证返回时一定销毁当前任务
	for i := 0; i < 5; i++ {
		fmt.Println("汪")
		time.Sleep(500 * time.Millisecond)
	}
}
```
- 在上述代码中我们看到使用了
  - `wg` 初始化了一个`sync.WaitGroup`类型的变量，用于调用同步函数
  - `Add()` 该方法负责注册若干个任务,注意如果传入非正整数则会panic
  - `Done()` 该方法负责通知主线程，子线程任务已完成并返回
  - `Wait()` 负责阻塞主线程,当`Add()`指定个数的任务都调用`Done()`后解除阻塞
- 注意`wg`的底层结构含有`nocopy`参数,提示我们不要直接传递形参给子线程,而是**应该传递指针地址**

### 线程间通信
- 现在我们搞定了如何控制主线程等待子线程结束后退出，现在我们考虑一个更加贴近实际的场景
- 一般而言，我们不会使用两个单独的函数分别执行相同的逻辑，仅仅是在要输出的内容上有差别，这时候我们通常可以合二为一：
```go
var count int //计数器

func main() {
	var wg sync.WaitGroup //初始化信号量
	wg.Add(2)             //注册两个任务

	go func() {
		counter(3, "汪")
		defer wg.Done()
	}()
	go func() {
		counter(5, "咩")
		defer wg.Done()
	}()

	wg.Wait() // 等待任务全部完成
	fmt.Println("Counter = ", count)
}

func counter(n int, animal string) {
	for i := 0; i < n; i++ {
		count++
		fmt.Println(animal)
		time.Sleep(500 * time.Millisecond)
	}
}

```
- 可以看到我们统一封装了一个函数`counter`用于输出我们统计了何种动物，每数一次就加一计数器，最后在主函数打印输出
- 在大多数情况下设置一个全局变量是最直接的想法，尤其是在别的语言中
- 但是这里存在一个问题，这个累加的操作**并不是线程安全**的。**如果我们创建的线程被分配到了不同的CPU核心中，就有可能造成最后输出的并非我们想要的效果，比如当前count等于2，但两个线程同时执行count+1的操作并且把他设置为3并返回，但其实此时应该为4！！！**
- Golang的设计理念贴近`CSP`理念，即**不要通过共享内存来通信，而应该通过通信来共享内存**
  - **核心思想是通过消息传递来实现内存共享**，而不是直接访问共享的内存区域(例如全局变量)
- **因此在golang中我们使用`channel`来在线程间共享通信**
```go
func main() {
	c := make(chan string) // 无缓冲channel
	cBuffer := make(chan string,2) // 有缓冲channel
	go counter(3, "汪", c)
	message := <-c
	fmt.Println(message)
}

func counter(n int, animal string, c chan string) {
	for i := 0; i < n; i++ {
		fmt.Println(animal)
		c <- animal
		time.Sleep(500 * time.Millisecond)
	}
}

```
- 在这里我们定义了一个无缓冲的channel：`c`，关于通道channel的基础语法如下：
:::important
- `channel`使用make方法初始化
  - `make(chan Type)` 初始化一个无缓冲channel,无缓冲channel要求发送和接收同时就绪，否则阻塞
  - `make(chan Type, capacity)` 初始化一个有缓冲channel，有缓冲channel在缓冲区满时阻塞
- `channel`在初始化时指定了数据类型后，后续只能接受该种数据类型
- 向channel发送数据 `ch<-value`
- 从channel接收数据 `value := <-ch` 或 `value, ok := <-ch`，`ok`参数用于判断channel是否已关闭
:::
- 现在我们可以在channel内获取子线程运行的内容了，但是我们发现并没有输出指定次数就退出了，这是因为无缓冲的channel在接收到消息后就解除了阻塞。之后主线程退出导致子线程也跟着退出了。
- 我们可以使用`for...range{}`语法或者`for{}`语法持续地从channel中获取数据
```go
func main() {
	c := make(chan string) // 无缓冲channel
	go counter(3, "汪", c)
	/* 	方式1： for...range{}
		message := <-c
	   	for v := range c {
	   		fmt.Println(v)

		}
	*/
	// 方式2，value,ok := chan 表达式
	for {
		v, ok := <-c
		if !ok {
			break
		}
		fmt.Println(v)
	}
}
func counter(n int, animal string, c chan string) {
	for i := 0; i < n; i++ {
		c <- animal
		time.Sleep(500 * time.Millisecond)
	}
}
/* 
汪
汪
汪
fatal error: all goroutines are asleep - deadlock!

goroutine 1 [chan receive]:
main.main()
        C:/Users/test/Desktop/exp/main.go:21 +0xc5
exit status 2
*/
```
- 现在我们可以持续地从channel中读取数据了，但是我们会发现最后程序因为异常`deadlock`退出了
- `deadlock` 也就是死锁，是并发编程中一个非常常见的`panic`级别的错误，稍后我们会归纳所有的死锁类型
- 这里死锁的原因是我们使用了channel却没有调用`close()`方法关闭
:::important
- 通道的关闭有几个原则
  - 1.应当由发送方关闭，因为接收方不知道什么时候停止发送或是否还会发送数据
    - 单一生产者-消费者模型的话由生产者关闭
    - 多个生产者的话使用`sync.Once`保证只关闭一次,因为**关闭已关闭的channel会导致panic**
  - 2.对于全局channel，建议使用`sync.Once`或者`WaitGroup`又或者`Context`来控制关闭行为
  - 3.在Golang中不需要关闭每个Channel，仅当在需要通知接收方**没有更多数据**时才需要关闭
  - 4.如果没有goroutine引用，那么这个通道会被GC回收
:::
- 对于上述代码，我们只要在counter函数最后添加一句`close(c)`即可
### 多路复用
- 在了解golang线程间通信的基本概念后，我们需要继续考虑更为实际的问题，假设我现在需要同时接收多个channel的数据，该如何操作？
- 显然，我们可以定义更多的通道来传输数据，最后在主函数汇总即可:
```go
func main() {
	c1 := make(chan string) // 无缓冲channel
	c2 := make(chan string) // 无缓冲channel
	go func() {
		for {
			c1 <- "汪"
			time.Sleep(500 * time.Millisecond)
		}
	}()
	go func() {
		for {
			c2 <- "咩"
			time.Sleep(2000 * time.Millisecond)
		}
	}()
	for {
		fmt.Println(<-c1)
		fmt.Println(<-c2)
	}
}
```
- 这里我们定义了两个通道`c1`和`c2`,包裹在两个子线程中,一个是1s发送2次，一个是2s发送一次
- 当我们尝试运行这段代码时，会发现输出和我们预期的交替输出有些不一样
- 这是因为我们定义的`c1`和`c2`都是无缓冲通道，根据之前的讲解，当接收方和发送方未能同时就绪时便会阻塞程序运行
- 在这个示例中，当`c1`发送方就绪时，很可能外部循环还阻塞在`c2`，因为`c2`发送方并未就绪；反之亦然
- 为了解决这种问题，golang使用`select`关键字来达成多路复用的功能，即：任意时刻选择到有数据的通道
```go
for {
	select {
	case msg:=<-c1:
		fmt.Println(msg)
	case msg:=<-c2:
		fmt.Println(msg)
		// default:
		// 	fmt.Println("No data ready")
	}
}
```
- 我们只要在原有的打印逻辑中使用`select`语法，类似`switch...case`语法，来选择输出。现在我们的代码可以按照正确频率输出两个通道的值了
- 注意`select`语句一般和for循环绑定使用，以实现持续获取通道内的值，否则读取一次后程序就直接退出了
- 现在我们已经掌握了Golang多线程编程的所有基本概念，包括:
  - 使用`go`关键字开启协程
  - 使用`channel`通信来共享内存
  - 使用`select`语句来实现多个`channel`数据的复用
## 实战应用-遍历文件
- 现在我们通过一个实际的案例来感受一下Golang高并发的效果
- 假设我们需要找出**给定路径下所有的后缀为`.jpg的文件`**,并且**打印执行时间和扫描到的文件数目**
- 基于常规思路，我们可以维护一个计数器、一个开始时间、一个结束时间。对于给定的路径，我们可以逐层扫描文件，判定是否要累加计数器。在`main()`函数开头和最后放置两个计数器，最后输出执行时间。代码如下:
```go
var count int = 0

func main() {
	start := time.Now()
	findFiles("G:")
	fmt.Printf("扫描到%d个jpg文件\n", count)
	fmt.Printf("总耗时:%f\n", time.Since(start).Seconds())
}

func findFiles(path string) {
	defer func() {
		if err := recover(); err != nil {
			fmt.Printf("err:%v\n", err)
		}
		return
	}()
	files, err := os.ReadDir(path)
	if err != nil {
		fmt.Printf("ReadDir error: %v \n", err)
		return
	}
	for _, file := range files {
		if file.IsDir() {
			fmt.Printf("正在搜索路径%s\n", path)
			findFiles(fmt.Sprintf("%s/%s/", path, file.Name()))// DFS
		}
		if strings.HasSuffix(file.Name(), ".jpg") ||
			strings.HasSuffix(file.Name(), ".JPG") {
			count++
		}
	}
}
/* 
扫描到155031个jpg文件
总耗时:172.916251
*/
```
- 我们使用常规的深度优先搜索(DFS)方式构建了一个`findFile()`函数,用于递归搜索所有子文件夹中匹配的目标
- 可以看到我们耗时172.9s搜索到了15w5000个左右的文件，显然还存在很大的优化空间
- 我们可以观察到DFS的过程其实是线性的,对于文件夹A下的子文件夹A1和A2，它会先搜索A1和A1的子文件夹，都搞定了再回来搜A2。
- 我们可以把整个搜索过程看作是遍历一棵二叉树，所有的非叶子结点都是文件夹，那么对于每一个搜索文件夹下文件的操作，都可以拆解为搜索它的子文件夹，这就是递归。
- 因此，我们可以创建协程，使得每次递归都可以使用一个协程去执行搜索操作，最后汇总结果，这样可以极大地提升搜索速度。
- 所以，给定的问题可以转变为如何递归创建次数未知的协程来执行相同的子任务且保证最后安全收尾？
```go
var count uint64 = 0
var totalSize uint64 = 0
var wg sync.WaitGroup
var sem = make(chan struct{}, 4000) // 控制并发数

func main() {
	start := time.Now()
	root := "G:" // 遍历起点
	wg.Add(1)
	sem <- struct{}{} // 根目录占一个槽位

	go findFiles(root)
	wg.Wait()
	totalSize = atomic.LoadUint64(&totalSize)
	var formatedSize string
	switch {
	case totalSize >= 1024*1024*1024*1024:
		formatedSize = fmt.Sprintf("%.5fTB", float64(totalSize)/(1024*1024*1024*1024))
	case totalSize >= 1024*1024*1024*1024:
		formatedSize = fmt.Sprintf("%.5fGB", float64(totalSize)/(1024*1024*1024))
	case totalSize >= 1024*1024*1024:
		formatedSize = fmt.Sprintf("%.5fMB", float64(totalSize)/(1024*1024))
	case totalSize >= 1024*1024:
		formatedSize = fmt.Sprintf("%.5fKB", float64(totalSize)/(1024))
	default:
		formatedSize = fmt.Sprintf("%.5fbytes", float64(totalSize))
	}
	fmt.Printf("扫描到%d个nef文件,总大小:%s \n",
		atomic.LoadUint64(&count), formatedSize)
	fmt.Printf("总耗时:%f秒\n", time.Since(start).Seconds())
}

func findFiles(path string) {
	defer func() {
		<-sem
		wg.Done()
		if err := recover(); err != nil {
			fmt.Printf("panic in %s: %v\n", path, err)
		}
	}()

	files, err := os.ReadDir(path)
	if err != nil {
		if os.IsPermission(err) {
			fmt.Printf("目录%s无读取权限!跳过...\n", path)
		} else {
			fmt.Printf("读取目录%s异常: %v\n", path, err)
		}
		return
	}

	for _, file := range files {
		nowPath := filepath.Join(path, file.Name())
		if !file.IsDir() {
			ext := strings.ToLower(filepath.Ext(file.Name()))
			if ext == ".nef" {
				atomic.AddUint64(&count, 1)
				f, err := os.Stat(nowPath)
				if err != nil {
					fmt.Printf("获取文件%s大小出错:%v\n", file.Name(), err)
					continue
				}
				atomic.AddUint64(&totalSize, uint64(f.Size()))
			}
			continue
		}
		// 子目录先Add再尝试占用一个并发槽位
		subPath := filepath.Join(path, file.Name())
		wg.Add(1)
		sem <- struct{}{} // 可能在这里阻塞，控制并发数量
		go findFiles(subPath)
	}
}
```
- 上述代码实现了一个并发扫描给定目录下`.NEF`文件的功能
  - 使用到了`atomic`包来并发读写计数器,避免了加锁导致的上下文切换损耗
  - 使用了一个`sem`通道,通过使用`空结构体struct{}{}`零损耗占位的方式,实现了并发线程数控制的功能
    - **使用空结构体`struct{}{}`是golang编程风格的体现，也是go语言一个非常实用的技巧，是编译器级别的优化手段之一**
- ***上述代码首次运行大概在23秒左右，之后因为系统缓存的原因平均只需要3-4秒即可跑完91371个NEF文件，总大小3.88TB左右，硬盘大小18.1TB左右。对于jpg格式的图片，大概15w5张图片平均耗时在6s左右，CPU占用不超过10%。体现了golang并发强大的性能优势。***

# Goroutine高级话题
## 线程模型
## GC机制
## 三色标记法
## pprof分析法

# Goroutine高级应用

## 常用库函数

### Atomic包
### Sync|Wait包
### Context包
### runtime包

## 单例模式
## 超时控制
## 扇入扇出模型

# 其他话题