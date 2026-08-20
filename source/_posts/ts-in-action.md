---
title: Typescript实践总结 从基础类型到工程化与项目实战
description: 一篇讲透 TypeScript 的基本类型、接口、泛型、类型保护与高级类型，再到命名空间、声明文件、tsconfig 配置和 React/Vue 项目落地，附常见报错的正确与错误写法对照。
date: 2019-09-03 16:25:24
tags: 
   - JavaScript
   - Typescript
   - 前端工程化
categories: Front-End
---

刚上手 TypeScript 那阵子，我最难受的不是语法，而是「编译器为什么要拦我」。明明 `let a: void = 'hi'` 看着挺正常，它就是报错；明明 `arguments` 用得好好的，标成 `number[]` 就红一片。后来我发现，绝大多数卡壳都不是记不住正确写法，而是不知道**哪些写法是错的、错在哪一步**。

这篇是我把 TypeScript 从基础类型一路啃到工程落地的完整笔记，按「正确的写法 / 错误的写法」成对整理，每个坑都标了 ❌。内容分三块，基础篇讲类型系统本身，工程篇讲声明文件和 tsconfig，实战篇讲 React 和 Vue 里真正会遇到的类型问题。

<!--more-->

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- TypeScript 的基本类型体系，以及它比 ES6 多出来的 `void`、`any`、`never`、元组、枚举
- 接口的四种属性形态（确定、可选、任意、只读）和它们互相之间的约束关系
- 函数的四种声明方式、重载，以及 `interface` 和 `type` 到底该怎么选
- 泛型、泛型约束、索引类型、映射类型、条件类型这一整条「类型编程」链路
- 类型推断和四种类型保护（`typeof` / `instanceof` / `in` / 类型谓词）的适用场景
- 命名空间、三斜线指令、三类库（全局库 / 模块库 / UMD 库）声明文件怎么写
- `tsconfig.json` 每一个常用编译选项的含义，以及多项目工程引用怎么配
- React 函数组件、类组件、高阶组件、Hooks、Redux 的类型写法，和 Vue 的 `.vue` 声明文件

文章写于 2019 年，当时 TypeScript 还是 3.x，现在已经到 5.x 了。老写法我一律保留原样，需要更新认知的地方我会另起一小段说明现在一般怎么做，具体版本行为以官方文档为准。

## 一、基础篇，类型系统本身

先看这块。基础篇要解决的问题只有一个，把 JavaScript 里那些「运行时才炸」的错误挪到编译期。下面这几张图是我当时整理的思维导图，把基础篇涉及的类型、接口、泛型、类型检查机制串了一遍，可以先扫一眼有个整体印象，后面每一节都是对图里某个分支的展开。

