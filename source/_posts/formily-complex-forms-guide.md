---
title: Formily 核心概念解析与构建复杂表单的最佳实践总结
date: 2023-01-17 11:40:12
description: 从表单开发的真实痛点出发，讲清 Formily 的 MVVM 领域模型、createForm 与 Field 的职责边界、内置与异步校验、主动被动两种联动模式，以及 Schema 抽离、性能优化、数组表单等复杂表单的落地写法。
tags:
- Formily
- React
- 表单
- 状态管理
- 前端工程化
- Ant Design
- JSON Schema
categories: Front-End
---

接手过一个后台的「商品发布」页面，一屏四十多个字段，规则大概是这样的：选了「实物商品」才出现物流那一组，选了「虚拟商品」出现兑换码那一组；`SKU` 是个可增删的表格，每行的价格要参与总价计算；优惠券字段要拿另外两个字段的值去后端校验一次。这页用 `antd` 的 `Form` 写了八百多行，改一个需求要在 `useState`、`useEffect`、`onValuesChange` 三个地方同时动手，谁改谁头疼。

后来这类页面我改用 `Formily` 重写，代码量掉到三分之一，更重要的是联动逻辑终于集中在一个地方了。这篇把 `Formily` 的核心概念、校验体系、联动模式，以及我在实际项目里踩出来的一些取舍写清楚。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 传统表单开发到底卡在哪，`Formily` 是冲着哪几个问题去的
- `Formily` 的 MVVM 领域模型，`createForm` / `FormProvider` / `Field` 各管什么
- 内置规则、格式校验、自定义规则、异步校验、联动校验五种校验方式
- 主动模式和被动模式两种联动写法，分别适合什么场景
- Schema 抽离、复杂联动集中管理、性能优化这些落地经验
- 什么项目适合上 `Formily`，什么项目上了反而更麻烦

## 一、Formily 想解决的到底是什么

### 1.1 传统表单开发的四个坑

**代码重复**。每个表单页都要写一遍状态管理、校验逻辑、联动处理。这些代码在不同表单之间长得极像，但字段名不一样、规则不一样，抽不成公共组件，只能复制粘贴改改。

**联动逻辑散得到处都是**。「选 A 之后显示 B」「C 变了 D 自动重算」这类需求，在命令式写法里会散落到 `onChange` 回调、`useEffect`、渲染函数的三元表达式里。字段一多，你根本说不清某个字段是被谁改的。

**校验规则分散**。有的写在组件 `state` 里，有的挂在 `Form` 的 `rules` 上，有的塞在 `blur` 回调里。想统一改一下「所有必填项的提示文案」，得全局搜一遍。

**动态表单几乎写不了**。字段结构由后端配置下发，前端要根据一份 JSON 动态渲染出整个表单，命令式写法在这种场景下基本抓瞎。

### 1.2 Formily 的定位

`Formily` 是阿里开源的表单解决方案，一句话概括就是**一个抽象了表单领域模型的 MVVM 表单方案**。它把表单开发从命令式改成了声明式：你不再是「监听某个事件然后手动改另一个状态」，而是「声明字段之间的关系」，剩下的交给框架。

它的几个核心能力：

- **完善的领域模型**。把表单拆成 `Form`、`Field`、`Validator` 等概念，每一层的职责边界清楚，状态管理不再是一团 `useState`。
- **联动能力**。支持主动和被动两种模式，一对一、一对多、多对一的联动都能写得很短。
- **校验体系**。内置 `@formily/validator` 校验引擎，支持 JSON Schema 协议校验、自定义规则、异步校验。
- **多框架支持**。`@formily/react` 和 `@formily/vue` 两个桥接包，核心逻辑在 `@formily/core` 里，跟视图层无关。

## 二、核心概念与架构

### 2.1 MVVM 是怎么落到表单上的

`Formily` 采用 MVVM 架构，对应关系是这样的：

- **Model**：`@formily/core` 里的 `Form` 实例，管整个表单的状态、数据、校验规则
- **View**：`Input`、`Select` 这些 UI 组件
- **ViewModel**：`Field` 实例，连接 Model 和 View 的桥梁

