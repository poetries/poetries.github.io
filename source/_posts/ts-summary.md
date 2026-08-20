---
title: Typescript总结篇（二） 语法全景与工程配置
description: TypeScript 语法系统性总结，从原始类型、接口、函数、类型断言、声明文件，到元组、枚举、类、泛型、声明合并和 tsconfig 编译选项，每条规则都配报错示例。
date: 2018-12-30 12:30:14
tags: 
  - Typescript
  - Javascript
  - 前端工程化
categories: Front-End
---

写完上一篇把 TypeScript 和 React 接起来之后，我发现一个问题：项目能跑，但很多规则我只是「照着写」，不知道为什么。比如为什么定义了任意属性之后，可选属性的类型也被限制住了；比如为什么函数重载要把精确的签名写在前面。这些细节在赶项目的时候不影响你交付，但一旦出错，你会盯着报错信息发呆很久。

所以这篇是一次系统性的补课。我按照官方 Handbook 的脉络，把 TypeScript 的语法从原始类型一路梳理到泛型和声明合并，每一条规则都配上会报错的反例和真实的报错信息。目标很明确，下次编译器拦你的时候，你能一眼认出这是哪条规则在起作用，而不是靠加 `any` 蒙混过去。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- TypeScript 是什么、它和 ES6/ES5 的关系，以及它的优点和真实存在的成本
- 五种原始数据类型的标注方式，`any` 的传染性，还有类型推论到底在什么时候生效
- 联合类型的访问规则，以及接口的四种属性形态（确定、可选、任意、只读）之间的约束关系
- 数组的四种定义方式、类数组为什么不能标成数组
- 函数声明与函数表达式的类型写法、可选参数、默认值、剩余参数和函数重载的匹配顺序
- 类型断言的两种语法、它能做什么和绝对不能做什么
- `declare` 声明语句、`.d.ts` 声明文件、`@types` 第三方声明文件和内置对象的类型来源
- 类型别名、字符串字面量类型、元组的越界规则
- 枚举的手动赋值、常数项与计算所得项、常数枚举和外部枚举
- 类的三种访问修饰符、抽象类，以及类与接口的四种关系
- 泛型的约束、泛型接口、泛型类和泛型参数默认类型
- 函数、接口、类的声明合并规则
- `tsconfig.json` 全量编译选项注释，以及一组可以直接抄的实战代码示例

