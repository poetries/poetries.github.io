---
title: oppo快应用开通账号服务获取openid记录
date: 2018-12-20 10:35:24
tags: 
  - openid
  - Quickapp
categories: Front-End
---

## 一、注册oppo账号

https://open.oppomobile.com

> `管理中心`->`快应用智慧服务`->`选择一个快应用`->`找到移动服务`

![](https://poetries1.gitee.io/img-repo/2019/10/411.png)
![](https://poetries1.gitee.io/img-repo/2019/10/412.png)

> 根据`OPPO`快应用帐号服务开启指南开通服务即可，其中回调地址可以随便写，可以使用`oppo`的示例即可

![](https://cdofs.oppomobile.com/cdo-portal/201812/03/cf11269cb2c76b4c78844e0046cdc42b.png)

## 二、获取用户信息

- 参考文档 https://open.oppomobile.com/wiki/doc#id=10255

> 开通账户服务之后我们就可以参考文档来获取用户信息了，但是这里还是拿不到用户信息的

- 调用授权接口`account.authorize` 返回的信息格式是这样的

```json
{
  "accessToken":"token",
  "state":"state",
  "tokenType":"type",
  "scope":"scope",
  "expiresIn":""
}
```

**解决方法**

> 加了官方群后无人解答，最后问了客服找到了答案




**完整示例代码**

```js
onInit(){
 account.authorize({
    type: 'token',
    redirectUri: 'https://baidu.com', // 跳转地址，可不填
    scope: 'scope.baseProfile',
    success: function (data) {
      console.log(JSON.stringify(data))
      
      // 获取用户基本信息
      account.getProfile({
        token: data.accessToken,
        success: function (data) {
          prompt.showToast({
            message: 'handling success:' + JSON.stringify(data),
            duration: 1
          })
        },
        fail: function (data, code) {
          prompt.showToast({
            message: `getProfile handling fail, code = ${code}`,
            duration: 1
          })
        }
      })
    },
    fail: function (data, code) {
      prompt.showToast({
        message: `authorize handling fail, code = ${code}`,
        duration: 1
      })
    }
  })
},
```

## 三、更多参考

- [快应用-开通oppo账号服务艰辛之路](https://www.jianshu.com/p/58f04d1a2f3a)
