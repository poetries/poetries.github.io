---
title: 业务中处理数据结构常用的JS方法
date: 2018-08-12 19:11:43
tags: 
  - JavaScript
  - API
categories: Front-End
---

一、由map、filter、reduce、find展开
---

**filter**

> filter方法可以筛除数组和类似结构中不满足条件的元素，并返回满足条件的元素组成的数组。

```javascript
const integers = [1, 2, 3, 4, 6, 7];
const evenIntegers = integers.filter(i => i%2 === 0);
// evenIntegers的值为[2, 4, 6]
```

**find**

> find返回数组或类似结构中满足条件的第一个元素

```javascript
const posts = [
  {id: 1, title: 'Title 1'},
  {id: 2, title: 'Title 2'}
];
// 找出id为1的posts
const title = posts.find(p => p.id === 1).title;
```

**map**

> map方法的作用在于处理流式数据，比如数组。我们可以把它想象成所有元素都要经过的一个转换器。

```javascript
const integers = [1, 2, 3, 4, 6, 7];
const twoXIntegers = integers.map(i => i*2);
// twoXIntegers现在是 [2, 4, 6, 8, 12, 14]，而integers不发生变化。
```

**reduce**

> 当你想要将多个数据放进一个实例中时，你可以使用一个reducer

```javascript
const posts = [
  {id: 1, upVotes: 2},
  {id: 2, upVotes: 89},
  {id: 3, upVotes: 1}
];
const totalUpvotes = posts.reduce((totalUpvotes, currentPost) =>     
  totalUpvotes + currentPost.upVotes, //reducer函数
  0 // 初始化投票数为0
);
console.log(totalUpvotes)//输出投票总数：92
```

- 传给`reduce`的第一个参数函数还可以增加2个参数：
- 第三个参数：每个元素在原数据结构中的位置，比如数组下标。
- 第四个参数：调用reduce方法的数据集合，比如例子中的posts

**some**

> some找到数组中符合条件的一项就不会在找，类似于`find`只找第一项

```
[1,2,3,4,5].some(v=>v>4) // true 符合有某一项满足条件
```

**every**

> `every`数组中每个条件都为真才会返回真

```
[1,2,3,4,5].every(v=>v>1) // false 数组中每一项都大于1才会返回true 
```

二、向对象数组添加新元素
---


```javascript
const books = [];
const newBook = {title: 'Alice in wonderland', id: 1};
const updatedBooks = [...books, newBook];
//updatedBooks的值为[{title: 'Alice in wonderland', id: 1}]
```

三、为一个数组创建视图
---


> 如果需要实现用户从购物车中删除物品，但是又不想破坏原来的购物车列表，可以使用filter方法


```javascript
const myId = 6;
const userIds = [1, 5, 7, 3, 6];
const allButMe = userIds.filter(id => id !== myId);
// allButMe is [1, 5, 7, 3]
```

四、向数组中新增元素
---

```javascript
const books = ['Positioning by Trout', 'War by Green'];
const newBooks = [...books, 'HWFIF by Carnegie'];
// newBooks are now ['Positioning by Trout', 'War by Green', 'HWFIF // by Carnegie']
```

五、为对象新增一组键值对
---

```javascript
const user = {name: 'Shivek Khurana'};
const updatedUser = {...user, age: 23};
//updatedUser的值为：{name: 'Shivek Khurana', age: 23}
```

六、使用变量作为键名为对象添加键值对
---


```javascript
const dynamicKey = 'wearsSpectacles';
const user = {name: 'Shivek Khurana'};
const updatedUser = {...user, [dynamicKey]: true};
// updatedUser is {name: 'Shivek Khurana', wearsSpectacles: true}
```

七、修改数组中满足条件的元素对象
---

```javascript
const posts = [
  {id: 1, title: 'Title 1'},
  {id: 2, title: 'Title 2'}
];
const updatedPosts = posts.map(p => p.id !== 1 ?
  p : {...p, title: 'Updated Title 1'}
);
/*
updatedPosts is now 
[
  {id: 1, title: 'Updated Title 1'},
  {id: 2, title: 'Title 2'}
];
*/
```

八、找出数组中满足条件的元素
---


```javascript
const posts = [
  {id: 1, title: 'Title 1'},
  {id: 2, title: 'Title 2'}
];
const postInQuestion = posts.find(p => p.id === 2);
// postInQuestion now holds {id: 2, title: 'Title 2'}
```

九、删除目标对象的一组属性
---


```javascript
//方法一
const user = {name: 'Shivek Khurana', age: 23, password: 'SantaCl@use'};
const userWithoutPassword = Object.keys(user)
  .filter(key => key !== 'password')
  .map(key => {[key]: user[key]})
  .reduce((accumulator, current) => 
    ({...accumulator, ...current}),
    {}
  )
;

// 方法二
const user = {name: 'Shivek Khurana', age: 23, password: 'SantaCl@use'};
const userWithoutPassword = (({name, age}) => ({name, age}))(user);

// userWithoutPassword becomes {name: 'Shivek Khurana', age: 23}
```

十、将对象转化成请求串
---


```javascript
const params = {color: 'red', minPrice: 8000, maxPrice: 10000};
const query = '?' + Object.keys(params)
  .map(k =>   
    encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
  )
  .join('&')
;
// encodeURIComponent将对特殊字符进行编码。
// query is now "color=red&minPrice=8000&maxPrice=10000"
```

十一、获取数组中某一对象的下标
---


```javascript
const posts = [
  {id: 13, title: 'Title 221'},
  {id: 5, title: 'Title 102'},
  {id: 131, title: 'Title 18'},
  {id: 55, title: 'Title 234'}
];
// 找到id为131的元素
const requiredIndex = posts.findIndex(obj=>obj.id===131);
```