![TypeScript 基础篇思维导图 数据类型总览](https://s.poetries.top/gitee/20190903/base-1.webp)
![TypeScript 基础篇思维导图 任意值与类型推论](https://s.poetries.top/gitee/20190903/base-2.webp)
![TypeScript 基础篇思维导图 联合类型与接口](https://s.poetries.top/gitee/20190903/base-3.webp)
![TypeScript 基础篇思维导图 数组与函数类型](https://s.poetries.top/gitee/20190903/base-4.webp)
![TypeScript 基础篇思维导图 类型断言与类型别名](https://s.poetries.top/gitee/20190903/base-5.webp)
![TypeScript 基础篇思维导图 枚举与类](https://s.poetries.top/gitee/20190903/base-6.webp)
![TypeScript 基础篇思维导图 访问修饰符与泛型](https://s.poetries.top/gitee/20190903/base-7.webp)
![TypeScript 基础篇思维导图 类型检查机制](https://s.poetries.top/gitee/20190903/base-8.webp)
![TypeScript 基础篇思维导图 高级类型](https://s.poetries.top/gitee/20190903/base-9.webp)
![TypeScript 基础篇思维导图 常见困惑汇总](https://s.poetries.top/gitee/20190903/base-10.webp)

### 1.1 基本类型

`JavaScript` 的类型分为两种，原始数据类型和对象类型。原始数据类型包括布尔值、数值、字符串、`null`、`undefined` 以及 ES6 中的新类型 `Symbol`。这一节主要看前五种原始数据类型在 `TypeScript` 里怎么标注，布尔值是最基础的一个，用 `boolean` 定义。

把两份类型清单摆在一起看，差异一眼就出来了。TypeScript 并没有替换掉 JS 的运行时类型，它是在 ES6 那套类型之上又叠了一层「只在编译期存在」的类型，`void`、`any`、`never`、元组、枚举、高级类型都属于这一层。编译完这些标注全部被擦掉，产物还是普通 JS。

**ES6数据类型**

- `Boolean`
- `Number`
- `String`
- `Array`
- `Function`
- `Object`
- `Symbol`
- `undefined`
- `null`

**Typescript数据类型**

- `Boolean`
- `Number`
- `String`
- `Array`
- `Function`
- `Object`
- `Symbol`
- `undefined`
- `null`
- `void`
- `any`
- `never`
- 元组
- 枚举
- 高级类型

下面这段把五种原始类型的标注方式一次性过完，重点看 `Boolean` 和 `boolean` 的区别，大写开头的是构造函数产出的包装对象，小写的才是原始值类型，这两个混用是新手最常踩的第一个坑。

**正确的写法**

```js
➖➖➖➖➖➖➖➖➖布尔➖➖➖➖➖➖➖➖➖
// 布尔值
let isDone: boolean = false;  

// 事实上 `new Boolean()` 返回的是一个 `Boolean` 对象
let createdByNewBoolean: Boolean = new Boolean(1);

//(直接调用 `Boolean` 也可以返回一个 `boolean` 类型) 
let createdByBoolean: boolean = Boolean(1); 

➖➖➖➖➖➖➖➖➖数值➖➖➖➖➖➖➖➖➖
// 数值
let decLiteral: number = 6;
let hexLiteral: number = 0xf00d;

// ES6 中的二进制表示法
let binaryLiteral: number = 0b1010;

// ES6 中的八进制表示法
let octalLiteral: number = 0o744;
let notANumber: number = NaN;
let infinityNumber: number = Infinity;
➖➖➖➖➖➖➖➖➖字符串➖➖➖➖➖➖➖➖➖
let myName: string = 'Tom';
➖➖➖➖➖➖➖➖➖空值➖➖➖➖➖➖➖➖➖
// 没有返回值的函数为void
function alertName(): void {
    alert('My name is Tom');
}

//声明一个 void 类型的只能将它赋值为 undefined 和 null
let unusable: void = undefined;
➖➖➖➖➖➖➖➖➖Null 和 Undefined➖➖➖➖➖➖➖➖➖
// undefined 类型的变量只能被赋值为 undefined，null 类型的变量只能被赋值为 null
let u: undefined = undefined;
let n: null = null;
```

正确写法记起来没难度，真正卡人的是下面这些。我整理笔记的时候特意把错误示例单独列一栏，因为编译器报错的时候你需要的是「哦，这个我见过」，而不是重新推一遍类型规则。

**错误的写法**

> 注意:正确的很好记,大多数人都会写正确的,关键是要记住这些错误的!!!

```js
➖➖➖➖➖➖➖➖➖布尔➖➖➖➖➖➖➖➖➖
// 注意，使用构造函数 `Boolean` 创造的对象不是布尔值
let createdByNewBoolean: boolean = new Boolean(1);❌

➖➖➖➖➖➖➖➖➖数值➖➖➖➖➖➖➖➖➖
let decLiteral: number = "6";❌

➖➖➖➖➖➖➖➖➖字符串➖➖➖➖➖➖➖➖➖
let myName: string = 999;❌

➖➖➖➖➖➖➖➖➖空值➖➖➖➖➖➖➖➖➖
// 没有返回值的函数为void
function alertName(): void {❌
   return 666;
}
//声明一个 void 类型的只能将它赋值为 undefined 和 null
let unusable: void = 'I love you';❌

➖➖➖➖➖➖➖➖➖Null 和 Undefined➖➖➖➖➖➖➖➖➖
// undefined 类型的变量只能被赋值为 undefined，null 类型的变量只能被赋值为 null
let u: undefined = 888;❌
let n: null = 999;❌
```

这里有个坑要注意，`let unusable: void = null` 在默认配置下是允许的，但只要你打开 `strictNullChecks`，`null` 就不再是所有类型的子类型，这行立刻变成错误。老项目升级的时候，这一个开关能给你炸出几百个报错，建议单独开一个分支慢慢改，别和业务需求混在一起。

### 1.2 任意值

`any` 是 TypeScript 给你留的逃生舱。它的语义是「这个位置我不检查了」，所以赋什么值都行，访问什么属性也都不报错。

**正确的写法**

```js
// 顾名思义,可以被任何值赋值
let anyThing: any = 'hello';
let anyThing: any = 888;
let anyThing: any = true;
let anyThing: any = null;
let anyThing: any = undefined;

// 变量如果在声明的时候，未指定其类型，那么它会被识别为任意值类型：
let any;
any =true;
```

`any` 用多了 TypeScript 就退化成了 JavaScript，这是老生常谈。我自己的感受是，`any` 真正危险的地方不在于它自己不检查，而在于它会顺着调用链往外传染：一个返回 `any` 的函数，它的返回值再往下传三层，这三层全部失去保护，而你在编辑器里看不出任何异常。

顺着上面聊，TS 3.0 之后其实有一个更好的选择叫 `unknown`。它同样能接住任意值，但你在使用它之前必须先做类型收窄（用 `typeof`、类型断言或者类型谓词），编译器强制你把「我不知道这是什么」这件事显式处理掉。接口返回值、`JSON.parse` 的结果、第三方库的回调参数，这几个位置用 `unknown` 比 `any` 稳得多。

### 1.3 类型推论

不写类型标注不代表没有类型。TypeScript 会在变量初始化的那一刻，根据右边的值反推一个类型出来钉死，之后再赋别的类型就报错。

**正确的写法**

```js
// 如果没有明确的指定类型，那么 TypeScript 会依照类型推论（Type Inference）的规则推断出一个类型。
let myFavoriteNumber = 'seven';  
//等价于
let myFavoriteNumber :string= 'seven';
```

**错误的写法**

```js
// 第一句已经被推论为String类型了
let myFavoriteNumber = 'seven';
myFavoriteNumber = 7;❌
```

这里有个细节很多人没注意到：用 `let` 声明时推断出的是宽泛类型 `string`，用 `const` 声明时推断出的是字面量类型 `'seven'`。前者能再赋别的字符串，后者连别的字符串都不行。这个差异在写联合类型和配置对象的时候会反复咬人，比如 `const config = { method: 'GET' }` 里 `method` 推出来是 `string` 而不是 `'GET'`，传给要求 `'GET' | 'POST'` 的函数就会报错。老办法是加 `as const`，TS 4.9 之后还多了 `satisfies` 这个更精细的写法。

### 1.4 联合类型

一个值可能是字符串也可能是数字，这种场景太常见了。联合类型用竖线连接，语义是「取值可以是这几种类型中的一种」。

**正确的写法**

```js
// 联合类型（Union Types）表示取值可以为多种类型中的一种。
// 当你允许某个变量被赋值多种类型的时候,使用联合类型,管道符进行连接
let myFavoriteNumber: string | number;
myFavoriteNumber = 'seven';
myFavoriteNumber = 7;

// 也可用于方法的参数定义, 都有toString方法,访问 string 和 number 的共有属性是没问题的
function getString(something: string | number): string {
    return something.toString();
}
```

**错误的写法**

```js
// number类型没有length属性.所以编译错误,因为我们只能访问此联合类型的所有类型里共有的属性或方法：
function getLength(something: string | number): number {❌
    return something.length;
}
```

为什么 `toString()` 能调，`length` 就不行？因为在没有做类型收窄之前，编译器只敢让你访问联合类型里**所有分支都存在**的成员。`string` 和 `number` 都有 `toString`，但 `number` 没有 `length`，所以后者被拦下来了。想访问某个分支独有的成员，就得先做类型保护，这块在 1.14 节会展开讲。

### 1.5 对象的类型与接口

到这里类型标注还停留在单个值上，真实业务里传来传去的都是对象。接口就是用来描述对象「长什么形状」的，赋值的时候变量的形状必须和接口保持一致，不能多也不能少，类型还得对得上。

**正确的写法**

```js
// 赋值的时候，变量的形状必须和接口的形状保持一致(不能多也不能少,类型还必须一致)
interface Person {
    name: string;
    age: number;
}

let tom: Person = {
    name: 'Tom',
    age: 25
};


// 注意 interface 关键字不能少，原笔记这里漏写了
interface IUserInfo{
  age : any;//定义一个任何变量的 age.
  userName :string;//定义一个 username.
}
function getUserInfo(user : IUserInfo):string{
    return user.age+"======"+user.userName; 	
}
  ➖➖➖➖➖➖➖➖➖可选属性➖➖➖➖➖➖➖➖➖

interface Person {
    name: string;
    age?: number; // 表示这个属性可有可无
}

let tom: Person = {
    name: 'Tom'
};
// 可索引签名（索引签名必须写成 [名字: 类型] 的形式，原笔记这里少了索引名和冒号）
interface StringArray {
  [index: number]: string // 数字索引签名。通过数字下标访问，返回 string
  // [key: string]: string // 字符串索引签名。两者要同时存在，数字索引的返回值必须是字符串索引返回值的子类型
}

let myArr: StringArray
myArr = ['test1','test2']
let myString = myArr[0]


  ➖➖➖➖➖➖➖➖➖任意属性➖➖➖➖➖➖➖➖➖

//希望一个接口允许有任意的属性，可以使用如下方式：旦定义了任意属性，那么确定属性和可选属性的类型都必须是它的类型的子集
interface Person {
    name: string;
    age?: number;
    [propName: string]: any;
}

let tom: Person = {
    name: 'Tom',
    gender: 'male' // 可以加其他的属性
};

➖➖➖➖➖➖➖➖➖只读属性➖➖➖➖➖➖➖➖➖
interface Person {
    readonly id: number; // 
    name: string;
    age?: number;
    [propName: string]: any;
}

let tom: Person = {
    id: 89757, // 只读
    name: 'Tom',
    gender: 'male'
};
```

这四种属性形态串起来看，其实是一条从严到松的滑轨。确定属性最严，必须有；可选属性放宽一档，可有可无；任意属性直接开口子，随便加；只读属性则是在另一个维度上加锁，只能在初始化时赋值。四者互相之间是有约束的，一旦声明了任意属性 `[propName: string]: T`，那么前面所有确定属性和可选属性的类型都必须是 `T` 的子集，这是下面这段错误示例的根因。

**错误的写法**

```js
// 一旦定义了任意属性，那么确定属性和可选属性的类型都必须是它的类型的子集
interface Person {
    name: string;
    age?: number;
    [propName: string]: string;
}

let tom: Person = {
    name: 'Tom',
    age: 25,
    gender: 'male'❌
};
上例中，任意属性的值允许是 string，但是可选属性 age 的值却是 number，number 不是 string 的子属性，所以报错了。

➖➖➖➖➖➖➖➖➖只读属性➖➖➖➖➖➖➖➖➖
interface Person {
    readonly id: number;
    name: string;
    age?: number;
    [propName: string]: any;
}

let tom: Person = {
    name: 'Tom',
    gender: 'male'
};

tom.id = 89757; // 不能被二次赋值❌
```

`readonly` 有个容易误解的点：它拦的是**赋值动作**，不是值本身的不可变。`readonly config: { url: string }` 只能保证你不能整个替换 `config`，改 `config.url` 照样通过。真要深层只读得自己套一层递归的映射类型。

**数组只读属性**

数组也有对应的只读版本，`ReadonlyArray<T>` 把 `push`、`pop`、`splice` 这些会改动原数组的方法全部去掉了，用来接住那些「只读不写」的入参很合适。

```ts
// 原笔记这里拼写有误，正确写法是 ReadonlyArray（大写开头，Array 不是 Arrary）
let myArr: ReadonlyArray<number> = [1, 2, 3]

// 等价的简写形式
let myArr2: readonly number[] = [1, 2, 3]
```

### 1.6 数组的类型

数组的标注有两种等价写法，`T[]` 和 `Array<T>`。选哪个基本看团队约定，我自己倾向于简单类型用 `T[]`，联合类型用 `Array<string | number>`，因为 `(string | number)[]` 那对括号很容易漏掉。

**正确的做法**

```js
let fibonacci: number[] = [1, 1, 2, 3, 5];
let fibonacci: Array<number> = [1, 1, 2, 3, 5];

➖➖➖➖➖➖➖➖➖用接口表示数组➖➖➖➖➖➖➖➖➖
interface NumberArray {
    [index: number]: number;
}
let fibonacci: NumberArray = [1, 1, 2, 3, 5];

➖➖➖➖➖➖➖➖➖any 在数组中的应用➖➖➖➖➖➖➖➖➖
let list: any[] = ['Xcat Liu', 25, { website: 'http://xcatliu.com' }];

➖➖➖➖➖➖➖➖➖类数组➖➖➖➖➖➖➖➖➖
function sum() {
    let args: IArguments = arguments;
}
```

最后那个 `IArguments` 值得单独说一句。`arguments` 长得像数组，有 `length`，能用下标取值，但它不是数组，没有 `map`、`filter`、`forEach`。TypeScript 内置了 `IArguments` 这个接口专门描述它，标错成 `number[]` 就会报错。现在写业务代码基本不用 `arguments` 了，剩余参数 `...args: number[]` 拿到的是真数组，更好使。

**错误的做法**

```js
// 数组的项中不允许出现其他的类型：
let fibonacci: number[] = [1, '1', 2, 3, 5];❌

// push 方法只允许传入 number 类型的参数，但是却传了一个 string 类型的参数，所以报错了。
let fibonacci: number[] = [1, 1, 2, 3, 5];
fibonacci.push('8');❌


// 类数组（Array-like Object）不是数组类型，比如 arguments
function sum() {❌
    let args: number[] = arguments;
}
```

### 1.7 函数的类型

函数比变量麻烦一点，因为你要同时把**输入和输出**都考虑到。TypeScript 对函数的参数个数卡得很死，多传少传都不行，这和 JavaScript 的宽松习惯差别最大。

**正确的做法**

```js
// 需要把输入和输出都考虑到
function sum(x: number, y: number): number {
    return x + y;
}

➖➖➖➖➖➖➖➖➖函数表达式➖➖➖➖➖➖➖➖➖
let mySum = function (x: number, y: number): number {
    return x + y;
};
// 不要混淆了 TypeScript 中的 => 和 ES6 中的 =>
let mySum: (x: number, y: number) => number = function (x: number, y: number): number {
    return x + y;
};
➖➖➖➖➖➖➖➖➖接口定义函数的形状➖➖➖➖➖➖➖➖➖
interface SearchFunc {
    (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;
mySearch = function(source, subString) {
    return source.search(subString) !== -1;
}

➖➖➖➖➖➖➖➖➖可选参数➖➖➖➖➖➖➖➖➖
function buildName(firstName: string, lastName?: string) {
    if (lastName) {
        return firstName + ' ' + lastName;
    } else {
        return firstName;
    }
}
let tomcat = buildName('Tom', 'Cat');
let tom = buildName('Tom');


➖➖➖➖➖➖➖➖➖参数默认值➖➖➖➖➖➖➖➖➖
function buildName(firstName: string, lastName: string = 'Cat') {
    return firstName + ' ' + lastName;
}

➖➖➖➖➖➖➖➖➖剩余参数➖➖➖➖➖➖➖➖➖
// rest 参数只能是最后一个参数，关于 rest 参数,是一个数组
function push(array: any[], ...items: any[]) {
    items.forEach(function(item) {
        array.push(item);
    });
}

let a = [];
push(a, 1, 2, 3);
```

上面那段里最容易看晕的是这一行：

```ts
let mySum: (x: number, y: number) => number = function (x: number, y: number): number { ... }
```

等号左边的 `=>` 是**类型层面**的箭头，表示「这是一个接收两个 number、返回 number 的函数类型」；等号右边如果写成箭头函数，那个 `=>` 才是 ES6 的语法。两个符号长得一样但活在不同的世界里，刚开始读这种代码会很别扭，习惯之后反而觉得这个设计是真的舒服，因为类型签名本身就读得像一句话。

**错误的做法**

```js
// 输入多余的（或者少于要求的）参数，是不被允许的：
function sum(x: number, y: number): number {
    return x + y;
}
sum(1, 2, 3); ❌
sum(1);❌

// 输入多余的（或者少于要求的）参数，是不被允许的：
function sum(x: number, y: number): number {
    return x + y;
}
sum(1, 2, 3);

// 可选参数后面不允许再出现必须参数了：
function buildName(firstName?: string, lastName: string) {❌
    if (firstName) {
        return firstName + ' ' + lastName;
    } else {
        return lastName;
    }
}
let tomcat = buildName('Tom', 'Cat');
let tom = buildName(undefined, 'Tom');
```

可选参数后面不能再跟必须参数，这条规则背后的道理很朴素：调用方是按位置传参的，如果 `buildName(firstName?, lastName)` 合法，那 `buildName('Tom')` 到底是给了 `firstName` 还是给了 `lastName`，谁也说不清。真遇到这种需求，就把参数收成一个对象，或者用重载。

#### 1.7.1 函数相关知识点梳理

**四种声明方式：**

- 通过`function`
- 通过变量
- 通过接口
- 通过类型别名

这四种写法描述的是同一件事，区别只在于类型信息挂在哪儿。函数声明把类型直接写在定义上，变量式把类型和实现拆开，接口和类型别名则能把这个签名复用到多个地方。

```ts
// 函数定义
function add1(x: number, y: number) {
    return x + y
}

// 通过变量
let add2: (x: number, y: number) => number

// 通过类型别名（原笔记这里误写成了 let add3 = ...，那是赋值不是类型声明）
type Add3 = (x: number, y: number) => number
let add3: Add3

// 通过接口
interface add4 {
    (x: number, y: number): number
}
```

**用interface定义函数和用type定义函数有区别?**

- `type`：不是创建新的类型，只是为一个给定的类型起一个名字。`type`还可以进行联合、交叉等操作，引用起来更简洁
- `interface`：创建新的类型，接口之间还可以继承、声明合并
- 如果可能，建议优先使用 `interface`。
- 混合接口一般是为第三方类库写声明文件时会用到，很多类库名称可以直接当函数调用，也可以有些属性和方法。例子可以看一下`@types/jest/index.d.ts` 里面有一些混合接口。
- 用混合接口声明函数和用接口声明类的区别是，接口不能声明类的构造函数（既不带名称的函数），但混合接口可以，其他都一样。

「优先用 interface」这条是当年 TypeScript 官方 Handbook 里的建议，现在的说法温和多了，两者能表达的东西高度重叠，选哪个更多是团队口味问题。我自己现在的分法是：**对外暴露、别人可能要扩展的用 `interface`，纯内部的联合类型、工具类型用 `type`**。声明合并这个能力在给第三方库补类型的时候很好用，但在业务代码里它是个隐患，两个同名 interface 在不同文件里悄悄合并，排查起来很费劲。

关于 `interface` 和 `type` 的完整对比，我之前单独写过一篇，想深挖可以看 [TypeScript 中 interface 和 type 的区别](https://feinterview.poetries.top/blog/ts-interface-type)。

**函数重载**

同一个函数名，根据传入参数的不同返回不同类型，这种需求在工具函数里特别常见。TypeScript 的做法是先写若干条「重载签名」，再写一个兼容所有情况的「实现签名」，实现签名本身对外不可见。

```js
function add8(...rest: number[]): number;
function add8(...rest: string[]): string;
function add8(...rest: any[]): any {
    let first = rest[0];
    if(typeof first === 'string') {
        return rest.join('')
    }
    if(typeof first === 'number') {
        return rest.reduce((pre, cur) => pre + cur)
    }
}
```


### 1.8 类型断言

- 有时候你会遇到这样的情况，你会比 `TypeScript` 更了解某个值的详细信息。 通常这会发生在你清楚地知道一个实体具有比它现有类型更确切的类型。
- 通过类型断言这种方式可以告诉编译器，「相信我，我知道自己在干什么」。 类型断言好比其它语言里的类型转换，但是不进行特殊的数据检查和解构。 它没有运行时的影响，只是在编译阶段起作用。 `TypeScript` 会假设你，程序员，已经进行了必须的检查。

类型断言有两种形式。 其一是「尖括号」语法：

```js
let someValue: any = 'this is a string'

let strLength: number = (<string>someValue).length
```

> 另一个为 `as` 语法：

```js
let someValue: any = 'this is a string'

let strLength: number = (someValue as string).length
```

> 两种形式是等价的。 至于使用哪个大多数情况下是凭个人喜好；然而，当你在 `TypeScript` 里使用 `JSX` 时，只有` as` 语法断言是被允许

原因很直接，`.tsx` 文件里 `<string>` 会被当成一个 JSX 标签的开始，解析器分不清你是在断言还是在写组件。所以只要项目里有 React，团队就应该统一用 `as`，省得来回切换。

这里必须提醒一句，类型断言不是类型转换，它在运行时**什么都不做**。你写 `someValue as string` 只是让编译器闭嘴，如果 `someValue` 运行时真是个数字，该崩还是会崩。我见过最常见的滥用是拿 `as` 去糊接口返回值，`res.data as UserInfo`，接口一改字段，编译器一声不吭，错误全部漏到线上。

**正确的做法**

```js
// 可以使用类型断言，将 something 断言成 string
function getLength(something: string | number): number {
    if ((<string>something).length) {
        return (<string>something).length;
    } else {
        return something.toString().length;
    }
}
```

**错误的做法**

```js
// 只能访问此联合类型的所有类型里共有的属性或方法
function getLength(something: string | number): number { ❌
    return something.length;
}
```

### 1.9 类型别名

类型别名解决的是「同一个复杂类型要在十个地方写十遍」的问题。它不创建新类型，只是给一个已有类型起名字，所以别名之间可以随便做联合、交叉运算。

**正确的做法**

```js
// 使用 type 创建类型别名,类型别名常用于联合类型
type Name = string;
type NameResolver = () => string;
type NameOrResolver = Name | NameResolver;
function getName(n: NameOrResolver): Name {
    if (typeof n === 'string') {
        return n;
    } else {
        return n();
    }
}
```

上面这个 `NameOrResolver` 是很典型的用法，一个参数既可以直接传字符串，也可以传一个返回字符串的函数。函数体里用 `typeof n === 'string'` 一分叉，两个分支里 `n` 的类型就被自动收窄了，不用写任何断言。

### 1.10 枚举

枚举适合取值被限定在固定范围里的场景，一周七天、订单的几种状态、审批流的几个节点，都是它的地盘。TypeScript 的数字枚举有个特点，它会做**双向映射**，既能用名字取值，也能用值反查名字。

**正确的做法**

```js
// 枚举（Enum）类型用于取值被限定在一定范围内的场景，比如一周只能有七天	
// 枚举就是枚举值到枚举名进行反向映射

enum Days {Sun, Mon, Tue, Wed, Thu, Fri, Sat};
console.log(Days["Sun"]); // 0
console.log(Days[0]); // 'Sun'

enum Days {Sun = 7, Mon = 1, Tue, Wed, Thu, Fri, Sat};
console.log(Days["Sun"]); // 7
```

第二个例子里手动指定了 `Sun = 7, Mon = 1`，后面的 `Tue` 到 `Sat` 会从 `Mon` 往后递增，也就是 2 到 6。这种手动赋值和自动递增混着来的写法，很容易撞值，撞了编译器也不一定拦你，排查起来很痛苦。我的习惯是要么全自动，要么全手写。

再补一句现在的做法。枚举是少数几个「会生成运行时代码」的 TypeScript 语法，编译后它是一个真实的对象，会进打包产物。如果你只想要一组常量约束，用 `as const` 对象加上联合类型往往更轻：

```ts
const Days = { Sun: 0, Mon: 1, Tue: 2 } as const
type Day = typeof Days[keyof typeof Days]  // 0 | 1 | 2
```

字符串枚举没有双向映射，反而更安全，用在接口状态码上比数字枚举合适。

### 1.11 类

`class` 这套东西 ES6 就有了，TypeScript 在它之上补的是类型标注、访问修饰符和抽象类。下面这段把类、继承、存取器、静态方法、抽象类一次性过完。

**正确的做法**

```js
➖➖➖➖➖➖➖➖➖类➖➖➖➖➖➖➖➖➖
class Animal {
    constructor(name) {
        this.name = name;
    }
    sayHi() {
        return `My name is ${this.name}`;
    }
}

let a = new Animal('Jack');
console.log(a.sayHi()); // My name is Jack
➖➖➖➖➖➖➖➖➖继承➖➖➖➖➖➖➖➖➖
class Cat extends Animal {
    constructor(name) {
        super(name); // 调用父类的 constructor(name)
        console.log(this.name);
    }
    sayHi() {
        return 'Meow, ' + super.sayHi(); // 调用父类的 sayHi()
    }
}

let c = new Cat('Tom'); // Tom
console.log(c.sayHi()); // Meow, My name is Tom
➖➖➖➖➖➖➖➖➖存储器➖➖➖➖➖➖➖➖➖
class Animal {
    constructor(name) {
        this.name = name;
    }
    get name() {
        return 'Jack';
    }
    set name(value) {
        console.log('setter: ' + value);
        this.name = value;
    }
}

let a = new Animal('Kitty'); // setter: Kitty
a.name = 'Tom'; // setter: Tom
console.log(a.name); // Jack
➖➖➖➖➖➖➖➖➖静态方法➖➖➖➖➖➖➖➖➖
class Animal {
    static isAnimal(a) {
        return a instanceof Animal;
    }
}

let a = new Animal('Jack');
Animal.isAnimal(a); // true
// 只能通过类名调用
a.isAnimal(a); // TypeError: a.isAnimal is not a function ❌
➖➖➖➖➖➖➖➖➖抽象类➖➖➖➖➖➖➖➖➖
// 只能被继承，不能被实例化
abstract class Animal {
  eat(){
    console.log('eat')
  }
  abstract sleep(): void
}
// 子类必须实现抽象类的抽象方法
class Dog extends Animal {
    constructor(name: string) {
        super()
        this.name = name
    }
    name: string;
    run() {}
    sleep() {
        console.log('dog sleep')
    }
}

let dog = new Dog('wang')
dog.eat()
```

存取器那段有个坑，示例里 `set name(value) { this.name = value }` 会无限递归，因为赋值又触发了自己这个 setter。实际写的时候得用一个不同名的私有字段接着，比如 `private _name`，setter 里写 `this._name = value`。原笔记这段是从教程里抄来演示语法的，语义上并不能直接跑。

抽象类那段值得多看两眼。`abstract class` 只能被继承不能被 `new`，里面的 `abstract sleep(): void` 只有签名没有实现，子类必须补上。这是把「模板方法」这类设计约束交给编译器去保证，比写注释说「记得实现这个方法」靠谱得多。

#### 1.11.1 类与接口的关系

类和接口的关系可以概括成一句话：接口负责描述「有什么」，类负责实现「怎么做」。`implements` 是一份契约检查，写了它，编译器就会盯着这个类有没有把接口里声明的成员都补齐。

```ts
interface Human {
    name: string;
    eat(): void;
}

// 实现接口中声明的属性
class Person implements Human {
    constructor(name: string) {
        this.name = name
    }
    name: string;
    eat() {}
}
```

接口自己也能继承，而且支持多继承，这一点比类灵活。下面这段把 `Human`、`Man`、`Child` 三个接口拼成了 `Boy`，实现的时候四个成员一个都不能少（原笔记里 `voild` 是 `void` 的笔误，这里改回来了）。

```ts
// 接口可以像类一样实现继承
interface Man extends Human {
    run(): void
}
interface Child {
    cry(): void
}
interface Boy extends Man,Child {}

// 添加被继承过来的属性
let body: Boy = {
    name: 'xx',
    run() {},
    eat() {},
    cry() {}
}
```

### 1.12 public private 和 protected

- `public` 修饰的属性或方法是公有的，可以在任何地方被访问到，默认所有的属性和方法都是 `public` 的
- `private` 修饰的属性或方法是私有的，不能在声明它的类的外部访问
- `protected` 修饰的属性或方法是受保护的，它和 `private` 类似，区别是它在子类中也是允许被访问的

这三个修饰符只在编译期生效，编译成 JavaScript 之后全部消失，运行时照样能通过 `obj['secret']` 摸到 `private` 字段。真要运行时私有，得用 ES2022 的 `#private` 字段，那个是语言级别的，外部访问直接抛错。两套机制不能混用，同一个类里选一种。

还有一个偷懒写法值得知道，参数属性。在构造函数参数前面直接加修饰符，编译器会自动帮你声明并赋值：

```ts
class Person {
  // 等价于声明 name 字段 + 在构造函数里 this.name = name
  constructor(public name: string, private age: number) {}
}
```

这个语法在写 NestJS 这类依赖注入框架的代码时会大量出现，第一次见会有点懵，知道它是语法糖就好了。

### 1.13 泛型

> 更多详情 http://blog.poetries.top/ts-axios/chapter2/generic.html

> 泛型就是解决 类 接口 方法的复用性、以及对不特定数据类型的支持。**泛型理解为代表类型的参数，只是另一个维度的参数**

我一开始也是这么想的：泛型不就是个占位符吗，写个 `T` 应付过去就行。真正把它用顺是在写请求封装的时候，一个 `request<T>(url): Promise<T>`，调用处写 `request<UserInfo>('/api/user')`，返回值的类型直接就对了，不用再 `as` 一遍。那一刻才明白泛型的价值不是「省代码」，是**把类型信息从调用处传进去，再原样带出来**。

**正确的做法**

```js
//只能返回string类型的数据
function getData(value:string):string{
  return value;
}

//同时返回 string类型 和number类型  （代码冗余）
function getData1(value:string):string{
  return value;
}
function getData2(value:number):number{
  return value;
}

>>>>>>>>>>使用泛型后就可以解决这个问题
// T表示泛型，具体什么类型是调用这个方法的时候决定的
// 表示参数是什么类型就返回什么类型~~~
function getData<T>(value:T):T{
  return value;
}
getData<number>(123);
getData<string>('1214231');

// 定义接口
interface ConfigFn{
    <T>(value:T):T;
}
var getData:ConfigFn=function<T>(value:T):T{
  return value;
}
getData<string>('张三');
getData<string>(1243);  //错误
```

#### 1.13.1 泛型函数和接口

泛型参数写在哪儿，决定了它的作用范围。写在成员签名上，只约束那一个成员，调用时才确定类型；写在接口或类型别名的名字后面，就约束了所有成员，引用时必须先把类型填上。这个区别很细，但用错了报错信息会很难懂。

```ts
// 这两个等价的，使用时无需指定类型
type Log = <T>(value: T) => T;

// 只约束改成员
interface Log {
  <T>(value: T):T
}

// 这两个等价的，使用时必须指定类型
type Log<T> = (value: T) => T;

// 约束接口的所有成员
interface Log<T> {
  (value: T):T
}
```

#### 1.13.2 泛型类与泛型约束

类也能带泛型参数，写在类名后面，实例成员都能用。有个限制得记住，**静态成员用不了类的泛型参数**，因为静态成员属于类本身，而泛型是实例化时才确定的。

```ts
// 把泛型放到类的后面，就可以约束所有成员
class Log<T> {
    run(value: T) {
        return value
    }
    // 不能约束静态成员
   // static eat() // 报错
}

// 实例化类 传入类型
let log1 = new Log<number>()
log1.run(1)

// 不指定类型参数传任意都允许
let log2 = new Log()
log2.run('1')
```

**类型约束**

裸的 `T` 什么都能传，也就什么属性都不能访问，这跟 `any` 没差多少。泛型约束就是给这个占位符划个范围，用 `T extends 某个类型` 告诉编译器「传进来的东西至少得长这样」，函数体里就能安全地访问那部分成员了。

```ts
interface Length {
    length: number
}

// T继承了接口 约束了不是任意类型都可传。传入的参数必须有length属性
function log<T extends Length>(value: T): T {
    console.log(value, value.length)
    return value
}
// 数组、字符串都有 length，可以传
log([1])
log('1')
// 原笔记这里写的是 log({a:1})，但 { a: 1 } 上没有 length，实际会报错
log({ length: 1, a: 1 })  // 带 length 的对象才行
```

用泛型约束换来的好处很实在：

- 函数和类可以轻松支持多种类型，增强程序的扩展性
- 不必写多条函数重载
- 灵活控制类型之间的约束

**对象属性约束**

再往前一步就是 `keyof`。`K extends keyof T` 的意思是「`key` 只能是 `obj` 上真实存在的那些键名」，写错一个字母编译器立刻报错，返回值类型还能精确到 `T[K]`。这个组合是 lodash 那类工具函数写类型的标准套路。

```ts
// 泛型约束对象中的属性
function getProp<T,K extends keyof T>(obj:T,key: K) {
    return obj[key]
}
```

TS 5.0 之后还多了一个 `const` 类型参数，写成 `function f<const T>(arg: T)`，可以让传入的字面量保持字面量类型而不被拓宽，省掉调用处到处写 `as const` 的麻烦。这个我只在写配置类工具函数时用过几次，具体行为以官方文档为准。


### 1.14 类型检查机制

#### 1.14.1 类型推断

> 编译器在做类型检查时，秉承的一些原则，表现出的一些行为

作用：辅助开发，提高开发效率

- 类型推断
- 类型兼容性
- 类型保护

> 所谓类型推断：不需要指定变量的类型（函数的返回值类型），TS可以根据某些规则自动的为其推断出一个类型

- 基础类型推断
- 最佳通用类型推断
- 上下文类型推断

> 基础类型推断，从右向左。但是有些是从左向右推断

最佳通用类型推断说的是数组这种场景，`let arr = [1, 'a']` 会推出 `(string | number)[]`，编译器找的是能装下所有元素的那个最小类型。上下文类型推断则相反，类型信息是从左边的位置流向右边的表达式，最典型的就是事件回调。

如事件

```js
// ts 根据onkeydown推断出类型
window.onkeydown = event=>{
    console.log(event)
}
```

> 通过类型断言阻断TS的类型推断

```ts
interface Foo {
    bar: number
}

//let foo = {} as Foo
//foo.bar = 1

let foo: Foo = {
    bar: 1
}
```

注释掉的那两行是很常见的偷懒写法，先 `{} as Foo` 骗过编译器，再一个个补属性。它能跑，但你少补一个属性编译器也不会提醒你，这个我踩过，后来接口加了个必填字段，五个地方漏赋值，全靠线上报错才发现。下面那种直接完整声明的写法才是对的，缺什么当场就红。

#### 1.14.2 类型保护机制


> 联合类型适合于那些值可以为不同类型的情况。 但当我们想确切地了解是否为 Fish 或者是 Bird 时怎么办？ JavaScript 里常用来区分这 2 个可能值的方法是检查成员是否存在。如之前提及的，我们只能访问联合类型中共同拥有的成员


**不同的判断方法有不同的使用场景：**

- `typeof`：判断一个变量的类型
- `instanceof`：判断一个实例是否属于某个类
- `in`：判断一个属性是否属于某个对象
- 类型保护函数：某些判断可能不是一条语句能够搞定的，需要更多复杂的逻辑，适合封装到一个函数内

四种方式的选择标准其实挺清晰的。判断原始类型用 `typeof`，判断类实例用 `instanceof`，判断对象上有没有某个字段用 `in`，逻辑复杂到一行写不下就抽成类型保护函数。下面这段把四种方式放在同一个函数里对照着看（原笔记里方法名 `hellJava` 少了个字母，类型保护函数里还多写了一层 `.lang`，这里一并改正）。

```ts
function getLanguage(type: Type) {
    let lang = type === type.Strong ? new Java(): new Javascript()
    
    // 类型保护instanceof
    if(lang instanceof Java){
        lang.helloJava()
    }else {
        lang.helloJavaScript()
    }
    
    // in
    if('helloJava' in lang) {
        lang.helloJava()
    }else {
        lang.helloJavaScript()
    }
    
    // 类型保护函数方式
    if(isJava(lang)) {
        lang.helloJava()
    }else {
        lang.helloJavaScript()
    }
}

// 创建一种类型保护函数
function isJava(lang: Java | Javascript): lang is Java {
    // 类型断言
    return (lang as Java).helloJava !== undefined
}
```

不做类型保护会怎样？下面这段就是反面教材，`pet` 是 `Fish | Bird`，直接访问 `swim` 和 `fly` 每一处都会报错，因为编译器只认两者的公共成员。

```ts
let pet = getSmallPet()

// 每一个成员访问都会报错
if (pet.swim) {
  pet.swim()
} else if (pet.fly) {
  pet.fly()
}
```

为了让这段代码工作，我们要使用类型断言

```js
let pet = getSmallPet()

if ((pet as Fish).swim) {
  (pet as Fish).swim()
} else {
  (pet as Bird).fly()
}
```

##### 用户自定义的类型保护

- 这里可以注意到我们不得不多次使用类型断言。如果我们一旦检查过类型，就能在之后的每个分支里清楚地知道 `pet` 的类型的话就好了。
- `TypeScript` 里的类型保护机制让它成为了现实。 类型保护就是一些表达式，它们会在运行时检查以确保在某个作用域里的类型。定义一个类型保护，我们只要简单地定义一个函数，它的返回值是一个类型谓词

```js
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined
}
```

- 在这个例子里，`pet is Fish` 就是类型谓词。谓词为 `parameterName is Type` 这种形式， `parameterName` 必须是来自于当前函数签名里的一个参数名。
- 每当使用一些变量调用 `isFish` 时，TypeScript 会将变量缩减为那个具体的类型

```js
if (isFish(pet)) {
  pet.swim()
}
else {
  pet.fly()
}
```

> 注意 TypeScript 不仅知道在 `if` 分支里 `pet` 是 `Fish` 类型；它还清楚在` else` 分支里，一定不是 `Fish`类型而是 `Bird` 类型

##### typeof 类型保护

我们可以像下面这样利用类型断言来写（原笔记里 `isNumber` 的谓词写成了 `x is string`，和函数体的 `typeof x === 'number'` 对不上，这里改成 `x is number`）

```ts
function isNumber (x: any):x is number {
  return typeof x === 'number'
}

function isString (x: any): x is string {
  return typeof x === 'string'
}

function padLeft (value: string, padding: string | number) {
  if (isNumber(padding)) {
    return Array(padding + 1).join(' ') + value
  }
  if (isString(padding)) {
    return padding + value
  }
  throw new Error(`Expected string or number, got '${padding}'.`)
}
```

> 然而，你必须要定义一个函数来判断类型是否是原始类型，但这并不必要。其实我们不必将 `typeof x === 'number'`抽象成一个函数，因为 TypeScript 可以将它识别为一个类型保护。 也就是说我们可以直接在代码里检查类型了

```js
function padLeft (value: string, padding: string | number) {
  if (typeof padding === 'number') {
    return Array(padding + 1).join(' ') + value
  }
  if (typeof padding === 'string') {
    return padding + value
  }
  throw new Error(`Expected string or number, got '${padding}'.`)
}
```

> 这些 `typeof` 类型保护只有两种形式能被识别：`typeof v === "typename"` 和 `typeof v !== "typename"`， `"typename"`必须是 `"number"`， `"string"`，`"boolean"` 或 `"symbol"`。 但是 TypeScript 并不会阻止你与其它字符串比较，只是 TypeScript 不会把那些表达式识别为类型保护。

这段话里的类型清单是当年的说法，`typeof` 在现在的 TypeScript 里还能识别 `"bigint"`、`"function"`、`"object"`、`"undefined"` 等，完整列表以官方文档为准。规则本身没变，只有 `typeof v === "字面量"` 和 `!==` 这两种形式会被当成类型保护。

##### instanceof 类型保护

- 如果你已经阅读了 `typeof` 类型保护并且对 JavaScript 里的 `instanceof` 操作符熟悉的话，你可能已经猜到了这节要讲的内容。
- `instanceof` 类型保护是通过构造函数来细化类型的一种方式。我们把之前的例子做一个小小的改造：

```js
class Bird {
  fly () {
    console.log('bird fly')
  }

  layEggs () {
    console.log('bird lay eggs')
  }
}

class Fish {
  swim () {
    console.log('fish swim')
  }

  layEggs () {
    console.log('fish lay eggs')
  }
}

function getRandomPet () {
  return Math.random() > 0.5 ? new Bird() : new Fish()
}

let pet = getRandomPet()

if (pet instanceof Bird) {
  pet.fly()
}
if (pet instanceof Fish) {
  pet.swim()
}
```

`instanceof` 靠的是构造函数的原型链，所以它只对 `class` 和构造函数创建的对象有效。接口是纯类型，编译后不存在，拿接口去 `instanceof` 是编译不过的，这也是为什么上面要把 `Bird` 和 `Fish` 从接口改写成类。

### 1.15 高级类型

到这一节才算真正进入 TypeScript 的深水区。前面讲的都是「怎么给值标类型」，接下来是「怎么用已有的类型算出新类型」，也就是常说的类型编程。

#### 1.15.1 交叉类型

> 交叉类型是将多个类型合并为一个类型。这让我们可以把现有的多种类型叠加到一起成为一种类型，它包含了所需的所有类型的特性。 例如，`Person & Loggable` 同时是 `Person` 和 `Loggable`。就是说这个类型的对象同时拥有了这两种类型的成员。

名字里带个「交叉」，成员上却是取并集，这个地方特别容易绕晕。记住一句话就够了：`A & B` 描述的是「同时满足 A 和 B 的那些值」，能同时满足两份要求，自然就得把两边的成员都凑齐。所以类型集合上是交集，成员列表上看起来是并集。

> 我们大多是在混入（mixins）或其它不适合典型面向对象模型的地方看到交叉类型的使用。 （在 JavaScript里发生这种情况的场合很多！）下面是如何创建混入的一个简单例子

```js
function extend<T, U> (first: T, second: U): T & U {
  let result = {} as T & U
  for (let id in first) {
    result[id] = first[id] as any
  }
  for (let id in second) {
    if (!result.hasOwnProperty(id)) {
      result[id] = second[id] as any
    }
  }
  return result
}

class Person {
  constructor (public name: string) {
  }
}

interface Loggable {
  log (): void
}

class ConsoleLogger implements Loggable {
  log () {
    // ...
  }
}

var jim = extend(new Person('Jim'), new ConsoleLogger())
var n = jim.name
jim.log()
```

这段 `extend` 是 2019 年常见的手写混入，用 `var` 和 `hasOwnProperty` 都是那个年代的写法。现在一般直接用对象展开 `{ ...first, ...second }`，返回类型照样标成 `T & U`，代码短一大截。原始写法保留在这儿是因为它把「交叉类型怎么产生」这件事讲得更清楚。

下面这段更实用，把交叉类型、联合类型、字面量联合类型和可辨识联合放在一起对照：

```ts
interface DogInterface {
    run(): void
}
interface CatInterface {
    jump(): void
}

// pet 具备两个接口的所有方法
let pet: DogInterface & CatInterface = {
    run() {},
    jump() {}
}

// 联合类型
let a: number | string = 1
let b: 'a' | 'b' | 'c' // 字面量联合类型
let c: 1 | 2 | 3 // 数字联合类型


class Dog implements DogInterface {
    run() {}
    eat() {}
}
class Cat  implements CatInterface {
    jump() {}
    eat() {}
}
enum Master { Boy, Girl }
function getPet(master: Master) {
    let pet = master === Master.Boy ? new Dog() : new Cat();
    // pet.run()
    // pet.jump()
    pet.eat()
    return pet
}

interface Square {
    kind: "square";
    size: number;
}
interface Rectangle {
    kind: "rectangle";
    width: number;
    height: number;
}
interface Circle {
    kind: "circle";
    radius: number;
}

type Shape = Square | Rectangle | Circle

function area(s: Shape) {
    switch (s.kind) {
        case "square":
            return s.size * s.size;
        case "rectangle":
            return s.height * s.width;
        case 'circle':
            return Math.PI * s.radius ** 2
        default:
            return ((e: never) => {throw new Error(e)})(s)
    }
}
console.log(area({kind: 'circle', radius: 1}))
```

最后那个 `area` 函数是**可辨识联合**的标准写法，值得单独拎出来说。三个接口都有一个 `kind` 字面量字段当标签，`switch` 一分支，编译器就知道当前这一支具体是哪个接口，`s.size`、`s.radius` 随便访问。

`default` 里那句 `((e: never) => { throw new Error(e) })(s)` 是精髓。所有分支都处理完之后，`s` 的类型被收窄成了 `never`，能顺利传进去；但只要你后面往 `Shape` 里新加一个形状又忘了在 `switch` 里补分支，`s` 就不再是 `never`，这一行立刻编译报错。

用类型系统提醒你「你漏了一种情况」，这招在写状态机和 Redux reducer 的时候真的好用。

#### 1.15.2 索引类型

索引类型解决的是「动态取属性」的类型安全问题。`keyof T` 拿到 T 所有键名组成的联合类型，`T[K]` 拿到对应属性的类型，两个配合就能把 `obj[key]` 这种写法也纳入检查。

```ts
let obj = {
    a: 1,
    b: 2,
    c: 3
}

// function getValues(obj: any, keys: string[]) {
//     return keys.map(key => obj[key])
// }
function getValues<T, K extends keyof T>(obj: T, keys: K[]): T[K][] {
    return keys.map(key => obj[key])
}
console.log(getValues(obj, ['a', 'b']))
// console.log(getValues(obj, ['d', 'e']))

// keyof T
interface Obj {
    a: number;
    b: string;
}
let key: keyof Obj

// T[K]
let value: Obj['a']

// T extends U
```

注释掉的那版 `getValues(obj: any, keys: string[])` 编译能过，但 `getValues(obj, ['d', 'e'])` 这种传了不存在的键的调用它拦不住，运行时拿到一堆 `undefined`。换成泛型版本之后，`['d', 'e']` 当场报错，这就是索引类型的价值。

#### 1.15.3 映射类型

映射类型是在一个已有类型上批量改造每个成员。TypeScript 内置了一批开箱即用的，覆盖了绝大多数日常需求，自己手写映射类型的场景其实不多。

```ts
interface Obj {
    a: string;
    b: number;
}

// 使得每个成员属性变为只读
type ReadonlyObj = Readonly<Obj>

// 把一个接口属性变为可选
type PartialObj = Partial<Obj>

// 抽取obj的子集
type PickObj = Pick<Obj, 'a' | 'b'>

type RecordObj = Record<'x' | 'y', Obj>
```

这几个的分工是：`Readonly` 全部加只读，`Partial` 全部变可选，`Pick` 挑几个出来，`Record` 用一组键构造一个新对象类型。日常最高频的是 `Partial`，写更新接口的入参类型基本都靠它。和 `Pick` 相对的 `Omit`（排除几个键）是 TS 3.5 才进内置库的，这篇写的时候还没有，现在直接用就行。

#### 1.15.4 条件类型

条件类型的形式是 `T extends U ? X : Y`，读起来就是类型层面的三元表达式。它的杀手锏在于**分发**：当 T 是联合类型时，条件会作用到每一个分支上，再把结果合并回来。

```ts
// T extends U ? X : Y

type TypeName<T> =
    T extends string ? "string" :
    T extends number ? "number" :
    T extends boolean ? "boolean" :
    T extends undefined ? "undefined" :
    T extends Function ? "function" :
    "object";
type T1 = TypeName<string>
type T2 = TypeName<string[]>

// (A | B) extends U ? X : Y
// (A extends U ? X : Y) | (B extends U ? X : Y)
type T3 = TypeName<string | string[]>

type Diff<T, U> = T extends U ? never : T
type T4 = Diff<"a" | "b" | "c", "a" | "e">
// Diff<"a", "a" | "e"> | Diff<"b", "a" | "e"> | Diff<"c", "a" | "e">
// never | "b" | "c"
// "b" | "c"

type NotNull<T> = Diff<T, null | undefined>
type T5 = NotNull<string | number | undefined | null>

// Exclude<T, U>
// NonNullable<T>

// Extract<T, U>
type T6 = Extract<"a" | "b" | "c", "a" | "e">

// ReturnType<T>
type T8 = ReturnType<() => string>
```

代码里那三行注释是重点，`Diff<T, U>` 和内置的 `Exclude<T, U>` 是同一个东西，`NotNull<T>` 对应内置的 `NonNullable<T>`。自己写一遍是为了搞懂分发是怎么发生的，实际项目里直接用内置版本。

`ReturnType` 用得非常多，尤其是给那些没导出返回值类型的函数拿类型，`type Res = ReturnType<typeof someFunc>` 一行搞定。后来还加了 `Parameters<T>` 取参数元组、`Awaited<T>` 剥 Promise，写工具类型基本靠这几个拼。

顺着这条线往后，TS 4.1 加了模板字面量类型，可以直接在类型层面拼字符串：

```ts
type EventName<T extends string> = `on${Capitalize<T>}`
type T9 = EventName<'click'>  // 'onClick'
```

配合条件类型和 `infer`，能做到从一个字符串类型里反解出结构，路由参数、事件名这类场景很好用。这块我自己只在封装 hooks 的时候用过几次，复杂的类型体操写多了可读性会掉得很快，够用就行。

#### 1.15.5 联合类型

> 联合类型与交叉类型很有关联，但是使用上却完全不同。 偶尔你会遇到这种情况，一个代码库希望传入 `number` 或 `string` 类型的参数。 例如下面的函数

```js
function padLeft(value: string, padding: any) {
  if (typeof padding === 'number') {
    return Array(padding + 1).join(' ') + value
  }
  if (typeof padding === 'string') {
    return padding + value
  }
  throw new Error(`Expected string or number, got '${padding}'.`)
}

padLeft('Hello world', 4) // returns "    Hello world"
```

> padLeft 存在一个问题，padding 参数的类型指定成了 any。 这就是说我们可以传入一个既不是 number 也不是 string 类型的参数，但是 TypeScript 却不报错

```js
let indentedString = padLeft('Hello world', true) // 编译阶段通过，运行时报错
```

> 为了解决这个问题，我们可以使用 联合类型做为 `padding` 的参数

```js
function padLeft(value: string, padding: string | number) {
  // ...
}

let indentedString = padLeft('Hello world', true) // 编译阶段报错
```

- 联合类型表示一个值可以是几种类型之一。我们用竖线（`|`）分隔每个类型，所以 `number | string` 表示一个值可以是 `number `或` string`。

> 如果一个值是联合类型，**我们只能访问此联合类型的所有类型里共有的成员**

```js
interface Bird {
  fly()
  layEggs()
}

interface Fish {
  swim()
  layEggs()
}

function getSmallPet(): Fish | Bird {
  // ...
}

let pet = getSmallPet()
pet.layEggs() // okay
pet.swim()    // error
```

> 这里的联合类型可能有点复杂：如果一个值的类型是 `A | B`，我们能够确定的是它包含了 `A` 和 `B` 中共有的成员。这个例子里，Fish 具有一个 `swim` 方法，我们不能确定一个 `Bird | Fish`类型的变量是否有 `swim`方法。 如果变量在运行时是 Bird 类型，那么调用 `pet.swim() `就出错了


### 1.16 初学者的困惑

前面讲的都是语法，这一节换个角度，聊几个「语法都会了但还是不知道怎么下手」的问题。类型声明放哪儿、第三方库没类型怎么办、想要的那个类型名字叫什么，这几件事没人教的话确实要摸索一阵。

#### 1.16.1 如何优雅的声明类型

先从最基础的开始，把五种 JS 值类型声明明白。

```ts
interface Basic {
  num: number;
  str: string | null;
  bol?: boolean;
}
```

> 五种 JS 值类型就声明好了。那数组、函数呢？

数组这块留意 `fixedStructure: [string, number]` 这一行，这是元组，长度和每个位置的类型都固定死了，`useState` 的返回值就是这么描述的。

```ts
interface Func {
  func(str: string): void;
}

interface Arr {
  str: string[];
  mixed: Array<string | number>;
  fixedStructure: [string, number];
  basics: Basic[];
}
```

> 枚举类型也是很常用的，比如声明一个状态机的各个状态

```js
enum Status {
  Draft,
  Published
}

// 也可指定值
enum Status {
  Draft = 'Draft',
  Published = 'Published'
}
```

这两段枚举写法有个实际差异要提一句。上面那个不指定值的，`Draft` 编译后是 0；下面那个字符串枚举，`Draft` 就是 `'Draft'`。做日志和调试的时候字符串枚举友好太多，看到 0 你还得回去数一遍顺序。

#### 1.16.2 类型声明放在哪儿

写在哪个文件、怎么分组，这事没有标准答案，但下面这几条经验能少走不少弯路。

**独立声明**

> 一个 `ts` 文件只声明一个类型或者接口，文件名为需要暴露的类型名称，方便检索和管理

**就近声明**

> 当一个声明没有被外部引用或者依赖时，可以考虑就近放在使用的地方，典型的场景是 `React` 组件的 `Props` 和 `State` 的类型声明

**按职责分组**

- 在项目中，需要声明类型的可大致分为两类：一类是 `model`，也就是接口请求相关的，包括入参和出参；另一类是 `view`，界面渲染相关的。因此，我在 独立声明 的基础上，可以类型按照`model` 和 `view` 的维度进行分组，相互独立。
- 那么问题来了，如果是独立的类型声明的话，怎么把 model 的数据应用到 `view` 呢？ 可能你需要一个 `adapter` 来做类型的的转换：`DTOTypes` -> `adapter` -> `ViewTypes`, 完成类似于将接口中的字符串映射成枚举类型这之类的转换

**any**

> 当遇到确实解决不了的类型报错的时候，`as any` 能带给你不一样的快感，但是不建议使用啊

按 model 和 view 分组这条我特别认同。接口返回的字段命名往往是后端风格，直接铺到组件里会很难看，中间加一层 adapter 做转换，顺带把字符串状态码映射成枚举，两边的类型都干净了。代价是多写一层代码，小项目可以不做，字段一多就值回票价了。

至于 `as any`，真要用就在旁边留一行注释写清楚为什么，别让下一个人（大概率是三个月后的自己）对着这行代码发呆。

#### 1.16.3 如何引用外部库

> 在 `JS` 中，`npm` 上有丰富的海量的库帮我们完成日常的编码，可能并不是所有的库都能完全被应用到 `TS` 中，因为有些缺少类型声明

比如，在 `TS` 中使用 `react `, 你会得到这样的一个类型检查错误。这个报错长这样，提示找不到 react 的声明文件，几乎每个从 JS 转过来的人都会先撞上它一次：

![TypeScript 中引入 react 时提示缺少类型声明文件的报错截图](https://pic2.zhimg.com/80/v2-fdfb8e5f2be67d8c978e216254b80a9d_hd.jpg)

- 因为 react 的库中并没有类型声明
- 现在比较通用的做法是，实现和类型实现独立成两个库，也就是你需要再安装类型声明的库: `@types/react`
- 当遇到上述问题的时候，尝试安装一下 `@types/[package]`
- 然而，并不是所有的库都有类型声明的实现，也会有很多不支持 TS 的存在，然而又必须得使用这个库的时候该怎么办？

**自己写声明**

> 以 `progressbar.js`为例，基本使用方法

```js
import * as ProgressBar from 'progressbar.js';

new ProgressBar.Circle(this.$progress, {
  strokeWidth: 8,
  trailColor: '#e5e4e5',
  trailWidth: 8,
  easing: 'easeInOut'
});
```

我们需要对库中暴露出的 api 去做声明，对上述例子做个分解：暴露了 Circle 类，Circle 构造函数包含两个参数，一个 HTMLElement，一个 options. OK

```js
// 首先声明一下模块：
declare module 'progressbar.js' {
  // 模块中暴露了 Circle 类
  export class Circle {
    constructor(container: HTMLElement, options: Options);
  }

  // 构造函数的 Options 需要单独声明 
  interface Options {
    easing?: string;
    strokeWidth?: number;
    trailColor?: string;
    trailWidth?: number;
  }
}
```

> 如此我们便完成了一个简单的声明，当然实际使用中的 API 肯定比上述情况复杂，根据使用情况，用了哪些 API 或者参数，就补充那些的声明即可

这里的思路很重要：**不要一上来就想把整个库的类型补全**。你用到了 `Circle` 和它的四个配置项，那就只声明这五样，剩下的等用到再说。我见过有人为了一个只用了两个方法的库，照着文档吭哧吭哧写了三百行 `.d.ts`，性价比太低了。

补充一句现在的情况，越来越多的库直接在包里自带 `.d.ts`，`@types/*` 的需求比 2019 年少了不少。判断方法很简单，装完之后去 `node_modules/包名/package.json` 里看有没有 `types` 或 `typings` 字段。

#### 1.16.4 如何组织一个 TS 项目

- TS 项目的目录组织上，跟 JS 项目一样，补充好 types 的声明就可以了
- 需要注意的是，将你希望对外暴露的能力相关的类型声明都暴露出去，不友好的声明会让接入你项目的人非常的痛苦，同时，在 package.json 中需要指定 type 的 path, 比如："types": "dist/types/index.d.ts"
- 另外，务必加上 tslint, 更规范的去用 TS 实现功能，对于入门而言尤为重要

最后一条得更新一下。TSLint 已经在 2019 年宣布停止维护了，现在的标准组合是 ESLint 加上 `typescript-eslint` 这套 parser 和插件。新项目直接上后者，老项目里如果还有 `tslint.json`，官方也提供过迁移工具。

`package.json` 里除了 `types` 字段，现在发包一般还会配 `exports`，把 CJS、ESM 和类型入口分开声明，这块变化比较快，以官方文档和你用的打包工具文档为准。

#### 1.16.5 TSX 和 JSX

- 之前我们在用 `JavaScript` 写 `React` 时，对文件的扩展名没有什么特别的要求，`.js` 或者 `.jsx` 都行。
- 但在 `TypeScript` 中，如果你要使用 `JSX` 语法，就不能使用 `.ts`，必须使用 `.tsx`。如果你不知道，或者忘了这么做，那么你会在使用了 `JSX` 代码的地方收到类型报错，但代码本身怎么看都没有问题。这也是刚上手 `TypeScript + React` 时几乎每个人都会遇到的坑。
- 关于这一点，`TypeScript` 只是在官方教程的示例代码中直接用了 `*.tsx`，但并没有明确说明这一问题

#### 1.16.6 变量的 Type 怎么找

- 上手 `TypeScript` 之后很快我们就发现，即便是原生的 `DOM`、或是 `React` 的 `API`，也经常会要我们手动指定类型。但这些结构并不是简单的 `JavaScript `原始类型，在使用 `JavaScript` 编写相关代码时候由于没有这种需要，我们也没关心过这些东西的类型，突然问起来，还真不知道这些类型叫什么名字。
- 不光是这些标准类型，同样的问题在很多第三方的库中也会遇到，比如一些组件库会检查你传入的 `Props`
- 在我看来，这中间其实缺少了一部分的文档，来指导新用户如何找到所需要的类型。既然社区没有提供，那就我来吧。
- 当然，让每个开发者都熟记所有的类型肯定是不现实的，总不能每接触一个新的库，就要去记一堆类型吧。放心，世界还是美好的，这种事情，当然是有方法的。
- 最直白的方法就是去看库的 `Types Definition`，也就是那些 `.*d.ts` 文件。如果你刚好有在用 `VS Code` 的话，有一个非常方便的操作：把鼠标移动到你想知道它类型的代码上（比如某个变量、某个函数调用，或是某个 JSX 标签、某个组件的 props），右键选择「Go to Definition」（或者光标选中后按 F12），就可以跳转到它的类型定义文件了。
- 如果你更习惯使用 VS Code 之外的编辑器，我相信时至今日，它们应该也都早就对 `TypeScript` 提供了支持。具体操作我不太熟悉，你可以自己探索下（我一直用 VS Code，其它的不太熟）
- 一般来说，这个操作可以直接把你带到你想要的地方，但考虑到类型是可以继承的，有时候一次跳转可能不太够，遇到这种情况，那就需要你随机应变一下，沿着继承关系多跳几次，直到找到你想要的内容。
- 对于不熟悉的类型，可以通过这个方法去寻找，慢慢熟悉以后，你会发现，一些常见的类型还是很好找的，稍微联想一下英文的表达方式，配合自动补全的提示，一般都不难找到

这个「按 F12 跳定义」的办法看着土，但它是最可靠的。类型定义文件就是最新最准的文档，比任何博客都靠谱，包括这篇。

#### 1.16.7 常见 Types 之 DOM

- `TypeScript` 自带了一些基本的类型定义，包括 ECMAScript 和 DOM 的类型定义，所有你需要的类型都可以从这里找到。如果你想做一些「纯 TypeScript 开发」的话，有这些就够了
- 比如下面这张截图，就是对 `<div>` 标签的类型定义。我们可以看到，它继承了更加通用的 `HTMLElement` 类型，并且扩展了一个即将被废弃的 `align` 属性，以及两组 `addEventListener` 和 `removeEventListener`，注意这里使用了重载。

![lib.dom.d.ts 中 HTMLDivElement 的类型定义截图](https://s.poetries.top/gitee/20190903/3.png)

截图里 `HTMLDivElement extends HTMLElement` 这一行是关键线索，顺着它往上跳就能看到整条继承链。

> 这里的命名也不是随便起的，都是在 MDN 上可以查到的。还是以 `<div>` 为例，我们已经知道它继承自 `HTMLElement`，其实再往上，`HTMLElement` 继承自 `Element`，`Element` 又继承自 `Node`，顺着这条路，你可以挖掘出所有 `HTML` 标签的类型
   
![HTMLElement 向上继承 Element 与 Node 的类型定义截图](https://s.poetries.top/gitee/20190903/4.png)

这张图就是往上跳一层之后看到的内容，`HTMLElement` 上挂着的那一大堆属性，和你在 MDN 上查到的完全对得上。

> 对于一些 DOM 相关的属性，比如 `onclick`、`onchange` 等，你都可以如法炮制，找到它们的定义。

#### 1.16.8 常见 Types 之 React

- 关于 TypeScript 的问题，有不少其实是在使用第三方库的时候遇到的，React 就是其中比较典型的一个
- 其实方法都一样，只不过相关的类型定义不在 `TypeScript` 中，而是在 `@types/react` 中。
- `React` 的类型定义的名称其实也很直观，比如我们常见的 `React.Component`，在定义 `Class` 组件时，我们需要对 `Props` 和 `State` 预先进行类型定义，为什么呢？答案就在它的类型定义中

![@types/react 中 React.Component 的泛型签名截图](https://s.poetries.top/gitee/20190903/5.png)

从截图里能看到 `Component<P, S>` 带了两个泛型参数，这就是为什么定义类组件时要按顺序把 Props 和 State 的类型填进去。

- 再比如，当我们在写一些组件时，我们可能会需要向下传递 `this.props.children`，但 `children` 并没有被设为默认值，需要我们自己定义到 `props` 上，那么它的类型应该是什么呢
- 到类型定义中搜一下关键字 `children`，很快我们就找到了下面的定义

![@types/react 中 children 属性被声明为 ReactNode 的截图](https://s.poetries.top/gitee/20190903/6.png)

> 所有 `React` 中 `JSX` 所代表的内容，无论是 `render()` 的返回，还是 `children`，我们都可以定义为一个 `ReactNode`。那这个 `ReactNode` 长什么样呢？我们通过右键继续寻找

![ReactNode 类型定义展开后的联合类型截图](https://s.poetries.top/gitee/20190903/7.png)

跳进去才发现 `ReactNode` 是个大联合类型，把元素、字符串、数字、布尔、`null`、`undefined` 全包进去了。

> 看到这里，我们不光找到了我们想要的类型，还顺带明白了为什么 `render()` 可以返回 `boolean`、`null`、`undefined` 表示不渲染任何内容。
那么事件呢？当我们给组件定义事件处理函数的时候，也经常会被要求指定类型。还是老办法，找不到咱就搜，比如 `onClick` 不清楚，那我们就以它为关键字去搜

![在 @types/react 中按 onClick 关键字搜索到 MouseEventHandler 的截图](https://s.poetries.top/gitee/20190903/8.png)

> 据此我们找到一个叫 `MouseEventHandler` 的定义，这名字，够直白吧。好了，我们找到想要的了。不过既然来了，不如继续看一下，看看还能发现什么。我们右键 `MouseEventHandler` 急需往下看：

![React 各类事件处理函数类型定义列表截图](https://s.poetries.top/gitee/20190903/9.png)

> 看到了吗，所有的事件处理函数都有对应的定义，每个都需要一个泛型参数，传递了事件的类型，名称也挺直白的

![React 合成事件对象的类型定义截图](https://s.poetries.top/gitee/20190903/10.png)

> 事件的类型也被我们挖出来了，以后如果需要单独定义一个事件相关的类型，就可以直接用了。以此类推，不管是什么东西的类型，都可以去它们对应的 `@types/xxx `里，按关键字搜

这套「搜关键字 + 跳定义」的方法我到现在还在用，比死记类型名有用得多。命名规律摸熟之后基本能猜个八九不离十，事件处理函数就是 `XxxEventHandler`，事件对象就是 `XxxEvent`，元素属性就是 `XxxHTMLAttributes`。

一个时效性提醒：React 18 之后 `React.FC` 不再隐式包含 `children`，需要 children 的组件得自己在 Props 里显式声明 `children?: React.ReactNode`。这个改动当年让很多项目升级时报了一片错，遇到了别慌，就是这个原因。

#### 1.16.9 多重 extends

- 我们知道 `Interface` 是可以多继承的，`extends` 后面可以跟多个其它 `Interface`，我们不能保证被继承的多个 `Interface` 一定没有重复的属性，那么当属性重复，但类型定义不同时，最终的结果会怎么样呢？

原笔记这里写的是「按从右往左的顺序合并，左边覆盖右边」，我后来验证下来这个说法站不住。TypeScript 的规则是：多继承时，同名属性的类型必须**完全一致**，否则直接报错，说这个接口不能同时继承这几个类型，因为同名属性的类型不一致。它不会帮你挑一个胜出。

```ts
interface A {
  value?: string
}
interface B {
  value: string
}
interface C {
  value: number
}

// 下面两行都会报错：value 的类型不一致，不能同时继承
// interface D extends A, B {}
// interface E extends B, C {}
```

那真想「覆盖」某个属性怎么办？把冲突的那个键先摘掉再重新声明：

```ts
interface D extends Omit<A, 'value'>, B {}   // value: string
```

具体报错文案和边界情况以官方文档为准，但「同名属性类型必须一致」这条规则本身是明确的。

#### 1.16.10 obj[prop] 无法访问怎么办

- 有时候我们会定义一些集合型的数据，例如对象、枚举等，但在调用的时候，我们未必会直接通过 `obj.prop` 的形式去调用，可能会是以 `obj[prop]` 这种动态索引的形式去访问，但通过动态索引的方式就无法确定最终访问的元素是否存在，因此在 `TypeScript` 中，默认是不允许这种操作的
- 但这又是个非常合理，而且非常常见的场景，怎么办呢？`TypeScript` 允许为类型添加索引，以实现这一点。

```js
interface Foo {
  x: string,
  y: number
  [index: string]: string | number
}
```

- 这个方法虽然有效，但每次都要手动为类型加索引，重复多了也挺心累的。包括在一些「配置对象」中，我们甚至无法确定有哪些类型，有没有一种更加通用、更加一劳永逸的方法。
- 其实在 `TypeScript `的官方文档中就有提到这个方案，官方管它叫 `OptionBag`，大概就是指 `config`、`option` 等用于提供配置信息的这么一类参数。我不是很确定这到底是个常规的英文单词，还是 `TypeScript` 中特定的术语（个人感觉是前者），反正就这么个意思吧。
简单说来，我们可以定义下面这样一个类型：

```ts
interface OptionBag {
  [index: string]: any
}
```

- 这是一个非常通用的结构，以字符串为键，值可以是任何类型，并且支持索引，这不就是 `Object` 么。
- 之后所有需要动态索引的结构，或是作为配置对象的结构，都可以直接指定为，或是继承 `OptionBag`。这个方案以牺牲一定的类型检查为代价，换取了操作上的便利。
- 理论上讲，`OptionBag` 可以适用于所有类似对象这样的结构，但不建议各位真就这么做。这个方案只能是用在一些对类型要求不那么严格，或是无法预知类型的场景中，能够确定的类型还是尽可能地写一下，否则就失去了使用 `TypeScript` 意义了


#### 1.16.11 其他技巧

**1. 安全导航操作符 ( ?. )和非空断言操作符（!.）**

- **安全导航操作符 ( ?. ) 和空属性路径**： 

> 为了解决导航时变量值为null时，页面运行时出错的问题

- **非空断言操作符**

> 能确定变量值一定不为空时使用。与安全导航操作符不同的是，非空断言操作符不会防止出现 `null` 或 `undefined`

```ts
let s = e!.name; // 断言e是非空并访问name属性
```

这两个符号长得像，作用完全相反，别搞混了。`?.` 会真的生成运行时判断，前面是 `null` 或 `undefined` 就短路返回 `undefined`；`!` 只是告诉编译器「这里我保证不为空」，**编译后消失，运行时一点保护都没有**。

`!` 用错的后果就是把 `strictNullChecks` 白开了。我的原则是，`!` 只用在编译器确实推不出来但你有充分理由确定的地方，比如刚 `push` 完立刻 `arr[arr.length - 1]!`；只要有一丝不确定，就老老实实写 `if` 判断。

补一个时效性说明。这篇写于 2019 年 9 月，当时 `?.` 还带着 Angular 时代「安全导航操作符」的叫法。TypeScript 3.7 之后它作为标准的可选链正式落地，同时还带来了空值合并运算符 `??`，这两个现在都是 JavaScript 语言本身的一部分了，不再是 TS 特有语法。

## 二、工程篇，声明文件与编译配置

会写类型只是入门，把 TypeScript 塞进一个真实工程还有另一套问题：老代码的全局变量怎么办、第三方库没类型怎么办、编译选项那么多该开哪些、多个子项目怎么共享配置。这一章讲的就是这些。

同样先放几张导图，把工程篇的知识点串一遍：

![TypeScript 工程篇导图 命名空间与声明合并](https://s.poetries.top/gitee/20190903/gongcheng-1.webp)
![TypeScript 工程篇导图 声明文件分类](https://s.poetries.top/gitee/20190903/gongcheng-2.webp)
![TypeScript 工程篇导图 全局库声明写法](https://s.poetries.top/gitee/20190903/gongcheng-3.webp)
![TypeScript 工程篇导图 模块库与 UMD 库声明写法](https://s.poetries.top/gitee/20190903/gongcheng-4.webp)
![TypeScript 工程篇导图 tsconfig 文件相关选项](https://s.poetries.top/gitee/20190903/gongcheng-5.webp)
![TypeScript 工程篇导图 tsconfig 编译相关选项](https://s.poetries.top/gitee/20190903/gongcheng-6.webp)
![TypeScript 工程篇导图 工程引用与多项目配置](https://s.poetries.top/gitee/20190903/gongcheng-7.webp)
![TypeScript 工程篇导图 编译工具与单元测试选型](https://s.poetries.top/gitee/20190903/gongcheng-8.webp)

### 2.1 使用命名空间

> 不要在一个模块中使用命名空间，最好在一个全局中使用

命名空间要解决的是模块系统出现之前的老问题：所有脚本都往 `window` 上挂东西，迟早撞名字。它的做法是用一个对象把相关的函数包起来，只暴露这一个名字。

```ts
// a.ts
namespace Shape {
    const pi = Math.PI
    export function cricle(r: number) {
        return pi * r ** 2
    }
}
```

```js
// b.ts

// 三斜线引用a
/// <reference path="a.ts" />
namespace Shape {
    export function square(x: number) {
        return x * x
    }
}

console.log(Shape.cricle(2))
console.log(Shape.square(2))

// 更方便使用 不是es6中的import
import cricle = Shape.cricle
console.log(cricle(2))
```

这段里有三个当年特有的写法，值得逐个说清楚。

`/// <reference path="a.ts" />` 是三斜线指令，作用是告诉编译器「我依赖那个文件，先编译它」。同名 `namespace` 在多个文件里会自动合并，所以 b.ts 里能直接调 a.ts 里的 `cricle`。最后那个 `import cricle = Shape.cricle` 叫导入别名，和 ES6 的 `import` 完全是两回事，它只是给命名空间里的成员起个短名字。

回到我们要解决的问题上。这套东西在 2019 年就已经不推荐用在新代码里了，现在更是如此。**有 ES module 的地方就别用 namespace**，直接 `export` / `import`，文件本身就是天然的作用域，打包工具还能做 tree-shaking。命名空间现在主要剩两个用武之地：给全局脚本（比如挂在 window 上的老 SDK）写声明文件，以及和函数、类做声明合并给它们挂静态属性。

### 2.2 理解声明合并

同一个名字在 TypeScript 里可以被声明多次，编译器会把它们并成一个。这个机制看着别扭，但它是给第三方库补类型的核心手段。

```ts
// 接口声明合并
interface A {
    x: number;
    // y: string;
    foo(bar: number): number; // 5
    foo(bar: 'a'): string; // 2
}

interface A {
    y: number;
    foo(bar: string): string; // 3
    foo(bar: string[]): string[]; // 4
    foo(bar: 'b'): string; // 1
}

let a: A = {
    x: 1,
    y: 2,
    foo(bar: any) {
        return bar
    }
}

// 命名空间和类声明合并--命名空间需要放到后面
class C {}
namespace C {
    export let state = 1
}
console.log(C.state)

// 命名空间和函数声明合并--命名空间需要放到后面
function Lib() {}
namespace Lib {
    export let version = '1.0'
}
console.log(Lib.version)

// 命名空间和枚举声明合并--位置没有要求
enum Color {
    Red,
    Yellow,
    Blue
}
namespace Color {
    export function mix() {}
}
console.log(Color)
```

代码里 `foo` 那几行后面标的数字 1 到 5 是**重载解析的顺序**，不是随手写的。规则是：后声明的接口排在前面，同一个接口内部按书写顺序排，但带字符串字面量参数的重载会被提到最前面优先匹配。所以最终顺序是 `foo(bar: 'b')`、`foo(bar: 'a')`、`foo(bar: string)`、`foo(bar: string[])`、`foo(bar: number)`。这个顺序影响调用时命中哪个签名，写库的时候要留意。

后面三段是命名空间分别和类、函数、枚举做合并。前两种要求**命名空间必须放在后面**，因为类和函数声明不会被提升到可以被提前扩展的程度；枚举没这个限制，放哪儿都行。给一个函数挂静态属性（比如 `Lib.version`）就靠这个套路，jQuery 那种「既能当函数调又有一堆静态方法」的库，声明文件里全是这么写的。

### 2.3 如何编写声明文件与引入类库

> 类库分为三类：全局类库、模块类库、`UMD`类库

判断一个库属于哪一类，看它是怎么被用的：直接在 HTML 里 `<script>` 引进来然后用全局变量的，是全局库；必须 `import` 才能用的，是模块库；两种都支持的，是 UMD 库。类型不同，声明文件的写法差别很大，一开始就得判断对，不然写完发现编译器根本不认。

下面这几个 `declare` 关键字是写声明文件的全部家当：

```ts
declare var // 声明全局变量
declare function // 声明全局方法
declare class // 声明全局类
declare enum // 声明全局枚举类型
declare global // 扩展全局变量
declare module // 扩展模块
```

> 大多数的声明文件社区已经帮我们安装好了，使用`@types/包名`声明文件即可

> Typescript声明文件查找 https://microsoft.github.io/TypeSearch/

**以jquery为例子**

```
yarn add @types/jquery 
```


**引入了一个JS类库，但是社区又没有提供类型声明文件，我该如何去编写它的类型声明文件**

> 先确定这个库的类型，全局库、模块库、还是UMD库，然后参照下面介绍的方法，把它的`API`声明逐步添加进来（暂时用不到的`API`也可以不写）

#### 2.3.1 三种类库声明文件写法

三种库对应三套模板，照着套就行。共同点是：`.d.ts` 文件里只有类型，没有任何实现，编译后不产出任何 JS。

##### 全局库

全局库的特征是不需要 import，变量直接挂在全局。声明的时候用 `declare function` 声明主体，再用同名 `declare namespace` 给它挂静态属性，这就是上一节讲的函数与命名空间合并。


```js
// global-lib.d.ts
    
declare function globalLib(options: globalLib.Options): void;
// 函数和命名空间的声明合并 为这个函数提供了一些属性
declare namespace globalLib {
    const version: string;
    function doSomething(): void;
    interface Options {
        [key: string]: any
    }
}
```

```js
// global-lib.js
// 和声明文件对应
function globalLib(options) {
    console.log(options);
}

globalLib.version = '1.0.0';

globalLib.doSomething = function() {
    console.log('globalLib do something');
};
```

```js
// 全局使用 index.ts
globalLib({x:1})
globalLib.doSomething()
```

##### 模块类库

模块库必须 import 才能用，所以声明文件末尾一定要有导出语句。注意这里用的是 `export = moduleLib` 而不是 `export default`，这是 CommonJS 的 `module.exports = xxx` 在类型层面的对应写法，用错了 import 进来会拿到 `undefined`。


```js
// module-lib.d.ts
declare function moduleLib(options: Options): void

interface Options {
    [key: string]: any
}

declare namespace moduleLib {
    const version: string
    function doSomething(): void
}

export = moduleLib
```

```js
// module-lib.js
const version = '1.0.0';

function doSomething() {
    console.log('moduleLib do something');
}

function moduleLib(options) {
    console.log(options);
}

moduleLib.version = version;
moduleLib.doSomething = doSomething;

module.exports = moduleLib;
```

```ts
// index.ts 使用（原笔记这里误贴成了 umd-lib，模块库应该引自己）
import moduleLib from './module-lib'

moduleLib.doSomething()
```

##### UMD类库

UMD 库两头讨好，既能 `<script>` 引也能 `import`。它的声明文件比模块库多一行 `export as namespace umdLib`，意思是「这个模块同时还会在全局暴露一个同名变量」。少了这行，全局用法就没有类型。


```js
// umd-lib.d.ts

declare namespace umdLib {
    // 省略了export
    const version: string
    function doSomething(): void
}

// UMD库不可缺少的语句
export as namespace umdLib

export = umdLib
```

```js
// umd-lib.js
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define(factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.umdLib = factory();
    }
}(this, function() {
    return {
        // 需要为这两个成员编写声明文件
        version: '1.0.0',
        doSomething() {
            console.log('umdLib do something');
        }
    }
}))
```

```js
// index.ts使用
import umdLib from './umd-lib'
// 可以不用导入umd-lib模块。但是需要打开tsconfig.tson中的umd配置
umdLib.doSomething()
```

#### 2.3.2 两种插件声明文件写法

上面讲的是「给一个库从零写声明」，还有一类需求是「库本身有声明，但我给它加了点自己的东西」，比如给 moment 挂一个业务方法。这时候不用改人家的 `.d.ts`，用声明合并扩展就行。

##### 模块化插件declare module

> `declare module` 可以给类库添加一些自定义方法。 扩展模块

关键在于文件顶部得先 `import` 一次目标模块，这样编译器才知道 `declare module 'moment'` 是在扩展一个已存在的模块，而不是从头声明一个新模块。这个细节漏了的话，你的声明会把原库的类型整个盖掉。


```js
// 模块插件
import m from 'moment';
declare module 'moment' {
    // 给moment自定义一些方法
    export function myFunction(): void;
}
m.myFunction = () => {}
```

##### 全局插件declare global

`declare global` 是在模块文件里往全局作用域打洞。日常最常见的用途是给 `window` 加字段，比如接入了某个统计 SDK 之后 `window._hmt` 报错找不到，就在项目里建个 `global.d.ts` 声明一下。


```js
// 全局插件
declare global {
    namespace globalLib {
        function doAnyting(): void
    }
}
// 在全局变量添加方法
// 会对全局变量造成污染 一般不这么做
globalLib.doAnyting = () => {}
```


#### 2.3.3 jquery声明文件示例

理论讲完，看一个真实的大型声明文件长什么样。jQuery 的类型定义是社区维护的典型案例，入口文件本身几乎没有内容，全靠三斜线指令把几个拆分文件串起来，最后一句 `export = jQuery` 收口。

```ts
// index.d.ts入口

// Type definitions for jquery 3.3
// Project: https://jquery.com
// Definitions by: Leonard Thieu <https://github.com/leonard-thieu>
//                 Boris Yankov <https://github.com/borisyankov>
//                 Christian Hoffmeister <https://github.com/choffmeister>
//                 Steve Fenton <https://github.com/Steve-Fenton>
//                 Diullei Gomes <https://github.com/Diullei>
//                 Tass Iliopoulos <https://github.com/tasoili>
//                 Jason Swearingen <https://github.com/jasons-novaleaf>
//                 Sean Hill <https://github.com/seanski>
//                 Guus Goossens <https://github.com/Guuz>
//                 Kelly Summerlin <https://github.com/ksummerlin>
//                 Basarat Ali Syed <https://github.com/basarat>
//                 Nicholas Wolverson <https://github.com/nwolverson>
//                 Derek Cicerone <https://github.com/derekcicerone>
//                 Andrew Gaspar <https://github.com/AndrewGaspar>
//                 Seikichi Kondo <https://github.com/seikichi>
//                 Benjamin Jackman <https://github.com/benjaminjackman>
//                 Poul Sorensen <https://github.com/s093294>
//                 Josh Strobl <https://github.com/JoshStrobl>
//                 John Reilly <https://github.com/johnnyreilly>
//                 Dick van den Brink <https://github.com/DickvdBrink>
//                 Thomas Schulz <https://github.com/King2500>
//                 Terry Mun <https://github.com/terrymun>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.3

// 三斜线引入模块

/// <reference types="sizzle" />
/// <reference path="JQueryStatic.d.ts" />
/// <reference path="JQuery.d.ts" />
/// <reference path="misc.d.ts" />
/// <reference path="legacy.d.ts" />

export = jQuery;
```

注意开头那一大段注释里的 `// Definitions by:` 和 `// TypeScript Version: 2.3`，这是 DefinitelyTyped 仓库要求的固定格式，你要是想给社区贡献类型定义，这个头部不能少。

### 2.4 配置tsconfig.json

`tsconfig.json` 是 TypeScript 工程的总开关，选项多到吓人，但真正天天要动的就那么十几个。下面这份是我当时逐条注释过的完整版，可以当查询手册用，用不到的保持注释状态就行。

#### 2.4.1 基础配置

配置项大体分两块：一块管「编译哪些文件」，一块管「怎么编译」。前者是 `files` / `include` / `exclude`，后者全塞在 `compilerOptions` 里。

```jsonc
{
  // ===与文件相关的选项===
  // 注意 JSON 里字符串必须用双引号，原笔记这里写成了单引号
  "files": ["src/index.ts"], // 编译的文件列表
  "include": ["src"], // 指定编译文件
  "exclude": ["src/lib"], // 排除编译文件
  
  // ====与编译相关的选项====
  "compilerOptions": {
      // "incremental": true,                // 增量编译，再次编译会增量编译
      // "tsBuildInfoFile": "./buildFile",   // 增量编译文件的存储位置
      // "diagnostics": true,                // 打印诊断信息

      // "target": "es5",           // 目标语言的版本
      // "module": "commonjs",      // 生成代码的模块标准
      // "outFile": "./app.js",     // 将多个相互依赖的文件生成一个文件，可以用在 AMD 模块中
        
       // 比如你需要使用es2019方法 需要在这里导入模块 "lib": ['es2019.arrary']
      // "lib": [],                 // TS 需要引用的库，即声明文件，es5 默认 "dom", "es5", "scripthost"

      // "allowJs": true,           // 允许编译 JS 文件（js、jsx）
      // "checkJs": true,           // 允许在 JS 文件中报错，通常与 allowJS 一起使用
      // "outDir": "./out",         // 指定输出目录
      // "rootDir": "./",           // 指定输入文件目录（用于输出）

      // "declaration": true,         // 生成声明文件
      // "declarationDir": "./d",     // 声明文件的路径
      // "emitDeclarationOnly": true, // 只生成声明文件
      // "sourceMap": true,           // 生成目标文件的 sourceMap
      // "inlineSourceMap": true,     // 生成目标文件的 inline sourceMap
      // "declarationMap": true,      // 生成声明文件的 sourceMap
      // "typeRoots": [],             // 声明文件目录，默认 node_modules/@types
      // "types": [],                 // 声明文件包

      // "removeComments": true,    // 删除注释

      // "noEmit": true,            // 不输出文件
      // "noEmitOnError": true,     // 发生错误时不输出文件

      // "noEmitHelpers": true,     // 不生成 helper 函数，需额外安装 ts-helpers
      // "importHelpers": true,     // 通过 tslib 引入 helper 函数，文件必须是模块

      // "downlevelIteration": true,    // 降级遍历器的实现（es3/5）

      // "strict": true,                        // 开启所有严格的类型检查
      // "alwaysStrict": false,                 // 在代码中注入 "use strict";
      // "noImplicitAny": false,                // 不允许隐式的 any 类型
      // "strictNullChecks": false,             // 不允许把 null、undefined 赋值给其他类型变量
      // "strictFunctionTypes": false           // 不允许函数参数双向协变
      // "strictPropertyInitialization": false, // 类的实例属性必须初始化
      // "strictBindCallApply": false,          // 严格的 bind/call/apply 检查
      // "noImplicitThis": false,               // 不允许 this 有隐式的 any 类型

      // "noUnusedLocals": true,                // 检查只声明，未使用的局部变量
      // "noUnusedParameters": true,            // 检查未使用的函数参数
      // "noFallthroughCasesInSwitch": true,    // 防止 switch 语句贯穿
      // "noImplicitReturns": true,             // 每个分支都要有返回值

      // "esModuleInterop": true,               // 允许 export = 导出，由import from 导入
      // "allowUmdGlobalAccess": true,          // 允许在模块中访问 UMD 全局变量
      // "moduleResolution": "node",            // 模块解析策略
      // "baseUrl": "./",                       // 解析非相对模块的基地址
      // "paths": {                             // 路径映射，相对于 baseUrl
      //   "jquery": ["node_modules/jquery/dist/jquery.slim.min.js"]
      // },
      // "rootDirs": ["src", "out"],            // 将多个目录放在一个虚拟目录下，用于运行时

      // "listEmittedFiles": true,        // 打印输出的文件
      // "listFiles": true,               // 打印编译的文件（包括引用的声明文件）
  }
}
```

这一大堆里，真正决定项目「严不严」的是 `strict` 那一组。`strict: true` 是个总开关，它会一次性打开 `noImplicitAny`、`strictNullChecks`、`strictFunctionTypes` 等一系列子选项。新项目建议直接开，老项目迁移则反过来，先关掉总开关，再一个一个往上加，每加一个跑一轮修一轮。

`strictNullChecks` 是收益最大也最痛的一个。开了之后 `string` 就不再包含 `null`，所有可能为空的地方都得显式处理。改起来烦，但线上那些 `Cannot read property 'x' of undefined` 基本就靠它拦下来。

另外几个我常开的：`noUnusedLocals` 和 `noUnusedParameters` 帮你清理死代码，`noImplicitReturns` 防止某个 `if` 分支忘了 return，`noFallthroughCasesInSwitch` 防 `switch` 漏写 `break`。这几个成本低收益高。

时效性提醒：`moduleResolution` 现在除了 `node` 还多了 `bundler` 这个值，配合 Vite、esbuild 这类打包器用更合适；`verbatimModuleSyntax` 则用来精确控制类型导入的擦除行为。具体取值和默认值随版本变化，以官方文档为准。

> 也可以把公共的抽离出来

配置一多，多个子项目之间就会大量重复。`extends` 就是干这个的，把公共部分抽到一个基础配置里，各子项目继承之后只写差异部分。

```jsonc
// tsconfig.base.json

{
  "files": ["src/index.ts"], // 编译的文件列表
  "include": ["src"], // 指定编译文件
  "exclude": ["src/lib"] // 排除编译文件
}
```

```jsonc
"extends": "./tsconfig.base",
"exclude": [] // 覆盖之前的
```

这里有个坑要注意，`extends` 的继承规则不是深合并，同名字段是**整个覆盖**掉的。所以子配置里写了 `"exclude": []`，父配置里的 `exclude` 就完全失效，而不是两者取并集。

#### 2.4.2 工程引用配置多个项目

> 每个项目都有一份独立的`tsconfig.json`，继承一份公共的配置，最后可单独构建每个子项目工程

> 参考学习`typescript`项目 https://github.com/microsoft/TypeScript/tree/master/src

工程引用（Project References）是给 monorepo 准备的。核心是两个字段：父配置里开 `composite: true`，子配置里用 `references` 指出自己依赖哪些兄弟项目。开了之后 `tsc --build` 会按依赖顺序增量编译，只重编改动过的那部分，大仓库里能省下大量时间。

```jsonc
// 示例 项目入口
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "strict": true,
    "composite": true,
    "declaration": true
  }
}
```

```js
// 子工程1
// src/client/tsconfig.json
{
    "extends": "../../tsconfig.json", //继承基础配置
    "compilerOptions": {
        "outDir": "../../dist/client", // 输出文件
    },
    "references": [
        { "path": "../common" } // 依赖文件
    ]
}

```

```js
// 子工程2
// src/server/tsconfig.json

{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "../../dist/server",
    },
    "references": [
        { "path": "../common" }
    ]
}
```


### 2.5 编译工具与代码检查

配好了 tsconfig，下一个问题是「谁来执行编译」。这块当年有两条路线，选错了会很难受，因为两套工具链的能力边界不一样。

**如何选择Typescript编译器**

> - 如果没有使用过`babel`，首选`Typescript`自身编译器(可配合`Ts-loader`使用)
> - 如果项目中已经使用`babel`，安装`@babel/preset-typescript`(可配合tsc做类型检查)
> - 两种编译工具不要混用

**typescript-eslint与babel-eslint区别**

> - `babel-eslint`支持`typescript`没有额外的语法检查，抛弃`typescript`,不支持类型检查
> - `typescript-eslint`基础typescript的AST,基于创建基于类型信息的规则（`tsconfig.json`）

- 两者底层机制不一样，不要一起使用
- `babel`体系建议使用`babel-eslint`，否则使用`typescript-eslint`

**总结**

- 编译工具
  - `ts-loader`
  - `@babel/preset-typescript`

- 代码检查工具
  - `babel-eslint`
  - `typescript-eslint`

这里最关键的一条是「两种编译工具不要混用」。Babel 走的路子是**只删类型不做检查**，它把 `.ts` 当成加了点额外语法的 JS，转译速度快但完全不管类型对不对；`tsc` 和 `ts-loader` 才会真正做类型检查。所以用 Babel 方案的项目，一定要在 CI 里单独跑一条 `tsc --noEmit`，否则类型错误会一路溜到线上。

Babel 那条路还有个限制得知道，因为它是**单文件转译**，拿不到跨文件的类型信息，像 `const enum`、老版本的 `namespace` 这类需要全局信息的语法它处理不了。日常业务代码基本不会碰到，写库的话要留意。

再说说现在的情况。这几年又冒出来一批更快的方案，esbuild 和 SWC 都能做 TS 转译，Vite 默认就用 esbuild 剥类型，同样不做类型检查，所以「转译归转译、检查归检查」这个分工反而更普遍了。`vue-tsc`、`tsc --noEmit`、编辑器里的 TS 语言服务，这三处才是真正把关的地方。

### 2.6 使用jest进行单元测试

测试这块的选型逻辑和上面一模一样，就看你要不要在测试用例里也做类型检查。

- 单元测试工具
  - `ts-jest` -- 能够在测试用例中进行类型检查
  - `babel-jest` -- 没有进行类型检查
  
> 生成配置文件 `ts-jest config:init`

我倾向于用 `ts-jest`。测试代码本身也是代码，如果测试里的 mock 数据和真实类型对不上，那这个测试的价值就打折扣了。代价是跑得慢一些，项目大了之后要考虑开缓存或者改用 SWC 的 jest transformer。

## 三、项目实战，React 与 Vue

前面两章都在讲「TypeScript 本身」，这一章看它在真实框架里怎么落地。先放两张实战篇的整体导图：

![TypeScript 项目实战导图 React 项目类型实践路径](https://s.poetries.top/gitee/20190903/1.png)
![TypeScript 项目实战导图 组件与状态管理类型设计](https://s.poetries.top/gitee/20190903/2.png)

### 3.1 手动创建 React 项目

> 项目代码 https://github.com/poetries/typescript-in-action/tree/master/ts-react

**1. 安装依赖文件**

```js
yarn add @types/react @types/react-dom
```

**2. 修改tsconfig.json**配置

> 修改 `compilerOptions`中的`jsx`为`react`

手动搭一遍的价值在于你能看清楚每一步在干嘛：装 `@types/react` 是为了让编译器认识 React 的 API，改 `jsx` 选项是为了让 `.tsx` 里的标签能被正确编译。补充一句，`jsx` 这个选项后来又多了 `react-jsx` 这个值，对应 React 17 之后的新 JSX 转换，不用再在每个文件顶部 `import React` 了。

### 3.2 使用脚手架安装

> 项目代码 https://github.com/poetries/typescript-in-action/tree/master/ts-react-app

```bash
create-react-app ts-react-app --typescript
```

这条命令是 2019 年的写法，后来 CRA 改成了 `--template typescript`。再后来 Create React App 本身也不再是官方推荐的起手方式了，现在新项目基本上 Vite 或者 Next.js 起步，`npm create vite@latest` 选 react-ts 模板就行。原始命令保留在这儿，是因为老项目里还能见到。

下面几个小节是同一个员工管理页面的不同写法，从函数组件一路写到 Redux，可以对照着看类型是怎么一层层往上加的。

#### 3.2.1 函数组件

函数组件最简单，Props 定义成一个接口，直接标在参数上就完事了。

```tsx
import React from 'react';
import { Button } from 'antd';

interface Greeting {
    name: string;
    firstName: string;
    lastName: string;
}

const Hello = (props: Greeting) => <Button>Hello {props.name}</Button>

// const Hello: React.FC<Greeting> = ({
//     name,
//     firstName,
//     lastName,
//     children
// }) => <Button>Hello {name}</Button>

Hello.defaultProps = {
    firstName: '',
    lastName: ''
}

export default Hello;
```

注释掉的那段 `React.FC<Greeting>` 写法在当年很流行，好处是能自动带上 `children` 和 `defaultProps` 的类型。这块现在变了，React 18 的类型定义把隐式 `children` 拿掉了，React 19 更进一步，函数组件上的 `defaultProps` 不再生效，得改用 ES6 的参数默认值。也就是说上面 `Hello.defaultProps = {...}` 这种写法在新版本里要换成解构时给默认值。

#### 3.2.2 类组件

类组件要同时描述 Props 和 State，两个泛型参数按顺序传给 `Component<P, S>`。

```tsx
import React, { Component } from 'react';
import { Button } from 'antd';

interface Greeting {
    name: string;
    firstName?: string;
    lastName?: string;
}

interface HelloState {
    count: number
}

class HelloClass extends Component<Greeting, HelloState> {
    state: HelloState = {
        count: 0
    }
    static defaultProps = {
        firstName: '',
        lastName: ''
    }
    render() {
        return (
            <>
                <p>你点击了 {this.state.count} 次</p>
                <Button onClick={() => {this.setState({count: this.state.count + 1})}}>
                    Hello {this.props.name}
                </Button>
            </>
        )
    }
}

export default HelloClass;
```

对比上一节可以发现一个差别：类组件里 `firstName` 和 `lastName` 标成了可选（带 `?`），函数组件那版是必填的。因为类组件的 `static defaultProps` 会在类型层面被识别，标可选之后调用方不传也不报错。这个细节当年折腾了我一会儿。

#### 3.2.3 高阶组件

HOC 的类型是 React 里最难写的部分之一，难点在于「包装之后要保留原组件的 Props，再加上自己注入的那些」。做法是用一个泛型 `P` 接住原组件的 Props，返回的组件类型写成 `P & Loading`。

```tsx
import React, { Component } from 'react';

import HelloClass from './HelloClass';

interface Loading {
    loading: boolean
}

function HelloHOC<P>(WrappedComponent: React.ComponentType<P>) {
    return class extends Component<P & Loading> {
        render() {
            const { loading, ...props } = this.props;
            return loading ? <div>Loading...</div> : <WrappedComponent { ...props as P } />;
        }
    }
}

export default HelloHOC(HelloClass);
```

`{ ...props as P }` 那个断言是当年不得不加的，因为 `Omit` 类型还没进内置库，编译器推不出剩余属性刚好等于 `P`。现在可以写得更干净一些，用 `Omit<P & Loading, 'loading'>` 之类的表达，不用硬断言。这也是为什么现在 HOC 用得越来越少，自定义 Hook 干同样的事，类型简单得多，关于 Hooks 我另外写过一篇 [React Hooks 完全上手指南](https://feinterview.poetries.top/blog/react-hooks)。

#### 3.2.4 Hooks组件

Hooks 的类型大部分靠推断，`useState(0)` 编译器自己就知道是 `number`。只有初始值推不出来的时候才需要手动给泛型参数。

```tsx
import React, { useState, useEffect } from 'react';
import { Button } from 'antd';

interface Greeting {
    name: string;
    firstName: string;
    lastName: string;
}

const HelloHooks = (props: Greeting) => {
    const [count, setCount] = useState(0);
    const [text, setText] = useState<string | null>(null);

    useEffect(() => {
        if (count > 5) {
            setText('休息一下');
        }
    }, [count]);

    return (
        <>
            <p>你点击了 {count} 次 {text}</p>
            <Button onClick={() => {setCount(count + 1)}}>
                Hello {props.name}
            </Button>
        </>
    )
}

HelloHooks.defaultProps = {
    firstName: '',
    lastName: ''
}

export default HelloHooks;
```

`useState<string | null>(null)` 这一行就是「推不出来得手写」的典型。只传 `null` 的话编译器会认为它永远是 `null`，后面 `setText('休息一下')` 直接报错。凡是初始值是 `null` 或者空数组的 state，都得把泛型参数补上。

#### 3.2.5 事件处理与数据请求

到这里开始有点真实业务的样子了。这个查询表单涉及三类类型：表单组件自身的 Props、请求入参、请求返回值。把它们分别声明在 `interface/employee.ts` 里，组件和请求层共用同一份定义，接口一改两边一起报错，这就是类型系统在项目里最实际的收益。

```tsx
import React, { Component, useState, useEffect } from 'react';
import { Form, Input, Select, Button } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

import { get } from '../../utils/request';
import { GET_EMPLOYEE_URL } from '../../constants/urls';
import { EmployeeRequest, EmployeeResponse } from '../../interface/employee';

const { Option } = Select;

interface Props extends FormComponentProps {
    onDataChange(data: EmployeeResponse): void
}

// Hooks version
// const QueryFormHooks = (props: Props) => {
//     const [name, setName] = useState('');
//     const [departmentId, setDepartmentId] = useState<number | undefined>();

//     const handleNameChange = (e: React.FormEvent<HTMLInputElement>) => {
//         setName(e.currentTarget.value)
//     }

//     const handleDepartmentChange = (value: number) => {
//         setDepartmentId(value)
//     }

//     const handleSubmit = () => {
//         queryEmployee({name, departmentId});
//     }

//     const queryEmployee = (param: EmployeeRequest) => {
//         get(GET_EMPLOYEE_URL, param).then(res => {
//             props.onDataChange(res.data);
//         });
//     }

//     useEffect(() => {
//         queryEmployee({name, departmentId});
//     }, [])

//     return (
//         <>
//             <Form layout="inline">
//                 <Form.Item>
//                     <Input
//                         placeholder="姓名"
//                         style={{ width: 120 }}
//                         allowClear
//                         value={name}
//                         onChange={handleNameChange}
//                     />
//                 </Form.Item>
//                 <Form.Item>
//                 <Select
//                     placeholder="部门"
//                     style={{ width: 120 }}
//                     allowClear
//                     value={departmentId}
//                     onChange={handleDepartmentChange}
//                 >
//                     <Option value={1}>技术部</Option>
//                     <Option value={2}>产品部</Option>
//                     <Option value={3}>市场部</Option>
//                     <Option value={4}>运营部</Option>
//                 </Select>
//                 </Form.Item>
//                 <Form.Item>
//                     <Button type="primary" onClick={handleSubmit}>查询</Button>
//                 </Form.Item>
//             </Form>
//         </>
//     )
// }

class QueryForm extends Component<Props, EmployeeRequest> {
    state: EmployeeRequest = {
        name: '',
        departmentId: undefined
    }
    handleNameChange = (e: React.FormEvent<HTMLInputElement>) => {
        this.setState({
            name: e.currentTarget.value
        });
    }
    handleDepartmentChange = (value: number) => {
        this.setState({
            departmentId: value
        });
    }
    handleSubmit = () => {
        this.queryEmployee(this.state);
    }
    componentDidMount() {
        this.queryEmployee(this.state);
    }
    queryEmployee(param: EmployeeRequest) {
        get(GET_EMPLOYEE_URL, param).then(res => {
            this.props.onDataChange(res.data);
        });
    }
    render() {
        return (
            <Form layout="inline">
                <Form.Item>
                    <Input
                        placeholder="姓名"
                        style={{ width: 120 }}
                        allowClear
                        value={this.state.name}
                        onChange={this.handleNameChange}
                    />
                </Form.Item>
                <Form.Item>
                <Select
                    placeholder="部门"
                    style={{ width: 120 }}
                    allowClear
                    value={this.state.departmentId}
                    onChange={this.handleDepartmentChange}
                >
                    <Option value={1}>技术部</Option>
                    <Option value={2}>产品部</Option>
                    <Option value={3}>市场部</Option>
                    <Option value={4}>运营部</Option>
                </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="primary" onClick={this.handleSubmit}>查询</Button>
                </Form.Item>
            </Form>
        )
    }
}

const WrapQueryForm = Form.create<Props>({
    name: 'employee_query'
})(QueryForm);

export default WrapQueryForm;
```

有两个点值得单独说。`e: React.FormEvent<HTMLInputElement>` 这个类型是查出来的，方法就是 1.16.6 讲的「跳定义 + 搜关键字」，别硬记。另一个是 `Form.create<Props>()`，这是 antd v3 的高阶组件写法，v4 之后改成了 `Form.useForm()` Hook，写法完全不同，看老代码的时候要注意版本。

#### 3.2.6 列表渲染

列表这块的类型难点在于「数据还没请求回来时是什么」。这里把 state 声明成 `EmployeeResponse`（一个可能为 `undefined` 的类型），渲染前先用 `typeof !== 'undefined'` 做类型保护。

```tsx
import React, { Component, useState } from 'react';
import { Table } from 'antd';

import './index.css';

import QueryForm from './QueryForm';

import { employeeColumns } from './colums';
import { EmployeeResponse } from '../../interface/employee';

// Hooks version
// const Employee = () => {
//     const [employee, setEmployee] = useState<EmployeeResponse>(undefined);

//     const getTotal = () => {
//         let total: number;
//         if (typeof employee !== 'undefined') {
//             total = employee.length
//         } else {
//             total = 0
//         }
//         return <p>共 {total} 名员工</p>
//     }

//     return (
//         <>
//             <QueryForm onDataChange={setEmployee} />
//             {/* {getTotal()} */}
//             <Table columns={employeeColumns} dataSource={employee} className="table" />
//         </>
//     )
// }

interface State {
    employee: EmployeeResponse
}

class Employee extends Component<{}, State> {
    state: State = {
        employee: undefined
    }
    setEmployee = (employee: EmployeeResponse) => {
        this.setState({
            employee
        });
    }
    getTotal() {
        let total: number;
        // 类型保护
        if (typeof this.state.employee !== 'undefined') {
            total = this.state.employee.length
        } else {
            total = 0
        }
        return <p>共 {total} 名员工</p>
    }
    render() {
        return (
            <>
                <QueryForm onDataChange={this.setEmployee} />
                {/* {this.getTotal()} */}
                <Table columns={employeeColumns} dataSource={this.state.employee} className="table" />
            </>
        )
    }
}

export default Employee;
```

`getTotal` 里那句注释「类型保护」就是重点。如果直接写 `this.state.employee.length`，在开了 `strictNullChecks` 的项目里会红，因为它可能是 `undefined`。加一层 `typeof` 判断之后编译器就放行了，这比到处写 `!.` 干净得多。

#### 3.2.7 Redux与类型

> 项目代码 https://github.com/poetries/typescript-in-action/tree/master/ts-redux

Redux 加类型是当年的一大痛点。下面这段 reducer 里能看到几个典型手法：state 用 `Readonly<>` 包一层防止直接改，action 里的 `payload` 因为形状不固定只能标 `any`，取列表时到处 `as EmployeeInfo[]` 断言。

```ts
import { Dispatch } from 'redux';
import _ from 'lodash';

import { get, post } from '../../utils/request';
import { department, level } from '../../constants/options';

import {
    GET_EMPLOYEE_URL,
    CREATE_EMPLOYEE_URL,
    DELETE_EMPLOYEE_URL,
    UPDATE_EMPLOYEE_URL
} from '../../constants/urls';

import {
    GET_EMPLOYEE,
    CREATE_EMPLOYEE,
    DELETE_EMPLOYEE,
    UPDATE_EMPLOYEE
} from '../../constants/actions';

import {
    EmployeeInfo,
    EmployeeRequest,
    EmployeeResponse,
    CreateRequest,
    DeleteRequest,
    UpdateRequest
} from '../../interface/employee';

type State = Readonly<{
    employeeList: EmployeeResponse
}>

type Action = {
    type: string;
    payload: any;
}

const initialState: State = {
    employeeList: undefined
}

export function getEmployee(param: EmployeeRequest, callback: () => void) {
    return (dispatch: Dispatch) => {
        get(GET_EMPLOYEE_URL, param).then(res => {
            dispatch({
                type: GET_EMPLOYEE,
                payload: res.data
            });
            callback();
        });
    }
}

export function createEmployee(param: CreateRequest, callback: () => void) {
    return (dispatch: Dispatch) => {
        post(CREATE_EMPLOYEE_URL, param).then(res => {
            dispatch({
                type: CREATE_EMPLOYEE,
                payload: {
                    name: param.name,
                    department: department[param.departmentId],
                    departmentId: param.departmentId,
                    hiredate: param.hiredate,
                    level: level[param.levelId],
                    levelId: param.levelId,
                    ...res.data
                }
            });
            callback();
        });
    }
}

export function deleteEmployee(param: DeleteRequest) {
    return (dispatch: Dispatch) => {
        post(DELETE_EMPLOYEE_URL, param).then(res => {
            dispatch({
                type: DELETE_EMPLOYEE,
                payload: param.id
            })
        });
    }
}

export function updateEmployee(param: UpdateRequest, callback: () => void) {
    return (dispatch: Dispatch) => {
        post(UPDATE_EMPLOYEE_URL, param).then(res => {
            dispatch({
                type: UPDATE_EMPLOYEE,
                payload: param
            });
            callback();
        });
    }
}

export default function(state = initialState, action: Action) {
    switch (action.type) {
        case GET_EMPLOYEE:
            return {
                ...state,
                employeeList: action.payload
            }
        case CREATE_EMPLOYEE:
            let newList = [action.payload, ...(state.employeeList as EmployeeInfo[])]
            return {
                ...state,
                employeeList: newList
            }
        case DELETE_EMPLOYEE:
            let reducedList = [...(state.employeeList as EmployeeInfo[])];
            _.remove(reducedList, (item: EmployeeInfo) => {
                return item.id === action.payload
            });
            return {
                ...state,
                employeeList: reducedList
            }
        case UPDATE_EMPLOYEE:
            let updatedList = [...(state.employeeList as EmployeeInfo[])];
            let item: UpdateRequest = action.payload;
            let index = _.findIndex(updatedList, {
                id: item.id
            });
            updatedList[index] = {
                id: item.id,
                key: item.id,
                name: item.name,
                department: department[item.departmentId],
                departmentId: item.departmentId,
                hiredate: item.hiredate,
                level: level[item.levelId],
                levelId: item.levelId
            }
            return {
                ...state,
                employeeList: updatedList
            }
        default:
            return state
    }
}
```

`type Action = { type: string; payload: any }` 这个写法在当年很普遍，但它其实把 action 的类型检查基本放弃了，`switch` 里拿到的 `payload` 是 `any`，写错字段名编译器一声不吭。

现在的做法完全不一样了。Redux Toolkit 的 `createSlice` 能从 reducer 的实现里反推出 action 的类型，`PayloadAction<T>` 把 payload 精确标出来，前面 1.15.1 讲的可辨识联合在这里正好派上用场。如果项目还在用手写 reducer，至少可以把 `Action` 改成一个联合类型，让每种 action 的 payload 各有各的形状。

### 3.3 服务端使用Typescript

> 项目地址 https://github.com/poetries/typescript-in-action/tree/master/ts-express

Node 侧用 TypeScript 的收益比前端还明显，因为服务端代码的调用关系更深，一个字段改名可能牵动十几个文件。Express 的类型定义在 `@types/express` 里，`Request`、`Response`、`NextFunction` 三个类型基本够用；给 `req` 挂自定义字段（比如鉴权中间件塞进去的 `req.user`）就用前面讲的 `declare global` 扩展。

### 3.4 Vue项目实践

> 项目代码 https://github.com/poetries/typescript-in-action/tree/master/ts-vue

> TS不能识别`.vue`文件，需要声明文件

`.vue` 是单文件组件，对 TypeScript 来说就是个不认识的扩展名。所以每个 Vue + TS 项目都得有这么一个声明文件，告诉编译器「凡是以 `.vue` 结尾的模块，默认导出都是一个 Vue 组件」。

```ts
// vue-shims.d.ts

declare module '*.vue' {
    import Vue from 'vue'
    export default Vue
  }
  
```

这份是 Vue 2 时代的写法。Vue 3 里对应的类型换成了 `DefineComponent`，而且如果你用 Vite 加官方插件，这个 shim 通常已经由 `vite/client` 或者插件自带的类型文件提供了，不用自己写。类型检查也从 `tsc` 换成了 `vue-tsc`，因为要连模板里的表达式一起检查。

## 总结

回头看这三章，TypeScript 真正难的从来不是语法。基础篇那些正确与错误的对照，练个两周就形成肌肉记忆了；工程篇的声明文件和 tsconfig，查一次文档抄一次模板也能应付。真正拉开差距的是两件事。

**一是知道编译器为什么拦你**。联合类型不能访问非共有成员、任意属性要求其它属性是它的子集、多继承时同名属性类型必须一致，这些规则背后都有一致的逻辑，想通了就不用死记。想不通的时候就退回到那个问题：编译器现在掌握的信息，够不够它确定这个操作是安全的。

二是知道**什么时候该放手**。`as any`、`!`、`{} as Foo`，这几个都是把检查关掉的开关，用了不丢人，但要清楚代价是什么，并且在旁边写清楚为什么。类型系统是拿来降低维护成本的，不是拿来做类型体操比赛的。

这篇写于 2019 年，当时 TypeScript 还是 3.x。这些年变化最大的是周边生态：TSLint 没了，CRA 不推荐了，Babel 和 esbuild 把「转译」和「类型检查」彻底拆成了两件事，React 的类型定义也改了好几轮。但类型系统本身的核心概念，泛型、条件类型、类型收窄这几样，六年下来基本没动过，学一次能用很久。

## 参考

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript Handbook 中文版](https://ts.dev.org.tw/docs/handbook/intro.html)
- [DefinitelyTyped 类型定义仓库](https://github.com/DefinitelyTyped/DefinitelyTyped)
- [TypeSearch 声明文件查找](https://microsoft.github.io/TypeSearch/)
- [typescript-eslint 官网](https://typescript-eslint.io/)
- [本文配套示例代码 typescript-in-action](https://github.com/poetries/typescript-in-action)
- [TypeScript 从零实现 axios](http://blog.poetries.top/ts-axios/chapter1/)
- [Typescript基础及结合React实践(一)](http://blog.poetries.top/2018/12/29/ts-intro-and-use-in-react/)
- [Typescript总结篇（二）](http://blog.poetries.top/2018/12/30/ts-summary/)
- [Typescript+React模板搭建（三）](http://blog.poetries.top/2018/12/31/ts-react-template/)
- [原文地址](https://github.com/poetries/poetries.github.io/edit/dev/source/_posts/ts-in-action.md)
- [前端进阶之旅](https://interview.poetries.top)
