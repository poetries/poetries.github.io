---
title: TypeScript 中 interface 与 type 的区别和选型建议
date: 2019-09-28 16:25:24
description: 从相同点讲到真正有差别的地方，包含声明合并、extends 与交叉类型的冲突处理差异、隐式索引签名、报错可读性和编译性能，最后给出一份可以直接照着执行的选型规则。
tags:
   - JavaScript
   - Typescript
   - 类型系统
categories: Front-End
---

`interface` 和 `type` 到底该用哪个，是 TypeScript 项目里最容易起争执的问题之一。网上大部分回答停在「差不多，看团队规范」，但真到了写 `Record<string, unknown>` 报错、两个类型交叉之后属性静默变成 `never`、或者要给第三方库补类型这几个场景，选错了是要返工的。

这篇把两者真正有差别的地方一条条列出来，每条都在 TypeScript 5.9.3 上验证过，最后给一份可以直接照着执行的选型规则。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 两者在描述对象和函数上的写法差异，以及为什么可以互相 `extends`
- `type` 独有的能力，联合类型、元组、映射类型、条件类型、模板字面量类型
- `interface` 独有的声明合并，以及它在给第三方库补类型时的不可替代性
- `extends` 和交叉类型在遇到属性冲突时的行为差异，这条最容易踩
- 隐式索引签名，为什么 `interface` 赋值给 `Record` 会报错而 `type` 不会
- 报错信息、编译性能，以及最终的选型建议

## 一、相同之处

### 1.1 都可以描述一个对象或者函数

**interface**

```ts
interface User {
  name: string
  age: number
}

interface SetUser {
  (name: string, age: number): void;
}
```

**type**

```ts
type User = {
  name: string
  age: number
};

type SetUser = (name: string, age: number)=> void;
```

这里补一个原文没提的细节。上面 `SetUser` 的两种写法虽然等价，但 `interface` 那种「调用签名」的形式支持给函数类型追加静态属性，`type` 要做到同样的事得写交叉类型。日常业务里用不到，写库的时候偶尔会遇到。

### 1.2 都允许拓展（extends）

`interface` 和 `type` 都可以拓展，并且两者并不是相互独立的，也就是说 `interface` 可以 `extends type`，`type` 也可以 `extends interface`。虽然效果差不多，但是两者语法不同。

**interface extends interface**

```ts
interface Name {
  name: string;
}
interface User extends Name {
  age: number;
}
```

**type extends type**

```ts
type Name = {
  name: string;
}
type User = Name & { age: number  };
```

**interface extends type**

```ts
type Name = {
  name: string;
}
interface User extends Name {
  age: number;
}
```

**type extends interface**

```ts
interface Name {
  name: string;
}
type User = Name & {
  age: number;
}
```

四种组合都合法，写法上一个用 `extends` 一个用 `&`。这里说「效果差不多」是有前提的，前提是**两边没有同名属性冲突**。冲突的时候差别巨大，第四节专门讲这个。

另外注意 `interface extends` 的右边只能是对象类型或者由对象类型组成的交叉类型，你没法 `interface Foo extends (string | number)`，因为联合类型不是对象类型。

## 二、type 可以而 interface 不行

`type` 可以声明基本类型别名、联合类型、元组等类型：

```ts
// 基本类型别名
type Name = string

// 联合类型
interface Dog {
    wong(): void;
}
interface Cat {
    miao(): void;
}

type Pet = Dog | Cat

// 具体定义数组每个位置的类型
type PetList = [Dog, Pet]
```

原文这里的 `wong();` 和 `miao();` 没写返回类型，在 `strict` 模式下会直接报 `TS7010: 'wong', which lacks return-type annotation, implicitly has an 'any' return type`。我在 TypeScript 5.9.3 上确认过，所以上面补上了 `: void`。老文里这类省略很常见，因为当年很多项目不开 `strict`。

`type` 语句中还可以使用 `typeof` 获取实例的类型进行赋值：

```ts
// 当你想获取一个变量的类型时，使用 typeof
let div = document.createElement('div');
type B = typeof div
```

其他骚操作：

```ts
type StringOrNumber = string | number;
type Text = string | { text: string };
type NameLookup = Dictionary<string, Person>;
type Callback<T> = (data: T) => void;
type Pair<T> = [T, T];
type Coordinates = Pair<number>;
type Tree<T> = T | { left: Tree<T>, right: Tree<T> };
```

### 2.1 真正拉开差距的是类型运算

