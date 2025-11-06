---
title: Go语法解析-defer关键字
published: 2025-10-17
description: 'defer的用法总结'
image: ''
tags: [Golang]
category: 'Golang'
draft: false 
lang: ''
---

:::note
`defer`关键字和延迟注册机制是Golang编程风格的重要组成之一,提供了一种延迟触发机制，适用于资源释放、文件关闭、计时等操作
:::

# 基础语法

- `defer`的基础语法如下：
  ```go
  func main(){
      fmt.Println("before defer")
      // defer可以直接修饰语句
      defer fmt.Println("defer print")
      // 当然defer也可以用于修饰匿名函数
      defer func(){
          fmt.Println("in defer")
      }()
  }
  // before defer
  // in defer
  // defer print
  ```
- 注意到，多个`defer`语句遵循**先入后出**的机制，首先注册`defer print`，其次是`in defer`，实际输出顺序相反

- 延迟触发机制在某些场合非常好用，例如关闭文件句柄，关闭连接等，此时使用defer调用close()方法是一个很好的习惯：
  ```go
  // 打开文件获取句柄
  func openFile(fileName string)(string, error) {
    file, err := os.Open(filename)
	if err != nil {
		return "", err
	}
	defer file.Close()
    // 下略
  }
  ```

# 对函数返回值和闭包的影响

- `闭包(closure)`是常见的语法糖，特性是会捕获闭包外的变量，遇到闭包写法时需要小心分析函数运行结果
- 前述`defer`延迟触发机制会影响函数返回值，因此当作用于闭包且闭包捕获了全局返回值时就要格外小心运行结果超出预期
- 在阐述具体机制前，需要明确以下几点：
  - 对于**非嵌套写法**，即defer直接修饰语句，通过`defer`关键字注册的函数或变量值在注册时就已经确定
    - 注意如果非嵌套写法下发生和函数嵌套，则在注册时，**内部函数应当计算完毕后作为外部函数的参数，注册到defer**
      - 例如，如果存在`add(x,y int) int`函数返回两数之和，此时注册`defer add(x,add(x,y))`时，应当先计算内层`add(x,y)`,再把外层`add`注册到defer
  - 对于**嵌套写法**，即闭包，如果`defer`注册的函数或语句中包含**命名返回值变量**，则**命名返回值变量**要到运行时才确定，因为Golang中`return`操作并不是原子的，分为以下几步：
    - 首先，**对返回值变量赋值**
    - 其次，依次出栈执行defer注册的内容
    - 最后，返回上一级函数
  - 此外，不同于非嵌套写法，嵌套写法时如果也注册了形如`defer add(x,add(x,y))`的写法，则**不立刻计算内层add，而是作为整体注册，在触发计算时先计算内层再计算外层**
