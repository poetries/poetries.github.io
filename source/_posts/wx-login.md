---
title: 微信小程序登录流程详解 从 wx.login 到自定义登录态
description: 拆解微信小程序登录的完整链路，wx.login 拿 code、服务端用 code 换 openid 与 session_key、自定义登录态设计，以及为什么 session_key 和 AppSecret 绝不能下发到前端。
date: 2018-08-13 00:01:20
tags:
  - 小程序
  - 微信小程序
  - 登录
categories: Front-End
---

小程序没有 cookie。这句话第一次真正咬到我，是在把一套 Web 的登录逻辑往小程序上搬的时候。后端同学照旧发了 `Set-Cookie`，前端这边死活拿不到会话，来回折腾了大半天才反应过来，小程序的请求压根不走浏览器那套 cookie 机制。登录这件事在小程序里得重做一遍。`wx.login` 拿到的 code 到底是什么、为什么必须绕一趟自己的服务器、`session_key` 为什么一个字节都不该下发到前端，这几点没搞清楚，写出来的登录要么不安全，要么隔三差五掉登录态。这篇把整条链路从头到尾拆一遍。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- 小程序登录为什么不能照搬 Web 的那一套
- `wx.login` 拿到的 code 是什么，它凭什么能换来 openid
- 服务端用 code 换 `openid` 和 `session_key` 的那一步，为什么必须放在服务端
- `session_key` 和 `AppSecret` 泄露到前端会发生什么
- 自定义登录态（3rd_session / token）该怎么设计
- `wx.checkSession` 在整条链路里的位置，登录态失效怎么补
- 一段可以直接抄走的完整登录代码，以及 2018 年这套写法今天还剩多少能用

> 先交代一句时效性。这篇写于 2018 年，链路的骨架（code 换 session、自建登录态）这些年没变，但获取用户信息那部分改了好几轮。文中出现的 `wx.getUserInfo` 现在已经不是推荐写法了，第七节会专门说现状，正文里的老代码我一个字没删，方便你对着老项目排查。

## 一、小程序登录和 Web 登录差在哪

Web 登录的心智很简单。用户提交账号密码，服务端验一下，种个 cookie 或者返回一个 token，之后每个请求带上它，齐活。整条链路里只有两方，浏览器和你的服务器。

小程序不一样，中间多了一个微信。

用户在小程序里是不输账号密码的，他点一下就进来了，这个「一下」背后的身份是微信给的。所以链路上至少有三方，小程序客户端、你的服务器、微信的接口服务。你的服务器没法直接问用户「你是谁」，只能拿着小程序给的一张凭证去问微信。

还有几个更琐碎但更容易踩的差别：

- 小程序没有 cookie，`Set-Cookie` 发过来也不会自动带回去，登录态只能自己在 `header` 或者 body 里手动传
- 小程序没有 `localStorage`，对应的是 `wx.setStorageSync` 这一套，是小程序自己的存储
- 小程序的代码包是可以被解出来的，任何写死在前端的密钥都等于公开

第三条是这篇里最需要记住的一条。后面讲 `AppSecret` 的时候还会回到它。

## 二、完整登录流程

先看整条链路的时序。下面这张图是登录流程的全貌，从小程序调 `wx.login` 开始，到你的服务器把自定义登录态发回小程序结束。