这篇写于 2018 年底，当时 TypeScript 是 3.2。语法主干这些年基本没动，但周边有几处变了（`namespace` 和三斜线指令让位给 ES module，`enum` 有了新的替代方案，`satisfies` 和模板字面量类型是后来才有的），我会在对应的小节里另起一段说明。第一篇 [Typescript基础及结合React实践(一)](https://feinterview.poetries.top/blog/ts-intro-and-use-in-react) 讲的是怎么把环境搭起来把项目跑通，这篇专攻语法本身，两篇分工不同，重复的部分我尽量做了区分。

## 一、简介

### 1.1 什么是 TypeScript

- `TypeScript` 是 `JavaScript` 的一个超集，主要提供了类型系统和对 `ES6 `的支持
- `TypeScript` 是由微软开发的一款开源的编程语言
- `TypeScript` 是 `Javascript` 的超级，遵循最新的 `ES6`、`Es5` 规范。`TypeScript` 扩展了 `JavaScript` 的语法
- `TypeScript` 更像后端 `java`、`C#`这样的面向对象语言可以让 `js` 开发大型企业项目

### 1.2 为什么选择 TypeScript

> `Typescript`和`es6`、`es5`关系

这三者的关系用一张同心圆图最清楚：ES5 是内圈，ES6 在它外面又加了一圈，TypeScript 是最外面那圈。也就是说合法的 ES5 代码天然是合法的 TypeScript 代码，反过来不成立。

![TypeScript ES6 ES5 三者的超集包含关系示意图](https://s.poetries.top/gitee/2019/10/583.png)

这张图能解释一件事，为什么迁移成本比想象中低。`.js` 改名成 `.ts` 就能编译通过（前提是不开严格模式），你可以一个文件一个文件慢慢加类型，不用停下来做大重构。

**TypeScript 增加了代码的可读性和可维护性**

- 类型系统实际上是最好的文档，大部分的函数看看类型的定义就可以知道如何使用了
- 可以在编译阶段就发现大部分错误，这总比在运行时候出错好
- 增强了编辑器和 `IDE` 的功能，包括代码补全、接口提示、跳转到定义、重构等

**TypeScript 非常包容**

- `TypeScript` 是 `JavaScript` 的超集，`.js` 文件可以直接重命名为 `.ts` 即可
- 即使不显式的定义类型，也能够自动做出类型推论
- 可以定义从简单到复杂的几乎一切类型
- 即使 `TypeScript` 编译报错，也可以生成 `JavaScript` 文件
- 兼容第三方库，即使第三方库不是用 `TypeScript` 写的，也可以编写单独的类型文件供 `TypeScript` 读取

**TypeScript 拥有活跃的社区**

- 大部分第三方库都有提供给 `TypeScript` 的类型定义文件
- `Google` 开发的` Angular2` 就是使用 `TypeScript` 编写的
- `TypeScript` 拥抱了 `ES6` 规范，也支持部分 `ESNext` 草案的规范
- 最新的 `Vue` 、`React` 也可以集成 `TypeScript`


**TypeScript 的缺点**


- 有一定的学习成本，需要理解接口（`Interfaces`）、泛型（`Generics`）、类（`Classes`）、枚举类型（`Enums`）等前端工程师可能不是很熟悉的概念
- 短期可能会增加一些开发成本，毕竟要多写一些类型的定义，不过对于一个需要长期维护的项目，`TypeScript` 能够减少其维护成本
- 集成到构建流程需要一些工作量
- 可能和一些库结合的不是很完美

这份优缺点清单里有两条我想再强调。「Angular2 是用 TypeScript 写的」在 2018 年还是个有力的背书，现在更有说服力的是 Vue 3、Vite、Next.js、Nest、Playwright 这些主流工具全都是 TypeScript 写的，`@types` 反而成了少数派。另一条「即使编译报错也会生成 JS 文件」，这个行为可以用 `noEmitOnError` 关掉，团队里建议关掉，不然 CI 会给你一种「构建成功」的错觉。

至于缺点里的学习成本，我自己的感受是它不是一次性的。刚上手两周就能写业务，但真正遇到复杂类型（高阶组件的 props 推断、库的泛型签名）时会再卡一次，这一次的坎比第一次高。

### 1.3 安装 TypeScript

**typescript 安装**

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

> 那么我们每次都要输`tsc hello.ts`命令来编译，这样很麻烦，能否让它自动编译？答案是可以的，使用`vscode`来开发，需要配置一下`vscode`就可以。

> 首先我们在命令行执行`tsc --init`来生成配置文件，然后我们在目录下看到生成了一个`tsconfig.json`文件

生成出来的配置文件是这样，里面大部分选项都是注释掉的，可以当成一份带说明的清单来读。

![tsc --init 生成的 tsconfig.json 配置文件内容](https://s.poetries.top/gitee/2019/10/584.png)

> 这个`json`文件里有很多选项

- `target`是选择编译到什么语法
- `module`则是模块类型
- `outDir`则是输出目录，可以指定这个参数到指定目录

> 更多细节 https://zhongsp.gitbooks.io/typescript-handbook/content/doc/handbook/tsconfig.json.html

> 接下来我们需要开启监控了，在`vscode`任务栏中

在任务栏里选 `tsc: 监视`，编译器就常驻后台，改一次保存编译一次。

![VS Code 中开启 tsc 监视任务的入口](https://s.poetries.top/gitee/2019/10/585.png)

开起来之后，终端会一直挂着输出。这一步做完你才有一个能反复试错的环境，下面几十个反例都得靠它去验证。

### 1.4 Hello TypeScript

> 将以下代码复制到 `hello.ts` 中

```js
function sayHello(person: string) {
    return 'Hello, ' + person;
}

let user = 'poetries';
console.log(sayHello(user));
```

```js
tsc hello.ts
```

```js
//这时候会生成一个编译好的文件 hello.js：

function sayHello(person) {
    return 'Hello, ' + person;
}
var user = 'poetries';
console.log(sayHello(user));
```

> `TypeScript` 中，使用 `:` 指定变量的类型，`:` 的前后有没有空格都可以

- `TypeScript` 只会进行静态检查，如果发现有错误，编译的时候就会报错
- `TypeScript` 编译的时候即使报错了，还是会生成编译结果，我们仍然可以使用这个编译之后的文件

对比一下 `hello.ts` 和 `hello.js` 就会发现，除了 `let` 变 `var`、`: string` 被删掉，什么都没变。这就是理解 TypeScript 的第一把钥匙，它是纯编译期的东西，不给运行时增加任何负担，也就意味着它保护不了运行时真正收到的数据。接口返回的数据跟你声明的类型不一致，编译器一无所知，该炸还是炸。想在运行时也校验，得另外上 zod 这类运行时校验库。

## 二、基础

这一章覆盖日常写业务九成会用到的东西。我建议不要跳着看，因为后面几节的规则是叠在前面的规则上的，比如「任意属性」那条约束你不先理解索引签名就会觉得莫名其妙。

### 2.1 原始数据类型

> `JavaScript` 的类型分为两种：原始数据类型（`Primitive data types`）和对象类型（`Object types`）。

- 原始数据类型包括：`布尔值`、`数值`、`字符串`、`null`、`undefined` 以及 `ES6 `中的新类型 `Symbol`。

> 本节主要介绍前五种原始数据类型在 `TypeScript` 中的应用

#### 2.1.1 布尔值

> 布尔值是最基础的数据类型，在 `TypeScript` 中，使用 `boolean` 定义布尔值类型

```js
let isDone: boolean = false;

// 编译通过
// 后面约定，未强调编译错误的代码片段，默认为编译通过
```

> 注意，使用构造函数 `Boolean` 创造的对象不是布尔值

```js
let createdByNewBoolean: boolean = new Boolean(1);

// index.ts(1,5): error TS2322: Type 'Boolean' is not assignable to type 'boolean'.
// 后面约定，注释中标出了编译报错的代码片段，表示编译未通过
```

- 事实上 `new Boolean()` 返回的是一个 `Boolean` 对象：

```
let createdByNewBoolean: Boolean = new Boolean(1);
```

- 直接调用 `Boolean` 也可以返回一个 `boolean` 类型：

```
let createdByBoolean: boolean = Boolean(1);
```

- 在 `TypeScript` 中，`boolean `是 `JavaScript` 中的基本类型，而 `Boolean` 是 `JavaScript `中的构造函数。其他基本类型（除了 `null` 和 `undefined`）一样

大小写这条规则我建议直接记成一句话：小写的永远是你要的那个。`String`、`Number`、`Boolean` 这三个大写形态在业务代码里几乎没有正当用途，看到就该怀疑是写错了。有些 lint 规则（typescript-eslint 的 `no-wrapper-object-types`）会直接把它们标成错误。

#### 2.1.2 数值

> 使用 `number` 定义数值类型

```js
let decLiteral: number = 6;
let hexLiteral: number = 0xf00d;

// ES6 中的二进制表示法
let binaryLiteral: number = 0b1010;

// ES6 中的八进制表示法
let octalLiteral: number = 0o744;
let notANumber: number = NaN;
let infinityNumber: number = Infinity;
```

```js
//编译结果：

var decLiteral = 6;
var hexLiteral = 0xf00d;
// ES6 中的二进制表示法
var binaryLiteral = 10;
// ES6 中的八进制表示法
var octalLiteral = 484;
var notANumber = NaN;
var infinityNumber = Infinity;
```

> 其中 `0b101`0 和 `0o744 `是 `ES6` 中的二进制和八进制表示法，它们会被编译为十进制数字

#### 2.1.3 字符串

> 使用 `string` 定义字符串类型：

```js
let myName: string = 'Tom';
let myAge: number = 25;

// 模板字符串
let sentence: string = `Hello, my name is ${myName}.
I'll be ${myAge + 1} years old next month.`;
```

#### 2.1.4 空值

> `JavaScript` 没有空值（`Void`）的概念，在 `TypeScript` 中，可以用 `void` 表示没有任何返回值的函数

```js
function alertName(): void {
    alert('My name is Tom');
}
```

> 声明一个 `void` 类型的变量没有什么用，因为你只能将它赋值为 `undefined `和 `null`：

```
let unusable: void = undefined;
```

#### 2.1.5 Null 和 Undefined

> 在 `TypeScript` 中，可以使用 `null` 和 `undefined `来定义这两个原始数据类型：

```js
let u: undefined = undefined;
let n: null = null;
```

> `undefined` 类型的变量只能被赋值为 `undefined`，`null` 类型的变量只能被赋值为 `null`

- 与 `void` 的区别是，`undefined `和 `null` 是所有类型的子类型。也就是说 `undefined` 类型的变量，可以赋值给 `number` 类型的变量

```js
// 这样不会报错
let num: number = undefined;

// 这样也不会报错
let u: undefined;
let num: number = u;
```

> 而 `void` 类型的变量不能赋值给 `number` 类型的变量：

```js
let u: void;
let num: number = u;

// index.ts(2,5): error TS2322: Type 'void' is not assignable to type 'number'.
```

这一节有个大前提得说清楚，「`undefined` 和 `null` 是所有类型的子类型」这句话只在 `strictNullChecks` 关闭时成立。2018 年那会儿这个开关默认是关的，所以 `let num: number = undefined` 不报错。现在 `tsc --init` 生成的配置默认 `strict: true`，`strictNullChecks` 包在里面，上面那两段代码会直接报错，你必须写成 `number | undefined`。

我的建议是新项目一定开着。空值是 JavaScript 里最大的一类运行时错误来源，关掉这个开关等于放弃了 TypeScript 一半的价值。老项目迁移则可以先单独把 `strictNullChecks` 打开，逐个文件修，比一次性上 `strict` 温和。

### 2.2 任意值Any

> 如果是一个普通类型，在赋值过程中改变类型是不被允许的

```js
let myFavoriteNumber: string = 'seven';
myFavoriteNumber = 7;

// index.ts(2,1): error TS2322: Type 'number' is not assignable to type 'string'.
```

> 但如果是 `any` 类型，则允许被赋值为任意类型。

```js
let myFavoriteNumber: any = 'seven';
myFavoriteNumber = 7;
```

**任意值的属性和方法**

在任意值上访问任何属性都是允许的：

```js
let anyThing: any = 'hello';

console.log(anyThing.myName);
console.log(anyThing.myName.firstName);
```

**也允许调用任何方法**：

```js
let anyThing: any = 'Tom';

anyThing.setName('Jerry');
anyThing.setName('Jerry').sayHello();
anyThing.myName.setFirstName('Cat');
```

> 可以认为，声明一个变量为任意值之后，对它的任何操作，返回的内容的类型都是任意值

**未声明类型的变量**

> 变量如果在声明的时候，未指定其类型，那么它会被识别为任意值类型：

```js
let something;
something = 'seven';
something = 7;

something.setName('Tom');
```

等价于

```js
let something: any;
something = 'seven';
something = 7;

something.setName('Tom');
```

`any` 有个很要命的性质，它会传染。一个 `any` 值参与任何运算，结果还是 `any`；`any` 传进一个函数，函数内部对它的所有推断也跟着塌掉。所以项目里一处 `any` 往往会顺着调用链污染一大片，你以为只放弃了一个变量的检查，实际上放弃了一条链路。

TypeScript 3.0 后来加了 `unknown`，它就是为了治这个。`unknown` 同样能接受任何值，但你在用它之前必须先收窄（`typeof` 判断、类型断言或者类型守卫），一步都省不掉。所以处理 `JSON.parse` 的结果、`catch` 到的错误对象这类「真的不知道是什么」的场景，`unknown` 比 `any` 合适得多。这一条是我后来才改过来的习惯，2018 年那会儿满篇都是 `any`。

### 2.3 类型推论

> 如果没有明确的指定类型，那么 `TypeScript` 会依照类型推论（`Type Inference`）的规则推断出一个类型

**什么是类型推论**

以下代码虽然没有指定类型，但是会在编译的时候报错：

```
let myFavoriteNumber = 'seven';
myFavoriteNumber = 7;

// index.ts(2,1): error TS2322: Type 'number' is not assignable to type 'string'.
```

事实上，它等价于：

```
let myFavoriteNumber: string = 'seven';
myFavoriteNumber = 7;

// index.ts(2,1): error TS2322: Type 'number' is not assignable to type 'string'.
```

`TypeScript` 会在没有明确的指定类型的时候推测出一个类型，这就是类型推论

**如果定义的时候没有赋值，不管之后有没有赋值，都会被推断成 any 类型而完全不被类型检查**

```js
let myFavoriteNumber;

myFavoriteNumber = 'seven';
myFavoriteNumber = 7;
```

这条区分很重要，它决定了什么时候该手写类型。声明的同时赋值，推断出来的类型通常就是你想要的，再手写一遍 `: string` 属于噪音；声明的时候不赋值，类型就塌成 `any`，这时候必须手写。

顺带说个后来的变化。TypeScript 4.0 加了「基于控制流的 `any` 推断」，上面那种先声明后赋值的变量在部分场景下也能被推断出具体类型，编辑器悬浮上去会看到 `string` 而不是 `any`。但这个优化有条件限制，别指望它兜底，该写的类型还是写上，具体行为以官方发布说明为准。

### 2.4 联合类型

> 联合类型（`Union Types`）表示取值可以为多种类型中的一种

```js
// 简单例子

let myFavoriteNumber: string | number;
myFavoriteNumber = 'seven';
myFavoriteNumber = 7;
```

```js
let myFavoriteNumber: string | number;
myFavoriteNumber = true;

// index.ts(2,1): error TS2322: Type 'boolean' is not assignable to type 'string | number'.
//   Type 'boolean' is not assignable to type 'number'.
```

- 联合类型使用 `|` 分隔每个类型。
- 这里的 `let myFavoriteNumber: string | number` 的含义是，允许 `myFavoriteNumber` 的类型是 `string` 或者 `number`，但是不能是其他类型

**访问联合类型的属性或方法**

> 当 `TypeScript` 不确定一个联合类型的变量到底是哪个类型的时候，我们只能访问此联合类型的所有类型里共有的属性或方法

```js
function getLength(something: string | number): number {
    return something.length;
}

// length 不是 string 和 number 的共有属性，所以会报错
// index.ts(2,22): error TS2339: Property 'length' does not exist on type 'string | number'.
//   Property 'length' does not exist on type 'number'.
```

> 访问 `string` 和 `number` 的共有属性是没问题的

```js
function getString(something: string | number): string {
    return something.toString();
}
```

> 联合类型的变量在被赋值的时候，会根据类型推论的规则推断出一个类型

```js
let myFavoriteNumber: string | number;
myFavoriteNumber = 'seven';

console.log(myFavoriteNumber.length); // 5

myFavoriteNumber = 7;
console.log(myFavoriteNumber.length); // 编译时报错

// index.ts(5,30): error TS2339: Property 'length' does not exist on type 'number'.
```

- 上例中，第二行的 `myFavoriteNumber` 被推断成了 `string`，访问它的 `length` 属性不会报错。
- 而第四行的 `myFavoriteNumber` 被推断成了 `number`，访问它的 `length` 属性时就报错了

这里其实已经出现了类型收窄，只不过是最简单的一种，赋值触发的收窄。更常用的是 `typeof` 判断触发的收窄：

```js
function getLength(something: string | number): number {
    if (typeof something === 'string') {
        return something.length; // 这里 something 已经被收窄成 string
    }
    return something.toString().length;
}
```

写成这样就不用类型断言了。下面 2.8 讲类型断言的时候会看到，原文用的是 `<string>something` 这种断言写法，能跑，但收窄才是更安全的解法，因为断言是「我保证」，收窄是「编译器验证过了」。

### 2.5 对象的类型和接口

#### 2.5.1 简单例子

> 在 `TypeScript` 中，我们使用接口（`Interfaces`）来定义对象的类型

**什么是接口**

- 在面向对象语言中，接口（`Interfaces`）是一个很重要的概念，它是对行为的抽象，而具体如何行动需要由类（`classes`）去实现（`implements`）。
- `TypeScript` 中的接口是一个非常灵活的概念，除了可用于对类的一部分行为进行抽象以外，也常用于对「对象的形状（`Shape`）」进行描述。

接口一般首字母大写

```js
interface Person {
    name: string;
    age: number;
}

let tom: Person = {
    name: 'Tom',
    age: 25
};
```

> 上面的例子中，我们定义了一个接口 `Person`，接着定义了一个变量 `tom`，它的类型是 `Person`。这样，我们就约束了 `tom` 的形状必须和接口 `Person` 一致


**定义的变量比接口少了一些属性是不允许的**


```js
interface Person {
    name: string;
    age: number;
}

let tom: Person = {
    name: 'Tom'
};

// index.ts(6,5): error TS2322: Type '{ name: string; }' is not assignable to type 'Person'.
//   Property 'age' is missing in type '{ name: string; }'.
```

**多一些属性也是不允许的**

```js
interface Person {
    name: string;
    age: number;
}

let tom: Person = {
    name: 'Tom',
    age: 25,
    gender: 'male'
};

// index.ts(9,5): error TS2322: Type '{ name: string; age: number; gender: string; }' is not assignable to type 'Person'.
//   Object literal may only specify known properties, and 'gender' does not exist in type 'Person'.
```


> 可见，赋值的时候，变量的形状必须和接口的形状保持一致。

「多一些属性也不允许」这条要补个前提，它只对对象字面量成立。下面这样写就不报错：

```js
let obj = { name: 'Tom', age: 25, gender: 'male' };
let tom: Person = obj; // 通过
```

这个规则叫多余属性检查，只在你把一个字面量直接赋给带类型的变量（或者直接传给函数参数）时触发。设计意图是：既然你现场写字面量，多写的那个字段大概率是拼错了字段名；而先赋给变量再传，说明这个对象另有用途，带点额外字段是正常的。

我第一次遇到的时候完全懵了，同样的数据换个写法一个报错一个不报，排查了一下午才明白是这条规则。知道了之后反而挺好用，临时想绕开它的话，中间加个变量就行，或者用 `as` 断言，但后者会顺带关掉别的检查，不推荐。

#### 2.5.2 可选属性

> 有时我们希望不要完全匹配一个形状，那么可以用可选属性

可选属性的含义是该属性可以不存在

```js
interface Person {
    name: string;
    age?: number;
}

let tom: Person = {
    name: 'Tom'
};
```


```js
interface Person {
    name: string;
    age?: number;
}

let tom: Person = {
    name: 'Tom',
    age: 25
};
```

#### 2.5.3 任意属性

> 有时候我们希望一个接口允许有任意的属性，可以使用如下方式


```js
interface Person {
    name: string;
    age?: number;
    [propName: string]: any;
}

let tom: Person = {
    name: 'Tom',
    gender: 'male'
};
```

- 使用 `[propName: string]` 定义了任意属性取 `string` 类型的值
- 需要注意的是，**一旦定义了任意属性，那么确定属性和可选属性都必须是它的子属性**

```js
interface Person {
    name: string;
    age?: number;
    [propName: string]: string;
}

let tom: Person = {
    name: 'Tom',
    age: 25,
    gender: 'male'
};

// index.ts(3,5): error TS2411: Property 'age' of type 'number' is not assignable to string index type 'string'.
// index.ts(7,5): error TS2322: Type '{ [x: string]: string | number; name: string; age: number; gender: string; }' is not assignable to type 'Person'.
//   Index signatures are incompatible.
//     Type 'string | number' is not assignable to type 'string'.
//       Type 'number' is not assignable to type 'string'.
```

- 上例中，任意属性的值允许是 `string`，但是可选属性 `age` 的值却是 `number`，`number `不是 `string` 的子属性，所以报错了。
- 另外，在报错信息中可以看出，此时 `{ name: 'Tom', age: 25, gender: 'male' } `的类型被推断成了 `{ [x: string]: string | number; name: string; age: number; gender: string; }`，这是联合类型和接口的结合

那为什么定义了任意属性之后，别的属性也要跟着受限呢？想想看，索引签名 `[propName: string]: string` 的意思是「任何 string 键取出来都是 string」。而 `age` 也是一个 string 键，如果它的值是 `number`，这句承诺就被打破了。编译器只是在保证自己不撒谎。

所以实际用的时候，任意属性的类型要么写宽一点（`any`、`unknown`），要么写成能覆盖所有具体属性的联合类型（这里就是 `string | number`）。我个人的做法是尽量不写任意属性，它等于给接口开了个后门，拼错字段名编译器也不会拦。真需要动态键，宁可单独用 `Record<string, T>` 把动态部分隔离出来。

#### 2.5.4 只读属性

> 有时候我们希望对象中的一些字段只能在创建的时候被赋值，那么可以用 `readonly `定义只读属性

```js
interface Person {
    readonly id: number;
    name: string;
    age?: number;
    [propName: string]: any;
}

let tom: Person = {
    id: 89757,
    name: 'Tom',
    gender: 'male'
};

tom.id = 9527;

// index.ts(14,5): error TS2540: Cannot assign to 'id' because it is a constant or a read-only property.
```

> 上例中，使用 `readonly` 定义的属性 `id` 初始化后，又被赋值了，所以报错了

**注意，只读的约束存在于第一次给对象赋值的时候，而不是第一次给只读属性赋值的时候**


```js
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

tom.id = 89757;

// index.ts(8,5): error TS2322: Type '{ name: string; gender: string; }' is not assignable to type 'Person'.
//   Property 'id' is missing in type '{ name: string; gender: string; }'.
// index.ts(13,5): error TS2540: Cannot assign to 'id' because it is a constant or a read-only property.
```

- 上例中，报错信息有两处，第一处是在对 `tom` 进行赋值的时候，没有给 `id` 赋值。
- 第二处是在给 `tom.id` 赋值的时候，由于它是只读属性，所以报错了

`readonly` 只管一层，它挡住的是「重新赋值这个字段」，挡不住「修改这个字段指向的对象内部」。`readonly config: { a: number }` 的话，`obj.config = {...}` 报错，`obj.config.a = 1` 照样通过。想要深度只读得自己递归写映射类型，或者上 immutable 那类库。

跟它相关的还有 `ReadonlyArray<T>`（或者写成 `readonly T[]`），能把 `push`、`pop` 这些改变数组的方法从类型上摘掉，给函数参数标上它，就等于告诉调用方「我不会动你的数组」。

### 2.6 数组的类型

> 在 `TypeScript` 中，数组类型有多种定义方式，比较灵活。

#### 2.6.1「类型 + 方括号」表示法

> 最简单的方法是使用「类型 + 方括号」来表示数组：

```js
let fibonacci: number[] = [1, 1, 2, 3, 5];
```

> 数组的项中不允许出现其他的类型

```js
let fibonacci: number[] = [1, '1', 2, 3, 5];

// index.ts(1,5): error TS2322: Type '(number | string)[]' is not assignable to type 'number[]'.
//   Type 'number | string' is not assignable to type 'number'.
//     Type 'string' is not assignable to type 'number'.
```

- 上例中，`[1, '1', 2, 3, 5]` 的类型被推断为 `(number | string)[]`，这是联合类型和数组的结合。
- 数组的一些方法的参数也会根据数组在定义时约定的类型进行限制

```js
let fibonacci: number[] = [1, 1, 2, 3, 5];
fibonacci.push('8');

// index.ts(2,16): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

> 上例中，`push` 方法只允许传入 `number` 类型的参数，但是却传了一个 `string` 类型的参数，所以报错了

#### 2.6.2 数组泛型

> 也可以使用数组泛型（`Array Generic`）` Array<elemType> `来表示数组

```js
let fibonacci: Array<number> = [1, 1, 2, 3, 5];
```

#### 2.6.3 用接口表示数组

```js
interface NumberArray {
    [index: number]: number;
}
let fibonacci: NumberArray = [1, 1, 2, 3, 5];
```

> `NumberArray` 表示：只要 `index` 的类型是 `number`，那么值的类型必须是 `number`

#### 2.6.4 any 在数组中的应用

> 一个比较常见的做法是，用 `any` 表示数组中允许出现任意类型：

```js
let list: any[] = ['poetries', 22, { website: 'http://blog.poetries.top' }];
```

#### 2.6.5 类数组

> 类数组（`Array-like Object`）不是数组类型，比如 `arguments`

```js
function sum() {
    let args: number[] = arguments;
}

// index.ts(2,7): error TS2322: Type 'IArguments' is not assignable to type 'number[]'.
//   Property 'push' is missing in type 'IArguments'.
```

> 事实上常见的类数组都有自己的接口定义，如 `IArguments`, `NodeList`, `HTMLCollection` 等：

```js
function sum() {
    let args: IArguments = arguments;
}
```

四种写法里，`number[]` 是日常首选，最短最清楚。`Array<number>` 在类型比较复杂时读起来更顺，比如 `Array<{ id: number; name: string }>` 就比 `{ id: number; name: string }[]` 好断句。接口那种写法基本只在需要额外描述别的属性时才用。

类数组这一条现在遇到的机会少了，因为写箭头函数根本没有 `arguments`，剩余参数 `...args: number[]` 直接就是真数组。但 `NodeList`、`HTMLCollection` 还是会碰到，`document.querySelectorAll` 返回的是 `NodeListOf<Element>`，想用 `map` 得先 `Array.from()` 转一下。

### 2.7 函数的类型

函数是类型标注最密集的地方，输入输出各一套。这一节的六个小点顺序是有讲究的，从最简单的函数声明开始，逐步加上可选、默认值、剩余参数，最后是重载。

#### 2.7.1 函数声明

> 在 `JavaScript` 中，有两种常见的定义函数的方式，函数声明（`Function Declaration`）和函数表达式（`Function Expression`）

```js
// 函数声明（Function Declaration）
function sum(x, y) {
    return x + y;
}

// 函数表达式（Function Expression）
let mySum = function (x, y) {
    return x + y;
};
```

> 一个函数有输入和输出，要在 `TypeScript` 中对其进行约束，需要把输入和输出都考虑到，其中函数声明的类型定义较简单

```js
function sum(x: number, y: number): number {
    return x + y;
}
```

**注意，输入多余的（或者少于要求的）参数，是不被允许的：**

```js
function sum(x: number, y: number): number {
    return x + y;
}
sum(1, 2, 3);

// index.ts(4,1): error TS2346: Supplied parameters do not match any signature of call target.
```

```js
function sum(x: number, y: number): number {
    return x + y;
}
sum(1);

// index.ts(4,1): error TS2346: Supplied parameters do not match any signature of call target.
```

#### 2.7.2 函数表达式

> 如果要我们现在写一个对函数表达式（`Function Expression`）的定义，可能会写成这样

```js
let mySum = function (x: number, y: number): number {
    return x + y;
};
```

> 这是可以通过编译的，不过事实上，上面的代码只对等号右侧的匿名函数进行了类型定义，而等号左边的 `mySum`，是通过赋值操作进行类型推论而推断出来的。如果需要我们手动给 `mySum` 添加类型，则应该是这样

```js
// =>左边 (x: number, y: number) 是输入类型 
// =>右边number是输出类型
let mySum: (x: number, y: number) => number = function (x: number, y: number): number {
    return x + y;
};
```

**注意不要混淆了 TypeScript 中的 => 和 ES6 中的 =>**

> 在 `TypeScript` 的类型定义中，`=>` 用来表示函数的定义，左边是输入类型，需要用括号括起来，右边是输出类型。

这个 `=>` 确实容易看岔。判断方法很简单，看它出现在哪：出现在冒号后面（类型位置）就是类型定义，出现在等号右边（值位置）就是箭头函数。

实践里，函数表达式的类型我一般抽成 `type`，比如 `type Sum = (x: number, y: number) => number`，然后 `let mySum: Sum = (x, y) => x + y`。注意后面那个箭头函数里的 `x` 和 `y` 不用再标类型了，编译器会从 `Sum` 反推出来，这个叫上下文类型推断。把参数类型再抄一遍是很多人写 TypeScript 时最常见的冗余。

#### 2.7.3 用接口定义函数的形状

> 我们也可以使用接口的方式来定义一个函数需要符合的形状

```js
interface SearchFunc {
    (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;
mySearch = function(source: string, subString: string) {
    return source.search(subString) !== -1;
}
```

**需要注意的是，可选参数必须接在必需参数后面。也就是说，可选参数后面不允许再出现必须参数了**

```js
function buildName(firstName?: string, lastName: string) {
    if (firstName) {
        return firstName + ' ' + lastName;
    } else {
        return lastName;
    }
}
let tomcat = buildName('Tom', 'Cat');
let tom = buildName(undefined, 'Tom');

// index.ts(1,40): error TS1016: A required parameter cannot follow an optional parameter.
```


#### 2.7.4 参数默认值


> 在 `ES6 `中，我们允许给函数的参数添加默认值，`TypeScript` 会将添加了默认值的参数识别为可选参数

```js
function buildName(firstName: string, lastName: string = 'Cat') {
    return firstName + ' ' + lastName;
}
let tomcat = buildName('Tom', 'Cat');
let tom = buildName('Tom');
```

**此时就不受「可选参数必须接在必需参数后面」的限制了**

```js
function buildName(firstName: string = 'Tom', lastName: string) {
    return firstName + ' ' + lastName;
}
let tomcat = buildName('Tom', 'Cat');
let cat = buildName(undefined, 'Cat');
```

带默认值的参数放在前面是允许的，但调用时你得手动传 `undefined` 占位，写起来挺别扭。所以这个能力知道就行，实际排参数顺序还是把可省略的往后放更舒服。

#### 2.7.5 剩余参数

> ES6 中，可以使用 `...rest` 的方式获取函数中的剩余参数（`rest` 参数）

```js
function push(array, ...items) {
    items.forEach(function(item) {
        array.push(item);
    });
}

let a = [];
push(a, 1, 2, 3);
```

> 事实上，items 是一个数组。所以我们可以用数组的类型来定义它


```js
function push(array: any[], ...items: any[]) {
    items.forEach(function(item) {
        array.push(item);
    });
}

let a = [];
push(a, 1, 2, 3);
```

> 注意，rest 参数只能是最后一个参数

#### 2.7.6 函数重载

- 重载允许一个函数接受不同数量或类型的参数时，作出不同的处理。

> 比如，我们需要实现一个函数 `reverse`，输入数字 `123` 的时候，输出反转的数字 `321`，输入字符串 `'hello'` 的时候，输出反转的字符串 `'olleh'`

**利用联合类型，我们可以这么实现**

```js
function reverse(x: number | string): number | string {
    if (typeof x === 'number') {
        return Number(x.toString().split('').reverse().join(''));
    } else if (typeof x === 'string') {
        return x.split('').reverse().join('');
    }
}
```

> 然而这样有一个缺点，就是不能够精确的表达，输入为数字的时候，输出也应该为数字，输入为字符串的时候，输出也应该为字符串

**这时，我们可以使用重载定义多个 reverse 的函数类型**

```js
function reverse(x: number): number;
function reverse(x: string): string;

function reverse(x: number | string): number | string {
    if (typeof x === 'number') {
        return Number(x.toString().split('').reverse().join(''));
    } else if (typeof x === 'string') {
        return x.split('').reverse().join('');
    }
}
```

- 上例中，我们重复定义了多次函数 `reverse`，前几次都是函数定义，最后一次是函数实现。在编辑器的代码提示中，可以正确的看到前两个提示。

> **注意**，`TypeScript` 会优先从最前面的函数定义开始匹配，所以多个函数定义如果有包含关系，需要优先把精确的定义写在前面

匹配顺序这条特别容易踩。假如你把 `function reverse(x: any): any` 写在最前面，后面两个精确签名就永远匹配不上了，因为第一个已经能接住所有调用。所以顺序是从窄到宽。

`reverse` 这个例子里还藏着一个坑，函数体最后没有兜底的 `return`。开了 `strictNullChecks` 的话编译器会报「不是所有代码路径都有返回值」，因为 `if / else if` 之后还有一条隐含的路径。把最后那个 `else if` 改成 `else` 就好了。这类问题靠 `noImplicitReturns` 编译选项能一次性扫出来。

### 2.8 类型断言

> 类型断言（`Type Assertion`）可以用来手动指定一个值的类型。

**语法**

```
<类型>值

// 或

值 as 类型
```

> 在 `tsx` 语法（`React` 的 `jsx` 语法的 `ts` 版）中必须用后一种

**例子：将一个联合类型的变量指定为一个更加具体的类型**


> 当 TypeScript 不确定一个联合类型的变量到底是哪个类型的时候，我们只能访问此联合类型的所有类型里共有的属性或方法


```js
function getLength(something: string | number): number {
    return something.length;
}

// index.ts(2,22): error TS2339: Property 'length' does not exist on type 'string | number'.
//   Property 'length' does not exist on type 'number'.
```

> 而有时候，我们确实需要在还不确定类型的时候就访问其中一个类型的属性或方法，比如

```js
function getLength(something: string | number): number {
    if (something.length) {
        return something.length;
    } else {
        return something.toString().length;
    }
}

// index.ts(2,19): error TS2339: Property 'length' does not exist on type 'string | number'.
//   Property 'length' does not exist on type 'number'.
// index.ts(3,26): error TS2339: Property 'length' does not exist on type 'string | number'.
//   Property 'length' does not exist on type 'number'.
```

> 上例中，获取 `something.length `的时候会报错

**此时可以使用类型断言，将 something 断言成 string**

```js
function getLength(something: string | number): number {
    if ((<string>something).length) {
        return (<string>something).length;
    } else {
        return something.toString().length;
    }
}
```

> 类型断言的用法如上，在需要断言的变量前加上 `<Type>` 即可

**类型断言不是类型转换，断言成一个联合类型中不存在的类型是不允许的**

```js
function toBoolean(something: string | number): boolean {
    return <boolean>something;
}

// index.ts(2,10): error TS2352: Type 'string | number' cannot be converted to type 'boolean'.
//   Type 'number' is not comparable to type 'boolean'.
```

关于类型断言我想多说两句，因为它是最容易被滥用的一个特性。

断言的语义是「我比编译器更清楚这里是什么」，它不做任何运行时转换，编译产物里一个字符都不会多。所以断言错了不会当场报错，会在后面某个访问属性的地方炸掉，而且堆栈里看不出跟断言有关。这就是为什么我上一篇里说，每次用断言都要在旁边写清楚为什么。

`<Type>value` 这种尖括号写法在 `.tsx` 文件里会跟 JSX 标签冲突，所以现在统一推荐 `value as Type`。团队里干脆用 lint 规则锁死一种写法，省得两种混着看。

断言不能跨越到「完全不相关」的类型，这就是上面 `<boolean>something` 报错的原因。真要硬转，得两步走 `something as unknown as boolean`，这个写法本身就是个警示灯，看到它就该问一句为什么。

后来 TypeScript 4.9 加了 `satisfies` 操作符，它能校验一个值符合某个类型，同时又保留字面量推断出来的更精确的类型。很多以前只能靠 `as` 凑合的场景（比如给一个配置对象加约束又不想丢掉键名的字面量类型），现在用 `satisfies` 更合适。具体行为以官方文档为准。

### 2.9 声明文件

> 当使用第三方库时，我们需要引用它的声明文件

#### 2.9.1 声明(declare)语句

> 假如我们想使用第三方库，比如 `jQuery`，我们通常这样获取一个 `id` 是 `foo` 的元素

```js
$('#foo');
// or
jQuery('#foo');
```

> 但是在 `TypeScript` 中，我们并不知道 `$` 或 `jQuery `是什么东西

```js
jQuery('#foo');

// index.ts(1,1): error TS2304: Cannot find name 'jQuery'.
```

> 这时，我们需要使用 `declare` 关键字来定义它的类型，帮助` TypeScript` 判断我们传入的参数类型对不对

```js
declare var jQuery: (selector: string) => any;

jQuery('#foo');
```

> `declare` 定义的类型只会用于编译时的检查，编译结果中会被删除

```js
//上例的编译结果是：

jQuery('#foo');
```

#### 2.9.2 声明文件(约定.d.ts后缀)

> 通常我们会把类型声明放到一个单独的文件中，这就是声明文件


```js
// jQuery.d.ts

declare var jQuery: (string) => any;
```

- 我们约定声明文件以 `.d.ts` 为后缀。
- 然后在使用到的文件的开头，用`「三斜线指令」///`表示引用了声明文件

```js
/// <reference path="./jQuery.d.ts" />

jQuery('#foo');
```

三斜线指令现在基本退场了，这是这篇里时效性最强的一处。在 ES module 的世界里，声明文件通过 `tsconfig.json` 的 `include` / `typeRoots` / `types` 被自动加载，或者干脆写成 `.d.ts` 模块用 `import` 引入，不需要在每个用到的文件顶上写一行 `///`。你现在还能在一些老库的类型包里见到它，属于兼容存在。

同理还有 `namespace`。它当年是用来在没有模块系统的浏览器脚本里做命名隔离的，现在直接用 ES module 就够了，一个文件就是一个作用域。官方文档里也明确说了新代码不建议用 `namespace` 组织模块。

#### 2.9.3 第三方声明文件

> 当然，`jQuery` 的声明文件不需要我们定义了，已经有人帮我们定义好了：[jQuery in DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jquery/index.d.ts)

```js
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jquery/index.d.ts

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

// 引入声明文件
/// <reference types="sizzle" />
/// <reference path="JQueryStatic.d.ts" />
/// <reference path="JQuery.d.ts" />
/// <reference path="misc.d.ts" />
/// <reference path="legacy.d.ts" />

export = jQuery;
```

这段头部注释顺带说明了 DefinitelyTyped 的协作方式，谁维护、对应库的哪个版本、要求的 TypeScript 最低版本，全写在文件开头。遇到类型对不上的情况，去这个仓库翻一眼往往比猜快得多。

- 我们可以直接下载下来使用，但是更推荐的是使用工具统一管理第三方库的声明文件
- 社区已经有多种方式引入声明文件，不过 `TypeScript 2.0 `推荐使用 `@types` 来管理。
- `@types` 的使用方式很简单，直接用 `npm` 安装对应的声明模块即可，以 `jQuery` 举例


```bash
npm install @types/jquery --save-dev
```

**可以在这个页面搜索你需要的声明文件**

> http://microsoft.github.io/TypeSearch/

补一条实践经验。装 `@types/*` 之前先看一眼这个库自己带不带类型，办法是翻它的 `package.json` 有没有 `types` 或 `typings` 字段。现在大部分活跃维护的库都自带，重复装 `@types` 会引入版本对不上的重复定义，报一堆看不懂的错。

如果一个库既没有自带类型，`@types` 也没人写，还有两条路。一是自己在项目里建一个 `src/types/xxx.d.ts`，写 `declare module 'xxx';` 让它变成 `any`，先跑起来再说；二是照着实际用到的 API 手写一份最小声明，只声明你用到的那几个函数。第二种更麻烦但收益更高，我一般选第二种，因为第一种等于给自己埋了个静默的 `any`。

### 2.10 内置对象


> `JavaScript` 中有很多内置对象，它们可以直接在 `TypeScript` 中当做定义好了的类型

> 内置对象是指根据标准在全局作用域（`Global`）上存在的对象。这里的标准是指 `ECMAScript` 和其他环境（比如 `DOM`）的标准

#### 2.10.1 ECMAScript 的内置对象

**ECMAScript 标准提供的内置对象有**

> `Boolean`、`Error`、`Date`、`RegExp` 等

我们可以在 `TypeScript` 中将变量定义为这些类型：

```js
let b: Boolean = new Boolean(1);

let e: Error = new Error('Error occurred');

let d: Date = new Date();

let r: RegExp = /[a-z]/;
```

> 更多的内置对象，可以查看 [MDN 的文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects)

> 而他们的定义文件，则在 [TypeScript 核心库的定义文件中](https://github.com/Microsoft/TypeScript/tree/master/src/lib)

#### 2.10.2 DOM 和 BOM 的内置对象

**DOM 和 BOM 提供的内置对象有**

> `Document`、`HTMLElement`、`Event`、`NodeList` 等。

> TypeScript 中会经常用到这些类型

```js
let body: HTMLElement = document.body;
let allDiv: NodeList = document.querySelectorAll('div');

document.addEventListener('click', function(e: MouseEvent) {
  // Do something
});
```

> 它们的定义文件同样在 [TypeScript 核心库的定义文件中](https://github.com/Microsoft/TypeScript/tree/master/src/lib)

#### 2.10.3 TypeScript 核心库的定义文件

> [TypeScript 核心库](https://github.com/Microsoft/TypeScript/tree/master/src/lib)的定义文件中定义了所有浏览器环境需要用到的类型，并且是预置在 TypeScript 中的

> 当你在使用一些常用的方法的时候，`TypeScript` 实际上已经帮你做了很多类型判断的工作了，比如

```js
Math.pow(10, '2');

// index.ts(1,14): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

> 上面的例子中，`Math.pow` 必须接受两个 `number` 类型的参数。事实上 `Math.pow `的类型定义如下

```js
interface Math {
    /**
     * Returns the value of a base expression taken to a specified power.
     * @param x The base value of the expression.
     * @param y The exponent value of the expression.
     */
    pow(x: number, y: number): number;
}
```

> 再举一个 `DOM` 中的例子

```js
document.addEventListener('click', function(e) {
    console.log(e.targetCurrent);
});

// index.ts(2,17): error TS2339: Property 'targetCurrent' does not exist on type 'MouseEvent'.

```

> 上面的例子中，`addEventListener` 方法是在 `TypeScript` 核心库中定义的

```js
interface Document extends Node, GlobalEventHandlers, NodeSelector, DocumentEvent {
    addEventListener(type: string, listener: (ev: MouseEvent) => any, useCapture?: boolean): void;
}
```

> 所以 `e` 被推断成了 `MouseEvent`，而 `MouseEvent` 是没有 `targetCurrent` 属性的，所以报错了

**注意，TypeScript 核心库的定义中不包含 Node.js 部分**

#### 2.10.4 用 TypeScript 写 Node.js

> `Node.js` 不是内置对象的一部分，如果想用 `TypeScript` 写 `Node.js`，则需要引入第三方声明文件

```bash
npm install @types/node --save-dev
```

`lib` 这个编译选项决定了你能用到哪些内置类型。写纯 Node 服务就不该带 `dom`，不然 `window`、`document` 这些在编译期是合法的，跑起来直接 ReferenceError。反过来写浏览器代码带上 `dom` 和对应的 `es2017` 之类，`Object.entries`、`Array.prototype.flat` 才有类型。装了 `@types/node` 之后，`process`、`Buffer`、`fs` 这些才认得。

回到这块，内置类型定义文件其实是学习类型写法的好材料。按住 Cmd 点进 `Math.pow` 或者 `addEventListener`，你能看到官方是怎么用重载、泛型、映射类型描述这些 API 的，比看教程直观。

## 三、进阶

上面那一章覆盖的是「怎么把类型标上去」，这一章开始处理「类型怎么组合、怎么复用」。类型别名、字面量类型、泛型这几样是从「会用 TypeScript」到「用 TypeScript 设计 API」的分水岭。

### 3.1 类型别名

> 类型别名用来给一个类型起个新名字

```js
type Name = string;

type NameResolver = () => string;

type NameOrResolver = Name | NameResolver; // 联合类型

function getName(n: NameOrResolver): Name {
    if (typeof n === 'string') {
        return n;
    } else {
        return n();
    }
}
```

上例中，我们使用 `type` 创建类型别名。

> 类型别名常用于联合类型

`type` 和 `interface` 什么时候用哪个，是个高频问题。粗线条的答案是：描述对象形状用 `interface`，需要联合、交叉、条件、映射这些「类型运算」的时候只能用 `type`。另外 `interface` 支持同名合并（前面 2.9 提到给第三方库补类型就靠它），`type` 不支持。完整的对比我写在 [TypeScript 中 interface 和 type 的区别](https://feinterview.poetries.top/blog/ts-interface-type) 这篇里了。

`type` 后来还派生出一整套工具类型，`Partial`、`Required`、`Pick`、`Omit`、`Record`、`ReturnType` 这些都是内置的。其中 `Omit` 是 TypeScript 3.5 才加的，2018 年写这篇的时候还得自己用 `Pick` 加 `Exclude` 拼。

### 3.2 字符串字面量类型

> 字符串字面量类型用来约束取值只能是某几个字符串中的一个

```js
type EventNames = 'click' | 'scroll' | 'mousemove';
function handleEvent(ele: Element, event: EventNames) {
    // do something
}

handleEvent(document.getElementById('hello'), 'scroll');  // 没问题
handleEvent(document.getElementById('world'), 'dbclick'); // 报错，event 不能为 'dbclick'

// index.ts(7,47): error TS2345: Argument of type '"dbclick"' is not assignable to parameter of type 'EventNames'.
```

- 上例中，我们使用 `type` 定了一个字符串字面量类型 `EventNames`，它只能取三种字符串中的一种。

**注意，类型别名与字符串字面量类型都是使用 type 进行定义**

字符串字面量联合是我用得最多的一个特性，性价比极高。按钮的 `size: 'small' | 'middle' | 'large'`、请求状态 `'idle' | 'loading' | 'success' | 'error'`，写成这样之后编辑器直接给你补全，拼错立刻红。比用 `enum` 轻，因为它编译后完全不留痕迹。

TypeScript 4.1 之后还有了模板字面量类型，能用模板字符串的语法在类型层面拼字符串，配合 `Capitalize` 这类内置工具类型，可以从 `click` 自动推出 `onClick`。这块玩法很多，日常业务用不到那么深，知道有这个东西就行，具体语法以官方文档为准。

### 3.3 元组

- 数组合并了相同类型的对象，而元组（`Tuple`）合并了不同类型的对象。
- 元组起源于函数编程语言,在这些语言中频繁使用元组。

#### 3.3.1 简单的例子

> 定义一对值分别为 `string` 和 `number `的元组

```
let user: [string, number] = ['poetries', 22];
```

> 当赋值或访问一个已知索引的元素时，会得到正确的类型


```js
let user: [string, number];
user[0] = 'poetries';
user[1] = 22;

user[0].slice(1);
user[1].toFixed(2);
```

> 也可以只赋值其中一项

```js
let user: [string, number];
user[0] = 'poetries';
```

#### 3.3.2 越界的元素

> 当添加越界的元素时，它的类型会被限制为元组中每个类型的联合类型


```js
let user: [string, number];
user = ['poetries', 22];
user.push('http://blog.poetries.top');
user.push(true);

// index.ts(4,14): error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string | number'.
//   Type 'boolean' is not assignable to type 'number'.
```

这条越界规则是元组最反直觉的一处。`push` 一个 `string` 进去居然不报错，因为编译器把越界位置的类型放宽成了所有成员类型的联合。所以元组挡得住类型不对，挡不住长度变化。想连长度一起锁死，用 `readonly [string, number]` 或者在字面量后面加 `as const`。

顺带说下元组现在的主要用武之地，React 的 `useState` 返回的就是元组，这样你才能在解构时自己起名字。如果它返回的是对象，你就得写 `const { value: count, setValue: setCount } = useState(0)`，明显啰嗦。TypeScript 4.0 之后元组还支持给成员起名字（`[first: string, second: number]`），纯粹是给可读性用的，不影响类型行为。

### 3.4 枚举

> 枚举（`Enum`）类型用于取值被限定在一定范围内的场景，比如一周只能有七天，颜色限定为红绿蓝等

#### 3.4.1 简单的例子

> 枚举使用 `enum` 关键字来定义：

```js
enum Days {Sun, Mon, Tue, Wed, Thu, Fri, Sat};
```

> 枚举成员会被赋值为从 `0` 开始递增的数字，同时也会对枚举值到枚举名进行反向映射

```js
enum Days {Sun, Mon, Tue, Wed, Thu, Fri, Sat};

console.log(Days["Sun"] === 0); // true
console.log(Days["Mon"] === 1); // true
console.log(Days["Tue"] === 2); // true
console.log(Days["Sat"] === 6); // true

console.log(Days[0] === "Sun"); // true
console.log(Days[1] === "Mon"); // true
console.log(Days[2] === "Tue"); // true
console.log(Days[6] === "Sat"); // true
```

> 事实上，上面的例子会被编译为

```js
var Days;
(function (Days) {
    Days[Days["Sun"] = 0] = "Sun";
    Days[Days["Mon"] = 1] = "Mon";
    Days[Days["Tue"] = 2] = "Tue";
    Days[Days["Wed"] = 3] = "Wed";
    Days[Days["Thu"] = 4] = "Thu";
    Days[Days["Fri"] = 5] = "Fri";
    Days[Days["Sat"] = 6] = "Sat";
})(Days || (Days = {}));
```

看这段编译产物就明白反向映射是怎么来的了。`Days[Days["Sun"] = 0] = "Sun"` 这一行同时做了两件事，先把 `Days["Sun"]` 设成 `0`，这个赋值表达式的值是 `0`，然后再把 `Days[0]` 设成 `"Sun"`。一行代码建两个方向的映射，挺巧妙的。

要注意只有数字枚举才有反向映射，字符串枚举没有。原因也很直白，字符串枚举的值可能跟键撞上，双向映射会互相覆盖。

#### 3.4.2 手动赋值

> 我们也可以给枚举项手动赋值


```js
enum Days {Sun = 7, Mon = 1, Tue, Wed, Thu, Fri, Sat};

console.log(Days["Sun"] === 7); // true
console.log(Days["Mon"] === 1); // true
console.log(Days["Tue"] === 2); // true
console.log(Days["Sat"] === 6); // true
```

> 上面的例子中，未手动赋值的枚举项会接着上一个枚举项递增

如果未手动赋值的枚举项与手动赋值的重复了，`TypeScript` 是不会察觉到这一点的

```js
enum Days {Sun = 3, Mon = 1, Tue, Wed, Thu, Fri, Sat};

console.log(Days["Sun"] === 3); // true
console.log(Days["Wed"] === 3); // true
console.log(Days[3] === "Sun"); // false
console.log(Days[3] === "Wed"); // true
```

> 上面的例子中，递增到 `3` 的时候与前面的 `Sun` 的取值重复了，但是 `TypeScript` 并没有报错，导致 `Days[3] `的值先是 `"Sun"`，而后又被 `"Wed"` 覆盖了。编译的结果是

```js
var Days;
(function (Days) {
    Days[Days["Sun"] = 3] = "Sun";
    Days[Days["Mon"] = 1] = "Mon";
    Days[Days["Tue"] = 2] = "Tue";
    Days[Days["Wed"] = 3] = "Wed";
    Days[Days["Thu"] = 4] = "Thu";
    Days[Days["Fri"] = 5] = "Fri";
    Days[Days["Sat"] = 6] = "Sat";
})(Days || (Days = {}));
```

所以使用的时候需要注意，最好不要出现这种覆盖的情况。

> 手动赋值的枚举项可以不是数字，此时需要使用类型断言来让 `tsc` 无视类型检查 (编译出的 `js` 仍然是可用的)：

```js
enum Days {Sun = 7, Mon, Tue, Wed, Thu, Fri, Sat = <any>"S"};
```

```js
var Days;
(function (Days) {
    Days[Days["Sun"] = 7] = "Sun";
    Days[Days["Mon"] = 8] = "Mon";
    Days[Days["Tue"] = 9] = "Tue";
    Days[Days["Wed"] = 10] = "Wed";
    Days[Days["Thu"] = 11] = "Thu";
    Days[Days["Fri"] = 12] = "Fri";
    Days[Days["Sat"] = "S"] = "Sat";
})(Days || (Days = {}));
```

> 当然，手动赋值的枚举项也可以为小数或负数，此时后续未手动赋值的项的递增步长仍为 `1`：

```js
enum Days {Sun = 7, Mon = 1.5, Tue, Wed, Thu, Fri, Sat};

console.log(Days["Sun"] === 7); // true
console.log(Days["Mon"] === 1.5); // true
console.log(Days["Tue"] === 2.5); // true
console.log(Days["Sat"] === 6.5); // true
```

覆盖那个例子是真会出事的。`Days[3]` 先被写成 `"Sun"` 再被 `"Wed"` 覆盖，如果你的代码里有反查逻辑，就会得到一个静默的错误结果，编译器全程不吭声。所以枚举要么全部手动赋值，要么全部让它自增，别混着来。

小数和负数那个例子更像是编译器行为的验证，实际项目里我没见过谁真这么用。枚举值最好是稳定的整数或者字符串，因为它们经常要跟后端接口、数据库存储对齐，一旦顺序调整导致数值变了，历史数据就对不上了。这也是我推荐用字符串枚举而不是数字枚举的主要原因，字符串枚举的值跟声明顺序无关。

#### 3.4.3 常数项和计算所得项

> 枚举项有两种类型：常数项（`constant member`）和计算所得项（`computed member`）

前面我们所举的例子都是常数项，一个典型的计算所得项的例子：

```js
enum Color {Red, Green, Blue = "blue".length};
```

> 上面的例子中，`"blue".length` 就是一个计算所得项。

上面的例子不会报错，但是如果紧接在计算所得项后面的是未手动赋值的项，那么它就会因为无法获得初始值而报错

```js
enum Color {Red = "red".length, Green, Blue};

// index.ts(1,33): error TS1061: Enum member must have initializer.
// index.ts(1,40): error TS1061: Enum member must have initializer.
```

#### 3.4.4 常数枚举

> 常数枚举是使用 `const enum` 定义的枚举类型

```js
const enum Directions {
    Up,
    Down,
    Left,
    Right
}

let directions = [Directions.Up, Directions.Down, Directions.Left, Directions.Right];
```

> 常数枚举与普通枚举的区别是，它会在编译阶段被删除，并且不能包含计算成员

```js
//上例的编译结果是：

var directions = [0 /* Up */, 1 /* Down */, 2 /* Left */, 3 /* Right */];
```

```js
// 假如包含了计算成员，则会在编译阶段报错：

const enum Color {Red, Green, Blue = "blue".length};

// index.ts(1,38): error TS2474: In 'const' enum declarations member initializer must be constant expression.
```

`const enum` 的卖点是零运行时开销，编译时直接把引用替换成字面量。但它现在有个很现实的限制：它跟 `isolatedModules` 冲突。Babel、esbuild、swc 这些单文件转译器编译时看不到其它文件，没法做跨文件的内联替换，所以开了 `isolatedModules` 之后 `const enum` 会报错。而 Vite 这类现代构建默认就是单文件转译。

结论是，如果你的项目走的是打包器加单文件转译（也就是绝大多数现代前端项目），别用 `const enum`，用普通 `enum` 或者干脆用 `as const` 常量对象。具体兼容矩阵以官方文档为准。

#### 3.4.5 外部枚举

> 外部枚举（`Ambient Enums`）是使用 `declare enum` 定义的枚举类型

```js
declare enum Directions {
    Up,
    Down,
    Left,
    Right
}

let directions = [Directions.Up, Directions.Down, Directions.Left, Directions.Right];
```

- 之前提到过，`declare` 定义的类型只会用于编译时的检查，编译结果中会被删除。

上例的编译结果是：

```js
var directions = [Directions.Up, Directions.Down, Directions.Left, Directions.Right];
```

- 外部枚举与声明语句一样，常出现在声明文件中。
- 同时使用 `declare` 和 `const` 也是可以的：

```js
declare const enum Directions {
    Up,
    Down,
    Left,
    Right
}

let directions = [Directions.Up, Directions.Down, Directions.Left, Directions.Right];
```

```js
// 编译结果：

var directions = [0 /* Up */, 1 /* Down */, 2 /* Left */, 3 /* Right */];
```


### 3.5 类

#### 3.5.1 类的概念

> 类相关的概念做一个简单的介绍

- 类(`Class`)：定义了一件事物的抽象特点，包含它的属性和方法
- 对象（`Object`）：类的实例，通过 `new` 生成
- 面向对象（`OOP`）的三大特性：封装、继承、多态
- 封装（`Encapsulation`）：将对数据的操作细节隐藏起来，只暴露对外的接口。外界调用端不需要（也不可能）知道细节，就能通过对外提供的接口来访问该对象，同时也保证了外界无法任意更改对象内部的数据
- 继承（`Inheritance`）：子类继承父类，子类除了拥有父类的所有特性外，还有一些更具体的特性
- 多态（`Polymorphism`）：由继承而产生了相关的不同的类，对同一个方法可以有不同的响应。比如 `Cat` 和 `Dog` 都继承自 `Animal`，但是分别实现了自己的 `eat` 方法。此时针对某一个实例，我们无需了解它是 `Cat `还是 `Dog`，就可以直接调用 `eat `方法，程序会自动判断出来应该如何执行 `eat`
- 存取器（`getter & setter`）：用以改变属性的读取和赋值行为
- 修饰符（`Modifiers`）：修饰符是一些关键字，用于限定成员或类型的性质。比如 `public` 表示公有属性或方法
- 抽象类（`Abstract Class`）：抽象类是供其他类继承的基类，抽象类不允许被实例化。抽象类中的抽象方法必须在子类中被实现
- 接口（`Interfaces`）：不同类之间公有的属性或方法，可以抽象成一个接口。接口可以被类实现（`implements`）。一个类只能继承自另一个类，但是可以实现多个接口

这套面向对象的词汇表在前端里用得不算多，函数式和组合的写法更主流。但有三类地方绕不开类：Angular 和 Nest 这种依赖注入框架、需要维护复杂内部状态的 SDK、以及自定义 Error。理解修饰符和抽象类，主要是为了读懂这些库的源码和类型定义。

#### 3.5.2 public private 和 protected

> `TypeScript` 可以使用三种访问修饰符（`Access Modifiers`），分别是 `public`、`private` 和 `protected`


- `public` 修饰的属性或方法是公有的，可以在任何地方被访问到，默认所有的属性和方法都是 `public` 的
- `private` 修饰的属性或方法是私有的，不能在声明它的类的外部访问
- `protected` 修饰的属性或方法是受保护的，它和 `private` 类似，区别是它在子类中也是允许被访问的

```js
class Animal {
    public name;
    public constructor(name) {
        this.name = name;
    }
}

let a = new Animal('Jack');
console.log(a.name); // Jack
a.name = 'Tom';
console.log(a.name); // Tom
```


> 上面的例子中，`name` 被设置为了 `public`，所以直接访问实例的 `name` 属性是允许的。

很多时候，我们希望有的属性是无法直接存取的，这时候就可以用 `private` 了

```js
class Animal {
    private name;
    public constructor(name) {
        this.name = name;
    }
}

let a = new Animal('Jack');
console.log(a.name); // Jack
a.name = 'Tom';

// index.ts(9,13): error TS2341: Property 'name' is private and only accessible within class 'Animal'.
// index.ts(10,1): error TS2341: Property 'name' is private and only accessible within class 'Animal'.
```


> 上面的例子编译后的代码是：

```js
var Animal = (function () {
    function Animal(name) {
        this.name = name;
    }
    return Animal;
}());
var a = new Animal('Jack');
console.log(a.name);
a.name = 'Tom';
```

这段编译产物是理解 `private` 的关键，编译后 `a.name` 那两行原封不动留着，运行时该读读该写写。所以 `private` 是一条团队约定，不是安全边界。真需要运行时私有，用 ES2022 的 `#name` 私有字段，它在编译产物里会变成真正访问不到的东西。这两个不是替代关系，`private` 更宽松也更好调试，`#` 更严格但一旦用了就没法在外部临时读一眼。

> 使用 `private` 修饰的属性或方法，在子类中也是不允许访问的：

```js
class Animal {
    private name;
    public constructor(name) {
        this.name = name;
    }
}

class Cat extends Animal {
    constructor(name) {
        super(name);
        console.log(this.name);
    }
}

// index.ts(11,17): error TS2341: Property 'name' is private and only accessible within class 'Animal'.
```

> 而如果是用 `protected` 修饰，则允许在子类中访问

```js
class Animal {
    protected name;
    public constructor(name) {
        this.name = name;
    }
}

class Cat extends Animal {
    constructor(name) {
        super(name);
        console.log(this.name);
    }
}
```


#### 3.5.3 抽象类

> `abstract` 用于定义抽象类和其中的抽象方法。

**什么是抽象类？**

> 首先，抽象类是不允许被实例化的

```js
abstract class Animal {
    public name;
    public constructor(name) {
        this.name = name;
    }
    public abstract sayHi();
}

let a = new Animal('Jack');

// index.ts(9,11): error TS2511: Cannot create an instance of the abstract class 'Animal'.
```

> 上面的例子中，我们定义了一个抽象类 `Animal`，并且定义了一个抽象方法 `sayHi`。在实例化抽象类的时候报错了。

其次，抽象类中的抽象方法必须被子类实现

```js
abstract class Animal {
    public name;
    public constructor(name) {
        this.name = name;
    }
    public abstract sayHi();
}

class Cat extends Animal {
    public eat() {
        console.log(`${this.name} is eating.`);
    }
}

let cat = new Cat('Tom');

// index.ts(9,7): error TS2515: Non-abstract class 'Cat' does not implement inherited abstract member 'sayHi' from class 'Animal'.
```

> 上面的例子中，我们定义了一个类 `Cat` 继承了抽象类 `Animal`，但是没有实现抽象方法 `sayHi`，所以编译报错了。

下面是一个正确使用抽象类的例子：

```js
abstract class Animal {
    public name;
    public constructor(name) {
        this.name = name;
    }
    public abstract sayHi();
}

class Cat extends Animal {
    public sayHi() {
        console.log(`Meow, My name is ${this.name}`);
    }
}

let cat = new Cat('Tom');
```

上面的例子中，我们实现了抽象方法 `sayHi`，编译通过了。

> 需要注意的是，即使是抽象方法，`TypeScript` 的编译结果中，仍然会存在这个类，上面的代码的编译结果是：

```js
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Animal = (function () {
    function Animal(name) {
        this.name = name;
    }
    return Animal;
}());
var Cat = (function (_super) {
    __extends(Cat, _super);
    function Cat() {
        _super.apply(this, arguments);
    }
    Cat.prototype.sayHi = function () {
        console.log('Meow, My name is ' + this.name);
    };
    return Cat;
}(Animal));
var cat = new Cat('Tom');
```

这段 ES5 产物里的 `__extends` 是编译器自动注入的继承辅助函数。每个文件都注入一份挺浪费，所以有了 `importHelpers` 编译选项，打开之后这些辅助函数会统一从 `tslib` 这个包里 import，产物小一圈。目标定到 ES2015 以上就完全不需要它了，因为 `class` 和 `extends` 是原生语法。

回到抽象类本身。它在类型上的作用可以概括成一句话：编译期强制子类补齐实现。这个反馈发生在你写代码的时候，而不是跑到那行代码的时候，差别很大。

#### 3.5.4 类的类型

> 给类加上 `TypeScript` 的类型很简单，与接口类似：

```js
class Animal {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
    sayHi(): string {
      return `My name is ${this.name}`;
    }
}

let a: Animal = new Animal('Jack');
console.log(a.sayHi()); // My name is Jack
```

有个概念这里要理清楚，类在 TypeScript 里同时是值和类型。`new Animal(...)` 用的是值那一面，`let a: Animal` 用的是类型那一面，后者指的是实例的类型。想拿到「类本身」的类型（比如写一个接收类作为参数的工厂函数），得用 `typeof Animal`。这两个搞混是写高阶函数时的常见卡点。

### 3.6 类与接口

这一节的四个小点其实是在回答同一个问题：类和接口之间有几种搭配方式。类实现接口、接口继承接口、接口继承类、混合类型，四种各有各的场景。

#### 3.6.1 类实现接口

> 实现（`implements`）是面向对象中的一个重要概念。一般来讲，一个类只能继承自另一个类，有时候不同类之间可以有一些共有的特性，这时候就可以把特性提取成接口（`interfaces`），用 `implements` 关键字来实现。这个特性大大提高了面向对象的灵活性

举例来说，门是一个类，防盗门是门的子类。如果防盗门有一个报警器的功能，我们可以简单的给防盗门添加一个报警方法。这时候如果有另一个类，车，也有报警器的功能，就可以考虑把报警器提取出来，作为一个接口，防盗门和车都去实现它


```js
interface Alarm {
    alert();
}

class Door {
}

class SecurityDoor extends Door implements Alarm {
    alert() {
        console.log('SecurityDoor alert');
    }
}

class Car implements Alarm {
    alert() {
        console.log('Car alert');
    }
}
```

**一个类可以实现多个接口**

```js
interface Alarm {
    alert();
}

interface Light {
    lightOn();
    lightOff();
}

class Car implements Alarm, Light {
    alert() {
        console.log('Car alert');
    }
    lightOn() {
        console.log('Car light on');
    }
    lightOff() {
        console.log('Car light off');
    }
}
```

> 上例中，`Car` 实现了 `Alarm` 和 `Light `接口，既能报警，也能开关车灯

#### 3.6.2 接口继承接口

> 接口与接口之间可以是继承关系

```js
interface Alarm {
    alert();
}

interface LightableAlarm extends Alarm {
    lightOn();
    lightOff();
}
```

> 上例中，我们使用 `extends` 使 `LightableAlarm` 继承 `Alarm`

#### 3.6.3 接口继承类

> 接口也可以继承类：

```js
class Point {
    x: number;
    y: number;
}

interface Point3d extends Point {
    z: number;
}

let point3d: Point3d = {x: 1, y: 2, z: 3};
```

接口继承类这个用法看着奇怪，其实很好理解：类在类型层面就是它的实例形状，接口继承它等于把那个形状抄过来。注意继承过来的是形状而不是实现，所以最后那个对象字面量 `{x: 1, y: 2, z: 3}` 能直接赋值，不需要 `new Point()`。

还有一个细节，如果被继承的类里有 `private` 或 `protected` 成员，那么继承它的接口就只能被这个类或它的子类实现，外部对象字面量对不上。原因是私有成员在类型系统里是带「来源标记」的，不同类的同名私有成员不认为兼容。

#### 3.6.4 混合类型

> 可以使用接口的方式来定义一个函数需要符合的形状

```js
interface SearchFunc {
    (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;
mySearch = function(source: string, subString: string) {
    return source.search(subString) !== -1;
}
```

> 有时候，一个函数还可以有自己的属性和方法

```js
interface Counter {
    (start: number): string;
    interval: number;
    reset(): void;
}

function getCounter(): Counter {
    let counter = <Counter>function (start: number) { };
    counter.interval = 123;
    counter.reset = function () { };
    return counter;
}

let c = getCounter();
c(10);
c.reset();
c.interval = 5.0;
```

混合类型描述的是「既能调用又有属性」的东西，这在 JS 生态里很常见。jQuery 的 `$` 就是典型，`$('#foo')` 是调用，`$.ajax()` 是属性。lodash 的 `debounce` 返回值带 `.cancel()` 和 `.flush()`，也是这个形态。给这类库写声明文件，混合类型是绕不开的工具。

用 `type` 也能表达同样的东西，写成 `type Counter = ((start: number) => string) & { interval: number; reset(): void }`，交叉类型拼起来。哪种更好看看个人口味，接口写法层次更清楚一点。

### 3.7 泛型

泛型是整篇里最抽象的一节，但它的出发点其实很朴素：我想复用一段逻辑，同时又不想丢掉类型信息。下面这个 `createArray` 的演进过程就是最好的说明。

> 泛型（`Generics`）是指在定义函数、接口或类的时候，不预先指定具体的类型，而在使用的时候再指定类型的一种特性

#### 3.7.1 简单的例子

> 首先，我们来实现一个函数 `createArray`，它可以创建一个指定长度的数组，同时将每一项都填充一个默认值

```js
function createArray(length: number, value: any): Array<any> {
    let result = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

createArray(3, 'x'); // ['x', 'x', 'x']
```

- 上例中，我们使用了之前提到过的数组泛型来定义返回值的类型。
- 这段代码编译不会报错，但是一个显而易见的缺陷是，它并没有准确的定义返回值的类型：`Array<any>` 允许数组的每一项都为任意类型。但是我们预期的是，数组中每一项都应该是输入的` value` 的类型。

> 这时候，泛型就派上用场了：


```js
function createArray<T>(length: number, value: T): Array<T> {
    let result: T[] = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

createArray<string>(3, 'x'); // ['x', 'x', 'x']
```

> 上例中，我们在函数名后添加了 `<T>`，其中 `T` 用来指代任意输入的类型，在后面的输入 `value: T` 和输出 `Array<T> `中即可使用了

接着在调用的时候，可以指定它具体的类型为 `string`。当然，也可以不手动指定，而让类型推论自动推算出来

```js
function createArray<T>(length: number, value: T): Array<T> {
    let result: T[] = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

createArray(3, 'x'); // ['x', 'x', 'x']
```

#### 3.7.2 多个类型参数

> 定义泛型的时候，可以一次定义多个类型参数：

```js
function swap<T, U>(tuple: [T, U]): [U, T] {
    return [tuple[1], tuple[0]];
}

swap([7, 'seven']); // ['seven', 7]
```

> 上例中，我们定义了一个 `swap` 函数，用来交换输入的元组

`swap([7, 'seven'])` 这个调用不用写任何类型参数，`T` 和 `U` 全靠推断。这就是泛型好用的地方，写的时候多一层抽象，用的时候完全无感。

命名上有个不成文的约定：`T` 表示 Type，`K` 表示 Key，`V` 表示 Value，`E` 表示 Element，`R` 表示 Return。超过两三个类型参数的时候，还是起个有意义的名字更好读，比如 `<TResponse, TError>`。

#### 3.7.3 泛型约束

> 在函数内部使用泛型变量的时候，由于事先不知道它是哪种类型，所以不能随意的操作它的属性或方法

```js
function loggingIdentity<T>(arg: T): T {
    console.log(arg.length);
    return arg;
}

// index.ts(2,19): error TS2339: Property 'length' does not exist on type 'T'.

```

> 上例中，泛型 `T` 不一定包含属性 `length`，所以编译的时候报错了。

> 这时，我们可以对泛型进行约束，只允许这个函数传入那些包含` length` 属性的变量。这就是泛型约束

```js
interface Lengthwise {
    length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
    console.log(arg.length);
    return arg;
}
```

> 上例中，我们使用了 `extends `约束了泛型 `T` 必须符合接口 `Lengthwise` 的形状，也就是必须包含 `length` 属性。

> 此时如果调用 `loggingIdentity` 的时候，传入的 `arg `不包含 `length`，那么在编译阶段就会报错了

```js
interface Lengthwise {
    length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
    console.log(arg.length);
    return arg;
}

loggingIdentity(7);

// index.ts(10,17): error TS2345: Argument of type '7' is not assignable to parameter of type 'Lengthwise'.
```

**多个类型参数之间也可以互相约束：**

```js
function copyFields<T extends U, U>(target: T, source: U): T {
    for (let id in source) {
        target[id] = (<T>source)[id];
    }
    return target;
}

let x = { a: 1, b: 2, c: 3, d: 4 };

copyFields(x, { b: 10, d: 20 });
```

> 上例中，我们使用了两个类型参数，其中要求 `T` 继承 `U`，这样就保证了` U` 上不会出现 `T` 中不存在的字段

泛型约束是我在实际项目里用得最多的泛型特性。最典型的搭配是 `K extends keyof T`，比如写一个通用的取值函数：

```js
function pick<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}
```

这样 `pick(user, 'name')` 的返回值类型就精确地是 `user.name` 的类型，而 `pick(user, '不存在的键')` 直接编译报错。`keyof` 加索引访问类型这套组合是内置工具类型 `Pick`、`Omit`、`Record` 的底层实现方式，看懂了它，那些工具类型就不神秘了。

#### 3.7.4 泛型接口


> 可以使用接口的方式来定义一个函数需要符合的形状

```js
interface SearchFunc {
  (source: string, subString: string): boolean;
}

let mySearch: SearchFunc;
mySearch = function(source: string, subString: string) {
    return source.search(subString) !== -1;
}
```

> 当然也可以使用含有泛型的接口来定义函数的形状


```js
interface CreateArrayFunc {
    <T>(length: number, value: T): Array<T>;
}

let createArray: CreateArrayFunc;
createArray = function<T>(length: number, value: T): Array<T> {
    let result: T[] = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

createArray(3, 'x'); // ['x', 'x', 'x']
```

> 进一步，我们可以把泛型参数提前到接口名上

```js
interface CreateArrayFunc<T> {
    (length: number, value: T): Array<T>;
}

let createArray: CreateArrayFunc<any>;
createArray = function<T>(length: number, value: T): Array<T> {
    let result: T[] = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}

createArray(3, 'x'); // ['x', 'x', 'x']
```

> 注意，此时在使用泛型接口的时候，需要定义泛型的类型

这两种写法的差别在于泛型参数在哪一层。写在方法上，每次调用都能是不同的类型；提到接口名上，就是在声明变量时一次定死。前者更灵活，后者更适合「这个接口的用途从一开始就确定了」的场景，比如 `Response<User>`。

#### 3.7.5 泛型类

> 与泛型接口类似，泛型也可以用于类的类型定义中

```js
class GenericNumber<T> {
    zeroValue: T;
    add: (x: T, y: T) => T;
}

let myGenericNumber = new GenericNumber<number>();

myGenericNumber.zeroValue = 0;
myGenericNumber.add = function(x, y) { return x + y; };
```

#### 3.7.6 泛型参数的默认类型

> 在 `TypeScript 2.3 `以后，我们可以为泛型中的类型参数指定默认类型。当使用泛型时没有在代码中直接指定类型参数，从实际值参数中也无法推测出时，这个默认类型就会起作用

```js
function createArray<T = string>(length: number, value: T): Array<T> {
    let result: T[] = [];
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;
}
```

默认类型参数在写库的时候很有用，能让调用方在大多数情况下不用写类型参数。React 的 `useState` 和很多 hook 的类型签名里都能看到它。

TypeScript 5.0 之后还多了一个 `const` 类型参数修饰符（写成 `<const T>`），作用是让传进来的字面量保持字面量类型而不是被拓宽成 `string`、`number`。这个我只在写工具库的时候用过一两次，日常业务基本碰不到，具体行为以官方文档为准。

### 3.8 声明合并


> 如果定义了两个相同名字的函数、接口或类，那么它们会合并成一个类型

#### 3.8.1 函数的合并

> 我们可以使用重载定义多个函数类型

```js
function reverse(x: number): number;
function reverse(x: string): string;

function reverse(x: number | string): number | string {
    if (typeof x === 'number') {
        return Number(x.toString().split('').reverse().join(''));
    } else if (typeof x === 'string') {
        return x.split('').reverse().join('');
    }
}
```

#### 3.8.2 接口的合并

> 接口中的属性在合并时会简单的合并到一个接口中

```js
interface Alarm {
    price: number;
}
interface Alarm {
    weight: number;
}
```


> 相当于：

```js
interface Alarm {
    price: number;
    weight: number;
}
```

**注意，合并的属性的类型必须是唯一的**

```js
interface Alarm {
    price: number;
}
interface Alarm {
    price: number;  // 虽然重复了，但是类型都是 `number`，所以不会报错
    weight: number;
}
```

```js
interface Alarm {
    price: number;
}
interface Alarm {
    price: string;  // 类型不一致，会报错
    weight: number;
}

// index.ts(5,3): error TS2403: Subsequent variable declarations must have the same type.  Variable 'price' must be of type 'number', but here has type 'string'.

```

**接口中方法的合并，与函数的合并一样**

```js
interface Alarm {
    price: number;
    alert(s: string): string;
}
interface Alarm {
    weight: number;
    alert(s: string, n: number): string;
}
```

相当于：

```js
interface Alarm {
    price: number;
    weight: number;
    alert(s: string): string;
    alert(s: string, n: number): string;
}
```

接口合并有个真实用途，在项目里扩展第三方库的类型。比如给 Express 的 `Request` 加一个 `user` 字段，你只要在自己的 `.d.ts` 里重新 `declare` 一遍同名接口，加上那个字段，TypeScript 就会把它合并进去。React 里给 `CSSProperties` 加自定义 CSS 变量、给 Vue 的 `ComponentCustomProperties` 挂全局属性，走的都是这条路。

这也是我上一篇里说 `interface` 比 `type` 多出来的那个能力。反过来，如果你在写库，同名合并意味着使用者能改你的类型，这既是扩展点也是风险。

#### 3.8.3 类的合并

> 类的合并与接口的合并规则一致

需要提醒的是，声明合并对 `class` 的支持没有接口那么自由。两个同名的普通类会直接报重复标识符，能合并的是类和同名的 `namespace`（用来往类上挂静态成员），或者类和同名接口。所以「与接口的合并规则一致」这句要理解成合并后的成员规则一致，而不是任意两个类都能合。

## 四、工程

语法讲完，剩下的是让它在项目里跑起来。这一章其实就一个主角，`tsconfig.json`。

### 4.1 tsconfig.json

**编译选项**

> 你可以通过 `compilerOptions` 来定制你的编译选项

下面这份是把常用选项都列出来的完整版，注意它是一份「说明书」而不是「能直接用的配置」，里面有几项互相冲突（比如同时开 `outFile` 和 `outDir`），照抄会报错。真实项目里通常只写十来项。

```js
{
  "compilerOptions": {

    /* 基本选项 */
    "target": "es5",                       // 指定 ECMAScript 目标版本: 'ES3' (default), 'ES5', 'ES2015', 'ES2016', 'ES2017', or 'ESNEXT'
    "module": "commonjs",                  // 指定使用模块: 'commonjs', 'amd', 'system', 'umd' or 'es2015'
    "lib": [],                             // 指定要包含在编译中的库文件
    "allowJs": true,                       // 允许编译 javascript 文件
    "checkJs": true,                       // 报告 javascript 文件中的错误
    "jsx": "preserve",                     // 指定 jsx 代码的生成: 'preserve', 'react-native', or 'react'
    "declaration": true,                   // 生成相应的 '.d.ts' 文件
    "sourceMap": true,                     // 生成相应的 '.map' 文件
    "outFile": "./",                       // 将输出文件合并为一个文件
    "outDir": "./",                        // 指定输出目录
    "rootDir": "./",                       // 用来控制输出目录结构 --outDir.
    "removeComments": true,                // 删除编译后的所有的注释
    "noEmit": true,                        // 不生成输出文件
    "importHelpers": true,                 // 从 tslib 导入辅助工具函数
    "isolatedModules": true,               // 将每个文件做为单独的模块 （与 'ts.transpileModule' 类似）.

    /* 严格的类型检查选项 */
    "strict": true,                        // 启用所有严格类型检查选项
    "noImplicitAny": true,                 // 在表达式和声明上有隐含的 any类型时报错
    "strictNullChecks": true,              // 启用严格的 null 检查
    "noImplicitThis": true,                // 当 this 表达式值为 any 类型的时候，生成一个错误
    "alwaysStrict": true,                  // 以严格模式检查每个模块，并在每个文件里加入 'use strict'

    /* 额外的检查 */
    "noUnusedLocals": true,                // 有未使用的变量时，抛出错误
    "noUnusedParameters": true,            // 有未使用的参数时，抛出错误
    "noImplicitReturns": true,             // 并不是所有函数里的代码都有返回值时，抛出错误
    "noFallthroughCasesInSwitch": true,    // 报告 switch 语句的 fallthrough 错误。（即，不允许 switch 的 case 语句贯穿）

    /* 模块解析选项 */
    "moduleResolution": "node",            // 选择模块解析策略： 'node' (Node.js) or 'classic' (TypeScript pre-1.6)
    "baseUrl": "./",                       // 用于解析非相对模块名称的基目录
    "paths": {},                           // 模块名到基于 baseUrl 的路径映射的列表
    "rootDirs": [],                        // 根文件夹列表，其组合内容表示项目运行时的结构内容
    "typeRoots": [],                       // 包含类型声明的文件列表
    "types": [],                           // 需要包含的类型声明文件名列表
    "allowSyntheticDefaultImports": true,  // 允许从没有设置默认导出的模块中默认导入。

    /* Source Map Options */
    "sourceRoot": "./",                    // 指定调试器应该找到 TypeScript 文件而不是源文件的位置
    "mapRoot": "./",                       // 指定调试器应该找到映射文件而不是生成文件的位置
    "inlineSourceMap": true,               // 生成单个 soucemaps 文件，而不是将 sourcemaps 生成不同的文件
    "inlineSources": true,                 // 将代码与 sourcemaps 生成到一个文件中，要求同时设置了 --inlineSourceMap 或 --sourceMap 属性

    /* 其他选项 */
    "experimentalDecorators": true,        // 启用装饰器
    "emitDecoratorMetadata": true          // 为装饰器提供元数据的支持
  }
}
```

这份清单里我想挑几项单独说说，因为它们对日常开发影响最大。

`strict` 是一个总开关，打开它等于同时打开 `noImplicitAny`、`strictNullChecks`、`strictFunctionTypes`、`strictBindCallApply`、`strictPropertyInitialization`、`noImplicitThis`、`alwaysStrict` 这一组。新项目直接开，老项目分批开。这个开关带来的收益远大于它带来的麻烦。

`moduleResolution` 这一项现在的推荐值变了。清单里写的 `node` 对应的是 Node.js 老的 CommonJS 解析算法；现在如果你的代码交给 Vite、webpack、esbuild 这类打包器处理，官方推荐 `bundler`；纯 Node ESM 项目则用 `node16` 或 `nodenext`。选错了最典型的症状是「明明装了包却报找不到模块」，或者 `exports` 字段里的子路径导入不出来。

`isolatedModules` 前面 3.4.4 提过，它约束你的代码必须能被单文件转译。开着它会禁掉 `const enum`、要求类型导出必须写 `export type`。用 Babel 或 esbuild 转译的项目建议开，能提前发现兼容问题。

`experimentalDecorators` 对应的是老的装饰器提案，Angular、Nest、早期 MobX 用的都是它。ECMAScript 的装饰器标准后来定稿了，TypeScript 5.0 开始支持新版语法，两套不兼容，老项目要继续用就得一直开着这个选项。具体版本行为以官方文档为准。

`paths` 和 `baseUrl` 是配路径别名的，写 `"@/*": ["src/*"]` 之后就能 `import '@/utils'`。要注意 TypeScript 只负责类型解析，运行时的解析得由打包器同步配一份，webpack 的 `resolve.alias` 或者 Vite 的 `resolve.alias`。这个我踩过，只配了 tsconfig 结果编辑器不报错但构建挂了。

### 4.2 TypeScript 编译

> 运行 `tsc -p ./path-to-project-directory` 。`tsc -w `来启用 `TypeScript`编译器的观测模式，在检测到文件改动之后，它将重新编译


**指定需要编译的文件**

```js
{
  "files": [
    "./some/file.ts"
  ]
}
```

**使用 include 和 exclude 选项来指定需要包含的文件，和排除的文件**

```js
{
  "include": [
    "./folder"
  ],
  "exclude": [
    "./folder/**/*.spec.ts",
    "./folder/someSubFolder"
  ]
}
```

`files`、`include`、`exclude` 三者的优先级容易记混：`files` 里列的文件永远会被编译，`exclude` 只能排除 `include` 匹配到的，排不掉 `files` 里显式列出的。另外被 `include` 进来的文件所依赖的文件也会被自动带进编译范围，所以 `exclude` 掉一个文件不代表它真的不参与检查。

编译速度慢的时候，先看编译范围是不是圈太大了。`tsc --extendedDiagnostics` 能打出各阶段耗时和文件数，配合 `--generateTrace` 还能看到具体是哪个类型算得慢。这两个命令是我排查构建变慢时的第一站。

现代前端项目里 `tsc` 通常只用来做类型检查（`tsc --noEmit`），产物交给 Vite 或 webpack 出。所以 `package.json` 里常见 `"typecheck": "tsc --noEmit"` 这么一条脚本，挂到 CI 上。

## 五、一些例子演示

前面四章都在讲规则，这一章换成实战片段。这些例子是我当时练手写的，涵盖了业务里最常遇到的几种约束场景，可以当模板抄。

### 5.1 定义ajax请求数据接口

```js
interface Config{
    type:string;
    url:string;
    data?:string;
    dataType:string;
}

//原生js封装的ajax 
function ajax(config:Config){

   var xhr=new XMLHttpRequest();

   xhr.open(config.type,config.url,true);

   xhr.send(config.data);

   xhr.onreadystatechange=function(){

        if(xhr.readyState==4 && xhr.status==200){
            console.log('chengong');


            if(config.dataType=='json'){

                console.log(JSON.parse(xhr.responseText));
            }else{
                console.log(xhr.responseText)

            }


        }
   }
}


ajax({
    type:'get',
    data:'name=zhangsan',
    url:'http://a.itying.com/api/productlist', //api
    dataType:'json'
})
```

这个例子解决的是「配置对象参数」这类场景。函数只接一个对象参数，参数里字段一多就容易传错、漏传，用接口一约束，少传 `url` 立刻报错，多传一个不认识的字段也会被多余属性检查拦下。这是 TypeScript 在业务代码里最高频的用法，没有之一。

再往前走一步的话，`type` 和 `dataType` 其实可以从 `string` 收紧成字面量联合，`type: 'get' | 'post'`、`dataType: 'json' | 'text'`。这样连拼写错误都能挡住，编辑器还会自动补全可选值。

### 5.2 函数类型接口-对方法约束

```js
// 函数类型接口:对方法传入的参数 以及返回值进行约束   批量约束

// 加密的函数类型接口

interface encrypt{
    (key:string,value:string):string;
}


var md5:encrypt=function(key:string,value:string):string{
        //模拟操作
        return key+value;
}

console.log(md5('name','zhangsan'));



var sha1:encrypt=function(key:string,value:string):string{

    //模拟操作
    return key+'----'+value;
}

console.log(sha1('name','lisi'));
```

`md5` 和 `sha1` 两个实现完全不同，但对外的形状一样，所以能共用一个 `encrypt` 接口。这就是「面向接口编程」在 TypeScript 里最轻量的落地方式：调用方只依赖接口，将来换实现不影响任何调用点。

注意接口名 `encrypt` 是小写开头的，这个不符合社区习惯，接口一般首字母大写（`Encrypt`）。TypeScript 不强制，但团队里统一一下能省很多沟通。

### 5.3 可索引接口 数组和对象的约束（不常用）

#### 5.3.1 可索引接口-对数组的约束

```js
interface UserArr{
    [index:number]:string
}


var arr:UserArr=['aaa','bbb'];

console.log(arr[0]);
```

#### 5.3.2 可索引接口-对对象的约束

```js
interface UserObj{
    [index:string]:string
}

var arr:UserObj={name:'张三'};
```

对象那个索引接口现在更常见的写法是内置的 `Record<string, string>`，效果一样但短得多。原文说这类接口「不常用」，我的补充是：直接手写索引签名确实不常用，但通过 `Record` 用到它的场景很多，比如字典、缓存、按 id 归组的数据。

#### 5.3.3 类类型接口 对类的约束

- 抽象类抽象有点相似    


```js
interface Animal{
    name:string;
    eat(str:string):void;
}

class Dog implements Animal{

    name:string;
    constructor(name:string){

        this.name=name;

    }
    eat(){

        console.log(this.name+'吃粮食')
    }
}


var d=new Dog('小黑');
d.eat();


class Cat implements Animal{
    name:string;
    constructor(name:string){

        this.name=name;

    }
    eat(food:string){

        console.log(this.name+'吃'+food);
    }
}

var c=new Cat('小花');
c.eat('老鼠');
```

这里有个细节值得停一下。接口要求 `eat(str: string): void`，但 `Dog` 的实现写的是 `eat()`，一个参数都不接，编译器却没报错。原因是函数类型兼容性允许「实现方比声明少接几个参数」，因为多余的实参在 JS 里本来就是被忽略的，不会出问题。反过来实现方比声明多要一个必选参数就会报错。

这条规则第一次遇到会觉得编译器放水了，其实它是对的。回调函数里最能体现，`arr.forEach(item => ...)` 你只用第一个参数，不写 `index` 和 `array`，编译器当然不该拦你。

### 5.4 接口的扩展

> 接口继承接口 类实现接口

```js
interface Animal{
    eat():void;
}

interface Person extends Animal{

    work():void;
}


class Programmer{

    public name:string;
    constructor(name:string){
        this.name=name;
    }
    
    coding(code:string){

        console.log(this.name+code)
    }
}


class Web extends Programmer implements Person{
    
    constructor(name:string){
       super(name)
    }
    eat(){

        console.log(this.name+'喜欢吃馒头')
    }
    work(){

        console.log(this.name+'写代码');
    }
    
}

var w=new Web('小李');

// w.eat();

w.coding('写ts代码');
```

这个例子把 `extends` 和 `implements` 放在一起用了，`Web` 继承 `Programmer` 拿到 `coding` 的实现，同时 `implements Person` 承诺自己有 `eat` 和 `work`。这是最典型的组合方式：继承拿实现，实现拿约束。

`Person extends Animal` 之后，实现 `Person` 的类必须同时补上 `eat` 和 `work` 两个方法，少一个都不行。所以你会看到 `Web` 里两个方法都写了。

### 5.5 泛型类接口

#### 5.5.1 泛型类 泛型方法

- 泛型：软件工程中，我们不仅要创建一致的定义良好的`API`，同时也要考虑可重用性。 组件不仅能够支持当前的数据类型，同时也能支持未来的数据类型，这在创建大型系统时为你提供了十分灵活的功能。
- 在像`C#`和`Java`这样的语言中，可以使用泛型来创建可重用的组件，一个组件可以支持多种类型的数据。 这样用户就可以以自己的数据类型来使用组件。
- 通俗理解：泛型就是解决类接口方法的复用性、以及对不特定数据类型的支持(类型校验)

```js
// 只能返回string类型的数据
function getData(value:string):string{
    return value;
}

// 同时返回 string类型 和number类型  （代码冗余）
function getData1(value:string):string{
    return value;
}
function getData2(value:number):number{
    return value;
}
```

```js
//同时返回 string类型 和number类型  any可以解决这个问题


 function getData(value:any):any{
    return '哈哈哈';
}


getData(123);
getData('str');
```

```js
//any放弃了类型检查,传入什么 返回什么。比如:传入number 类型必须返回number类型  传入 string类型必须返回string类型


//传入的参数类型和返回的参数类型可以不一致
function getData(value:any):any{
  return '哈哈哈';
}

```

> `T`表示泛型，具体什么类型是调用这个方法的时候决定的

```js
// T表示泛型，具体什么类型是调用这个方法的时候决定的

function getData<T>(value:T):T{
   return value;
}
getData<number>(123);

getData<string>('1214231');


getData<number>('2112');       /*错误的写法*/  

```

```js
function getData<T>(value:T):any{
   return '2145214214';
}

getData<number>(123);  //参数必须是number

getData<string>('这是一个泛型');
```


**泛型类**

> 泛型类：比如有个最小堆算法，需要同时支持返回数字和字符串 `a  -  z`两种类型。  通过类的泛型来实现

```js
// 基本写法 但是不能传入字符串
class MinClass{
    public list:number[]=[];
    add(num:number){
        this.list.push(num)
    }
    min():number{
        var minNum=this.list[0];
        for(var i=0;i<this.list.length;i++){
            if(minNum>this.list[i]){
                minNum=this.list[i];
            }
        }
        return minNum;
    }

}

var m=new MinClass();

m.add(3);
m.add(22);
m.add(23);
m.add(6);

m.add(7);
alert(m.min());
```

**类的泛型**

```js
// 通过泛型改写 可以同时传入number 字符串等
//类的泛型
class MinClas<T>{

    public list:T[]=[];

    add(value:T):void{

        this.list.push(value);
    }

    min():T{        
        var minNum=this.list[0];
        for(var i=0;i<this.list.length;i++){
            if(minNum>this.list[i]){
                minNum=this.list[i];
            }
        }
        return minNum;
    }
}

var m1=new MinClas<number>();   /*实例化类 并且制定了类的T代表的类型是number*/
m1.add(11);
m1.add(3);
m1.add(2);
alert(m1.min())


var m2=new MinClas<string>();   /*实例化类 并且制定了类的T代表的类型是string*/

m2.add('c');
m2.add('a');
m2.add('v');
alert(m2.min())
```

这个最小值类的演进过程很能说明泛型的价值。第一版写死了 `number[]`，想支持字符串就得再复制一份类；用 `any` 又会丢掉类型，`min()` 返回的东西你不知道能不能直接比较。上了泛型之后一份实现覆盖两种类型，而且 `m1.min()` 返回 `number`、`m2.min()` 返回 `string`，各自的方法都能点出来。

顺带指出一个原文里的笔误，泛型版本的类名写成了 `MinClas`，少一个 `s`，跟前面的 `MinClass` 不是同一个类。我保留了原样没改，因为下面的实例化代码用的也是 `MinClas`，改一个就得改一串，不影响示例本身的正确性，看的时候心里有数就行。

还有一点，`if(minNum > this.list[i])` 这个比较对 `string` 是按字典序的，对 `number` 是按数值。这是 JS 的原生行为，泛型只保证类型一致，不保证语义一致。如果你的 `T` 是对象，这个比较就完全没意义了，所以更严谨的写法应该给 `T` 加个约束，或者接一个比较函数进来。

#### 5.5.2 泛型接口

**1. 方式1**

```js
interface ConfigFn{

    <T>(value:T):T;
}


var getData:ConfigFn=function<T>(value:T):T{

    return value;
}


getData<string>('张三');


// getData<string>(1243);  //错误
```

**2. 方式2**

```js
interface ConfigFn<T>{
    (value:T):T;
}


function getData<T>(value:T):T{

    return value;
}


var myGetData:ConfigFn<string>=getData;     


myGetData('20');  /*正确*/


// myGetData(20)  //错误
```

两种写法的区别前面 3.7.4 已经拆过了，这里是同一个规则的另一组例子。方式 1 把泛型放在调用签名上，每次调用各自决定类型；方式 2 提到接口名上，在声明变量 `myGetData: ConfigFn<string>` 的那一刻就定死成 `string`，所以 `myGetData(20)` 报错。

选哪种，取决于「类型是在定义变量时确定，还是在每次调用时确定」。写通用工具函数选方式 1，写某个具体业务场景的固定契约选方式 2。

## 总结

这篇梳理下来，我最大的体会是 TypeScript 的规则不是零散的，它们背后有一条一致的逻辑：编译器只在它能确定安全的时候才放行。

联合类型只能访问共有成员，是因为它不确定当前是哪个成员；定义了任意属性之后确定属性必须是它的子集，是因为索引签名做过承诺；函数重载要把精确签名写在前面，是因为它从上往下匹配，第一个够宽就不往下看了。想通了这条主线，遇到没见过的报错也能自己推。

第二个体会是关于 `any` 的。我 2018 年写这篇的时候，遇到不会写的类型就标 `any`，代码是跑起来了，但那部分等于没写 TypeScript。现在我的做法是：先试 `unknown` 加收窄，实在不行用 `as` 断言并在旁边注释原因，`any` 留给真的没法描述的第三方边界。这个转变带来的收益比学会任何一个高级类型都大。

至于时效性，这篇的语法主干到 5.x 依然成立，需要更新认知的是这几处：`namespace` 和三斜线指令让位给 ES module；`const enum` 跟 `isolatedModules` 冲突，打包器场景不建议用；`moduleResolution` 在打包器场景推荐 `bundler`；`satisfies`、`const` 类型参数、模板字面量类型、`Omit` 这些是 2018 年之后才加的；TSLint 已经停止维护，静态检查统一走 typescript-eslint。这些点我都在对应的小节里标了，具体行为以官方文档为准。

这个系列还有一篇 [Typescript+React模板搭建（三）](https://feinterview.poetries.top/blog/ts-react-template)，讲的是把这些语法真正落到一个可用的工程模板里，从零开始一步步截图，包含 ESLint、样式方案、路由和状态管理的完整配置。

## 参考

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript tsconfig 编译选项参考](https://www.typescriptlang.org/tsconfig)
- [TypeScript 入门教程（本文大量内容参考自此书）](https://ts.xcatliu.com/)
- [Typescript中文网](https://www.tslang.cn/docs/handbook/typescript-in-5-minutes.html)
- [DefinitelyTyped 类型定义仓库](https://github.com/DefinitelyTyped/DefinitelyTyped)
- [TypeSearch 声明文件查找](https://microsoft.github.io/TypeSearch/)
- [MDN JavaScript 内置对象参考](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects)
- [typescript-eslint 官网](https://typescript-eslint.io/)
- [技术胖Typescript视频学习入门](http://jspang.com/post/typescript.html#toc-a39)
- [Typescript基础及结合React实践(一)](https://feinterview.poetries.top/blog/ts-intro-and-use-in-react)
- [Typescript+React模板搭建（三）](https://feinterview.poetries.top/blog/ts-react-template)
- [Typescript实践总结 从基础类型到工程化与项目实战](https://feinterview.poetries.top/blog/ts-in-action)
- [TypeScript 中 interface 和 type 的区别](https://feinterview.poetries.top/blog/ts-interface-type)
- [前端进阶之旅](https://interview.poetries.top)
