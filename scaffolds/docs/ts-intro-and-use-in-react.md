---
title: Typescript基础及结合React实践(一)
date: 2018-12-29 16:30:24
tags: 
   - React
   - Typescript
categories: Front-End
---


# 第一部分 Typescript基础

## 一、typescript 安装

```js
npm i typescript -g
```

> 全局安装完成后，我们新建一个`hello.ts`的`ts`文件

```js
// hello.ts内容
let a = "poet"
```

> 接下来我们在命令行输入`tsc hello.ts`来编译这个`ts`文件，然后会在同级目录生成一个编译好了的`hello.js`文件

```js
// hello.js内容
var = "poet"
```

> 那么我们每次都要输`tsc hello.ts`命令来编译，这样很麻烦，能否让它自动编译？答案是可以的，使用`vscode`来开发，需要配置一下`vscode`就可以。

> 首先我们在命令行执行`tsc --init`来生成配置文件，然后我们在目录下看到生成了一个`tsconfig.json`文件

![](https://poetries1.gitee.io/img-repo/2019/10/545.png)

> 这个`json`文件里有很多选项

- `target`是选择编译到什么语法
- `module`则是模块类型
- `outDir`则是输出目录，可以指定这个参数到指定目录

> 更多细节 https://zhongsp.gitbooks.io/typescript-handbook/content/doc/handbook/tsconfig.json.html

> 接下来我们需要开启监控了，在`vscode`任务栏中

![](https://poetries1.gitee.io/img-repo/2019/10/546.png)

**Typescript在线编辑器**

> 建议使用在线编辑器练习 http://www.typescriptlang.org/play/index.html

## 二、数据类型

> `js`是弱类型语言，强弱类语言有什么区别呢？`typescript`最大的优点就是类型检查，可以帮你检查你定义的类型和赋值的类型。


### 2.1 布尔类型boolean

```js
// 在js中，定义isFlag为true，为布尔类型boolean
let isFlag = true;
// 但是我们也可以重新给它赋值为字符串
isFlag = "hello swr";

// 在ts中，定义isFlag为true，为布尔类型boolean
// 在变量名后加冒号和类型，如  :boolean
let isFlag:boolean = true
// 重新赋值到字符串类型会报错
isFlag = "hello swr" 

// 在java中，一般是这样定义，要写变量名也要写类型名
// int a = 10; 
// string name = "poetries"
```

### 2.2 数字类型number

```js
let age:number = 28;
age = 29;
```

### 2.3 字符串类型string

```js
let name:string = "poetries"
name = "iamswr"
```

> 以上`boolean`、`number`、`string`类型有个共性，就是可以通过`typeof`来获取到是什么类型，是基本数据类型

那么复杂的数据类型是怎么处理的呢？

### 2.4 数组 Array

```js
// 数组
// 这是一个字符串数组，只能往里面放字符串，写别的类型会报错
let persion:string[] = ['poetries', 'jing']
// 另一个写法 
let persions:Array<string> = ['poetries', 'jing']

// 如果数组里放对象呢
let persionObject:Array<object> = [{name:'poetries',age:22}]
let persionObjects:object[] = [{name:'poetries',age:22}]

// 在数组中放string、number、boolean、object
let arr:Array<number|object|string|boolean> = [22, 'test', true, {name:'poetries'}]

// 数组中放什么都可以
let arrAny:Array<any> = ['test',12,false]
```

### 2.5 元组类型tuple


- 什么是元组类型？其实元组是数组的一种。
- 有点类似解构赋值，但是又不完全是解构赋值，比如元组类型必须一一对应上
- 元组类型是一个不可变的数组，长度、类型是不可变的

 
```js
// 元组类型tuple
// 什么是元组类型？其实元组是数组的一种
let per :[string,number,object] = ['poetries',22,{love: 'coding'}]
```


### 2.6 枚举类型enum

> 什么是枚举？枚举有点类似一一列举，一个一个数出来。一般用于值是某几个固定的值

```js
// 枚举类型enum

enum sex {
    BOY='男孩',
    GIRL='女孩'
}
console.log(sex)
```

```js
// 转化为es5语法
// 我们顺便看看实现的原理

var sex;
(function (sex) {
// 首先这里是一个自执行函数
// 并且把sex定义为对象，传参进给自执行函数
// 然后给sex对象添加属性并且赋值
    sex["BOY"] = "\u7537\u5B69";
    sex["GIRL"] = "\u5973\u5B69";
})(sex || (sex = {}));
console.log(sex);
```

> 比如我们实际项目中，特别是商城类，订单会存在很多状态流转，那么非常适合用枚举

```js
enum orderStatus {
    WAIT_FOR_PAY = "待支付",
    UNDELIVERED = "完成支付，待发货",
    DELIVERED = "已发货",
    COMPLETED = "已确认收货"
}
```

> 到这里，我们会有一个疑虑，为什么我们不这样写呢？

```js
let orderStatus2 = {
    WAIT_FOR_PAY : "待支付",
    ...
}
```

> 如果我们直接写对象的键值对方式，是可以在外部修改这个值的，而我们通过`enum`则不能修改定义好的值了

### 2.7 任意类型 any

> `any`有好处也有坏处，特别是前端，很多时候写类型的时候，几乎分不清楚类型，任意去写，写起来很爽，但是对于后续的重构、迭代等是非常不友好的，会暴露出很多问题，某种程度来说，`any`类型就是放弃了类型检查了

比如我们有这样一个场景，就是需要获取某一个dom节点

```js
let btn = document.getElementById('btn');
btn.style.color = "blue";
```

> 此时我们发现在`ts`中会报错


![](https://poetries1.gitee.io/img-repo/2019/10/547.png)

- 因为我们取这个`dom`节点，有可能取到，也有可能没取到，当没取到的时候，相当于是`null`，是没有`style`这个属性的。
- 那么我们可以给它添加一个类型为`any`


```js
// 添加一个any类型，此时就不会报错了，但是也相当于放弃了类型检查了
let btn:any = document.getElementById('btn');
btn.style.color = "blue";
```

```js
// 可以赋值任何类型的值
// 跟以前我们var let声明的一模一样的
let person:any = "poetries"
person = 22
```

### 2.8 null undefined类型

```js
// (string | number | null | undefined) 相当于这几种类型
// 是 string 或 number 或 null 或 undefined

let str:(string | number | null | undefined)

str = 'poetries'
str = 28
str = null 
str = undefined
```

### 2.9 void类型

> `void`表示没有任何类型，一般是定义函数没有返回值

```js
// void 不能再函数里写return
// 怎么理解叫没有返回值呢？此时我们给函数return一个值
function say(name:string):void{
    console.log('hello:', name)
    // return "ok" 会报错
    return undefined;
    return //不会报错
}
say('poetries')

// 返回一个字符串类型
function say1(name:string):string {
    return 'ok'
}
```

### 2.10 never类型

> 这个用得很少，一般是用于抛出异常

```js
function error(message:string):never {
    throw new Error(message)
}
error('errorMsg')
```

### 2.11 我们要搞明白any、never、void

- `any`是任意的值
- `void`是不能有任何值
- `never`永远不会有返回值

> `any`比较好理解，就是任何值都可以

```js
let str:any = "hello poetries"
str = 28
str = true
```

> `void`不能有任何值(返回值)

```js
function say():void {
  
}
```

> `never`则不好理解，什么叫永远不会有返回值？

```js
// 除了上面举例的抛出异常以外，我们看一下这个例子
// 这个loop函数，一旦开始执行，就永远不会结束
// 可以看出在while中，是死循环，永远都不会有返回值，包括undefined

function loop():never {
    while(true){
        console.log("陷入死循环啦")
    }
}

loop()

// 包括比如JSON.parse也是使用这种 never | any
function parse(str:string):(never | any){
    return JSON.parse(str)
}
// 首先在正常情况下，我们传一个JSON格式的字符串，是可以正常得到一个JSON对象的
let json = parse('{"name":"poetries"}')
// 但是有时候，传进去的不一定是JSON格式的字符串，那么就会抛出异常
// 此时就需要never了
let json = parse("iamswr")
```

> 也就是说，当一个函数执行的时候，被抛出异常打断了，导致没有返回值或者该函数是一个死循环，永远没有返回值，这样叫做永远不会有返回值。

实际开发中，是`never`和联合类型来一起用，比如

```js
function say():(never | string) {
  return "ok"
}
```

## 三、函数

### 3.1 函数定义 

```js
function sayHello(name:string):void {
    
}
```

### 3.2 函数参数处理

```js
// 函数是这样定义的
// 形参和实参一一对应，完全一样
function sayHello(name:string,age:number):void {
    console.log('hello', name, age)
}
sayHello('poetries',22)

// 形参和实参要完全一样，如想不一样，则需要配置可选参数，可选参数放在后面
// 可选参数，用 ？ 处理，只能放在后面
function sayHelloToYou(name:string,age?:number):void {
    console.log('hello', name, age)
}
sayHelloToYou('poetries')

// 那么如何设置默认参数呢？

function ajax(url:string,method:string = 'GET') {
    console.log(url, method)
}

// 那么如何设置剩余参数呢？可以利用扩展运算符

function sum(...args:Array<number>):number {
    return eval(args.join("+"))
}
let total:number = sum(1,2,3,4,5)
console.log(total)
```

### 3.3 函数重载

```js
// 那么如何实现函数重载呢？函数重载是java中非常有名的，在java中函数的重载，是指两个或者两个以上的同名函数，参数的个数和类型不一样

// 比如我们现在有两个同名函数
// function eating(name:string) {
    
// }
// function eating(name:string,age:number) {
    
// }
// 那么我想达到一个效果
// 当我传参数name时，执行name:string这个函数
// 当我传参数name和age时，执行name:string,age:number这个函数
// 此时该怎么办？

// 接下来看一下typescript中的函数重载

// 首先声明两个函数名一样的函数
function eating(name: string):void;
function eating(name: number):void;

function eating(name:any): void {
    console.log(name)
}

eating("hello poetries")
eating(22)

// 在typescript中主要体现是同一个同名函数提供多个函数类型定义，函数实际上就只有一个，就是拥有函数体那个，如果想根据传入值类型的不一样执行不同逻辑，则需要在这个函数里面进行一个类型判断。

// 那么这个函数重载有什么作用呢？其实在ts中，函数重载只是用来限制参数的个数和类型，用来检查类型的，而且重载不能拆开几个函数，这一点和java的处理是不一样的，需要注意。
```

## 四、类

### 4.1 定义一个类

> 如何定义一个类？

```js
// ts 写法
// 跟es6非常像 没有太大区别
class Persion {
    // 这里声明的变量 是实例上的属性
    name: string;
    age:number;

    constructor(name: string, age: number){
        // this.name和this.age 必须先在前面声明好类型
        // name: string
        // age: number
        this.name = name;
        this.age = age;
    }
    // 原型方法
    say():string {
        return 'hello poetries'
    }
}

let p = new Persion('poetries', 22)
```

```js
// 那么转为es5呢？

var Persion = /** @class */ (function () {
    function Persion(name, age) {
        // this.name和this.age 必须先在前面声明好类型
        // name: string
        // age: number
        this.name = name;
        this.age = age;
    }
    // 原型方法
    Persion.prototype.say = function () {
        return 'hello poetries';
    };
    return Persion;
}());
var p = new Persion('poetries', 22);
```

### 4.2 类的继承

```js

// 和es6也是差不多
class Parent {
    name: string;
    age: number;
    constructor(name:string, age: number){
        this.name = name;
        this.age = age;
    }
    say():string{
        return 'hello poetries'
    }
}

class Child extends Parent {
    childName: string;
    constructor(name: string,age:number,childName:string) {
        super(name,age)
        this.childName = childName
    }
    childSay():string {
        return this.childName
    }
}
let child = new Child('poetries', 22, '静观流叶')
console.log(child)
```

### 4.3 类的修饰符

- `public`公开的，可以供自己、子类以及其它类访问
- `protected`受保护的，可以供自己、子类访问，但是其他就访问不了
- `private`私有的，只有自己访问，而子类、其他都访问不了

```js

class Parents {
    public name:string;
    protected age:number;
    private money:number;

   // 简写
   // constructor(public name:string,protected age:number,private money:number)

   constructor(name: string, age:number,money:number) {
       this.name = name;
       this.age = age;
       this.money = money;
   }
   getName():string {
       return this.name
   }
   getAge():number{
       return this.age
   }
   getMoney():number{
       return this.money
   }
}
let pare = new Parents('poetries', 22, 3000)
console.log(pare.name)
// console.log(pare.age)  报错
// console.log(pare.money) 报错

```

### 4.4 静态属性、静态方法

跟`es6`差不多

```js
class Person2 {
    // 类的静态属性
    static name1 = 'poetries'

    // 类的静态方法
    static say() {
        console.log('hello poetries')
    }
}
let per2 = new Person2()
Person2.say() // hello poetries
// per2.say() 报错
```

### 4.5 抽象类

- 抽象类和方法，有点类似抽取共性出来，但是又不是具体化，比如说，世界上的动物都需要吃东西，那么会把吃东西这个行为，抽象出来
- 如果子类继承的是一个抽象类，子类必须实现父类里的抽象方法，不然的话不能实例化，会报错

```js
/ 关键字 abstract抽象
// 定义抽象类

abstract class Animal {
    // 实际上是使用了public修饰符
    // 如果添加private修饰符会报错
    abstract eat():void;
}

// 需要注意的是这个Animal是不能实例化的
// let animal = new Animal() // 报错

// // 抽象类的抽象方法，意思就是，需要在继承这个抽象类的子类中
// 实现这个抽象方法，不然会报错
// 报错，因为在子类中没有实现eat抽象方法
// class Person4 extends Animal{
//     test(){
//         console.log("吃米饭")
//     }
// }

// Dog类继承Animal类后并且实现了抽象方法eat，所以不会报错
class Dog extends Animal{
    eat(){
        console.log("吃骨头")
    }
}
```


## 五、接口

> 这里的接口，主要是一种规范，规范某些类必须遵守规范，和抽象类有点类似，但是不局限于类，还有属性、函数等

### 5.1 接口规范对象

```js

//假设我们需要获取用户信息
// 我们通过这样的方式 规范必须传name和age的值
function getUserInfo(user:{name:string,age:number}) {
    console.log(user.name,user.age)
}
getUserInfo({name: 'poetries', age: 22})

// 这样看挺完美的， 那么问题就出现了，如果我另外还有一个方法，也是需要这个规范呢？

function getUserInfo1(user:{name:string,age:number}){
    console.log(`${user.name} ${user.age}`)
}
function getInfo(user:{name:string,age:number}){
    console.log(`${user.name} ${user.age}`)
}
getUserInfo1({name:"poetries",age:22})
getInfo({name:"poetries",age:22})

// 可以看出，函数getUserInfo和getInfo都遵循同一个规范，那么我们有办法对这个规范复用吗？

// 首先把需要复用的规范，写到接口 关键字interface
interface infoInterface {
    name: string,
    age: number;
}
// 然后把这个接口 替换到我们需要复用的地方
function getUserInfo2(user:infoInterface) {
    console.log(user.name,user.age)
}
function getInfo2(user:infoInterface) {
    console.log(user.name,user.age)
}

getUserInfo2({name:"poetries",age:22})
getInfo2({name:"poetries",age:22})

// 那么有些参数可传可不传，该怎么处理呢？

interface infoInterface2{
    name: string;
    age: number;
    city?:string;
}
function getUserInfo3(user:infoInterface2){
    console.log(`${user.name} ${user.age} ${user.city}`)
}
function getInfo3(user:infoInterface){
    console.log(`${user.name} ${user.age}`)
}
getUserInfo3({name:"poetries",age:22,city:"深圳"})
getInfo3({name:"iamswr",age:22})
```


### 5.2 接口规范函数

```js
// 对一个函数的参数和返回值进行规范
interface mytotal {
    // 左侧是函数的参数，右侧是函数的返回类型
    (a:number,b:number):number;
}

let totalSum:mytotal = function(a:number,b:number):number {
    return a + b
}

console.log(totalSum(10, 20))
```

### 5.3 接口规范数组


```js
interface userInterface {
    // index为数组索引 类型是number
    // 右边是数组里为字符串的数组成员
    [index: number]: string;
}
let arrTest: userInterface = ['poetries', '静观流叶']

console.log(arrTest)
```

### 5.4 接口规范类

> 这个比较重要，因为写`react`的时候会经常使用到类

```js
// 首先实现一个接口
interface Animal2 {
    // 这个类必须有name
    name:string;

    // 这个类必须有eat方法
    eat(any:string):void;
}

// 关键字implements实现
// 因为接口是抽象的，需要通过子类是实现它

class Person6 implements Animal2 {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
    eat(any:string):void {
        console.log(`吃`+any)
    }
}

// 如果想遵循多个接口

interface Animal3 {
    name: string;
    eat(any: string):void;
}
// 新增一个接口
interface Animal4 {
    sleep():void;
}
// 可以在implements后面通过逗号添加和java一样
class Person7 implements Animal3,Animal4 {
    name: string;
    constructor(name:string){
        this.name = name;
    }
    eat(any:string) {
        console.log(`吃`+any)
    }
    sleep() {
        console.log('睡觉')
    }
}
```

### 5.5 接口继承接口

```js
interface Animal5{
    name:string;
    eat(any:string):void;
}
// 像类一样 通过extends继承
interface Animal6 extends Animal5 {
    sleep():void;
}
// 因为Animal6类继承了Animal5
// 所以这里遵循Animal6就相当于把Animal5也继承了

class Person8 implements Animal2 {
    name: string;
    constructor(name:string) {
        this.name = name;
    }
    eat(any:string):void{
        console.log(`吃${any}`)
    }
    sleep(){
        console.log('睡觉')
    }
}
```

## 六、泛型

### 6.1 函数的泛型

> 泛型可以支持不特定的数据类型，什么叫不特定呢？比如我们有一个方法，里面接收参数，但是参数类型我们是不知道，但是这个类型在方法里面很多地方会用到，参数和返回值要保持一致性

```js
// 假设我们有一个需求，我们不知道函数接收什么类型的参数，也不知道返回值的类型
// 而我们又需要传进去的参数类型和返回值的类型保持一致，那么我们就需要用到泛型

// <T>的意思是泛型，即generic type
// 可以看出value的类型也为T，返回值的类型也为T
function deal<T>(value:T):T{
    return value
}
// 下面的<string>、<number>实际上用的时候再传给上面的<T>
console.log(deal<string>("poetries"))
console.log(deal<number>(22))
```


> 实际上，泛型用得还是比较少，主要是看类的泛型是如何使用的

### 6.2 类的泛型

```js
class MyMath<T> {
    // 定义一个私有属性

    private arr: T[] = []

    // 规定传参类型
    add(value: T) {
        this.arr.push(value)
    }
}
// 这里规定了类型为number
// 相当于把T替换为number

let mymath = new MyMath<number>()
mymath.add(1)
mymath.add(2)
mymath.add(3)
```

**有了接口为什么还需要抽象类？**

> 接口里面只能放定义，抽象类里面可以放普通类、普通类的方法、定义抽象的东西。

# 第二部分 结合React实践

## 一、环境配置

### 1.1 初始化项目

- 生成一个目录`ts_react_demo`，输入`npm init -y`初始化项目
- 然后在项目里我们需要一个`.gitignore`来忽略指定目录不传到`git`上
- 进入`.gitignore`输入我们需要忽略的目录，一般是`node_modules`

```
// .gitignore
node_modules
```

### 1.2 安装依赖

> 接下来我们准备下载相应的依赖包，这里需要了解一个概念，就是类型定义文件

#### 1.2.1 类型定义文件

> 因为目前主流的第三方库都是以`javascript`编写的，如果用`typescript`开发，会导致在编译的时候会出现很多找不到类型的提示，那么如果让这些库也能在`ts`中使用呢？

- 类型定义文件(`*.d.ts`)就是能够让编辑器或者插件来检测到第三方库中`js`的静态类型，这个文件是以`.d.ts`结尾- 比如说`react`的类型定义文件：https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react
- 在`typescript2.0`中，是使用`@type`来进行类型定义，当我们使用`@type`进行类型定义，`typescript`会默认查看`./node_modules/@types`文件夹，可以通过这样来安装这个库的定义库`npm install @types/react --save`

#### 1.2.2 相关依赖包

**React相关**

```
- react // react的核心文件
- @types/react // 声明文件
- react-dom // react dom的操作包
- @types/react-dom 
- react-router-dom // react路由包
- @types/react-router-dom
- react-redux
- @types/react-redux
- redux-thunk  // 中间件
- @types/redux-logger
- redux-logger // 中间件
- connected-react-router
```

```bash
## 执行安装依赖包

npm i react react-dom @types/react @types/react-dom react-router-dom @types/react-router-dom react-redux @types/react-redux redux-thunk redux-logger @types/redux-logger connected-react-router -S
```

**webpack相关**

```
- webpack // webpack的核心包
- webpack-cli // webapck的工具包
- webpack-dev-server // webpack的开发服务
- html-webpack-plugin // webpack的插件，可以生成index.html文件
```

```
npm i webpack webpack-cli webpack-dev-server html-webpack-plugin -D
```

> 这里的`-D`相当于`--save-dev`的缩写，下载开发环境的依赖包

**typescript相关**

```
- typescript // ts的核心包
- ts-loader // 把ts编译成指定语法比如es5 es6等的工具，有了它，基本不需要babel了，因为它会把我们的代码编译成es5
- source-map-loader // 用于开发环境中调试ts代码
```

```
npm i typescript ts-loader source-map-loader -D
```

- 从上面可以看出，基本都是模块和声明文件都是一对对出现的，有一些不是一对对出现，就是因为都集成到一起去了
- 声明文件可以在`node_modules/@types/xx/xx`中找到

### 1.3 Typescript config配置

> 首先我们要生成一个`tsconfig.json`来告诉`ts-loader`怎样去编译这个`ts`代码

```
tsc --init
```

> 会在项目中生成了一个`tsconfig.json`文件，接下来进入这个文件，来修改相关配置

```js
// tsconfig.json
{
  // 编译选项
  "compilerOptions": {
    "target": "es5", // 编译成es5语法
    "module": "commonjs", // 模块的类型
    "outDir": "./dist", // 编译后的文件目录
    "sourceMap": true, // 生成sourceMap方便我们在开发过程中调试
    "noImplicitAny": true, // 每个变量都要标明类型
    "jsx": "react", // jsx的版本,使用这个就不需要额外使用babel了，会编译成React.createElement
  },
  // 为了加快整个编译过程，我们指定相应的路径
  "include": [
    "./src/**/*"
  ]
}
```

### 1.4 webpack配置

> 在`./src/`下创建一个`index.html`文件，并且添加`<div id='app'></div>`标签

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Document</title>
</head>
<body>
  <div id='app'></div>
</body>
</html>
```

> 在`./`下创建一个`webpack`配置文件`webpack.config.js`

```js
// ./webpack.config.js
// 引入webpack
const webpack = require("webpack");
// 引入webpack插件 生成index.html文件
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path")

// 把模块导出
module.exports = {
  // 以前是jsx，因为我们用typescript写，所以这里后缀是tsx
  entry:"./src/index.tsx",
  // 指定模式为开发模式
  mode:"development",
  // 输出配置
  output:{
    // 输出目录为当前目录下的dist目录
    path:path.resolve(__dirname,'dist'),
    // 输出文件名
    filename:"index.js"
  },
  // 为了方便调试，还要配置一下调试工具
  devtool:"source-map",
  // 解析路径，查找模块的时候使用
  resolve:{
    // 一般写模块不会写后缀，在这里配置好相应的后缀，那么当我们不写后缀时，会按照这个后缀优先查找
    extensions:[".ts",'.tsx','.js','.json']
  },
  // 解析处理模块的转化
  module:{
    // 遵循的规则
    rules:[
      {
        // 如果这个模块是.ts或者.tsx，则会使用ts-loader把代码转成es5
        test:/\.tsx?$/,
        loader:"ts-loader"
      },
      {
        // 使用sourcemap调试
        // enforce:pre表示这个loader要在别的loader执行前执行
        enforce:"pre",
        test:/\.js$/,
        loader:"source-map-loader"
      }
    ]
  },
  // 插件的配置
  plugins:[
    // 这个插件是生成index.html
    new HtmlWebpackPlugin({
      // 以哪个文件为模板，模板路径
      template:"./src/index.html",
      // 编译后的文件名
      filename:"index.html"
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
  // 开发环境服务配置
  devServer:{
    // 启动热更新,当模块、组件有变化，不会刷新整个页面，而是局部刷新
    // 需要和插件webpack.HotModuleReplacementPlugin配合使用
    hot:true, 
    // 静态资源目录
    contentBase:path.resolve(__dirname,'dist')
  }
}
```

> 那么我们怎么运行这个`webpack.config.js`呢？这就需要我们在`package.json`配置一下脚本

- 在`package.json`里的`script`，添加`build`和`dev`的配置

```json
{
  "name": "ts_react_demo",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "build": "webpack",
    "dev":"webpack-dev-server"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@types/react": "^16.7.13",
    "@types/react-dom": "^16.0.11",
    "@types/react-redux": "^6.0.10",
    "@types/react-router-dom": "^4.3.1",
    "connected-react-router": "^5.0.1",
    "react": "^16.6.3",
    "react-dom": "^16.6.3",
    "react-redux": "^6.0.0",
    "react-router-dom": "^4.3.1",
    "redux-logger": "^3.0.6",
    "redux-thunk": "^2.3.0"
  },
  "devDependencies": {
    "html-webpack-plugin": "^3.2.0",
    "source-map-loader": "^0.2.4",
    "ts-loader": "^5.3.1",
    "typescript": "^3.2.1",
    "webpack": "^4.27.1",
    "webpack-cli": "^3.1.2",
    "webpack-dev-server": "^3.1.10"
  }
}
```

- 因为入口文件是`index.tsx`，那么我们在`./src/`下创建一个`index.tsx`，并且在里面写入一段代码，看看`webpack`是否能够正常编译
- 因为我们在`webpack.config.js`中`entry`设置的入口文件是`index.tsx`，并且在`module`中的`rules`会识别到`.tsx`格式的文件，然后执行相应的`ts-loader`


```
// ./src/index.tsx
console.log("hello poetries")
```

- 接下来我们`npm run build`一下，看看能不能正常编译
- 编译成功，我们可以看看`./dist/`下生成了`index.html index.js index.js.map`三个文件
- 那么我们在开发过程中，不会每次都`npm run build`来看修改的结果，那么我们平时开发过程中可以使用`npm run dev`。这样就启动成功了一个`http://localhost:8080/`的服务了。
- 接下来我们看看热更新是否配置正常，在`./src/index.tsx`中新增一个`console.log('hello poetries')`，我们发现浏览器的控制台会自动打印出这一个输出，说明配置正常了

## 二、React组件

### 2.1 写一个计数器组件

> 首先我们在`./src/`下创建一个文件夹`components`，然后在`./src/components/`下创建文件`Counter.tsx`

```js
// ./src/components/Counter.tsx
// import React from "react"; // 之前的写法
// 在ts中引入的写法
import * as React from "react";

export default class CounterComponent extends React.Component{
  // 状态state
  state = {
    number:0
  }
  render(){
    return(
      <div>
        <p>{this.state.number}</p>
        <button onClick={()=>this.setState({number:this.state.number + 1})}>+</button>
      </div>
    )
  }
}
```

> 我们发现，其实除了引入`import * as React from "react"`以外，其余的和之前的写法没什么不同。

- 接下来我们到`./src/index.tsx`中把这个组件导进来


```js
// ./src/index.tsx
import * as React from "react";
import * as ReactDom from "react-dom";
import CounterComponent from "./components/Counter";
// 把我们的CounterComponent组件渲染到id为app的标签内
ReactDom.render(<CounterComponent />,document.getElementById("app"))
```

> 这样我们就把这个组件引进来了，接下来我们看下是否能够成功跑起来

![image.png](https://upload-images.jianshu.io/upload_images/1480597-86ad083c5149a72e.png)


> 到目前为止，感觉用`ts`写`react`还是跟以前差不多，没什么区别，要记住，`ts`最大的特点就是类型检查，可以检验属性的状态类型

假设我们需要在`./src/index.tsx`中给`<CounterComponent />`传一个属性`name`，而`CounterComponent`组件需要对这个传入的`name`进行类型校验，比如说只允许传字符串

- `./src/index.tsx`中修改一下

```
ReactDom.render(<CounterComponent name="poetries" />,document.getElementById("app"))
```

> 然后需要在`./src/components/Counter.tsx`中写一个接口来对这个`name`进行类型校验

```js
// import React from "react"; // 之前的写法
// 在ts中引入的写法
import * as React from "react";

// 写一个接口对name进行类型校验
// 如果我们不写校验的话，在外部传name进来会报错的
interface IProps{
    name:string,
}

// 我们还可以用接口约束state的状态
interface IState{
    number: number
}

// 把接口约束的规则写在这里
// 如果传入的name不符合类型会报错
// 如果state的number属性不符合类型也会报错
export default class CounterComponent extends React.Component<IProps,IState>{
  // 状态state
  state = {
    number:0
  }
  render(){
    return(
        <div>
        <p>{this.state.number}</p>
        <p>{this.props.name}</p>
        <button onClick={()=>this.setState({number:this.state.number + 1})}>+</button>
      </div>
    )
  }
}
```

### 2.2 结合Redux使用

#### 2.2.1 基础使用

- 上面`state`中的`number`就不放在组件里了，我们放到`redux`中，接下来我们使用`redux`
- 首先在`./src/`创建`store`目录，然后在`./src/store/`创建一个文件`index.tsx`

```js
// .src/store/index.tsx
import { createStore } from "redux";

// 引入reducers
import reducers from "./reducers";

// 接着创建仓库
let store = createStore(reducers);

// 导出store仓库
export default store;
```

- 然后我们需要创建一个`reducers`，在`./src/store/`创建一个目录`reducers`，该目录下再创建一个文件`index.tsx`。
- 但是我们还需要对`reducers`中的函数参数进行类型校验，而且这个类型校验很多地方需要复用，那么我们需要把这个类型校验单独抽离出一个文件。
- 那么我们需要在`./src/`下创建一个`types`目录，该目录下创建一个文件`index.tsx`

```js
// ./src/types/index.tsx
// 导出一个接口
export interface Store{
  // 我们需要约束的属性和类型
  number:number
}
```

> 回到`./src/store/reducers/index.tsx`

```js
// 导入类型校验的接口
// 用来约束state的
import { Store } from "../../types/index"
// 我们需要给number赋予默认值
let initState:Store = { number:0 }
// 把接口写在state:Store
export default function (state:Store=initState,action) {
  // 拿到老的状态state和新的状态action
  // action是一个动作行为，而这个动作行为，在计数器中是具备 加 或 减 两个功能
}
```

- 上面这段代码暂时先这样，因为需要用到`action`，我们现在去配置一下`action`相关的，首先我们在`./src/store`下创建一个`actions`目录，并且在该目录下创建文件`counter.tsx`
- 因为配置`./src/store/actions/counter.tsx`会用到动作类型，而这个动作类型是属于常量，为了更加规范我们的代码，我们在`./src/store/`下创建一个`action-types.tsx`，里面写相应常量

```js
// ./src/store/action-types.tsx
export const ADD = "ADD";
export const SUBTRACT = "SUBTRACT";
```

> 回到`./src/store/actions/counter.tsx`

```js
// ./src/store/actions/counter.tsx
import * as types from "../action-types";
export default {
  add(){
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.ADD}
  },
  subtract(){
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.SUBTRACT}
  }
}
```

> 我们可以想一下，上面`return { type:types.ADD }`实际上是返回一个`action`对象，将来使用的时候，是会传到`./src/store/reducers/index.tsx`的`action`中，那么我们怎么定义这个`action`的结构呢？

```js
// ./src/store/actions/counter.tsx
import * as types from "../action-types";

// 定义两个接口，分别约束add和subtract的type类型
export interface Add{
  type:typeof types.ADD
}
export interface Subtract{
  type:typeof types.SUBTRACT
}

// 再导出一个type
// type是用来给类型起别名的
// 这个actions里是一个对象，会有很多函数，每个函数都会返回一个action
// 而 ./store/reducers/index.tsx中的action会是下面某一个函数的返回值

export type Action = Add | Subtract

// 把上面定义好的接口作用于下面
// 约束返回值的类型
export default {
  add():Add{
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.ADD}
  },
  subtract():Subtract{
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.SUBTRACT}
  }
}
```

> 接着我们回到`./store/reducers/index.tsx`

经过上面一系列的配置，我们可以给`action`使用相应的接口约束了并且根据不同的`action`动作行为来进行不同的处理

```js
// ./store/reducers/index.tsx
// 导入类型校验的接口
// 用来约束state的
import { Store } from "../../types/index"

// 导入约束action的接口
import { Action } from "../actions/counter"

// 引入action动作行为的常量
import * as types from "../action-types"

// 我们需要给number赋予默认值
let initState:Store = { number:0 }

// 把接口写在state:Store
export default function (state:Store=initState,action:Action) {
  // 拿到老的状态state和新的状态action
  // action是一个动作行为，而这个动作行为，在计数器中是具备 加 或 减 两个功能
  // 判断action的行为类型
  switch (action.type) {
    case types.ADD:
        // 当action动作行为是ADD的时候，给number加1
        return { number:state.number + 1 }
      break;
    case types.SUBTRACT:
        // 当action动作行为是SUBTRACT的时候，给number减1
        return { number:state.number - 1 }
      break;
    default:
        // 当没有匹配到则返回原本的state
        return state
      break;
  }
}
```

> 接下来，我们怎么样把组件和仓库建立起关系呢

首先进入`./src/index.tsx`

```js
// ./src/index.tsx
import * as React from "react";
import * as ReactDom from "react-dom";

// 引入redux这个库的Provider组件
import { Provider } from "react-redux";

// 引入仓库
import store from './store'

import CounterComponent from "./components/Counter";

// 用Provider包裹CounterComponent组件
// 并且把store传给Provider
// 这样Provider可以向它的子组件提供store
ReactDom.render((
  <Provider store={store}>
    <CounterComponent name="poetries"/>
  </Provider>
),document.getElementById("app"))
```

> 我们到组件内部建立连接，`./src/components/Counter.tsx`

```js
// import React from "react"; // 之前的写法
// 在ts中引入的写法
import * as React from "react";

// 引入connect，让组件和仓库建立连接
import { connect } from "react-redux";

// 引入actions，用于传给connect
import actions from "../store/actions/counter";

// 引入接口约束
import { Store } from "../types";

// 接口约束
interface IProps{
  number:number,

  name:string, //如果我们不写校验的话，在外部传name进来会报错的

  // add是一个函数
  add:any,

  // subtract是一个函数
  subtract:any
}

// 我们还可以用接口约束state的状态
interface IState{
    number: number
}

// 把接口约束的规则写在这里
// 如果传入的name不符合类型会报错
// 如果state的number属性不符合类型也会报错
class CounterComponent extends React.Component<IProps,IState>{
  // 状态state
  state = {
    number:0
  }
  render(){
    // 利用解构赋值取出
    // 这里比如和IProps保持一致，不对应则会报错，因为接口约束了必须这样
    let { number,add,subtract } = this.props

    return(
        <div>
            <h1>{this.props.name}</h1>
            <button onClick={add}>+</button><br />
            <button onClick={subtract}>-</button>  
            <p>{number}</p>
      </div>
    )
  }
}

// 这个connect需要执行两次，第二次需要我们把这个组件CounterComponent传进去
// connect第一次执行，需要两个参数，

// 需要传给connect的函数
let mapStateToProps = function (state:Store) {
    return state
}
  
export default connect(
    mapStateToProps,
    actions
)(CounterComponent);
```

这时候看到成功执行了

![image.png](https://upload-images.jianshu.io/upload_images/1480597-32fc82d43dadb063.png)

- 其实搞来搞去，跟原来的写法差不多，主要就是`ts`会进行类型检查。
- 如果对`number`进行异步修改，该怎么处理？这就需要我们用到`redux-thunk`

> 接着我们回到`./src/store/index.tsx`

```js
// 需要使用到thunk，所以引入中间件applyMiddleware
import { createStore, applyMiddleware } from "redux";

// 引入reducers
import reducers from "./reducers";

// 引入redux-thunk，处理异步
// 现在主流处理异步的是saga和thunk
import thunk from "redux-thunk";

// 引入日志
import logger from "redux-logger";

// 接着创建仓库和中间件
let store = createStore(reducers, applyMiddleware(thunk,logger));

// 导出store仓库
export default store;
```

> 接着我们回来`./src/store/actions`，新增一个异步的动作行为

```js
// ./src/store/actions/counter.tsx
import * as types from "../action-types";

// 定义两个接口，分别约束add和subtract的type类型
export interface Add{
  type:typeof types.ADD
}

export interface Subtract{
  type:typeof types.SUBTRACT
}
// 再导出一个type
// type是用来给类型起别名的
// 这个actions里是一个对象，会有很多函数，每个函数都会返回一个action
// 而 ./store/reducers/index.tsx中的action会是下面某一个函数的返回值

export type Action = Add | Subtract

// 把上面定义好的接口作用于下面
// 约束返回值的类型
export default {
  add():Add{
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.ADD}
  },
  subtract():Subtract{
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.SUBTRACT}
  },
  // 一秒后才执行这个行为
  // ++
  addAsync():any{
    return function (dispatch:any,getState:any) {
      setTimeout(function(){
        // 当1秒过后，会执行dispatch，派发出去，然后改变仓库的状态
        dispatch({type:types.ADD})
      }, 1000);
    }
  }
}
```

> 到`./src/components/Counter.tsx`组件内，使用这个异步

#### 2.2.2 合并reducers

> 假如我们的项目里面，有两个计数器，而且它俩是完全没有关系的，状态也是完全独立的，这个时候就需要用到合并`reducers`了

- 首先我们新增`action`的动作行为类型，在`./src/store/action-types.tsx`
- 然后修改接口文件，`./src/types/index.tsx`
- 然后把`./src/store/actions/counter.tsx`文件拷贝在当前目录并且修改名称为`counter2.tsx`
- 然后把`./src/store/reduces/index.tsx`拷贝并且改名为`counter.tsx`和`counter2.tsx`

> 我们多个`reducer`是通过`combineReducers`方法，进行合并的，因为我们一个项目当中肯定是存在非常多个`reducer`，所以统一在这里处理。

```js
// ./src/store/reducers/index.tsc

// 引入合并方法
import { combineReducers } from "redux";

// 引入需要合并的reducer
import counter from "./counter";

// 引入需要合并的reducer
import counter2 from "./counter2";

// 合并
let reducers = combineReducers({
  counter,
  counter2,
});
export default reducers;
```

> 最后修改组件，进入`./src/components/`,其中

到目前为止，我们完成了`reducers`的合并了，那么我们看看效果如何，首先我们给`./src/index.tsc`添加`Counter2`组件，这样的目的是与`Counter`组件完全独立，互不影响，但是又能够最终合并到`readucers`

![](https://poetries1.gitee.io/img-repo/2019/10/548.png)

### 2.3 路由

#### 2.3.1 基本用法

> 首先进入`./src/index.tsx`导入我们的路由所需要的依赖包

```js
// ./src/index.tsx
import * as React from "react";
import * as ReactDom from "react-dom";

// 引入redux这个库的Provider组件
import { Provider } from "react-redux";

// 引入路由
// 路由的容器:HashRouter as Router
// 路由的规格:Route
// Link组件
import { BrowserRouter as Router,Route,Link } from "react-router-dom"

// 引入仓库
import store from './store'

import CounterComponent from "./components/Counter";
import CounterComponent2 from "./components/Counter2";
import Counter from "./components/Counter";

function Home() {
    return <div>home</div>
}

// 用Provider包裹CounterComponent组件
// 并且把store传给Provider
// 这样Provider可以向它的子组件提供store
ReactDom.render((
  <Provider store={store}>
    {/* 路由组件 */}
    <Router>
      {/*  放两个路由规则需要在外层套个React.Fragment */}
        <React.Fragment>
            {/* 增加导航 */}
            <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/counter">Counter</Link></li>
            <li><Link to="/counter2">Counter2</Link></li>
            </ul>
            {/* 当路径为 / 时是home组件 */}
            {/* 为了避免home组件一直渲染，我们可以添加属性exact */}
            <Route exact path="/" component={Home}/>
            <Route path="/counter" component={CounterComponent}/>
            <Route path="/counter2" component={CounterComponent2} />
        </React.Fragment>
        </Router>
  </Provider>
),document.getElementById("app"))
```

![](https://poetries1.gitee.io/img-repo/2019/10/549.png)

> 但是有个很大的问题，就是我们直接访问`http://localhost:8080/counter`会找不到路由

- 因为我们的是单页面应用，不管路由怎么变更，实际上都是访问`index.html`这个文件，所以当我们访问根路径的时候，能够正常访问，因为`index.html`文件就放在这个目录下，但是当我们通过非根路径的路由访问，则出错了，是因为我们在相应的路径没有这个文件，所以出错了
- 从这一点也可以衍生出一个实战经验，我们平时项目部署上线的时候，会出现这个问题，一般我们都是用`nginx`来把访问的路径都是指向`index.html`文件，这样就能够正常访问了。
- 那么针对目前我们这个情况，我们可以通过修改`webpack`配置，让路由不管怎么访问，都是指向我们制定的`index.html`文件。

> 进入`./webpack.config.js`，在`devServer`的配置对象下新增一些配置

```js
// ./webpack.config.js
...

  // 开发环境服务配置
  devServer:{
    // 启动热更新,当模块、组件有变化，不会刷新整个页面，而是局部刷新
    // 需要和插件webpack.HotModuleReplacementPlugin配合使用
    hot:true, 
    // 静态资源目录
    contentBase:path.resolve(__dirname,'dist'),
    // 不管访问什么路径，都重定向到index.html
    historyApiFallback:{
      index:"./index.html"
    }
  }

...

```

> 修改`webpack`配置需要重启服务，然后重启服务，看看浏览器能否正常访问`http://localhost:8080/counter`

#### 2.3.2 同步路由到redux

> 路由的路径，如何同步到仓库当中。以前是用一个叫`react-router-redux`的库，把路由和`redux`结合到一起的，`react-router-redux`挺好用的，但是这个库不再维护了，被废弃了，所以现在推荐使用`connected-react-router`这个库，可以把路由状态映射到仓库当中

> 首先我们在`./src`下创建文件`history.tsx`

假设我有一个需求，就是我不通过`Link`跳转页面，而是通过编程式导航，触发一个动作，然后这个动作会派发出去，而且把路由信息放到`redux`中，供我以后查看。

> 我们进入`./src/store/reducers/index.tsx`

```js
// 引入合并方法
import { combineReducers } from "redux";

// 引入需要合并的reducer
import counter from "./counter";

// 引入需要合并的reducer
import counter2 from "./counter2";

// 引入connectRouter
import { connectRouter } from "connected-react-router";
import history from "../../history";

// 合并
let reducers = combineReducers({
  counter,
  counter2,
  // 把history传到connectRouter函数中
  router: connectRouter(history)
});
export default reducers;
```

> 我们进入`./src/store/index.tsx`来添加中间件

```js
// 需要使用到thunk，所以引入中间件applyMiddleware
import { createStore, applyMiddleware } from "redux";

// 引入reducers
import reducers from "./reducers";

// 引入redux-thunk，处理异步
// 现在主流处理异步的是saga和thunk
import thunk from "redux-thunk";

// 引入日志
import logger from "redux-logger";

// 引入中间件
import { routerMiddleware } from "connected-react-router";
import history from "../history";

// 接着创建仓库和中间件
let store = createStore(reducers, applyMiddleware(routerMiddleware(history),thunk,logger));

// 导出store仓库
export default store;
```

> 我们进入`./src/store/actions/counter.tsx`加个`goto`方法用来跳转

```js
// ./src/store/actions/counter.tsx
import * as types from "../action-types";

// 引入push方法
import { push } from "connected-react-router";

// 定义两个接口，分别约束add和subtract的type类型
export interface Add{
  type:typeof types.ADD
}

export interface Subtract{
  type:typeof types.SUBTRACT
}
// 再导出一个type
// type是用来给类型起别名的
// 这个actions里是一个对象，会有很多函数，每个函数都会返回一个action
// 而 ./store/reducers/index.tsx中的action会是下面某一个函数的返回值

export type Action = Add | Subtract

// 把上面定义好的接口作用于下面
// 约束返回值的类型
export default {
  add():Add{
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.ADD}
  },
  subtract():Subtract{
    // 需要返回一个action对象
    // type为动作的类型
    return { type: types.SUBTRACT}
  },
  // 一秒后才执行这个行为
  addAsync():any{
    return function (dispatch:any,getState:any) {
      setTimeout(function(){
        // 当1秒过后，会执行dispatch，派发出去，然后改变仓库的状态
        dispatch({type:types.ADD})
      }, 1000);
    }
  },
  goto(path:string){
    // 派发一个动作
    // 这个push是connected-react-router里的一个方法
    // 返回一个跳转路径的action
    return push(path)
  }
}
```

> 我们进入`./src/components/Counter.tsx`中加个按钮，当我点击按钮的时候，会向仓库派发`action`，仓库的`action`里有中间件，会把我们这个请求拦截到，然后跳转