上面这些还只是「别名」层面的能力。`type` 和 `interface` 真正的分水岭在于，TypeScript 后来加进来的类型运算能力**全部只挂在 `type` 上**。

映射类型，遍历一个类型的所有 key 生成新类型：

```ts
type Readonly<T> = { readonly [K in keyof T]: T[K] }
type Partial<T> = { [K in keyof T]?: T[K] }
```

条件类型，根据类型关系分支：

```ts
type NonNullable<T> = T extends null | undefined ? never : T
type ElementOf<T> = T extends (infer U)[] ? U : never
```

模板字面量类型，用字符串拼接构造类型：

```ts
type EventName<T extends string> = `on${Capitalize<T>}`
type Click = EventName<'click'>   // 'onClick'
```

内置的工具类型 `Partial`、`Pick`、`Omit`、`Record`、`ReturnType` 全部是用 `type` 实现的，因为它们的实现依赖映射类型和条件类型。你想自己写一个通用的类型工具，只有 `type` 这一条路。

所以「两者差不多」这个说法在 2019 年勉强成立，放到今天已经不成立了。

## 三、interface 可以而 type 不行

`interface` 能够声明合并：

```ts
interface User {
  name: string
  age: number
}

interface User {
  sex: string
}

/*
User 接口为 {
  name: string
  age: number
  sex: string
}
*/
```

同名的 `type` 会直接报 `TS2300: Duplicate identifier`，我在 5.9.3 上跑过，两行都会标红。

### 3.1 声明合并不是玩具特性

第一次看到声明合并，我的反应是这玩意儿听着像个陷阱，同名的东西自动合并，出问题很难查。后来才发现它在一个场景里完全不可替代：**给别人的类型补东西**。

给全局对象加字段：

```ts
declare global {
  interface Window {
    __APP_VERSION__: string
  }
}
```

给 Express 的 `Request` 挂上自己的用户信息：

```ts
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; role: string }
  }
}
```

这两种写法都依赖声明合并，用 `type` 做不到。你不可能去改 `@types/express` 的源码，也不可能重新声明一个同名 `type`。所以只要你的项目需要扩展第三方库或者全局类型，`interface` 就是必选项。

反过来说，声明合并在业务类型上确实是个隐患。团队里两个人各自在不同文件写了 `interface Config`，TypeScript 不会报错，只会安静地合并，最后拿到的是一个谁也没预期的类型。这是很多团队规范里写「业务类型统一用 type」的理由。

## 四、extends 和交叉类型，冲突时行为完全不同

这一节是整篇最实用的部分。

同名属性类型冲突时，`interface extends` 会立刻报错：

```ts
interface A { x: string }
interface B extends A { x: number }
// TS2430: Interface 'B' incorrectly extends interface 'A'.
//   Types of property 'x' are incompatible.
//     Type 'number' is not assignable to type 'string'.
```

交叉类型不报错，它会把两个类型求交集：

```ts
type C = { x: string } & { x: number }
declare const c: C
const cx: never = c.x   // 编译通过，c.x 的类型就是 never
```

`string` 和 `number` 没有交集，所以 `c.x` 静默变成了 `never`。你把 `C` 传给别的函数，报错会出现在很远的地方，提示大概是「`never` 类型的参数不能赋给 `string`」，然后你要顺着调用链一路往回找，才能找到这个交叉类型。

这个我在 TypeScript 5.9.3 上验证过，两段的行为完全如上。

先说结论，**继承关系用 `interface extends` 比用 `&` 安全**，因为错误会在定义处就暴露，而不是延后到使用处。

### 4.1 隐式索引签名

这条也很容易撞上。同样是描述一个只有 `name` 的对象，`type` 声明的能赋值给 `Record<string, unknown>`，`interface` 声明的不能：

```ts
interface IUser { name: string }
type TUser = { name: string }

const a: Record<string, unknown> = {} as IUser
// TS2322: Type 'IUser' is not assignable to type 'Record<string, unknown>'.
//   Index signature for type 'string' is missing in type 'IUser'.

const b: Record<string, unknown> = {} as TUser   // 通过
```

原因是 `type` 声明的对象字面量类型会被隐式赋予索引签名，而 `interface` 不会。TypeScript 团队给的解释是 `interface` 可以被声明合并，任何时刻都可能被追加新属性，编译器没法保证它的键集合是封闭的，所以不敢给它推导索引签名。

