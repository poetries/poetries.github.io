---
title: Typescript总结篇（二）
date: 2018-12-30 12:30:14
tags: 
  - Typescript
  - Javascript
categories: Front-End
---


# 一、简介

## 1.1 什么是 TypeScript

- `TypeScript` 是 `JavaScript` 的一个超集，主要提供了类型系统和对 `ES6 `的支持
- `TypeScript` 是由微软开发的一款开源的编程语言
- `TypeScript` 是 `Javascript` 的超级，遵循最新的 `ES6`、`Es5` 规范。`TypeScript` 扩展了 `JavaScript` 的语法
- `TypeScript` 更像后端 `java`、`C#`这样的面向对象语言可以让 `js` 开发大型企业项目

## 1.2 为什么选择 TypeScript

> `Typescript`和`es6`、`es5`关系

![](https://poetries1.gitee.io/img-repo/2019/10/583.png)

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

## 1.3 安装 TypeScript

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
var = "poet"
```

> 那么我们每次都要输`tsc hello.ts`命令来编译，这样很麻烦，能否让它自动编译？答案是可以的，使用`vscode`来开发，需要配置一下`vscode`就可以。

> 首先我们在命令行执行`tsc --init`来生成配置文件，然后我们在目录下看到生成了一个`tsconfig.json`文件

![](https://poetries1.gitee.io/img-repo/2019/10/584.png)

> 这个`json`文件里有很多选项

- `target`是选择编译到什么语法
- `module`则是模块类型
- `outDir`则是输出目录，可以指定这个参数到指定目录

> 更多细节 https://zhongsp.gitbooks.io/typescript-handbook/content/doc/handbook/tsconfig.json.html

> 接下来我们需要开启监控了，在`vscode`任务栏中

![](https://poetries1.gitee.io/img-repo/2019/10/585.png)



## 1.4 Hello TypeScript

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

# 二、基础

## 2.1 原始数据类型

> `JavaScript` 的类型分为两种：原始数据类型（`Primitive data types`）和对象类型（`Object types`）。

- 原始数据类型包括：`布尔值`、`数值`、`字符串`、`null`、`undefined` 以及 `ES6 `中的新类型 `Symbol`。

> 本节主要介绍前五种原始数据类型在 `TypeScript` 中的应用

### 2.1.1 布尔值

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

### 2.1.2 数值

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

### 2.1.3 字符串

> 使用 `string` 定义字符串类型：

```js
let myName: string = 'Tom';
let myAge: number = 25;

// 模板字符串
let sentence: string = `Hello, my name is ${myName}.
I'll be ${myAge + 1} years old next month.`;
```

### 2.1.4 空值

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

### 2.1.5 Null 和 Undefined

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


## 2.2 任意值Any

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



## 2.3 类型推论

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



## 2.4 联合类型

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



## 2.5 对象的类型——接口

### 2.5.1 简单例子

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


### 2.5.2 可选属性

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

### 2.5.3 任意属性

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

### 2.5.4 只读属性

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


## 2.6 数组的类型

> 在 `TypeScript` 中，数组类型有多种定义方式，比较灵活。

### 2.6.1「类型 + 方括号」表示法

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

### 2.6.2 数组泛型

> 也可以使用数组泛型（`Array Generic`）` Array<elemType> `来表示数组

```js
let fibonacci: Array<number> = [1, 1, 2, 3, 5];
```

### 2.6.3 用接口表示数组

```js
interface NumberArray {
    [index: number]: number;
}
let fibonacci: NumberArray = [1, 1, 2, 3, 5];
```

> `NumberArray` 表示：只要 `index` 的类型是 `number`，那么值的类型必须是 `number`

### 2.6.4 any 在数组中的应用

> 一个比较常见的做法是，用 `any` 表示数组中允许出现任意类型：

```js
let list: any[] = ['poetries', 22, { website: 'http://blog.poetries.top' }];
```

### 2.6.5 类数组

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



## 2.7 函数的类型

### 2.7.1 函数声明

> 在 `JavaScript` 中，有两种常见的定义函数的方式——函数声明（`Function Declaration`）和函数表达式（`Function Expression`）

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

### 2.7.2 函数表达式

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



### 2.7.3 用接口定义函数的形状

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

**需要注意的是，可选参数必须接在必需参数后面。换句话说，可选参数后面不允许再出现必须参数了**

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


### 2.7.4 参数默认值


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


### 2.7.5 剩余参数

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

### 2.7.6 函数重载

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



## 2.8 类型断言

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



## 2.9 声明文件

> 当使用第三方库时，我们需要引用它的声明文件

### 2.9.1 声明(declare)语句

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

### 2.9.2 声明文件(约定.d.ts后缀)

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

### 2.9.3 第三方声明文件

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

- 我们可以直接下载下来使用，但是更推荐的是使用工具统一管理第三方库的声明文件- 社区已经有多种方式引入声明文件，不过 `TypeScript 2.0 `推荐使用 `@types` 来管理。
- `@types` 的使用方式很简单，直接用 `npm` 安装对应的声明模块即可，以 `jQuery` 举例


```bash
npm install @types/jquery --save-dev
```

**可以在这个页面搜索你需要的声明文件**

> http://microsoft.github.io/TypeSearch/


## 2.10 内置对象


> `JavaScript` 中有很多内置对象，它们可以直接在 `TypeScript` 中当做定义好了的类型

> 内置对象是指根据标准在全局作用域（`Global`）上存在的对象。这里的标准是指 `ECMAScript` 和其他环境（比如 `DOM`）的标准

### 2.10.1 ECMAScript 的内置对象

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

### 2.10.2 DOM 和 BOM 的内置对象

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

### 2.10.3 TypeScript 核心库的定义文件

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

### 2.10.4 用 TypeScript 写 Node.js

> `Node.js` 不是内置对象的一部分，如果想用 `TypeScript` 写 `Node.js`，则需要引入第三方声明文件

```bash
npm install @types/node --save-dev
```



# 三、进阶

## 3.1 类型别名

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


## 3.2 字符串字面量类型

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

**注意，类型别名与字符串字面量类型都是使用 type 进行定**

## 3.3 元组

- 数组合并了相同类型的对象，而元组（`Tuple`）合并了不同类型的对象。
- 元组起源于函数编程语言,在这些语言中频繁使用元组。

### 3.3.1 简单的例子

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

### 3.3.2 越界的元素

> 当添加越界的元素时，它的类型会被限制为元组中每个类型的联合类型


```js
let user: [string, number];
user = ['poetries', 22];
user.push('http://blog.poetries.top');
user.push(true);

// index.ts(4,14): error TS2345: Argument of type 'boolean' is not assignable to parameter of type 'string | number'.
//   Type 'boolean' is not assignable to type 'number'.
```

## 3.4 枚举

> 枚举（`Enum`）类型用于取值被限定在一定范围内的场景，比如一周只能有七天，颜色限定为红绿蓝等

### 3.4.1 简单的例子

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

### 3.4.2 手动赋值

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

### 3.4.3 常数项和计算所得项

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

### 3.4.4 常数枚举

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

### 3.4.5 外部枚举

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


## 3.5 类

### 3.5.1 类的概念

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

### 3.5.2 public private 和 protected

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
lass Animal {
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


### 3.5.3 抽象类

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

### 3.5.4 类的类型

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


## 3.6 类与接口

### 3.6.1 类实现接口

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

### 3.6.2 接口继承接口

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

### 3.6.3 接口继承类

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

### 3.6.4 混合类型

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

## 3.7 泛型

> 泛型（`Generics`）是指在定义函数、接口或类的时候，不预先指定具体的类型，而在使用的时候再指定类型的一种特性

### 3.7.1 简单的例子

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

### 3.7.2 多个类型参数

> 定义泛型的时候，可以一次定义多个类型参数：

```js
function swap<T, U>(tuple: [T, U]): [U, T] {
    return [tuple[1], tuple[0]];
}

swap([7, 'seven']); // ['seven', 7]
```

> 上例中，我们定义了一个 `swap` 函数，用来交换输入的元组

### 3.7.3 泛型约束

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

### 3.7.4 泛型接口


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

### 3.7.5 泛型类

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

### 3.7.6 泛型参数的默认类型

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



## 3.8 声明合并


> 如果定义了两个相同名字的函数、接口或类，那么它们会合并成一个类型

### 3.8.1 函数的合并

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

### 3.8.2 接口的合并

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

### 3.8.3 类的合并

> 类的合并与接口的合并规则一致

# 四、工程

## 4.1 tsconfig.json

**编译选项**

> 你可以通过 `compilerOptions` 来定制你的编译选项

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


## 4.2 TypeScript 编译

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

# 五、一些例子演示

## 5.1 定义ajax请求数据接口

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

## 5.2 函数类型接口-对方法约束

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

## 5.3 可索引接口：数组、对象的约束（不常用）

### 5.3.1 可索引接口-对数组的约束

```js
interface UserArr{
    [index:number]:string
}


var arr:UserArr=['aaa','bbb'];

console.log(arr[0]);
```

### 5.3.2 可索引接口-对对象的约束

```js
interface UserObj{
    [index:string]:string
}

var arr:UserObj={name:'张三'};
```

### 5.3.3 类类型接口:对类的约束

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

## 5.4 接口的扩展

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

## 5.5 泛型类接口

### 5.5.1 泛型类 泛型方法

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


### 5.5.2 泛型接口

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




# 六、更多参考

- [Typescript中文网](https://www.tslang.cn/docs/handbook/typescript-in-5-minutes.html)
- [技术胖Typescript视频学习入门](http://jspang.com/post/typescript.html#toc-a39)