![微信小程序登录流程时序图，从 wx.login 获取 code 到开发者服务器下发 3rd_session](https://s.poetries.top/gitee/2019/10/662.png)

把图拆成文字，一共是五步：

- 小程序内通过 `wx.login` 接口获得 `code`
- 将 `code` 传入后台，后台对微信服务器发起一个 `https` 请求换取 `openid`、`session_key`（解密 `encryptedData`、`iv` 得到的）
- 后台生成一个自身的 `3rd_session`（以此为 `key` 值保持 `openid` 和 `session_key`），返回给前端。PS：微信方的 `openid` 和 `session_key` 并没有发回给前端小程序
- 小程序拿到 `3rd_session` 之后保持在本地
- 小程序请求登录区内接口，通过 `wx.checkSession` 检查登录态，如果失效重新走上述登录流程，否则带上 `3rd_session` 到后台进行登录验证

这五步每一步都有它非在那儿不可的理由，下面逐个说。

### 2.1 第一步，wx.login 拿 code

`wx.login` 是整条链路的发起动作，它不弹窗、不需要用户点确认，调了就返回。

```javascript
wx.login({
    success(res){
     console.log(res)
       //code:"fda41033Z0fdak3dfae01dffaaWXQA1vwQ4dfae0Akg3e0Z0k3E"
       //errMsg:"login:ok"
    }
})
```

拿到的 `code` 就是那张凭证。它有三个性质决定了后面所有的设计：

- **临时**。有效期很短，官方文档写的是 5 分钟，过期就废
- **一次性**。拿去换过一次 session 之后就作废了，第二次换会直接报错
- **不含敏感信息**。code 本身看不出用户是谁，被截获了也没用，因为换 session 还需要 `AppSecret`

这里有个坑我见过好几次。前端给登录请求加了自动重试，网络抖一下重发一次，同一个 code 被送去换了两次，第二次微信返回 code 已被使用，用户就卡在登录页出不来了。正确的做法是重试之前重新调一次 `wx.login` 拿新 code，而不是复用旧的。具体的错误码请查官方文档的错误码表，别照抄我这里的文字描述去写判断分支。

### 2.2 第二步，服务端用 code 换 openid 和 session_key

这一步是整条链路的核心，也是最容易写错地方的一步。你的服务器拿着 code、`appid`、`AppSecret` 去调微信的 `auth.code2Session` 接口，微信校验通过后返回 `openid` 和 `session_key`。

原文里列的传输参数一共 7 个，我把它抄在下面并逐条注上用途：

```javascript
appid  小程序唯一标识
secret  小程序的 app secret
js_code  //wx.login登录时获取的 code,用于后续获取session_key

//下面两个参数用户服务器端签名校验用户信息的
signature 使用 sha1( rawData + sessionkey ) 得到字符串，用于校验用户信息。
rawData  不包括敏感信息的原始数据字符串，用于计算签名。

//下面两个参数是用于解密获取openId和UnionId的
encryptedData  包括敏感数据在内的完整用户信息的加密数据
iv 加密算法的初始向量
```

这 7 个参数不是一次全用上的。`appid` 和 `secret` 是你服务器自己的配置，前端根本不该知道；`signature` 和 `rawData` 是校验用户信息完整性的，可选；真正需要前端传给你服务器的，其实只有下面三个：

```javascript
js_code //  wx.login登录时获取的 code,用于后续获取session_key
encryptedData  包括敏感数据在内的完整用户信息的加密数据
iv 加密算法的初始向量
```

- 可精简为以上三个参数
- 其余的签名校验的参数可省略，而 `appid` 和 `secret` 可以直接写在服务器

`encryptedData` 和 `iv` 是配套的。它们是微信给你的一份加密数据，只有用 `session_key` 才解得开，解开之后能拿到包含 `unionid` 在内的完整用户信息。这也解释了 `session_key` 为什么叫 key，它就是解密用的钥匙。

至于服务端拿到之后怎么落库、怎么发 token，原文一句「服务端处理返回 token、sessionId 过程省略」带过了，第四节我把这块补上。

> 服务端处理返回 token、sessionId 过程省略...

### 2.3 拿 openid 之前先弄清它是什么

很多人第一次接触会默认 `openid` 就是用户 ID，这个理解在单个小程序里够用，但放到整个微信生态就不对了。

`openid` 是「某个微信号在某个应用里的唯一标识」。同一个人，在你的小程序和你的公众号里，`openid` 是两个完全不同的值。真正跨应用唯一的是 `UnionId`，它需要小程序和公众号绑定在同一个微信开放平台账号下才会下发。

所以数据库设计的时候，我的建议是一开始就把 `union_id` 这一列留出来。哪怕现在你只有一个小程序，后面业务扩到公众号再补迁移，比一开始多加一列痛苦得多。

## 三、session_key 和 AppSecret 绝不能下发到前端

这一节单独拎出来讲，因为它是这篇里唯一一条属于安全红线的内容。

先说结论：**`AppSecret` 只能存在于你的服务器，`session_key` 只能存在于你的服务器，两者都不允许出现在小程序端的任何位置，包括代码、请求响应体、日志和本地缓存。**

### 3.1 AppSecret 泄露会发生什么

`AppSecret` 是小程序的密钥，它和 `appid` 配对，代表「我就是这个小程序的拥有者」。拿到它可以做的事包括但不限于：直接调 `auth.code2Session` 换任意用户的 session、调各种服务端开放接口、拿 access_token 发模板消息。

我见过一种偷懒写法，为了省一个后端接口，直接在小程序里拼 `https://api.weixin.qq.com/sns/jscode2session?...&secret=xxx` 发请求。这么写调试期确实跑得通，但小程序的代码包是能被解包的，`AppSecret` 就明晃晃躺在里面。等于把家门钥匙贴在门上。

顺带说一句，`AppSecret` 也别提交进 git 仓库，哪怕是私有仓库。走环境变量或者配置中心。它虽然可以在公众平台后台重置，但一重置所有在途的服务端请求会同时失效，线上会明显抖一下。

### 3.2 session_key 泄露会发生什么

`session_key` 的危害路径不一样，但一样严重。它是解密 `encryptedData` 的钥匙，同时也是校验数据签名的密钥。泄露之后，攻击者可以伪造出一份「看起来签名合法」的用户数据发给你的服务器，你的校验逻辑会认为它是微信下发的真数据。

所以微信官方的措辞是「开发者不应该把 `session_key` 传输到小程序客户端等服务器外的环境」。这句话字面意思就够清楚了，不用过度解读。

### 3.3 那前端到底该拿到什么

答案是你自己签发的那个 token，仅此而已。

`openid` 严格来说不算私密信息，下发到前端也不会立刻出事，但我的习惯是能不发就不发。前端拿着 `openid` 唯一能做的事就是把它塞进请求参数，而这恰恰是你不希望的，因为一旦业务接口信任前端传来的 `openid`，改一个字符就能读别人的数据。让前端只持有 token，服务端从 token 反查 `openid`，这条边界会干净很多。

## 四、自定义登录态怎么设计

微信只负责告诉你「这次来的是谁」，它不负责帮你维持会话。用户总不能每打开一个页面就重新登录一次，所以自定义登录态这一层必须你自己造。原文叫它 `3rd_session`，现在更常见的叫法是 token，是同一个东西。

### 4.1 最小可用的映射结构

服务端拿到 `openid` 和 `session_key` 之后，生成一个随机字符串当 key，把这两个值挂在它下面：

```json
{
  "token_1": {
    "openid": "获取到的openid 1",
    "session_key": "获取到的session_key 1"
  },
  "token_2": {
    "openid": "获取到的openid 2",
    "session_key": "获取到的session_key 2"
  }
}
```

这个结构只是用来说明映射关系，真跑起来千万别用一个内存对象来存。进程一重启映射全丢，多实例部署的时候各存各的，用户在 A 机器登录、请求打到 B 机器就是 401。生产环境这份映射一般放 Redis，顺手把过期时间也设上，登录态的有效期就自然有了。

### 4.2 token 怎么传

小程序没有 cookie，token 只能手动带。URL Query、body、header 三种都能传，我的建议是走 header。

为什么？URL Query 会被访问日志、反向代理、各种埋点系统原样记录下来，token 就这么散得到处都是。放 header 至少不会进 access log 的 URL 字段。

实践上一般会在项目里包一层 `request` 封装，统一在这里注入 token、统一处理 401 重新登录，业务代码就不用每次都记得带。这个封装在小程序项目里几乎是标配，值得一开始就写好。

### 4.3 token 过期和 session_key 过期是两件事

这里是很多人第一次做小程序登录都会混淆的点。

你签发的 token 有效期是你自己定的，可以是 7 天，可以是 30 天。而 `session_key` 的有效期不由你控制，用户长时间不用小程序、或者在别的端触发了新的登录，微信这边就可能让它失效。

所以会出现一种状态，token 还没过期，但用它反查出来的 `session_key` 已经解不开数据了。真遇到解密失败的时候，先别怀疑加密算法写错了，八成是 `session_key` 过期了，重新走一遍 `wx.login` 换新的就行。

## 五、登录态校验和 checkSession

`wx.checkSession` 用来判断当前的登录态（微信侧的那个 session）还在不在。它不发网络请求给你的服务器，问的是微信客户端。

```javascript
wx.checkSession({
    success: (res) => {
        console.log('warning wx.checkSession OK, but no viewerId', res);
    },
    fail: (res) => {
        console.log('wx.checkSession failed:', res);
    },
    complete: () => {
        wx.login({
            success: (res) => {
                console.log('wx.login success:', res);
                // 登录自有系统
                API.login.wechat({
                    js_code: res.code
                }, d => {
                    console.log('private login response:', d);
                    if (d.code === 0) {
                        console.log('private login success:', d);

                        let viewerId = d.data.user.user_id;
                        _m.globalData.viewerId = viewerId;

                        wx.setStorageSync('user_id', viewerId);

                        callback && callback();
                    } else {
                        console.error('get user_id error');
                    }
                }, {
                    ignoreError: true
                });
            },
            fail: (res) => {
                console.log('wx.login failed:', res);
            }
        });
    }
});
```

这段代码有个写法值得留意，重新登录的逻辑放在了 `complete` 里，不是 `fail` 里。也就是说不管 `checkSession` 成不成功，都会走一遍 `wx.login`。

为什么这么写？因为 `checkSession` 只能告诉你微信侧的会话状态，它对你自己那套登录态一无所知。会话没过期，但你服务器上的 token 记录被清了、Redis 被刷了、用户换了个手机，这些情况 `checkSession` 都返回成功。稳妥起见，干脆每次都重新换一次 code。

代价是每次启动多一次 `wx.login` 调用，这个开销很小，换来的是登录态不会莫名其妙丢。我自己的项目里也是这么处理的。

如果你想省这一次调用，另一种更精细的做法是让业务接口在 token 失效时统一返回一个约定的错误码，前端在 `request` 封装里捕获这个码，再触发重新登录并重放原请求。这套写起来复杂一点，但用户无感，长会话的场景更合适。

## 六、完整登录代码示例

下面这段是当时项目里的完整实现，包含 `login`、`register`、`init` 三个部分，挂在 `App()` 上。它体现的是一个典型思路，登录动作只在 `App` 层做一次，页面层通过回调等结果，不各自发起。

```javascript
const CONFIG = require('./config.js')
App({
    globalData:{
        viewerId:null,
        userInfo:null
    },
    onLaunch(){
        // 注册当前用户
        this.register()
    },
    login: function(callback) {
        let _m = this
    
        // 开发环境重复使用就好
        if (!viewerId && CONFIG.IS_DEBUG) {
            viewerId = wx.getStorageSync('user_id');		
        }
    
        // 先检查是否有登录态，且获取过用户数据；否则触发一次登录
        if (viewerId) {
            _m.globalData.viewerId = viewerId;
            callback && callback();
        } else {
            wx.checkSession({
                success: (res) => {
                    console.log('warning wx.checkSession OK, but no viewerId', res);
                },
                fail: (res) => {
                    console.log('wx.checkSession failed:', res);
                },
                complete: () => {
                    wx.login({
                        success: (res) => {
                            // 登录自有系统
                            API.login.wechat({
                                js_code: res.code
                            }, d => {
                                if (d.code === 0) {
                                    let viewerId = d.data.user.user_id;
                                    _m.globalData.viewerId = viewerId;
                                    wx.setStorageSync('user_id', viewerId);
                                    callback && callback();
                                } else {
                                    console.error('get user_id error');
                                }
                            }, {
                                ignoreError: true
                            });
                        },
                        fail: (res) => {
                            console.log('wx.login failed:', res);
                        }
                    });
                }
            });
        }
    }
})
```

这段的 `login` 逻辑是「本地有 `viewerId` 就直接用，没有才走一遍完整登录」。注意 `CONFIG.IS_DEBUG` 那个分支，它是开发环境专用的，把上一次登录的 `user_id` 从缓存里读出来复用，省得每次热重载都重新登。这种开关一定要确保生产环境是关的。

`register` 这一段负责在登录成功之后把用户资料同步到自己的服务器：

```javascript
register: function(needTry, callback){
    !callback && (callback = function(){});
    
    this.login(()=>{
        wx.getUserInfo({
            success: (res) => {
                let params = {};
    
                this.globalData.userInfo = res.userInfo;
                params.owner = {
                    id: this.globalData.viewerId,
    
                    connected_profile: {
                        nickname : res.userInfo.nickName||'',  // 用户昵称
                        profile_pic_url: res.userInfo.avatarUrl||'',  // 头像， avatarUrl
                        language : res.userInfo.language||'',  // 语言, "zh_TW"
                        gender : res.userInfo.gender,
                        geo: {
                            country	: res.userInfo.country,
                            province: res.userInfo.province,
                            city	: res.userInfo.city
                        }
                    }
                }
                API.profile.update(params, (d) => {
                    // 静默注册
                    if(d.code === 0) {
                        try {
                            wx.setStorageSync('USERINFO.'+ this.globalData.viewerId, this.globalData.userInfo);
                            wx.setStorageSync('REGISTED.'+ this.globalData.viewerId, (new Date).getTime());
                        } catch (e) {}
    
                        callback();
                    }
                }, {
                    ignoreError: true
                });
            },
            fail: () => {
                console.log('get user info failed: not authorized.', arguments);
                
                // 强制弹一次授权
                if (needTry) {
                    wx.openSetting({
                        success: (res)=> {
                            if (res.authSetting['scope.userInfo']) {
                                wx.showToast({
                                    title: LANG.AuthorizeSuccess,
                                    duration: CONFIG.SHOWTOAST_DURATION,
                                });
                            }
                        },
                        fail: (res)=> {
                            console.log('user not permit to authorize.', arguments);
                        }
                    });
                }
            },
            withCredentials: false	// 不包含openid 等敏感信息
        });
    });
}
```

有两处值得单独说。

一个是被注释掉的那段 7 天缓存判断，原文里保留着：

```javascript
// 如果曾经授权过，则不用再请求了
/*try {
    let registedTime = wx.getStorageSync('REGISTED.'+ this.globalData.viewerId);
    // 7天内授权过的不再请求，不再更新资料
    if (registedTime && ((new Date).getTime()-registedTime) < 604800000) {
        callback();
        return;
    }
} catch (e) {}*/
```

思路是拿本地缓存的时间戳节流，7 天内不重复同步资料，`604800000` 就是 7 天的毫秒数。这个优化在用户资料变动不频繁的业务里是有意义的，能省掉一次接口调用。它被注释掉，多半是因为用户改了昵称头像之后同步不过来，取舍在这里。

另一个是 `withCredentials: false`。这个参数为 `true` 时返回值里会带上 `encryptedData` 和 `iv`，为 `false` 时只返回明文的基础信息。前面说过前端不该碰敏感数据，所以这里设成 `false` 是对的。

`init` 那部分是往页面塞全局上下文的，跟登录关系不大，为了完整性一并保留：

```javascript
init: function(callback) {
    this.login(()=>{
        // 塞入常规环境数据
        let pageInstance = this.getCurrentPageInstance(),
            context;

        context = {
            LANG				: LANG,
            CDN					: CONFIG.CDN_HOST,
            isNoContent			: false,
            HashtagType			: CONFIG.HashtagType,
            VerbType			: CONFIG.VerbType,
            GridImageWidthMode	: CONFIG.GridImageWidthMode,
            STICKER_MAKER_ENABLED: CONFIG.STICKER_MAKER_ENABLED,
            UGC_ENABLED			: CONFIG.UGC_ENABLED,
            UGC_IMAGE_COUNT_LIMIT: CONFIG.UGC_IMAGE_COUNT_LIMIT,
            ReviewStateText		: CONFIG.ReviewStateText,

            networkType			: this.globalData.device.network ? this.globalData.device.network.network_type : NetworkType.UNKNOWN,

            IS_DEV				: CONFIG.IS_DEV,
            IS_SHOW_CONSOLE		: CONFIG.IS_SHOW_CONSOLE,
            DEBUG_DATA			: [],

            // 全部配置都放开读
            CONFIG				: CONFIG,

            videoPlayStatus		: {},
            
            CURRENT_PAGE		: pageInstance.data.PAGE,

            hideVideo			: false,  // 因为小程序中video不能被任何元素遮挡，所以增加此变量，用于一些浮层展示时，隐藏视频
            
            updated_time		: (new Date).getTime()  // 页面上次更新时间
        };

        pageInstance.setData({
            context: context
        });

        this.sendLaunchEvent();

        callback && callback();
    })
}
```

`hideVideo` 那行注释挺有意思，小程序的 `video` 是原生组件，层级永远压在普通视图之上，浮层弹出来的时候只能手动把视频藏掉。这类原生组件的层级问题在小程序里是个老话题，后来微信提供了同层渲染来缓解，但当年只能这么绕。

## 七、这套写法今天还剩多少能用

写到这儿必须泼一盆冷水。上面代码里的 `wx.getUserInfo`，今天已经不是推荐写法了。

调用它现在拿不到真实的昵称和头像，返回的是灰色默认头像加上「微信用户」这样的占位昵称。取而代之的方案微信改过不止一次，先是要求用户主动点按钮触发的授权接口，后来又变成让用户自己确认的头像昵称填写能力。具体用哪个接口、从哪个基础库版本开始支持，请以[微信官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)当前的说明为准，我这里不列版本号，免得误导。

下面这张图是当年 `wx.getUserInfo` 成功返回的数据结构，昵称、头像、性别、国家省市都在里面：

![wx.getUserInfo 返回的用户信息结构，包含昵称头像性别与地区字段](https://s.poetries.top/gitee/2019/10/663.png)

对着这张图看现在的返回值，你会发现字段名基本没变，变的是里面能不能拿到真值。

除了用户信息，还有两块也变了：

- **隐私协议**。现在小程序要在后台配置用户隐私保护指引，涉及用户信息的接口在调用前需要用户同意隐私协议，代码里也要做相应处理。这块是这几年新增的合规要求，具体接口和后台配置位置以官方文档和你手上的后台实际界面为准
- **公众平台后台的菜单位置**。`AppSecret` 在哪个菜单下、服务器域名在哪儿配，这些年改过版，按当前后台的实际布局找就行

哪些没变？整条链路的骨架。`wx.login` 拿 code、服务端换 `openid` 和 `session_key`、自己签发登录态、`session_key` 不下发，这四条到今天依然成立。所以这篇的第二到第五节你可以放心看，第六节的代码当历史参考。

如果你想看更完整的小程序体系（双线程模型、性能优化、云开发这些），我在 [微信小程序开发实践总结](https://feinterview.poetries.top/blog/wx-weapp-summary) 里做过一次全面梳理，登录那一章和这篇是互补的，那边偏体系和 OAuth 规范对应，这篇偏实现细节。小程序框架层面的基础（页面栈、路由、限制清单）可以看 [小程序入门总结](https://feinterview.poetries.top/blog/xiaochengxu-note)。

## 总结

小程序登录说复杂不复杂，就三个角色两次转换。小程序把 code 交给你的服务器，你的服务器把 code 交给微信换回身份，然后你自己签发一张长期有效的通行证还给小程序。

真正需要守住的只有一条边界，`AppSecret` 和 `session_key` 停在服务器，前端只拿 token。这条守住了，剩下的都是工程问题；这条破了，后面写得再漂亮也是白搭。

至于 `wx.checkSession` 该放 `fail` 还是 `complete`、token 存多久、要不要做静默重放，这些没有标准答案，看你的业务对「掉登录态」有多敏感。我自己偏保守，宁可多调一次 `wx.login`。

## 参考

- [微信小程序登录官方文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [auth.code2Session 接口文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html)
- [微信小程序开发框架文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [前端进阶之旅](https://interview.poetries.top)
