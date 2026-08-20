---
title: Typescript基础及结合React实践(一) 从零搭出可跑的项目
description: TypeScript 入门第一篇，讲清基本类型、函数、类、接口、泛型的用法与边界，再手写 webpack 配置搭出 TS + React + Redux + Router 的最小可跑项目。
date: 2018-12-29 16:30:24
tags: 
   - React
   - Typescript
   - 前端工程化
categories: Front-End
---

接手一个要用 TypeScript 重写的中后台项目时，我心里想的是「不就是给变量加个冒号吗」。结果第一天就卡在 `document.getElementById('btn').style.color = 'blue'` 上，编译器红了一整行。真正难受的从来不是语法，是你得开始向编译器解释自己在干什么，而它比你严格得多。

这篇是我从安装 `tsc` 开始，把基本类型、函数、类、接口、泛型一路啃完，再手写 webpack 配置把 TypeScript 和 React 接起来的完整记录。全程不用脚手架，每一行配置都能看清楚它在解决什么问题。跟完之后你手上会有一个能跑的 TS + React + Redux + React Router 最小项目。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `tsc` 的安装、`tsc --init` 生成的 `tsconfig.json` 里那几个关键选项在管什么
- 布尔、数字、字符串、数组、元组、枚举、`any`、`null` / `undefined`、`void`、`never` 这一整套基本类型，以及 `any` / `void` / `never` 三者到底差在哪
- 函数的可选参数、默认参数、剩余参数和函数重载在 TypeScript 里的真实语义
- 类的定义、继承、`public` / `protected` / `private` 三个修饰符、静态成员和抽象类
- 接口怎么分别去规范对象、函数、数组和类，以及接口继承接口
- 泛型在函数和类上的用法，还有「有了接口为什么还要抽象类」
- 手写 webpack + `ts-loader` 搭出 TS + React 环境，包括类型定义文件 `@types/*` 是怎么回事
- 用 TypeScript 写 React 类组件，给 props 和 state 加接口约束
- Redux 的 action、reducer、store 全链路类型约束，以及 `combineReducers` 合并和路由同步到仓库

