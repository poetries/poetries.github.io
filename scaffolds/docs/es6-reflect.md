---
title: ES6系列之Reflect
date: 2018-12-21 11:10:31
tags: 
  - ES6
  - Javascript
categories: Front-End
---


## 一、简介

### 1.1 什么是Reflect

> 为操作对象而提供的新`API`

### 1.2 为什么要设计Reflect

1. 将`Object`对象的属于语言内部的方法放到`Reflect`对象上，即从`Reflect`对象上拿`Object`对象内部方法
2. 将用老`Object`方法报错的情况，改为返回`false`

```js
// 旧写法
try {
  Object.defineProperty(target, property, attributes);
  // success
} catch (e) {
  // failure
}
```

```js
// 新写法
if (Reflect.defineProperty(target, property, attributes)) {
  // success
} else {
  // failure
}
```

3. 让`Object`操作变成函数行为

```js
// 旧写法
'name' in Object //true
```

```js
// 新写法
Reflect.has(Object,'name') //true
```

4. `Reflect`与`Proxy`是相辅相成的，在`Proxy`上有的方法，在`Reflect`就一定有

```js
let target={}
let handler={
  set(target,proName,proValue,receiver){
    //确认对象的属性赋值成功
    let isSuccess=Reflect.set(target,proName,proValue,receiver)
    if(isSuccess){
      console.log("成功")
    }
    return isSuccess
  }
}
let proxy=new Proxy(target,handler)
```

> 确保对象的属性能正确赋值，广义上讲，即确保对象的原生行为能够正常进行，这就是`Reflect`的作用

## 二、Reflect的API

> 注：和`Proxy`的`API`一致

### 2.1 Reflect.get(target,property,receiver)

> 查找并返回`target`对象的`property`属性

```js
let obj={
  name:"poetries",
}
let result=Reflect.get(obj,"name")
console.log(result) //poetries 
```

```js
let obj={
  //属性yu部署了getter读取函数
  get yu(){
    //this返回的是Reflect.get的receiver参数对象
    return this.name+this.age
  }
}

let receiver={
  name:"shen",
  age:"18",
}

let result=Reflect.get(obj,"yu",receiver)
console.log(result) //shen18
```

> 注意：如果`Reflect.get()`的第一个参数不是对象，则会报错

### 2.2 Reflect.set(target,propName,propValue,receiver)

> 设置`target`对象的`propName`属性为`propValue`

```js
let obj={
  name:"poetries"
}

let result=Reflect.set(obj,"name","静观流叶")
console.log(result) //true
console.log(obj.name) //静观流叶
```

### 2.3 Reflect.set与Proxy.set

> `Reflect.set`与`Proxy.set`联合使用,并且传入`receiver`，则会进行定义属性操作

```js
let obj={
  name:"chen"
}

let handler={
  set(target,key,value,receiver){
    console.log("Proxy拦截赋值操作")
    //Reflect完成赋值操作
    Reflect.set(target,key,value,receiver)
  },
  defineProperty(target,key,attribute){
    console.log("Proxy拦截定义属性操作")
    //Reflect完成定义属性操作
    Reflect.defineProperty(target,key,attribute)
  }
}

let proxy=new Proxy(obj,handler)
proxy.name="ya"
//Proxy拦截赋值操作
//Proxy拦截定义属性操作
```

> 为什么Reflect.set()传入receiver参数，就会触发定义属性的操作？

因为`Proxy.set()`中的`receiver`是`Proxy`的实例，即`obj`，而`Reflect.set`一旦传入`receiver`，就会将属性赋值到`receiver`上面，也是`obj`，所以就会触发`defineProperty`拦截

### 2.4 Reflect.has(obj,name)

```js
var obj= {
  name: "poetries",
};
```

```js
//旧写法
'name' in obj // true
```

```js
//新写法
Reflect.has(obj, 'name') // true
```

### 2.5 Reflect.deleteProperty(obj, name)

> 删除对象的属性

```js
// 旧写法
delete obj.name;
```

```js
// 新写法
Reflect.deleteProperty(obj, 'name');
```

### 2.6 Reflect.construct(target, args)

```js
function Person(name) {
  this.name = name;
}
```

```js
// 旧 new写法
let person= new Person('poetries')
```

```js
// 新写法：Reflect.construct 的写法
let person = Reflect.construct(Person, ['poetries']);
```

### 2.7 Reflect.getPrototypeOf(obj)

> 用于读取对象的`proto`属性，对应`Object.getPrototypeOf(obj)`

### 2.8 Reflect.setPrototypeOf(obj, newProto)

> 设置目标对象的原型（`prototype`），对应`Object.setPrototypeOf(obj, newProto)`方法

### 2.9 Reflect.apply(func, thisArg, args)

> 继承目标对象的特定方法

```js
let array=[1,2,3,4,5,6]
```

```js
// 旧写法
let small= Math.min.apply(Math, array) //1
let big = Math.max.apply(Math, array) //6
let type = Object.prototype.toString.call(small) //"[object Number]"
```

```js
// 新写法
const small= Reflect.apply(Math.min, Math, array)
const big = Reflect.apply(Math.max, Math, array)
//第三个参数是Object类型的就好，因为调用的是Object的原型方法toString
const type = Reflect.apply(Object.prototype.toString, small, [])
```

### 2.10 Reflect.defineProperty(target, propertyKey, attributes)

```js
function MyDate() {
  ...
  ...
}
```

```js
// 旧写法
Object.defineProperty(MyDate, 'now', {
  value: () => Date.now()
});
```

```js
// 新写法
Reflect.defineProperty(MyDate, 'now', {
  value: () => Date.now()
});
```

> 与`Proxy.defineProperty`配合使用

```js
let proxy = new Proxy({}, {
  defineProperty(target, prop, descriptor) {
    console.log(descriptor);
    return Reflect.defineProperty(target, prop, descriptor);
  }
});

proxy .name= 'chen';
// {value: "chen", writable: true, enumerable: true, configurable: true}
p.name // "chen"
```

> 如上，`Proxy.defineProperty`对属性赋值设置拦截，然后使用`Reflect.defineProperty`完成赋值

### 2.11 Reflect.getOwnPropertyDescriptor(target, propertyKey)

> 基本等同于`Object.getOwnPropertyDescriptor`，用于得到指定属性的描述对象

### 2.12 Reflect.isExtensible (target)

> 对应`Object.isExtensible`，返回一个布尔值，表示当前对象是否可扩展

### 2.13 Reflect.preventExtensions(target)

> 对应`Object.preventExtensions`方法，用于让一个对象变为不可扩展。它返回一个布尔值，表示是否操作成功

### 2.14 Reflect.ownKeys (target)

> 用于返回对象的所有属性

