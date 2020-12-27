---
title: ES6新特性
date: 2017-02-04 18:20:43
tags: 
   - JavaScript
   - ES6
categories: Front-End
---

#### 一、作用域

- 块级作用域
- 块级变量`let`
- 块级常量 `const`

#### 二、箭头函数

- `sum = (a,b)=> a + b`
- `nums.forEach(v=> {console.log(v)})`
- 词法 `this`
 
#### 三、参数处理

- 默认参数值
- 剩余参数
- 展开运算符

#### 四、模板字面量

- 多行字符串
- 字符串插值
- 带标签的模板字面量
- 原始字符串

#### 五、原有字面量加强

- 更安全的二进制字面量(0b1111101)
- 更安全的八进制字面量(0o767)
- 字符串支持`Unicode`
  - `String.fromCodePoint`
  - `String.prototype.codePointAt`
- 正则表达式字面量添加 Unicode
- 正则表达式添加y标记，支持粘滞匹配
- 对象属性加强
  - 属性定义支持短语法`obj = {x,y}`
  - 属性名支持表达式 `obj = {["baz"+quux()]:42}`
  - 添加`__proto__`属性，但不建议使用
  
#### 六、解构赋值

- 匹配 `[b,a] = [a,b]`
- 对象匹配 `let {a,b,c} = objABC`
- 参数匹配 `function g({name:n,val:v}){}`

#### 七、模块


- 导入(`import`)
- 导出(`export`)
- 默认导出(`export default`)

#### 八、类


- 使用`extends`继承
- 重写构造器
- `super`关键字

#### 九、迭代


- 迭代器
- `for of`

#### 十、生成器


#### 十一、promise


#### 十二、元编程

- 代理(`proxy`)
- 反射(`Reflex`)

#### 十三、新增数据类型

- `Symbol`类型
- `Set`类型
- `Map`类型
- `WeakSet`类型
- `WeakMap`类型
- `TypedArray`类型

#### 十四、原有内置对象`API`增强

- `Object.assign`

- `Array.from`

- `Array.of`

- `Array.prototype.fill`

- `Array.prototype.find`

- `Array.prototype.findIndex`

- `Array.prototype.copyWithin`

- `Array.prototype.entries`

- `Array.prototype.keys`

- `Array.prototype.values`

- `String.prototype.includes`

- `String.prototype.repeat`

- `String.prototype.startsWidth`

- `String.prototype.endsWidth()`

- `Number.EPSILON`

- `Number.isInteger`

- `Number.isSafeInteger`

- `Number.isFinite`

- `Number.isNaN("NaN")`

- `Math.acosh`

- `Math.hypot`

- `Math.imul`

- `Math.sign`

- `Math.trunc`