这套拆分带来的直接好处是**表单状态和 UI 渲染彻底解耦**。`Form` 实例是一个独立于 React 的普通对象，你可以在任何地方拿到它、读它、改它，不用非得在组件树里。写单元测试的时候这一点尤其舒服，直接构造 `form` 实例跑逻辑，不用挂载组件。

底层撑起这套响应式的是 `@formily/reactive`，思路和 `MobX` 是一路的，都是靠 `observable` 加自动依赖收集来做精准更新。如果你对这套响应式的原理感兴趣，可以顺带看看 [MobX 在 React 项目里的最佳实践](https://feinterview.poetries.top/blog/mobx-react-best-practices)，两者的心智模型基本相通。

### 2.2 包结构

`Formily` 的分层很清楚，装包之前先搞明白你需要哪几层：

**核心层** `@formily/core`，负责表单状态、校验、联动。跟框架无关，Vue 项目用的也是它。

**桥接层** `@formily/react` 和 `@formily/vue`，把核心库接到具体框架的渲染体系里。

**组件层** `@formily/antd` 和 `@formily/next`，分别基于 `Ant Design` 和 `Alibaba Fusion` 封装，提供开箱即用的表单组件。这里有个版本对应要注意：`@formily/antd` 对应的是 `antd` v4，用 `antd` v5 的项目要装 `@formily/antd-v5`，装错了组件会各种样式错乱。

### 2.3 三个必须搞懂的 API

**createForm** 用来创建表单核心领域模型，它就是 MVVM 里那个标准的 ViewModel。

```javascript
import { createForm } from '@formily/core'

const form = createForm({
  // 表单初始值
  initialValues: {
    username: '',
    password: ''
  },
  // 表单变化回调
  onChange: (values) => {
    console.log('表单值变化:', values)
  },
  // 副作用处理
  effects: ($, { onFieldValueChange }) => {
    onFieldValueChange('username', (field) => {
      console.log('username 变化:', field.value)
    })
  }
})
```

这段代码表达的意思是对的（初始值 + 值变化监听 + 副作用），但写法上有两个地方跟 `Formily 2` 的实际 API 对不上，得说明一下。一是监听整体值变化，标准做法是在 `effects` 里用 `onFormValuesChange` 生命周期钩子，`createForm` 本身没有 `onChange` 选项；二是 `effects` 的签名是 `effects(form)`，只接收一个 `form` 参数，`onFieldValueChange` 这些钩子是**从 `@formily/core` 里 import 进来的**，不是从第二个参数解构出来的。写成上面那样在新版本里会直接报「不是函数」。正确的形态是这样：

```javascript
import { createForm, onFieldValueChange, onFormValuesChange } from '@formily/core'

const form = createForm({
  initialValues: { username: '', password: '' },
  effects() {
    onFormValuesChange((form) => {
      console.log('表单值变化:', form.values)
    })
    onFieldValueChange('username', (field) => {
      console.log('username 变化:', field.value)
    })
  }
})
```

**FormProvider** 是视图层桥接表单模型的入口。它接收 `createForm` 创建出来的 `Form` 实例，用 Context 把实例传给子组件，`Field` 才知道自己该往哪个 `form` 上挂。

**Field** 用来承接普通字段，是表单数据绑定的最小单位。

**createSchemaField** 用来创建基于 JSON Schema 的字段组件，走的是声明式配置那条路，动态表单靠它。

## 三、跑通第一个表单

### 3.1 装包

用 `Formily` 一定要装 `@formily/core`，它管状态、校验、联动这些核心逻辑：

```bash
# 安装内核库
npm install --save @formily/core

# 安装 React 桥接库
npm install --save @formily/react

# 安装 Ant Design 组件库
npm install --save antd moment @formily/antd
```

顺带说一句，`moment` 这个依赖是 `antd` v4 时代的产物，`antd` v5 已经换成了 `dayjs`，新项目照着装 `moment` 会白白多一个几百 K 的包，按你的 `antd` 版本来。

### 3.2 一个完整例子

下面这个例子把上面提到的几个 API 全串起来了：

```tsx
import React from 'react'
import { createForm } from '@formily/core'
import { FormProvider, FormConsumer, Field } from '@formily/react'
import {
  FormItem,
  FormLayout,
  Input,
  FormButtonGroup,
  Submit,
} from '@formily/antd'

// 创建表单实例
const form = createForm()

export default () => {
  return (
    <FormProvider form={form}>
      <FormLayout layout="vertical">
        <Field
          name="username"
          title="用户名"
          required
          initialValue="Hello world"
          decorator={[FormItem]}
          component={[Input]}
        />
        <Field
          name="email"
          title="邮箱"
          required
          decorator={[FormItem]}
          component={[Input]}
        />
      </FormLayout>
      <FormConsumer>
        {() => (
          <div
            style={{
              marginBottom: 20,
              padding: 5,
              border: '1px dashed #666',
            }}
          >
            实时响应：{form.values.username} - {form.values.email}
          </div>
        )}
      </FormConsumer>
      <FormButtonGroup>
        <Submit onSubmit={console.log}>提交</Submit>
      </FormButtonGroup>
    </FormProvider>
  )
}
```

这段代码里有几个关键点值得逐个拆开看：

- **createForm** 创建表单核心领域模型，注意它写在了组件外面。写在组件里的话每次渲染都会重建一个新实例，状态全丢，正确做法是用 `useMemo(() => createForm(), [])` 包一层。
- **FormProvider** 是视图层桥接表单模型的入口。
- **FormLayout** 批量控制表单布局，`layout`、`labelCol` 这些配一次，底下所有字段都生效。
- **Field** 承接字段，它的几个属性各有分工：`name` 标识字段在最终提交数据里的路径（支持 `a.b.c` 这种嵌套路径），`title` 是标题，`required` 标记必填，`initialValue` 是默认值，`decorator` 是 UI 装饰器（通常给 `FormItem`，负责 label、错误提示、必填星号），`component` 是真正的输入控件。
- **FormConsumer** 是响应式模型的响应器，用 render props 模式。上面例子里它包住的那块内容，会在 `username` 或 `email` 变化时自动重渲。
- **Submit** 是提交动作触发器，自动处理 `loading` 状态和校验失败时的拦截。

`decorator` 和 `component` 这个分离设计是我觉得 `Formily` 里最值得学的一处。传统写法里 `FormItem` 包着 `Input`，两者在 JSX 上是嵌套关系，想批量换掉所有 `FormItem` 得动每一处 JSX。`Formily` 把它们拆成两个平级属性，换装饰器就是改一个值的事。

## 四、表单校验详解

### 4.1 两种校验场景

`Formily` 的校验基于 `@formily/validator` 引擎，按你用的写法分两种场景：

- **JSON Schema 场景**：用 Schema 本身的校验属性（`required`、`maximum`、`format` 这些）加上 `x-validator` 属性
- **纯 JSX 场景**：用 `Field` 上的 `validator` 属性

两者能力是一样的，只是入口不同。下面的例子都以 Schema 写法为主，因为复杂表单最终大多会走这条路。

### 4.2 内置规则校验

内置规则指的是必填、最大值、最小值、长度、枚举这些最常用的：

```tsx
import React from 'react'
import { createForm } from '@formily/core'
import { createSchemaField } from '@formily/react'
import { Form, FormItem, Input, NumberPicker } from '@formily/antd'

const form = createForm()

const SchemaField = createSchemaField({
  components: {
    Input,
    FormItem,
    NumberPicker,
  },
})

export default () => (
  <Form form={form} labelCol={6} wrapperCol={10}>
    <SchemaField>
      {/* 必填校验 */}
      <SchemaField.String
        name="required"
        title="必填字段"
        required
        x-component="Input"
        x-decorator="FormItem"
      />
      {/* 最大值校验 */}
      <SchemaField.Number
        name="max"
        title="最大值(>100报错)"
        maximum={100}
        x-component="NumberPicker"
        x-decorator="FormItem"
      />
      {/* 最小值校验 */}
      <SchemaField.Number
        name="min"
        title="最小值(<0报错)"
        minimum={0}
        x-component="NumberPicker"
        x-decorator="FormItem"
      />
      {/* 长度校验 */}
      <SchemaField.String
        name="length"
        title="长度为5"
        x-validator={{ len: 5 }}
        x-component="Input"
        x-decorator="FormItem"
      />
      {/* 枚举校验 */}
      <SchemaField.String
        name="enum"
        title="枚举匹配"
        x-validator={{ enum: ['A', 'B', 'C'] }}
        x-component="Input"
        x-decorator="FormItem"
      />
    </SchemaField>
  </Form>
)
```

注意 `createSchemaField` 的 `components` 那个映射表。Schema 里的 `x-component: "Input"` 是个字符串，它靠这张表去找到真正的组件。**漏注册的组件在页面上是直接不渲染的，也不报错**，这个坑我踩过，盯着 Schema 看了半天才想起组件没注册。

### 4.3 内置格式校验

除了规则，`Formily` 还内置了一批常用格式：

```tsx
const FORMATS = [
  'url',      // URL格式
  'email',    // 邮箱格式
  'phone',    // 手机号格式
  'ipv4',     // IPv4地址
  'ipv6',     // IPv6地址
  'number',   // 数字
  'integer',  // 整数
  'qq',       // QQ号
  'idcard',   // 身份证号
  'money',    // 金额
  'zh',       // 中文
  'date',     // 日期
  'zip',      // 邮编
]

// 使用格式校验
<SchemaField.String
  name="email"
  title="邮箱"
  format="email"
  required
  x-component="Input"
  x-decorator="FormItem"
/>
```

这批格式覆盖了国内业务最常见的输入类型，`idcard`、`qq`、`zip` 这几个尤其省事，不用自己去背正则。不过 `phone` 和 `idcard` 的规则会随政策变化，做严格业务的时候建议自己确认一遍，别完全依赖前端这一层。

### 4.4 自定义规则校验

内置规则不够用的时候，用 `registerValidateRules` 全局注册：

```tsx
import { createForm, registerValidateRules } from '@formily/core'

// 全局注册自定义校验规则
registerValidateRules({
  // 自定义规则：不能输入123
  not123(value) {
    if (!value) return ''
    return value === '123' ? '不能输入123' : ''
  },
  // 自定义规则：返回多种状态
  customStatus(value) {
    if (!value) return ''
    if (value < 10) {
      return { type: 'error', message: '数值不能小于10' }
    } else if (value < 100) {
      return { type: 'warning', message: '数值在100以内' }
    } else if (value < 1000) {
      return { type: 'success', message: '数值大于100小于1000' }
    }
  }
})

// 在字段中使用
<SchemaField.String
  name="custom"
  title="自定义校验"
  x-validator={{ not123: true }}
  x-component="Input"
  x-decorator="FormItem"
/>
```

这里有两个设计值得注意。一是**返回空字符串代表通过，返回字符串代表报错信息**，跟很多校验库「返回 boolean」的约定不一样，第一次写容易搞反。二是校验结果不只有对错两态，返回对象里的 `type` 可以是 `error` / `warning` / `success`，`warning` 不会阻止提交但会给用户一个提示，做「密码强度」这类交互很好用。

### 4.5 异步校验

需要问后端才知道结果的场景（用户名是否被占用、优惠券是否有效），直接返回 Promise：

```tsx
<SchemaField.String
  name="asyncValidate"
  title="异步校验"
  required
  x-validator={(value) => {
    return new Promise((resolve) => {
      // 模拟异步校验
      setTimeout(() => {
        if (value === '123') {
          resolve('') // 校验通过
        } else {
          resolve('只能输入123') // 校验失败
        }
      }, 1000)
    })
  }}
  x-component="Input"
  x-decorator="FormItem"
/>
```

异步校验默认跟着输入触发，用户每敲一个字符就发一次请求，接口会被打爆。所以这类校验基本都要配 `triggerType`：

```tsx
x-validator={{
  triggerType: 'onBlur', // 只在失去焦点时触发
  validator: (value) => {
    return new Promise((resolve) => {
      // 异步校验逻辑
    })
  }
}}
```

`triggerType` 可选 `onInput`、`onBlur`、`onFocus`，异步校验一律用 `onBlur`。这条是硬经验，别省。

### 4.6 联动校验

字段之间互相制约的校验，靠 `x-reactions` 加 `field.query` 来写。比如「AA 必须大于 BB」：

```tsx
<SchemaField.String
  name="aa"
  title="AA"
  required
  x-reactions={(field) => {
    field.selfErrors =
      field.query('bb').value() >= field.value ? 'AA必须大于BB' : ''
  }}
  x-component="NumberPicker"
  x-decorator="FormItem"
/>
<SchemaField.String
  name="bb"
  title="BB"
  required
  x-reactions={(field) => {
    field.selfErrors =
      field.query('aa').value() <= field.value ? 'AA必须大于BB' : ''
  }}
  x-component="NumberPicker"
  x-decorator="FormItem"
/>
```

`field.query('bb')` 拿到的是另一个字段的查询代理，`.value()` 取它的当前值。两个字段各写一份反向判断，是为了保证改哪个都能触发校验。

这段代码有个小瑕疵顺手指出来：字段声明成了 `SchemaField.String` 却配了 `NumberPicker` 组件，类型上应该用 `SchemaField.Number`。`String` 类型会把输入值当字符串处理，在比大小的时候可能出现 `'9' > '100'` 这种字符串比较的结果。真写业务的时候记得改过来。

## 五、表单联动详解

### 5.1 两种模式

`Formily` 里实现联动有两种思路。

**主动模式**是「我变了，我去改别人」。监听一个或多个字段的变化，然后主动去控制另外一批字段的状态。一对多的场景用它最方便，比如「切换商品类型，一次性显示/隐藏三组字段」。

**被动模式**是「我依赖谁，谁变了我自己重算」。只需要在字段上声明它依赖哪些字段，依赖变了它自动更新。多对一的场景用它更简洁，比如「总价 = 单价 × 数量」。

选哪个的判断标准很简单：**看关系的箭头方向从哪边写更少**。一个字段控制十个，写主动；十个字段汇成一个，写被动。

### 5.2 主动模式

主动联动的核心 API 是 `onFieldValueChange`、`setFieldState` 和 `x-reactions` 的 `target` 写法。

一对一联动：

```tsx
const form = createForm({
  effects() {
    onFieldValueChange('select', (field) => {
      // 监听 select 字段变化，控制 input 字段的显示隐藏
      form.setFieldState('input', (state) => {
        state.display = field.value
      })
    })
  }
})

// 使用 SchemaReactions 实现
<SchemaField.String
  name="select"
  title="控制者"
  x-reactions={{
    target: 'input',
    fulfill: {
      state: {
        display: '{{$self.value}}',
      },
    },
  }}
  x-component="Select"
  x-decorator="FormItem"
/>
```

上下两种写法效果一样，区别在于代码放哪。写在 `effects` 里，联动逻辑集中在 `createForm` 一处，适合规则复杂、需要读接口数据的场景；写成 `x-reactions`，联动跟着字段声明走，Schema 是自描述的，适合规则简单、需要整份 Schema 存到后端的场景。

那个 `target` 加 `fulfill` 的结构里，`fulfill.state` 表示条件满足时把目标字段设成什么状态，字符串形式的 `$self`、`$deps`、`$form` 是 `Formily` 提供的表达式作用域变量，`$self` 指当前字段。

一对多联动靠通配符：

```tsx
// 使用 * 通配符匹配多个字段
onFieldValueChange('select', (field) => {
  form.setFieldState('*(input1,input2,input3)', (state) => {
    state.display = field.value
  })
})
```

这个路径匹配语法挺强的，`*` 匹配任意字段，`*(a,b,c)` 匹配括号里列出的几个，还支持 `array.*.price` 这种匹配数组每一项的写法，做数组表单的批量控制时很好用。

### 5.3 被动模式

被动模式用 `dependencies` 声明依赖：

```tsx
<SchemaField.String
  name="total"
  title="总价"
  x-reactions={{
    dependencies: ['price', 'quantity'], // 声明依赖
    fulfill: {
      state: {
        value: '{{$deps[0] * $deps[1]}}', // 自动计算
      },
    },
  }}
  x-component="Input"
  x-decorator="FormItem"
/>
```

`dependencies` 数组里声明的字段，会按顺序映射到表达式里的 `$deps[0]`、`$deps[1]`。这段的效果就是 `price` 或 `quantity` 任意一个变化，`total` 自动重算。

比起在两个字段上各挂一个 `onChange` 手动算总价，被动模式的好处是**依赖关系写在了消费方身上**。以后想再加一个「折扣」参与计算，只需要改 `total` 这一处，不用去动 `price` 和 `quantity`。

### 5.4 能联动的状态有哪些

联动里可以改的字段状态不止显示隐藏，常用的是这几个：

```tsx
// 显示/隐藏
state.display = 'visible'  // 显示
state.display = 'none'     // 隐藏（不保留值）
state.display = 'hidden'    // 隐藏（保留值）

// 禁用
state.disabled = true

// 只读
state.readOnly = true

// 设置值
state.value = 'new value'

// 设置校验错误
state.selfErrors = '错误信息'
```

`display` 那三个值的区别是最容易出线上问题的地方，单独说清楚。`visible` 是正常显示；`hidden` 是不渲染但**值还在** `form.values` 里，提交时会带过去；`none` 是不渲染而且**值会被移除**，提交时不带。

那什么时候该用哪个呢？规则是看后端要不要这个字段。用户切到「虚拟商品」之后，物流相关字段应该彻底不提交，用 `none`；如果只是折叠了一个高级配置区域，值还得保留，用 `hidden`。用错了的典型症状是「明明界面上没这个字段，后端却收到了一个空值报错」，或者反过来「切回去之后填过的内容全没了」。

## 六、复杂表单的落地经验

### 6.1 Schema 抽到单独文件

字段一多，JSX 会长到没法看。实际项目里我一律把 Schema 提到单独的配置文件：

```javascript
// schemas/userForm.js
export const userFormSchema = {
  type: 'object',
  properties: {
    username: {
      title: '用户名',
      type: 'string',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    email: {
      title: '邮箱',
      type: 'string',
      required: true,
      format: 'email',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    password: {
      title: '密码',
      type: 'string',
      required: true,
      'x-validator': { min: 6, max: 20 },
      'x-decorator': 'FormItem',
      'x-component': 'Input.Password',
    },
  },
}
```

然后在组件里消费这份 Schema：

```tsx
import React, { useMemo } from 'react'
import { createForm } from '@formily/core'
import { userFormSchema } from './schemas/userForm'

const UserForm = () => {
  // 注意用 useMemo 兜住，不然每次渲染都会重建实例
  const form = useMemo(() => createForm(), [])

  const handleSubmit = (values) => {
    console.log('提交数据:', values)
  }

  return (
    <Form form={form} onAutoSubmit={handleSubmit}>
      <SchemaField schema={userFormSchema} />
      <FormButtonGroup>
        <Submit>提交</Submit>
        <Button onClick={() => form.reset()}>重置</Button>
      </FormButtonGroup>
    </Form>
  )
}
```

抽出来之后有个额外收益：这份 Schema 是纯 JSON，可以直接存到后端。想做「表单配置化」「后台可视化搭建表单」这类需求，路已经铺好了一半。

### 6.2 复杂联动统一放进 effects

省市区三级联动这种，别散在各个字段的 `x-reactions` 上，集中到 `effects` 里更好维护：

```tsx
const form = createForm({
  effects($, { onFieldValueChange, onFieldMount }) {
    // 监听省份变化，更新城市列表
    onFieldValueChange('province', (field) => {
      const cities = getCitiesByProvince(field.value)
      form.setFieldState('city', (state) => {
        state.enum = cities
        state.value = undefined // 重置城市选择
      })
    })

    // 监听城市变化，更新区县列表
    onFieldValueChange('city', (field) => {
      const districts = getDistrictsByCity(field.value)
      form.setFieldState('district', (state) => {
        state.enum = districts
        state.value = undefined
      })
    })

    // 表单加载时初始化数据
    onFieldMount('province', (field) => {
      field.enum = getAllProvinces()
    })
  }
})
```

这段的 `effects` 签名同样是老写法，实际项目里把钩子从 `@formily/core` import 进来、`effects()` 不接参数就对了，逻辑本身不用改。

里面有两处细节值得学。一是改省份时把 `city` 的值置成 `undefined`，不清的话会留下一个属于旧省份的城市，提交上去后端一脸懵。二是用 `onFieldMount` 做初始化，它在字段挂载时触发，比在组件的 `useEffect` 里拉数据更贴合表单的生命周期，字段没渲染就不会白请求。

真接上后端接口的话，这里的 `getCitiesByProvince` 会是个异步函数，记得配合 `field.loading = true` 给个加载态，不然用户点开下拉看到空列表会以为坏了。

### 6.3 性能优化

**用 FormConsumer 圈住计算逻辑**：

```tsx
// 不推荐：每次渲染都重新计算
const total = price * quantity

// 推荐：使用 FormConsumer 只在依赖字段变化时重新计算
<FormConsumer>
  {() => (
    <div>总价: {form.values.price * form.values.quantity}</div>
  )}
</FormConsumer>
```

`FormConsumer` 内部是个 `observer`，只会收集它渲染过程中真正读到的那几个字段。所以上面这块只在 `price` 或 `quantity` 变化时重渲，其他三十几个字段怎么改都不关它的事。这就是响应式方案相对 `useState` 的核心优势：**精准更新，不用手写依赖数组**。

**用 display 而不是条件渲染**：

```tsx
// 使用 display 控制字段显示隐藏，而不是条件渲染
<SchemaField.String
  name="advanced"
  title="高级选项"
  x-reactions={{
    dependencies: ['mode'],
    fulfill: {
      state: {
        display: '{{$deps[0] === "advanced" ? "visible" : "none"}}',
      },
    },
  }}
  x-component="Input"
  x-decorator="FormItem"
/>
```

为什么不用 JSX 里的三元表达式呢？因为条件渲染会让字段从 `Form` 模型里彻底消失又重新创建，字段上挂的校验状态、`touched` 标记这些都会丢，而且父组件得跟着重渲。用 `display` 的话字段模型一直在，只是渲染层不输出，状态是连续的。

### 6.4 和 Ant Design 结合

`@formily/antd` 封装了一大批 `Ant Design` 组件，其中最值钱的是数组类组件：

```tsx
import {
  Form,
  FormItem,
  Input,
  Select,
  DatePicker,
  Radio,
  Checkbox,
  InputNumber,
  Upload,
  ArrayTable,
  Editable,
} from '@formily/antd'

// 数组类型表单
<SchemaField.Array
  name="users"
  title="用户列表"
  x-component="ArrayTable"
  x-decorator="FormItem"
>
  <SchemaField.Object>
    <SchemaField.String
      name="name"
      title="姓名"
      x-component="Input"
      x-decorator="FormItem"
    />
    <SchemaField.String
      name="email"
      title="邮箱"
      x-component="Input"
      x-decorator="FormItem"
    />
  </SchemaField.Object>
</SchemaField.Array>
```

`ArrayTable` 解决的就是开头那个 `SKU` 表格的场景：可增删行、每行多个字段、每行独立校验。自己用 `useState` 维护一个数组再手写增删改的话，光是「删掉第二行之后第三行的校验错误还挂在原位」这种 bug 就能耗掉一天。同一系列还有 `ArrayCards`、`ArrayItems`、`ArrayCollapse`，交互形态不同，Schema 写法几乎一样，换个 `x-component` 就能切。

## 总结

`Formily` 的价值不在于少写几行代码，而在于它把表单里三类最容易失控的东西各自收敛到了一个地方：状态收敛到 `Form` 实例，校验收敛到 `validator` 配置，联动收敛到 `effects` 或 `x-reactions`。

具体到落地上，有几条是我反复验证过的：`createForm` 一定要用 `useMemo` 兜住；异步校验一定要配 `triggerType: 'onBlur'`；隐藏字段要分清 `hidden` 和 `none`，看后端要不要这个值；`createSchemaField` 的组件映射表漏注册不会报错，字段直接不渲染，遇到「字段消失」先查这里。

但也别把它当银弹。`Formily` 的学习曲线是实打实的陡，领域模型、路径匹配语法、表达式作用域这几套东西得花时间啃，团队里如果只有一个人会，维护成本反而更高。我自己的判断线大概是这样：字段数在十个以内、联动只有一两处的表单，直接用 `antd` 的 `Form` 更快；字段过二十、有多组条件联动、有数组表格、或者需要 Schema 配置化的，`Formily` 能省下的时间才真正超过它的学习成本。

企业级后台管理系统、需要动态配置表单的场景、复杂联动关系的审批流表单，这几类是它最舒服的主场。

## 参考

- Formily 官方文档 <https://formilyjs.org/>
- Formily Core API <https://core.formilyjs.org/>
- Formily React 组件 <https://react.formilyjs.org/>
- Formily 表单校验文档 <https://core.formilyjs.org/zh-CN/guide/advanced/validate>
- [前端进阶之旅](https://interview.poetries.top)
