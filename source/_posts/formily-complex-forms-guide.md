---
title: Formily核心概念解析，构建复杂表单的最佳实践总结
date: 2023-01-17 11:40:12
description: 深度解读阿里巴巴Formily表单解决方案，详解核心API、MVVM架构、响应式联动、表单校验等最佳实践，帮助开发者快速构建企业级复杂表单。
tags:
- Formily
- React
- 表单
- 状态管理
- 前端工程化
- Ant Design
categories: Front-End
---

在前端开发中，表单是几乎每个应用都离不开的核心功能。随着业务复杂度的提升，传统表单实现方式面临着代码冗余、联动困难、校验复杂等诸多挑战。`Formily` 作为阿里巴巴开源的表单解决方案，正是为了解决这些痛点而生的。本文将带你深入了解 `Formily` 的核心概念，并通过实际案例展示如何构建复杂表单。

## 一、Formily是什么

### 1.1 表单开发的痛点

在传统的表单开发模式中，我们经常会遇到以下问题：

**代码重复严重**：每个表单页面都需要编写大量的状态管理、校验逻辑、联动处理代码，这些代码在不同表单之间高度相似，但又无法有效复用。

**联动逻辑复杂**：当表单中存在多个字段之间的联动关系时，例如"选择A选项后显示B字段"、"当C字段值变化时，D字段需要自动计算"等场景，代码逻辑会变得错综复杂，难以维护。

**校验规则分散**：表单校验逻辑散落在组件的各个角落，有的在组件state中，有的在form的校验配置中，有的在blur事件回调中，缺少统一的校验管理。

**难以动态渲染**：对于需要根据后端配置动态生成表单字段的场景，传统方式实现起来非常困难。

### 1.2 Formily的核心定位

`Formily` 用一句话来描述，它就是一个**抽象了表单领域模型的 MVVM 表单解决方案**。它将表单的开发模式从传统的命令式编程转变为声明式编程，让开发者可以通过配置化的方式快速构建复杂表单。

`Formily` 的核心优势包括：

**完善的领域模型**：`Formily` 抽象了一套完整的表单领域模型，包括 `Form`（表单）、`Field`（字段）、`Validator`（校验器）等概念，让表单状态管理变得清晰可控。

**强大的联动能力**：支持主动模式和被动模式两种联动方式，可以轻松实现一对一、一对多、多对一等多种联动场景。

**灵活的校验体系**：内置强大的 `@formily/validator` 校验引擎，支持 JSON Schema 协议校验、自定义规则校验、异步校验等多种方式。

**多框架支持**：提供了 `@formily/react` 和 `@formily/vue` 两个核心包，兼容 React 和 Vue 两大主流框架。

## 二、核心概念与架构

### 2.1 MVVM架构模式

`Formily` 采用经典的 MVVM（Model-View-ViewModel）架构模式：

- **Model（模型）**：对应 `@formily/core` 中的 `Form` 实例，管理整个表单的状态、数据、校验规则
- **View（视图）**：对应表单的 UI 组件，如 Input、Select 等
- **ViewModel（视图模型）**：对应 `Field` 实例，连接 Model 和 View 的桥梁

这种架构模式的优势在于：表单的状态管理与 UI 渲染完全解耦，开发者可以专注于业务逻辑的实现，而无需关心状态更新的细节。

### 2.2 核心包结构

`Formily` 的包结构设计非常清晰，主要分为以下几个层次：

**核心层**：`@formily/core` 是整个表单解决方案的核心，负责管理表单的状态、表单校验、联动逻辑等。

**桥接层**：`@formily/react` 和 `@formily/vue` 分别提供了 React 和 Vue 的适配层，让核心库能够与各框架无缝集成。

**组件层**：`@formily/antd` 和 `@formily/next` 是基于 Ant Design 和 Alibaba Fusion 封装的组件库，提供了开箱即用的表单组件。

### 2.3 核心API概述

`Formily` 的核心 API 主要包括：

**createForm**：用于创建表单核心领域模型，它是作为 MVVM 设计模式的标准 ViewModel。

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

**FormProvider**：作为视图层桥接表单模型的入口，它接收 `createForm` 创建出来的 Form 实例，并将 Form 实例以上下文形式传递到子组件中。

**Field**：用于承接普通字段的组件，是表单数据绑定的最小单位。

**createSchemaField**：用于创建基于 JSON Schema 的表单字段组件，支持声明式配置表单结构。

## 三、快速开始

### 3.1 安装依赖

使用 `Formily` 必须要用到 `@formily/core`，它负责管理表单的状态、表单校验、联动等等。

```bash
# 安装内核库
npm install --save @formily/core

# 安装 React 桥接库
npm install --save @formily/react

# 安装 Ant Design 组件库
npm install --save antd moment @formily/antd
```

### 3.2 基础用法

以下是一个完整的表单示例：

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

从以上例子中，我们可以学到很多关键概念：