什么时候会撞上？把对象传给 `JSON.stringify` 的包装函数、传给要求 `Record<string, unknown>` 的日志方法、传给某些表单库的 `values` 参数，都可能触发。解决办法是给 interface 显式加索引签名，或者把参数类型放宽成 `object`。

排查路径也挺固定的：看到 `Index signature for type 'string' is missing`，第一反应就该是这条。

### 4.2 报错信息和编译性能

这两点没有前面那么硬，但在大项目里能感觉出来。

报错信息上，`interface` 通常更友好。因为 interface 有名字，编译器在错误里会直接打出 `Interface 'B' incorrectly extends interface 'A'` 这样的句子；而复杂的交叉类型和条件类型经常被展开成一大坨结构，一屏都放不下。这几年 TypeScript 在保留类型别名名称上改进了不少，但复杂场景下还是 interface 更好读。

性能上，TypeScript 官方的 Performance 文档里有一条明确建议，用 `interface extends` 代替对象类型的交叉。原因是 interface 之间的关系可以被缓存，而交叉类型每次都要把成员摊平重新求解，类型层级一深，编译时间就上去了。这条我没在自己的项目上做过量化对比，只是照着官方建议在执行。

## 五、怎么选

原文最后给的建议是：如果不清楚什么时候用 `interface` 或 `type`，能用 `interface` 实现就用 `interface`，不能就用 `type`。

这条今天依然站得住，我在它基础上再细化一下。

| 场景 | 选哪个 | 理由 |
|------|--------|------|
| 描述对象结构、类要 implements 的契约 | `interface` | 报错友好，`extends` 冲突会当场报 |
| 有继承关系的一组类型 | `interface extends` | 冲突立刻暴露，编译更快 |
| 扩展第三方库或全局类型 | `interface` | 只有声明合并做得到 |
| 联合类型、元组、基本类型别名 | `type` | `interface` 表达不了 |
| 函数类型 | 都行，`type` 更简洁 | 一行搞定 |
| 工具类型、映射类型、条件类型 | `type` | 类型运算只挂在 `type` 上 |
| 从已有值推导类型（`typeof`） | `type` | 语法上只有 `type` 支持 |
| 需要赋值给 `Record<string, unknown>` | `type` | 有隐式索引签名 |

我自己现在的做法是：公开的、别人要实现或者继承的类型用 `interface`，内部推导出来的、组合出来的、参与类型运算的用 `type`。真到了两个都行的地方，跟团队现有代码保持一致就好，这一层的收益远小于统一带来的可读性收益。

顺带说一句，TypeScript 的其他基础用法我在 [TypeScript 实战入门](https://feinterview.poetries.top/blog/ts-in-action) 那篇里写过，这篇只聚焦这两个关键字的取舍。

## 总结

`interface` 和 `type` 在描述对象、描述函数、互相继承这几件事上确实差不多，但真正决定选型的是那些不重叠的部分。

`type` 独占的是表达能力。联合类型、元组、基本类型别名、`typeof` 推导，再加上映射类型、条件类型、模板字面量类型这一整套类型运算，`interface` 一样都做不了。TypeScript 内置的 `Partial`、`Pick`、`Omit`、`Record` 全是用 `type` 写的，你要造轮子只能走这条路。

`interface` 独占的是声明合并。给 `Window` 加字段、给 Express 的 `Request` 挂用户信息、给任何第三方库补类型，都只有这一条路。代价是同名 interface 会静默合并，业务类型上算是个隐患。

差别最大的是冲突处理。`interface extends` 遇到同名属性类型不兼容会当场报 TS2430；交叉类型不报，它把属性算成 `never`，然后让你在很远的调用处收到一个莫名其妙的报错。所以有继承关系的类型，用 `extends` 比用 `&` 安全，官方的性能建议也指向同一个结论。

还有一条容易撞上的：`interface` 没有隐式索引签名，赋值给 `Record<string, unknown>` 会报 `Index signature for type 'string' is missing`，`type` 声明的同结构对象则没这个问题。看到这个报错基本就是它。

选型规则不用太纠结，公开契约用 `interface`，类型运算用 `type`，其余跟着团队现有代码走。

## 参考

- [Everyday Types - TypeScript 官方文档](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Declaration Merging - TypeScript 官方文档](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [Mapped Types - TypeScript 官方文档](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)
- [Conditional Types - TypeScript 官方文档](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
- [Performance - TypeScript Wiki](https://github.com/microsoft/TypeScript/wiki/Performance)
- [前端进阶之旅](https://interview.poetries.top)
