---
title: 浅析JSON.stringify
date: 2017-10-21 14:40:43
tags: JavaScript
categories: Front-End
---

## 一、JSON.stringify参数详解

- `stringify`方法顾名思义，就是把`JSON`序列化，其语法如下

```javascript
JSON.stringify(value [, replacer] [, space]) 
```

- `value`：是必选字段。就是你输入的对象、如数组等
- `replacer`：这个是可选的。它又分为`2`种方式，一种是数组，第二种是方法【过滤函数，或者key的过滤数组（只有在数组中的会展示）】
  - 情况一：`replacer`为数组时，通过后面的实验可以知道，它是和第一个参数`value`有关系的。一般来说，系列化后的结果是通过键值对来进行表示的。 所以，如果此时第二个参数的值在第一个存在，那么就以第二个参数的值做key，第一个参数的值为value进行表示，如果不存在，就忽略。
  - 情况二：`replacer`为方法时，那很简单，就是说把系列化后的每一个对象（记住是每一个）传进方法里面进行处理。 
- `space`：就是用什么来做分隔符的【格式化前面的空格字符】
  - 如果省略的话，那么显示出来的值就没有分隔符，直接输出来
  - 如果是一个数字的话，那么它就定义缩进几个字符，当然如果大于`10` ，则默认为`10`，因为最大值为`10`
  - 如果是一些转义字符，比如`\t`，表示回车，那么它每行一个回车。 
  - 如果仅仅是字符串，就在每行输出值的时候把这些字符串附加上去。当然，最大长度也是`10`个字符

## 二、只传一个参数

```javascript
var obj = {
  name:"poetries",
  age:22,
  job:"FED",
  location:"shenzhen of China"
};

JSON.stringify(obj)  //"{"name":"poetries","age":22,"job":"FED","location":"shenzhen of China"}"
```

**注意点**
 
> `JSON.stringify`对`obj`里面的数据类型有一些要求

- 非数组对象的属性不能保证以特定的顺序出现在序列化后的字符串中

```javascript
JSON.stringify({x: 5, y: 6}) // '{"x":5,"y":6}' 或者 '{"y":6,"x":5}' 都可能
```

- 布尔值、数字、字符串的包装对象在序列化过程中会自动转换成对应的原始值
- `undefined`、任意的函数以及 `symbol` 值，在序列化过程中会被忽略（出现在非数组对象的属性值中时）或者被转换成 `null`（出现在数组中时）

```javascript
var obj = {
  "undefined":undefined,
  "null":null,
  "true":true,
  "func":function(){},
  "symbol":Symbol("")
};
JSON.stringify(obj); //"{"null":null,"true":true}"

// 出现在数组中时被转化成null
var arr = [undefined,Symbol(""),function(){}];
JSON.stringify(arr); //[null,null,null]
```

- 不可枚举的属性会被忽略

```javascript
JSON.stringify( Object.create(null, { x: { value: 'x', enumerable: false }, y: { value: 'y', enumerable: true } }) );
// '{"y":"y"}'
```

## 三、传递两个参数的时候

> - 第二个参数可以是一个过滤函数，也可以是一个数组
> - 当为数组时则只有包含在这个数组中的属性名才会被序列化到最终的 `JSON` 字符串中

### 3.1 过滤函数

- 注意点：
  - 这里一定要`return`一个值给下一个遍历函数作为参数传入，如果不`return`的话，后面的遍历就没法玩下去了

```javascript
var obj = {
  name:"poetries",
  age:22,
  job:"FED",
  location:"shenzhen of China"
};

JSON.stringify(obj, (key,value) => {
   console.log(key)
   return value; // 这个是必须的，用于下一次的循环迭代
})
```

### 3.2 数组

```javascript
var obj = {
  name:"poetries",
  age:22,
  job:"FED",
  location:"shenzhen of China"
};
JSON.stringify(obj, ["name", "age"]);

//job、location由于不在列表里，所以没被序列化
//"{"name":"poetries","age":22}"
```

## 四、传递三个参数的时候

> 第三参数space用来控制结果字符串里面的间距

- 如果是一个数字, 则在字符串化时每一级别会比上一级别缩进多这个数字值的空格（最多10个空格）
- 如果是一个字符串，则每一级别会比上一级别多缩进用该字符串（或该字符串的前十个字符）

```javascript
var obj = {name:"poetries",age:22,job:"FED",location:"shenzhen of China",lov:{age:11}};
JSON.stringify(obj, null,10);
// //每一个层级比上一个多10个空格
"{
          "name": "poetries",
          "age": 22,
          "job": "FED",
          "location": "shenzhen of China",
          "lov": {
                    "age": 11
          }
}"
```

```javascript
var obj = {
  name:"poetries",
  age:22,
  job:"FED",
  location:"shenzhen of China",
  lov:{
    age:11
  }
};
JSON.stringify(obj, null,"\n");
// 每一个层级比上一个多了一个回车符
"{

"name": "poetries",

"age": 22,

"job": "FED",

"location": "shenzhen of China",

"lov": {


"age": 11

}
}"
```

  
## 五、toJSON 方法

> 如果一个被序列化的对象拥有 `toJSON` 方法，那么该 `toJSON` 方法就会覆盖该对象默认的序列化行为

```javascript
var obj = {
  name:"poetries",
  info:{
    age:18,
    sex:"male"
  },
  toJSON:function(){
    return "via toJSON";
  }
};

JSON.stringify(obj); // ""via toJSON""
```
