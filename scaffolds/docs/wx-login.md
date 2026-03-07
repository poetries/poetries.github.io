---
title: 小程序之登录
date: 2018-08-13 00:01:20
tags: 小程序
categories: Front-End
---

一、登录流程
---


![](https://poetries1.gitee.io/img-repo/2019/10/662.png)

- 小程序内通过`wx.login`接口获得`code`
- 将`code`传入后台，后台对微信服务器发起一个`https`请求换取`openid`、`session_key`(解密`encryptedData`、`iv`得到的)
- 后台生成一个自身的`3rd_session`（以此为`key`值保持`openid`和`session_key`），返回给前端。PS:微信方的`openid`和`session_key`并没有发回给前端小程序 
- 小程序拿到`3rd_session`之后保持在本地
- 小程序请求登录区内接口，通过`wx.checkSession`检查登录态，如果失效重新走上述登录流程，否则待上`3rd_session`到后台进行登录验证


> 通过上面`wx.login`和`wx.getUserInfo`两个api拿到相应的信息,并通过上方接口传给自己的服务器. 

**登录获取用户信息**

```javascript
wx.login({
    success(res){
     console.log(res)
       //code:"fda41033Z0fdak3dfae01dffaaWXQA1vwQ4dfae0Akg3e0Z0k3E"
       //errMsg:"login:ok"
    }
})
```

```javascript
wx.getUserInfo({
   success(res){
     console.log(res)
   }
 })
```

返回的信息

![](https://poetries1.gitee.io/img-repo/2019/10/663.png)

**需要传输的信息有7个参数**

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

- 可精简为以下三个参数. 
- 其余的签名校验的参数可省略,而`appid`和`secret`可以直接写在服务器.

```javascript
js_code //  wx.login登录时获取的 code,用于后续获取session_key
encryptedData  包括敏感数据在内的完整用户信息的加密数据
iv 加密算法的初始向量
```

> 服务端处理返回token、sessionId过程省略...


二、登录态校验
---

> 主要用到`checkSession`


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

三、完整登录代码示例
---

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
        }
    },
    register: function(needTry, callback){
        !callback && (callback = function(){});
        
        this.login(()=>{
            // 如果曾经授权过，则不用再请求了
            /*try {
                let registedTime = wx.getStorageSync('REGISTED.'+ this.globalData.viewerId);
                // 7天内授权过的不再请求，不再更新资料
                if (registedTime && ((new Date).getTime()-registedTime) < 604800000) {
                    callback();
                    return;
                }
            } catch (e) {}*/
        
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
    },
    init: function(callback) {
        this.login(()=>{
            // 塞入常规环境数据
            let pageInstance = this.getCurrentPageInstance(),
                context, screenWidth, screenHeight;

            /*if (this.globalData.device.system_info) {
                screenWidth = this.globalData.device.system_info.screen_width;
                screenHeight = this.globalData.device.system_info.screen_height;
            } else {
                let systemInfo = wx.getSystemInfoSync();
                if (systemInfo) {
                    screenWidth = systemInfo.screenWidth;
                    screenHeight = systemInfo.screenHeight;
                }
            }*/
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
})

```