- **createForm** 用来创建表单核心领域模型
- **FormProvider** 组件是作为视图层桥接表单模型的入口
- **FormLayout** 组件是用来批量控制表单布局的组件
- **Field** 组件是用来承接字段的组件
  - `name` 属性标识字段在表单最终提交数据中的路径
  - `title` 属性标识字段的标题
  - `required` 属性标识该字段必填
  - `initialValue` 属性代表字段的默认值
  - `decorator` 属性代表字段的 UI 装饰器，通常指定为 `FormItem`
  - `component` 属性代表字段的输入控件
- **FormConsumer** 组件是作为响应式模型的响应器而存在，使用 render props 模式
- **Submit** 组件作为表单提交的动作触发器，支持自动处理 loading 状态

## 四、表单校验详解

### 4.1 校验方式概述

`Formily` 的表单校验使用了极其强大且灵活的 `@formily/validator` 校验引擎，校验主要分两种场景：

- **JSON Schema 场景**：使用 JSON Schema 本身的校验属性与 x-validator 属性实现校验
- **纯 JSX 场景**：使用 validator 属性实现校验

### 4.2 内置规则校验

内置规则校验是指 `Formily` 提供的一些常用校验规则，比如必填、最大值、最小值、长度、枚举等。

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

### 4.3 内置格式校验

`Formily` 还内置了多种常用格式的校验：

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

### 4.4 自定义规则校验

当内置校验规则不能满足需求时，可以使用自定义校验规则：

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

### 4.5 异步校验

`Formily` 支持异步校验，非常适合需要调用后端接口进行校验的场景：

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

还可以指定触发类型：

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

### 4.6 联动校验

利用 `x-reactions` 可以实现联动校验，例如"A字段必须大于B字段"：

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

## 五、表单联动详解

### 5.1 联动模式概述

`Formily` 中实现联动逻辑有两种模式：**主动模式**和**被动模式**。

**主动模式**：通过监听一个或多个字段的变化，去控制另一个或多个字段的状态。这种模式在实现一对多联动场景时非常方便。

**被动模式**：只需要关注某个字段所依赖的字段即可，依赖字段变化了，被依赖的字段自动联动。这种模式在实现多对一场景时更加简洁。

### 5.2 主动模式实现

主动联动核心是基于 `onFieldValueChange`、`setFieldState`、`x-reactions` 等 API 实现。

**一对一联动**：

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

**一对多联动**：

```tsx
// 使用 * 通配符匹配多个字段
onFieldValueChange('select', (field) => {
  form.setFieldState('*(input1,input2,input3)', (state) => {
    state.display = field.value
  })
})
```

### 5.3 被动模式实现

被动模式通过 `dependencies` 属性声明字段依赖关系：

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

### 5.4 联动状态控制

在联动中，可以控制字段的多种状态：

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

## 六、最佳实践

### 6.1 表单结构设计

在实际项目中，推荐将表单 Schema 提取到单独的配置文件中：

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

然后在组件中使用：

```tsx
import { userFormSchema } from './schemas/userForm'

const UserForm = () => {
  const [form] = Form.useForm()

  const handleSubmit = (values) => {
    console.log('提交数据:', values)
  }

  return (
    <Form form={form} onSubmit={handleSubmit}>
      <SchemaField schema={userFormSchema} />
      <FormButtonGroup>
        <Submit>提交</Submit>
        <Button onClick={() => form.reset()}>重置</Button>
      </FormButtonGroup>
    </Form>
  )
}
```

### 6.2 复杂联动场景

对于复杂的联动场景，建议使用 effects 统一管理：

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

### 6.3 性能优化

**使用 computed 优化计算逻辑**：

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

**避免不必要的字段渲染**：

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

### 6.4 与 Ant Design 结合

`@formily/antd` 提供了丰富的 Ant Design 组件封装：

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

## 七、总结

`Formily` 作为阿里巴巴开源的表单解决方案，通过抽象表单领域模型、提供强大的校验引擎和灵活的联动机制，极大地简化了复杂表单的开发成本。通过本文的学习，你应该已经掌握了以下内容：

1. **核心概念**：理解 `Formily` 的 MVVM 架构、核心 API（createForm、Field、FormProvider 等）

2. **表单校验**：掌握内置规则校验、格式校验、自定义校验、异步校验、联动校验等用法

3. **表单联动**：理解主动模式和被动模式，能够实现一对一、一对多、多对一等各种联动场景

4. **最佳实践**：了解如何组织表单结构、处理复杂联动、性能优化等

`Formily` 特别适合以下场景：企业级后台管理系统、需要动态配置表单的应用、复杂联动关系的表单、需要强校验规则的表单等。建议在项目中根据实际需求选择使用，对于简单表单可以直接使用 Ant Design Form，对于复杂表单强烈推荐使用 `Formily`。

---

*参考资料：*
- [Formily 官方文档](https://formilyjs.org/)
- [Formily Core API](https://core.formilyjs.org/)
- [Formily React 组件](https://react.formilyjs.org/)