- 下面来看几种情况：
  - 情况1： 非嵌套写法
    ```go
        /** 示例1：一般情况 **/
        func main() {
                x := 10
                defer func() {
                    fmt.Println("defer: x=", x)
                }()
                fmt.Println("before return,x=", x)
                return // 多余的return，给出是为了便于理解
        }
        // defer内的修改并没有影响return前的输出，因为虽然在return前触发了，
        // 但此时外部打印已完成，且main函数直接结束无后续调用
        // before return,x= 10
        // defer: x= 20
    ```
  - 情况2：嵌套写法，捕获命名返回值时，可以看到defer函数在交付本级函数前修改了x的值，因此defer执行的时机是返回上一级之前,main函数中t获取到的是修改后的值 
    ```go
    func delay() (x int) {
        x = 10
	defer func() {
		x += 10
		fmt.Println("defer: x=", x)
	}()

	fmt.Println("before return,x=", x)
	return x
    }

    func main() {
        t := delay()
        fmt.Println("t=", t)
    }
    // before return,x= 10
    // defer: x= 20
    // t= 20
    ```
  - 情况3：**注意!!!捕获匿名返回值时，不影响返回值**
    ```go
        func delay() int {
        x := 10
        defer func() {
            x += 10
            fmt.Println("defer: x=", x)
        }()

        fmt.Println("before return,x=", x)
        return x
        }

        func main() {
            t := delay()
            fmt.Println("t=", t)
        }
        // before return,x= 10
        // defer: x= 20
        // t= 10
    ```
    - 这里是go的常见语法陷阱之一，注意这里不是变量作用与问题，而是go编译器在处理匿名返回值时，遵循以下步骤:
      - 首先，自动创建一个匿名变量，假设为`y`
      - 其次，`return x`语句首先将`x`的值赋值给`y`，注意这里是值拷贝
      - 然后，defer函数触发，修改了`x`的值，**但是因为值拷贝的缘故，并未影响y的值**
      - 最后，返回y
    - 因此，闭包捕获的匿名变量修改后不影响最终的返回值
    - 那么，是否意味着**如果可以拿到匿名变量`y`的地址，就可以通过指针间接修改返回值**呢？
      - 答案是肯定的，但是实际操作很难获取
    - 既然很难获取，那么是否仍有可能修改匿名返回值变量的值呢？
      - 答案是肯定的，如果**发生了指针传递**，就可以实现这一点，请看下一种情况
  - 情况4：捕获了**引用类型**的匿名返回值,或者传递了**指针**
    - 捕获了切片,不生效，因为副本已确定，除非修改底层数组
    ```go
    func delay() []int {
        x := []int{1, 2, 3}
        defer func() {
            x[0] = 0//修改了切片中元素的值
            fmt.Println("defer: x=", x)
        }()

        fmt.Println("before return,x=", x)
        return x//返回的是切片头的副本（包括指针、长度和容量）
    }
    // before return,x= [1 2 3]
    // defer: x= [0 2 3]
    // t= [0 2 3]
    ```
    - 指针传递
    ```go
    func delay(result *int) {
        x := 10
        defer func() {
            *result = x + 10  // 直接修改指针指向的值
        }()
        *result = x
    }

    func main() {
        var t int
        delay(&t)
        fmt.Println("t=", t) // 输出 20
    }
    // t= 20
    ```


# 异常处理panic和recover

- 我们知道，部分语言中存在`try{}catch{}`机制，用于捕获异常后抛出或后处理。但是golang中，遵循捕获异常抛给用户处理的机制，因此不存在该语法
- golang在遇到panic时，程序会崩溃，进而异常退出，panic之后的代码不会执行。
- 因此为了避免这种情况，需要使用`recover()`函数来处理：
  ```go
    // 情况1：无recover
    func aaa() {
        fmt.Println("aaa")
    }

    func main() {
        panic("panic main!!")
        aaa()// 无法到达的代码
        fmt.Println("bbb")
    }
    /*
    输出：
        panic: panic main!!

        goroutine 1 [running]:
        main.main()
                C:/Users/test/Desktop/exp/main.go:10 +0x27
        exit status 2
    */

    // 情况2：有recover
    func aaa() {
        fmt.Println("aaa")
    }

    func main() {
        defer func() {
            if err := recover(); err != nil {
                fmt.Println("defer: panic recovered!")
                fmt.Printf("defer: %T %v", err, err)
                // 其他逻辑
            }
        }()
        panic("panic main!!")
        aaa() // 无法到达的代码
        fmt.Println("bbb")
    }
    /*
    输出：
        defer: panic recovered!
        defer: string panic main!!
    */
  ```
- 注意`recover()`必须配合`defer`使用，否则无法捕获`panic`
 - 由于延迟触发机制，**`defer`语句一定要在触发`panic`的语句之前定义**
- 注意如果要单独封装recover功能到其他函数中的话，**在调用时应当直接注册该函数而非嵌套调用，否则无法捕获panic**：
    ```go
    func myRecover() {
        if err := recover(); err != nil {
            fmt.Println("defer: panic recovered!")
            fmt.Printf("defer: %T %v", err, err)
            // 其他逻辑
        }
    }

    func main() {
        /*
            defer func() {  // 捕获失败
                myRecover()
            }()
        */
        //panic("panic main!!")// 捕获失败
        defer myRecover()  // 捕获成功
        panic("panic main!!")
    }
    ```
- 最后要注意`recover()`的意义在于**保证程序优雅地释放资源后退出**，阻止`panic`继续向上传播。
- 因此可以看到虽然捕获了`panic`但之后的代码并不会继续执行，捕获后会直接返回给该函数的调用者。