先说清楚一件事，这篇写于 2018 年底，当时 TypeScript 才 3.2，React 是 16.6，脚手架生态跟现在差得远。原文的写法我一律保留，涉及到现在做法不一样的地方，我会另起一小段说明，具体行为以官方文档为准。这三篇是一个连载，第二篇 [Typescript总结篇（二）](https://feinterview.poetries.top/blog/ts-summary) 把语法细节铺得更全，第三篇 [Typescript+React模板搭建（三）](https://feinterview.poetries.top/blog/ts-react-template) 则是带完整截图的工程模板实操。

## 一、装上 tsc，把编译链路先跑通

学 TypeScript 的第一步不是背类型，是先建立一个「改完 `.ts` 立刻能看到 `.js` 产物」的循环。看不到产物，你就永远不知道那些类型标注最后到底去哪了。

TypeScript 的编译器叫 `tsc`，全局装一个就行。

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
var a = "poet";
```

看到这个产物你就明白 TypeScript 干了什么了。`let` 被降级成了 `var`（因为默认 `target` 是 ES3/ES5），类型标注一个不剩，全部被擦掉。TypeScript 的类型只活在编译期，运行时是彻底不存在的，这一点后面讲 `never`、讲接口的时候会反复用到。

> 那么我们每次都要输`tsc hello.ts`命令来编译，这样很麻烦，能否让它自动编译？答案是可以的，使用`vscode`来开发，需要配置一下`vscode`就可以。

> 首先我们在命令行执行`tsc --init`来生成配置文件，然后我们在目录下看到生成了一个`tsconfig.json`文件

下面这张就是 `tsc --init` 之后目录里多出来的 `tsconfig.json`，它是整个项目类型检查行为的总开关。

![执行 tsc --init 后项目根目录生成的 tsconfig.json 文件](https://s.poetries.top/gitee/2019/10/545.png)

> 这个`json`文件里有很多选项

- `target`是选择编译到什么语法
- `module`则是模块类型
- `outDir`则是输出目录，可以指定这个参数到指定目录

这三个是最先要动的。`target` 决定产物语法版本，写 `es5` 就是给老浏览器用，写 `es2018` 以上箭头函数、`async` 都会被原样保留，产物体积小很多。`module` 决定模块系统，Node 端配 `commonjs`，走打包器就配 `esnext` 交给 webpack 自己处理。`outDir` 单纯是产物落哪个目录。

新版本还多了一个当年没有的 `moduleResolution`。现在如果你的代码是交给 Vite、webpack、esbuild 这类打包器处理的，官方推荐值是 `bundler`，它比老的 `node` 解析策略更贴近打包器的真实行为，比如允许省略扩展名同时又支持 `exports` 字段。具体取值和兼容矩阵以官方文档为准。

> 更多细节 https://zhongsp.gitbooks.io/typescript-handbook/content/doc/handbook/tsconfig.json.html

> 接下来我们需要开启监控了，在`vscode`任务栏中

有了配置文件还不够，得让它自动跑起来。VS Code 内置了 TypeScript 的构建任务，在任务栏里选 `tsc: 监视` 就能进入 watch 模式，改完保存自动编译。

![VS Code 任务栏中选择 tsc 监视任务开启自动编译](https://s.poetries.top/gitee/2019/10/546.png)

做完这一步你应该看到终端持续输出编译日志，随便在 `.ts` 里写个类型错误，终端会立刻报出来。如果没有反应，大概率是 `tsconfig.json` 的 `include` 没把你的文件圈进去。

**Typescript在线编辑器**

> 建议使用在线编辑器练习 http://www.typescriptlang.org/play/index.html

这个 Playground 到现在还在维护，左边写 TS 右边实时出 JS，还能切 TypeScript 版本。学类型的时候比在本地建项目快得多，我到现在验证一个类型推断结果还是习惯先开它。

## 二、数据类型

> `js`是弱类型语言，强弱类语言有什么区别呢？`typescript`最大的优点就是类型检查，可以帮你检查你定义的类型和赋值的类型。

弱类型的意思是变量的类型可以随时变，`let a = 1` 之后 `a = '1'` 完全合法，出错要等到运行时某个方法调不到才暴露。TypeScript 做的事就是在编译期先把这类问题拦下来。下面这一节把常用类型过一遍，每个类型我都补了一句「它到底在什么场景救你」。


### 2.1 布尔类型boolean

下面这段把同一个变量在 JS、TS、Java 三种语言里的写法摆在一起，看的是「类型信息写在哪」。JS 里根本没地方写，TS 是在变量名后面加冒号，Java 是写在变量名前面。

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

TypeScript 里没有 int / float / double 之分，所有数字都是 `number`，跟 JS 的运行时行为完全一致。`NaN` 和 `Infinity` 也算 `number`，这点偶尔会坑人。

```js
let age:number = 28;
age = 29;
```

### 2.3 字符串类型string

```js
let name:string = "poetries"
name = "iamswr"
```

这里有个坑要注意。如果你的 `tsconfig.json` 里 `lib` 带了 `dom`，全局作用域下已经存在一个 `name` 变量（`Window.name`），在顶层直接写 `let name: string` 有可能撞上「重复声明」的报错。放在模块里（文件中有任意一个 `import` 或 `export`）就没这个问题。我第一次遇到的时候排查了挺久，最后发现只要把文件变成模块就好了。

> 以上`boolean`、`number`、`string`类型有个共性，就是可以通过`typeof`来获取到是什么类型，是基本数据类型

那么复杂的数据类型是怎么处理的呢？

### 2.4 数组 Array

数组有两种写法，`T[]` 和 `Array<T>`，语义完全一样，选哪个纯看团队约定。真正需要想清楚的是「里面允许放什么」，这决定了你后面取出来的元素能直接调什么方法。

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

联合类型的数组 `Array<number|object|string>` 用起来其实挺别扭，因为取出来的每一项都是联合类型，你想调 `.toFixed()` 得先做类型收窄。所以真实项目里更常见的是给数组元素定一个接口，而不是堆联合类型。至于 `Array<any>`，能不写就不写，理由下面 2.7 会讲。

### 2.5 元组类型tuple

元组解决的是这么一类场景：一个数组里每个位置的含义都不同，位置本身就是语义。最典型的就是 React Hooks 里 `useState` 的返回值，第 0 位是值第 1 位是 setter，这就是元组。

- 什么是元组类型？其实元组是数组的一种。
- 有点类似解构赋值，但是又不完全是解构赋值，比如元组类型必须一一对应上
- 元组类型是一个不可变的数组，长度、类型是不可变的

 
```js
// 元组类型tuple
// 什么是元组类型？其实元组是数组的一种
let per :[string,number,object] = ['poetries',22,{love: 'coding'}]
```

原文说元组「不可变」，这个说法要打个补丁。TypeScript 会检查赋值和索引访问，但 `per.push('x')` 在早期版本里是不拦的，运行时长度照样能变。真想锁死，得用后来才有的 `as const` 或者 `readonly [string, number]`。这个我踩过，当时以为编译器保证了不变，结果线上数据多塞了一项都没人发现。

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

除了不可改，枚举还有一个普通对象给不了的东西，那就是类型。`enum orderStatus` 声明完，`orderStatus` 既是一个值也是一个类型，你可以直接写 `function ship(s: orderStatus)`，编译器会保证传进来的只能是那四个之一。普通对象要做到这一点，得再手写一遍 `keyof typeof`。

关于枚举现在有个新说法要提一句。TypeScript 5.0 之后官方在文档里更推荐用「常量对象 + `as const`」或者联合字面量类型来替代 `enum`，主要理由是 `enum` 会生成上面那段自执行函数的运行时代码，而字面量联合类型是零运行时开销的。`const enum` 又跟 `isolatedModules`（Babel、esbuild 这类单文件转译器需要它）冲突。不是说 `enum` 不能用，老项目里它一直工作得很好，只是新代码可以先考虑联合字面量。具体取舍以官方文档为准。

### 2.7 任意类型 any

> `any`有好处也有坏处，特别是前端，很多时候写类型的时候，几乎分不清楚类型，任意去写，写起来很爽，但是对于后续的重构、迭代等是非常不友好的，会暴露出很多问题，某种程度来说，`any`类型就是放弃了类型检查了

比如我们有这样一个场景，就是需要获取某一个dom节点

```js
let btn = document.getElementById('btn');
btn.style.color = "blue";
```

> 此时我们发现在`ts`中会报错

编译器给出的提示是对象可能为 `null`，红线就画在 `btn.style` 这里。

![TypeScript 提示 getElementById 返回值可能为 null 的报错截图](https://s.poetries.top/gitee/2019/10/547.png)

- 因为我们取这个`dom`节点，有可能取到，也有可能没取到，当没取到的时候，相当于是`null`，是没有`style`这个属性的。
- 那么我们可以给它添加一个类型为`any`


```js
// 添加一个any类型，此时就不会报错了，但是也相当于放弃了类型检查了
let btn:any = document.getElementById('btn');
btn.style.color = "blue";
```

这个解法能让红线消失，但它没解决任何问题。`getElementById` 之所以标成 `HTMLElement | null`，是因为它真的可能返回 `null`，你标 `any` 只是把编译器的嘴堵上了，线上该报 `Cannot read property 'style' of null` 还是会报。

更合适的写法是把这个可能性处理掉，比如加一个判断：

```js
const btn = document.getElementById('btn');
if (btn) {
  btn.style.color = 'blue';
}
```

或者用非空断言 `document.getElementById('btn')!.style`，前提是你能确定这个节点一定存在。这两种写法都比 `any` 强，因为它们至少把「我知道这里可能为空」这个判断留在了代码里。

```js
// 可以赋值任何类型的值
// 跟以前我们var let声明的一模一样的
let person:any = "poetries"
person = 22
```

### 2.8 null undefined类型

用竖线把多个类型连起来就是联合类型，表示「这个变量可以是其中任意一种」。它在描述接口返回值这类天生不确定的数据时特别有用。

```js
// (string | number | null | undefined) 相当于这几种类型
// 是 string 或 number 或 null 或 undefined

let str:(string | number | null | undefined)

str = 'poetries'
str = 28
str = null 
str = undefined
```

这里有个前提得说清楚。`null` 和 `undefined` 能不能赋给别的类型，取决于 `tsconfig.json` 里的 `strictNullChecks`。关掉的时候（2018 年很多项目的默认状态）`let a: string = null` 是合法的；打开之后它就报错了，你必须显式写成 `string | null`。现在新建项目基本都是 `strict: true` 起步，`strictNullChecks` 默认就在里面，所以上面这种「显式列出 null」的写法反而变成了常态。这条我建议一开始就打开，越晚打开迁移成本越高。

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

补一句 `void` 的实际用法。它最常出现的地方不是普通函数，而是回调函数的类型声明，比如 `onClick: () => void`。这里的 `void` 表达的是「我不关心你返回什么」，所以你传一个返回 `number` 的函数给它是允许的，编译器不会拦。这个规则我一开始也觉得反直觉，后来想通了：调用方本来就不会去用那个返回值，拦着没意义。

### 2.10 never类型

> 这个用得很少，一般是用于抛出异常

```js
function error(message:string):never {
    throw new Error(message)
}
error('errorMsg')
```

`never` 表示「这个函数根本不会正常返回」，跟 `void` 的「返回了但没值」是两码事。它还有一个更实用的场景，就是穷尽性检查。当你 `switch` 一个联合类型，在 `default` 分支里把变量赋给 `never`，一旦以后有人往联合类型里加了新成员却忘了加分支，编译器立刻报错。这招在 Redux 的 action 类型上特别好用，后面第九节那个 reducer 就适合加。

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
let json2 = parse("iamswr")
```

原文这两行都叫 `json`，实际编译会报重复声明，我改成了 `json` 和 `json2`。

另外这里得澄清一个说法。`never | any` 在类型系统里会被直接折叠成 `any`，因为 `never` 是所有类型的子类型，联合进去等于没写。真正的 `JSON.parse` 在 lib 里的签名是返回 `any`，跟 `never` 没关系。`never` 之所以有这个「吸收」特性，恰恰说明了它的定位：它是空集，是类型系统的底类型。

> 也就是说，当一个函数执行的时候，被抛出异常打断了，导致没有返回值或者该函数是一个死循环，永远没有返回值，这样叫做永远不会有返回值。

实际开发中，是`never`和联合类型来一起用，比如

```js
function say():(never | string) {
  return "ok"
}
```

这个写法等价于直接写 `:string`，写不写 `never` 结果一样。真要表达「可能抛异常」，TypeScript 没有 Java 那种 `throws` 声明，异常这件事它是不管的。

## 三、函数

函数是类型检查收益最直接的地方。参数少传一个、类型传错、返回值忘了 return，这三类问题在 JS 里全靠跑一遍才知道，在 TS 里编译期就拦住了。

### 3.1 函数定义 

```js
function sayHello(name:string):void {
    
}
```

冒号在参数名后面标参数类型，在参数列表后面标返回值类型。返回值类型其实可以省略让编译器自己推，但显式写出来有个好处：函数体里 return 错东西会立刻报错，而不是悄悄改变了函数签名。

### 3.2 函数参数处理

TypeScript 默认要求实参和形参严格对齐，个数不对就报错，这跟 JS 完全不同。所以可选参数、默认参数、剩余参数这三件事必须显式声明出来。

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

这段里有三个点值得单独拎出来。

可选参数的 `?` 必须放在必选参数后面，这是硬规则，因为 JS 的实参是按位置对齐的，中间挖个洞调用方没法表达。默认参数不需要写 `?`，写了 `= 'GET'` 编译器自然知道它可省略，而且会顺带推断出类型是 `string`，所以 `method:string = 'GET'` 里的 `:string` 其实可以不写。

剩余参数 `...args:Array<number>` 收到的是真数组，不是 `arguments` 那个类数组，直接能用数组方法。顺带说一句，原文这里用了 `eval(args.join("+"))` 来求和，能跑，但 `eval` 会在很多 CSP 策略下被禁掉，现在一般写成 `args.reduce((a, b) => a + b, 0)`，行为一样还快得多。

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

这一段是理解 TypeScript 重载的关键，我再展开一下。Java 的重载是真的存在多个函数，运行时按签名分派；TypeScript 的重载只是给同一个函数写了多张「对外名片」，实现体只有一个，运行时什么都没发生。编译产物里那两行 `function eating(name: string):void;` 会被完全擦掉。

所以写重载有两条纪律。一是实现签名（带函数体的那个）必须能兼容所有重载签名，通常只能写宽一点比如 `any`；二是实现签名本身对外不可见，调用方只能按重载列表里列出的那几种形态调用。

那什么时候才该用重载而不是联合类型？我的判断标准是看返回值。如果参数类型和返回值类型之间存在联动，传 `string` 返回 `string`、传 `number` 返回 `number`，那就用重载或者泛型；如果返回值跟参数类型无关，直接写联合类型 `name: string | number` 更简单，也少一层维护成本。

## 四、类

TypeScript 的类跟 ES6 的类高度重合，多出来的部分主要是三件事：属性要先声明类型、多了访问修饰符、多了抽象类。写 React 类组件的时候这几样天天用得上。

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

注意 `name: string;` 和 `age: number;` 这两行，它们在 JS 里是不存在的。TypeScript 要求实例属性先声明再在构造函数里赋值，不然 `this.name = name` 会报「属性不存在」。这个约束看着啰嗦，但它让类的形状一目了然，接手代码的人扫一眼开头就知道这个类有哪些字段。

编译产物长这样，可以看到声明部分同样被擦干净了。

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

继承这块跟 ES6 基本一样，`extends` 加 `super`。唯一多出来的约束是子类构造函数里访问 `this` 之前必须先调 `super()`，这条 ES6 也有，只是 TypeScript 会在编译期就拦下来而不是等运行时抛错。

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

不写修饰符默认就是 `public`。这三个修饰符也是纯编译期的东西，编译完全部消失，运行时该访问还是能访问。真正的运行时私有得用 ES2022 的 `#name` 语法，TypeScript 现在也支持，两套可以按需选：`private` 是给团队协作看的约定，`#` 是真的锁住。

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

代码里注释掉的那行简写值得单独说一下，它叫参数属性。把修饰符直接写在构造函数参数上，TypeScript 会自动帮你声明属性并完成赋值，五行变一行：

```js
class Parents {
   constructor(public name:string, protected age:number, private money:number) {}
}
```

这是我在 TypeScript 里最喜欢的语法糖之一，写 service、写 store 的时候能省掉大量样板代码。缺点是它只在 TypeScript 里成立，纯 Babel 转译需要额外插件配合，用之前先确认你的构建链支持。

### 4.4 静态属性、静态方法

跟`es6`差不多。静态成员挂在类本身而不是实例上，所以只能用 `Person2.say()` 调，`new` 出来的实例上是没有的。

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

这里原文写的是 `static name1`，不是 `static name`，这不是随手起的。类本身是个函数对象，函数天生带 `name` 属性（只读），所以 `static name` 在部分配置下会跟内置属性冲突报错。避开 `name`、`length`、`caller` 这几个字眼是个好习惯。

写 React 类组件的时候，`static defaultProps` 和 `static contextType` 就是靠这个机制工作的。不过 React 19 起函数组件的 `defaultProps` 已经失效了，官方推荐直接用参数默认值；类组件的 `defaultProps` 目前还在，具体状态以 React 官方文档为准。

### 4.5 抽象类

- 抽象类和方法，有点类似抽取共性出来，但是又不是具体化，比如说，世界上的动物都需要吃东西，那么会把吃东西这个行为，抽象出来
- 如果子类继承的是一个抽象类，子类必须实现父类里的抽象方法，不然的话不能实例化，会报错

```js
// 关键字 abstract抽象
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

抽象类真正的价值在于「强制子类补齐实现」这件事发生在编译期。你把公共逻辑放在抽象类里写死，把每个子类必然不同的那部分标成 `abstract`，新同事加子类时忘了实现，编译直接不过。比起在基类方法里 `throw new Error('not implemented')` 等运行时炸，这个反馈快太多了。

回到我们要解决的问题上。抽象类和接口经常被拿来比较，这一节先记住一个差别：抽象类可以带实现，接口不行。完整的对比放在下面 6.2 后面。

## 五、接口

> 这里的接口，主要是一种规范，规范某些类必须遵守规范，和抽象类有点类似，但是不局限于类，还有属性、函数等

接口是 TypeScript 里最常写的东西，没有之一。它描述的是「形状」，只要一个值的形状对得上，就认为它符合这个接口，不需要显式声明继承关系。这套规则叫结构化类型（也有人叫鸭子类型），跟 Java 那种必须 `implements` 才算数的名义类型是两条路。

`interface` 和 `type` 该怎么选，是个能单独写一篇的话题，我在 [TypeScript 中 interface 和 type 的区别](https://feinterview.poetries.top/blog/ts-interface-type) 里专门拆过，这里就不展开了。

### 5.1 接口规范对象

先看不用接口会发生什么。

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

可选属性的 `?` 和函数参数的 `?` 是一回事，加了之后这个字段的类型自动变成 `string | undefined`，所以用之前得判空。这里有个很多人没注意到的规则叫「对象字面量的多余属性检查」：直接传字面量 `{name, age, city}` 给只声明了 `name` 和 `age` 的接口会报错，但先赋给一个变量再传就不报了。这个不一致是故意设计的，字面量场景下多写一个字段大概率是打错字，而变量场景下多带字段通常是合理的。

回到接口本身，它最大的收益不是「少写几行类型」，而是给这套数据结构起了个名字。以后接口返回值变了，改一处所有用到的地方全部飘红，这就是重构的安全网。

### 5.2 接口规范函数

接口不光能描述对象，还能描述函数的调用签名。写法是在接口体里放一个没有名字的方法。

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

这种写法在描述回调、事件处理器、以及需要「函数本身还挂着属性」的场景（比如一个函数同时有 `.cancel()` 方法）时特别顺手，后者是 `type` 的箭头写法做不到的。日常只是标一个普通回调，直接写 `type MyTotal = (a: number, b: number) => number` 更短。

### 5.3 接口规范数组

接口体里放 `[index: number]: T` 叫索引签名，表示「用数字下标访问会拿到 T」。数组就是这么个形状，所以它能约束数组。

```js
interface userInterface {
    // index为数组索引 类型是number
    // 右边是数组里为字符串的数组成员
    [index: number]: string;
}
let arrTest: userInterface = ['poetries', '静观流叶']

console.log(arrTest)
```

实际项目里直接写 `string[]` 就够了，索引签名真正的用武之地是索引类型为 `string` 的字典对象，比如 `{ [key: string]: User }`。要注意索引签名会削弱类型安全，`dict['不存在的key']` 编译器认为它返回 `User`，运行时其实是 `undefined`。后来的 `noUncheckedIndexedAccess` 编译选项就是来治这个的，打开之后取出来的类型会自动带上 `| undefined`。

### 5.4 接口规范类

> 这个比较重要，因为写`react`的时候会经常使用到类

`implements` 表达的是「我承诺满足这个形状」，编译器会逐项核对，少一个方法就报错。它跟 `extends` 的区别是不继承任何实现，纯约束。

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

一个类可以同时 `implements` 多个接口，逗号隔开。这一点比继承灵活，JS 没有多继承，但「同时满足多个契约」是很常见的需求，比如一个组件既要可序列化又要可销毁。

### 5.5 接口继承接口

接口之间也能 `extends`，效果是把父接口的成员并进来。这样你可以把大接口拆成几个小接口，按需组合。

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

class Person8 implements Animal6 {
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

原文这里写的是 `implements Animal2`，跟上文「继承了 Animal5 的 Animal6」对不上，我改成了 `Animal6`，这样 `sleep()` 才是被接口要求的方法，示例才自洽。

接口继承还有个连带能力：同名接口会自动合并。两处分别写 `interface Foo { a: string }` 和 `interface Foo { b: number }`，最终 `Foo` 同时有 `a` 和 `b`。这就是给第三方库补类型定义时最常用的手段，后面第七节讲 `@types` 的时候会再碰到它。`type` 没有这个能力，同名会直接报重复标识符。

## 六、泛型

泛型解决的是「类型之间的联动」。前面讲重载的时候提过，如果返回值类型跟参数类型挂钩，重载能写但会写到爆炸，泛型是更省力的答案。

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

`<string>` 这个显式传参其实大多数时候可以省掉，直接 `deal("poetries")` 编译器会从实参反推出 `T` 是 `string`，这个过程叫类型推断。只有推不出来或者推错了的时候才需要手动指定。

泛型最常见的实战场景是包装接口请求。假设后端统一返回 `{ code, message, data }`，你可以写一个 `interface Resp<T> { code: number; message: string; data: T }`，然后 `request<User[]>('/api/users')` 拿到的 `res.data` 就直接是 `User[]`，不用再断言一次。这一下就把「后端字段改了前端不知道」这个老问题变成了编译错误。

> 实际上，泛型用得还是比较少，主要是看类的泛型是如何使用的

这句是我 2018 年的判断，现在得改口了。写 React Hooks（`useState<User | null>(null)`）、写工具类型、写任何要复用的函数，泛型都是绕不开的。真正用得少的是泛型的高级玩法，条件类型、映射类型那些，日常业务确实不常写。

### 6.2 类的泛型

类上的泛型参数会覆盖整个类体，所有成员都能用同一个 `T`，保证内部一致。

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

`MyMath<number>` 这个写法叫实例化泛型类。到了 React 里你会天天见到它的兄弟，`React.Component<IProps, IState>`，两个泛型参数分别锁住 props 和 state 的形状，下面第八节就靠它。

**有了接口为什么还需要抽象类？**

> 接口里面只能放定义，抽象类里面可以放普通类、普通类的方法、定义抽象的东西。

再补一条更实际的判断依据：接口编译后什么都不剩，抽象类会真的生成一个类。所以想复用实现代码就选抽象类，只想约束形状就选接口。还有一点，一个类只能 `extends` 一个抽象类，但能 `implements` 任意多个接口，需要横向组合能力的时候接口更灵活。

到这里基础部分就过完了。这些概念在 [Typescript总结篇（二）](https://feinterview.poetries.top/blog/ts-summary) 里还有更细的展开，包括类型断言、类型守卫、装饰器这些这篇没覆盖到的。下面开始动手把它们用到 React 项目里。

## 七、搭一套 TypeScript + React 的开发环境

2018 年这会儿 `create-react-app` 对 TypeScript 的支持刚上不久，很多细节不好改，所以我选了手写 webpack。好处是每一环都看得见，坏处是配置项多，得有点耐心。

先说一句时效性。这套手写 webpack 的流程现在不建议照抄来起新项目了，`create-react-app` 官方已经停止推荐，社区默认方案换成了 Vite，`npm create vite@latest` 选 `react-ts` 模板三十秒就能跑起来。但这一节的价值不在于「怎么起项目」，而在于让你看清楚 `ts-loader` 在整条链路里的位置，以及 `@types/*` 到底解决了什么。这些理解换到 Vite 上一样成立。

### 7.1 初始化项目

- 生成一个目录`ts_react_demo`，输入`npm init -y`初始化项目
- 然后在项目里我们需要一个`.gitignore`来忽略指定目录不传到`git`上
- 进入`.gitignore`输入我们需要忽略的目录，一般是`node_modules`

```
// .gitignore
node_modules
```

### 7.2 安装依赖

> 接下来我们准备下载相应的依赖包，这里需要了解一个概念，就是类型定义文件

#### 7.2.1 类型定义文件

> 因为目前主流的第三方库都是以`javascript`编写的，如果用`typescript`开发，会导致在编译的时候会出现很多找不到类型的提示，那么如果让这些库也能在`ts`中使用呢？

- 类型定义文件(`*.d.ts`)就是能够让编辑器或者插件来检测到第三方库中`js`的静态类型，这个文件是以`.d.ts`结尾
- 比如说`react`的类型定义文件：https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/react
- 在`typescript2.0`中，是使用`@types`来进行类型定义，当我们使用`@types`进行类型定义，`typescript`会默认查看`./node_modules/@types`文件夹，可以通过这样来安装这个库的定义库`npm install @types/react --save`

原文这里把 `@types` 写成了 `@type`，是笔误，npm 上的作用域包名是 `@types`，我顺手改了。

`.d.ts` 这个东西第一次接触会觉得很玄，其实它就是一份「只有类型没有实现」的说明书。`react` 这个包本身是 JS 写的，编译器读不懂里面的函数签名，`@types/react` 就是社区维护的一份平行说明书，装上之后 `import * as React from 'react'` 才有类型和自动补全。

这些说明书统一放在 DefinitelyTyped 这个仓库里，包名规则是原包名前面加 `@types/`，带作用域的包比如 `@babel/core` 会变成 `@types__babel__core` 这种下划线形式。

现在有个变化要说：越来越多的库自己就是 TypeScript 写的，或者在包里自带 `.d.ts`（`package.json` 的 `types` 字段指过去），这类库不需要也不应该再装 `@types/xxx`。装之前先看一眼 node_modules 里有没有 `.d.ts`，装重了反而会有类型冲突。这个我踩过一次，一个库自带类型，我又装了个版本对不上的 `@types` 包，报了一堆莫名其妙的重复定义。

#### 7.2.2 相关依赖包

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

注意 `redux-thunk` 和 `connected-react-router` 这两个没有配对的 `@types`，就是因为它们自带类型。这份清单也侧面说明了 2018 年的 Redux 生态有多重，一个计数器要拉进来七八个包。现在同等需求用 Redux Toolkit 一个包就够了，它本身用 TypeScript 写成，`createSlice` 能自动推断出 action 和 state 的类型，下面第九节手写的那一大堆 action 类型声明基本可以省掉。老写法我保留在下面，因为理解了它你才知道 RTK 帮你省了什么。

### 7.3 Typescript config配置

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

这几个选项里 `jsx: "react"` 是关键，配了它 `.tsx` 文件里的 JSX 才会被编译成 `React.createElement`，也就不需要额外挂 Babel 了。这个值现在有了新选项 `react-jsx`，对应 React 17 之后的新 JSX 转换，编译产物走 `react/jsx-runtime`，好处是文件里不用再写 `import React`。新项目建议用 `react-jsx`，具体版本要求以 React 官方文档为准。

`noImplicitAny: true` 是我最推荐一开始就打开的一项。它的作用是「你不写类型可以，但不能让我推成 `any`」，能挡住绝大部分偷懒。至于 `include`，它决定编译器扫哪些文件，范围开太大（比如漏了 `node_modules`）编译会慢到怀疑人生。

### 7.4 webpack配置

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

配置分四块看：入口出口、模块解析、loader 规则、插件和 dev server。先看前两块。

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
```

`resolve.extensions` 这个数组顺序是有讲究的，写在前面的先试。这里把 `.ts` 和 `.tsx` 放在 `.js` 前面，意思是同名文件优先用 TypeScript 版本，这在从 JS 渐进迁移到 TS 的项目里很实用，你可以一个文件一个文件地换，不用一次改完。忘配这一项的后果是所有 `import './Counter'` 全部报模块找不到，这大概率你也遇到过。

接着是 loader 和插件部分。

```js
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

`ts-loader` 做的事情是「类型检查 + 转译」两件一起干，所以它慢。这也是后来 `babel-loader` 加 `@babel/preset-typescript` 那套方案流行起来的原因，Babel 只负责把类型标注删掉，检查交给独立的 `tsc --noEmit` 进程去跑，构建速度差好几倍。现在 Vite 走的是同一个思路，用 esbuild 转译，类型检查另开一个 `vue-tsc` / `tsc` 进程。

这条经验换个说法就是：转译和类型检查是两件独立的事，把它们绑在一起会拖慢开发反馈。

还有一点，`devServer.contentBase` 在 webpack 5 里已经被 `static` 取代了，照抄这份配置到新版本会报未知属性。当年是 webpack 4，这么写没问题。

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

到这一步环境就通了。跑不起来的话优先查三个地方：`entry` 指的文件存不存在、`resolve.extensions` 有没有带 `.tsx`、`tsconfig.json` 的 `include` 有没有把 `src` 圈进去。这三样占了我当时排查时间的九成。

## 八、用 TypeScript 写 React 组件

环境通了之后，接下来要回答的问题是：TypeScript 到底给 React 带来了什么？答案集中在两个地方，props 和 state。这两样在 JS 里是完全开放的，传错了、拼错了、少传了，全靠运行时报错或者 PropTypes 在控制台喊一声。

### 8.1 写一个计数器组件

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

这个 `import * as React` 的写法是当年的历史包袱。`react` 是 CommonJS 包，用 `module.exports` 导出，没有 ES 模块的 default 导出，所以早期必须写命名空间导入。后来 TypeScript 加了 `esModuleInterop` 和 `allowSyntheticDefaultImports` 两个编译选项，打开之后就能正常写 `import React from 'react'` 了，现在的模板默认都是开的。你在老项目里看到 `import * as React` 不用慌，它跟新写法编译结果是等价的。

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

浏览器里应该能看到一个数字加一个加号按钮，点一下数字涨一。

![浏览器中运行起来的 TypeScript React 计数器组件](https://upload-images.jianshu.io/upload_images/1480597-86ad083c5149a72e.png)


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

`React.Component<IProps, IState>` 就是前面 6.2 讲的泛型类实例化，两个类型参数分别锁住 props 和 state。加上之后，`<CounterComponent />` 少传 `name` 会直接编译报错，传 `name={123}` 也会报错，`this.props.xxx` 拼错同样报错。这是 PropTypes 给不了的，PropTypes 只在运行时的开发模式下 warn 一声。

这里有个坑要注意：代码里 `state = { number: 0 }` 用的是类字段初始化，编译器会按赋值推断类型，而不是拿 `IState` 去校验它。想让 `IState` 真正约束到初始值，得写成 `state: IState = { number: 0 }`。少写这个标注的话，`IState` 里改了字段初始值这边不会报错，我见过好几次因为这个漏改。

补一条时效性。React 16.8 之后新代码基本都写函数组件加 Hooks 了，类组件仍然能用但不再是主流。函数组件的类型写法是直接给参数标接口：

```tsx
interface IProps { name: string }

function Counter({ name }: IProps) {
  const [number, setNumber] = React.useState(0)
  return <div>{name}: {number}</div>
}
```

早年流行的 `React.FC<IProps>` 现在不太推荐了，主要原因是 React 18 起 `FC` 不再隐式带 `children`，写法上没有优势了，还平白多一层泛型。直接标参数类型更直白。

## 九、Redux 全链路加上类型约束

这一节是整篇最能体现 TypeScript 价值的地方，因为 Redux 的数据流很长：组件 dispatch action，action 进 reducer，reducer 产出新 state，state 又通过 connect 回到组件。这条链上任何一环类型对不上，在 JS 里都要等运行时才发现。

#### 9.1 基础使用

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

这两行看着平平无奇，但它在 TypeScript 里的作用比在 JS 里大得多。因为用了 `const` 加字符串字面量，`types.ADD` 的类型不是 `string` 而是字面量类型 `"ADD"`。下面 `type:typeof types.ADD` 拿到的就是 `"ADD"` 这个精确的类型，reducer 里的 `switch` 才能据此做类型收窄。写成 `let` 或者 `var` 这套就全塌了，类型会退化成 `string`。

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

`export type Action = Add | Subtract` 这一行是整套设计的枢纽，它有个正式名字叫可辨识联合。三个条件缺一不可：每个成员都有一个共同字段（这里是 `type`）、这个字段的类型是字面量、然后用联合类型把它们连起来。满足之后，编译器就能在 `switch (action.type)` 的每个 `case` 分支里自动把 `action` 收窄到具体的那一个成员。

这套写法在整个前端里都很通用，不止 Redux。请求状态机、消息协议、表单校验结果，凡是「一个值有几种互斥形态」的场景都适合它。

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

在 `case types.ADD` 这个分支里把鼠标悬到 `action` 上，编辑器会告诉你它的类型是 `Add` 而不是 `Action`，这就是收窄生效了。假如 `Add` 上还有个 `payload` 字段，你在这里能直接点出来，在 `SUBTRACT` 分支里点它就报错。

顺着上面讲 `never` 的时候提过的穷尽性检查，这个 reducer 的 `default` 分支正是加它的地方。以后往 `Action` 里加了 `Reset` 却忘了写 case，编译器就会告诉你「`Reset` 不能赋给 `never`」。

代码里那几个 `return` 后面跟着的 `break` 是永远执行不到的死代码，`return` 已经跳出去了，我保留了原样，只是提醒一句这几行删掉不影响任何行为，某些 lint 规则还会直接报 unreachable code。

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

`connect` 里的 `mapStateToProps` 直接把整个 state 返回了，所以组件的 `number` 是从仓库来的。点加号按钮时 `add` 被 connect 自动包成了 dispatch 版本，派发出去，reducer 算出新 state，再流回组件。

这时候看到成功执行了

![接入 Redux 后计数器组件在浏览器中正常加减的效果](https://upload-images.jianshu.io/upload_images/1480597-32fc82d43dadb063.png)

- 其实搞来搞去，跟原来的写法差不多，主要就是`ts`会进行类型检查。
- 如果对`number`进行异步修改，该怎么处理？这就需要我们用到`redux-thunk`

`IProps` 里 `add:any` 和 `subtract:any` 这两处 `any` 其实是偷懒了，正确的类型是 `() => void`。当时之所以写 `any`，是因为 `connect` 把 action creator 包装之后的类型推导在 react-redux 6 那个版本挺难写对。现在的 react-redux 8 以上配合 Redux Toolkit，官方推荐的做法是自己定义好 `RootState` 和 `AppDispatch` 两个类型，再导出 `useAppSelector` / `useAppDispatch` 两个带类型的 hook，`connect` 那套 HOC 写法用得少了。这块我只在 RTK 的官方模板里跑过，具体写法以 Redux 官方文档为准。

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

`addAsync():any` 这里的 `any` 是个信号，说明 thunk 的类型确实不好写。thunk 返回的不是普通 action 对象而是一个函数，标准 Redux 的 `dispatch` 类型不接受函数，得靠 `ThunkAction` 这个类型来描述。`redux-thunk` 自带的类型定义里有它，签名大致是四个泛型参数（返回值、state、额外参数、action），完整写法以库的类型定义为准。当年图省事标了 `any`，代价是 dispatch 那一端完全没有检查。

`dispatch:any, getState:any` 这两个参数同理，正确类型分别是 `Dispatch<Action>` 和 `() => Store`。

> 到`./src/components/Counter.tsx`组件内，使用这个异步

#### 9.2 合并reducers

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

到目前为止，我们完成了`reducers`的合并了，那么我们看看效果如何，首先我们给`./src/index.tsx`添加`Counter2`组件，这样的目的是与`Counter`组件完全独立，互不影响，但是又能够最终合并到`reducers`

合并之后 state 的形状变了，从 `{ number: 0 }` 变成了 `{ counter: { number: 0 }, counter2: { number: 0 } }`。所以 `mapStateToProps` 里不能再直接 `return state`，得写成 `state => state.counter`。这一步不改的话页面上数字会变成 `undefined`，而且因为 `IProps` 里 `number` 标的是 `number`，编译器在 `connect` 那一层未必能拦住，属于会漏到运行时的那类问题。

页面上两个计数器各点各的，互不影响，就说明合并生效了。

![两个独立计数器组件通过 combineReducers 合并后互不影响的运行效果](https://s.poetries.top/gitee/2019/10/548.png)

## 十、路由

路由这块 TypeScript 的存在感反而没那么强，因为 `@types/react-router-dom` 已经把组件的 props 都定义好了，你按提示写就行。真正值得记的是路由和 Redux 怎么打通，以及 SPA 部署时那个经典的刷新 404 问题。

### 10.1 基本用法

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

点上面的导航链接，下面的内容会跟着切换，地址栏也变了，页面没有整页刷新。

![React Router 导航切换 Home Counter Counter2 三个路由的页面效果](https://s.poetries.top/gitee/2019/10/549.png)

代码里那个 `React.Fragment` 是因为 react-router 4 的 `Router` 只接受单个子节点。这个限制在 react-router 5 里放宽了，到了 react-router 6 整个 API 又重写了一遍，`Route` 的 `component` 属性换成了 `element`，还必须包在 `Routes` 里。下面这些写法在 v6 上是跑不了的，迁移的时候要照官方迁移指南来。

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

这个坑值得单独记一笔，因为它会一路跟到线上。`BrowserRouter` 用的是 History API，地址栏里的 `/counter` 是真实路径，浏览器直接访问会向服务器要这个路径下的文件，而服务器上根本没有。开发环境靠 `historyApiFallback` 兜底，生产环境就得靠服务器配置。Nginx 里对应的写法是 `try_files $uri $uri/ /index.html;`。

想彻底绕开这个问题也有办法，把 `BrowserRouter` 换成 `HashRouter`，路径变成 `/#/counter`，`#` 后面的部分不会发给服务器。代价是 URL 难看，而且对 SEO 不友好。我自己的选择一直是 `BrowserRouter` 加 Nginx 配置。

### 10.2 同步路由到redux

> 路由的路径，如何同步到仓库当中。以前是用一个叫`react-router-redux`的库，把路由和`redux`结合到一起的，`react-router-redux`挺好用的，但是这个库不再维护了，被废弃了，所以现在推荐使用`connected-react-router`这个库，可以把路由状态映射到仓库当中

> 首先我们在`./src`下创建文件`history.tsx`

这个文件的作用是把 history 实例从 `Router` 内部提出来变成一个模块级单例，这样 reducer、middleware、action 三处都能拿到同一个实例。原文这里没贴代码，补上，内容很短：

```js
// ./src/history.tsx
import { createBrowserHistory } from "history";

export default createBrowserHistory();
```

对应地，`index.tsx` 里的 `BrowserRouter` 要换成 `connected-react-router` 的 `ConnectedRouter` 并把这个 history 传进去，否则仓库里的路由状态和实际地址栏会对不上。

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

组件里加一个 `<button onClick={() => goto('/counter2')}>跳转</button>` 就够了，`goto` 跟 `add`、`subtract` 一样通过 `connect` 注入到 props 上。点下去之后你会在 redux-logger 的日志里看到一条路由 action，地址栏同步变化，仓库里的 `router.location` 也更新了。

这套「路由变成一个 action」的设计好处是让路由跳转和其它状态变更走同一条链路，时间旅行调试的时候能连路由一起回放。代价是多引一个库，而且路由状态和 Redux 状态存在同步失败的可能。我自己的感受是，除非你真的需要在 reducer 里读路由，否则直接用 `useNavigate` 这类 API 更省事。connected-react-router 本身现在也已经不太活跃了，新项目不建议再引。

## 总结

回头看这一整套流程，TypeScript 在里面真正发挥作用的地方其实很集中。

第一处是描述数据形状。接口、泛型、可辨识联合这三样，把「这个对象长什么样」「这个函数吃什么吐什么」从口口相传变成了编译器能验证的东西。上面 Redux 那一节最典型，action 的 `type` 一旦定成字面量类型，reducer 里的每个分支就自动收窄，你连注释都不用写。

第二处是划边界。`@types/*` 是你和第三方库之间的边界，`IProps` 是父组件和子组件之间的边界，接口返回值的类型是前后端之间的边界。边界定得越清楚，改动的影响面就越可控。

至于代价，写 TypeScript 确实要多打字，尤其是遇到 thunk 这种类型很绕的东西，你会忍不住标个 `any` 了事。我的建议是允许自己用 `any`，但每用一次在旁边写清楚为什么，别让它成为默认选项。上面那几处 `any` 我都标出来了，它们不是最佳实践，是当时的妥协。

这篇写于 2018 年底，很多工具链已经换代：CRA 让位给 Vite，`ts-loader` 让位给 esbuild 加独立类型检查，TSLint 停止维护换成了 typescript-eslint，Redux 那套样板代码被 Redux Toolkit 收掉了，`namespace` 和三斜线指令也基本被 ES module 取代。但类型系统本身的核心概念，接口、泛型、联合类型、字面量类型，这些年基本没变过。学一次能用很久，这是我到现在还愿意推荐从这些基础啃起的原因。

## 参考

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript tsconfig 参考](https://www.typescriptlang.org/tsconfig)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [DefinitelyTyped 类型定义仓库](https://github.com/DefinitelyTyped/DefinitelyTyped)
- [React 官方文档 TypeScript 章节](https://react.dev/learn/typescript)
- [Redux Toolkit 官方文档 TypeScript 指南](https://redux-toolkit.js.org/usage/usage-with-typescript)
- [React Router v6 迁移指南](https://reactrouter.com/upgrading/v5)
- [Typescript总结篇（二）](https://feinterview.poetries.top/blog/ts-summary)
- [Typescript+React模板搭建（三）](https://feinterview.poetries.top/blog/ts-react-template)
- [Typescript实践总结 从基础类型到工程化与项目实战](https://feinterview.poetries.top/blog/ts-in-action)
- [TypeScript 中 interface 和 type 的区别](https://feinterview.poetries.top/blog/ts-interface-type)
- [前端进阶之旅](https://interview.poetries.top)
