---
title: 小程序绘制海报总结
date: 2021-01-02 12:01:24
tags: 
  - 小程序
  - 海报
categories: Front-End
---

## 生成海报方式一


**封装成组件方便调用**

```json
{
  "component": true,
  "usingComponents": {
    "van-popup": "@vant/weapp/popup/index",
    "van-icon": "@vant/weapp/icon/index"
  }
}
```

```
<canvas canvas-id="poster-share" class="poster" />

<view bind:tap="handleShare">
	<slot wx:if="{{useSlot}}" />
</view>
<van-popup custom-class="page-van-popup" show="{{ showShare }}" bind:close="shareClose">
	<view class="df fxdc h100v w100v" wx:if="{{showShare}}">
		<view class="df jcc aic fxa posr mt120" bind:tap="shareClose">
			<image class="poster-image" src="{{ tempFilePath }}" mode="aspectFit" />
		</view>
		<view class="fxn h238 bgfff df aic jcc bdrs16t">
			<view class="fxa w0 df aic jcc">
				<view class="df fxdc posr">
					<button class="posa t0 l0 w100p h100p op0" open-type="share" />
					<image class="h108 w108" src="./assets/ic_fenxiang.svg" />
					<text class="mt16 c333 fz28">分享好友</text>
				</view>
			</view>
			<view class="fxa w0 df aic jcc">
				<view class="df fxdc" bind:tap="savePicture">
					<image class="h108 w108" src="./assets/ic_baocun.svg" />
					<text class="mt16 c333 fz28">保存图片</text>
				</view>
			</view>
		</view>
	</view>
</van-popup>
```

```css
@import "../../../../libs/wxss/index.wxss";
.container {
	width: 100%;
}
.h377 {
	height: 377rpx;
}
.h417 {
	height: 417rpx;
}
.pb70 {
	padding-bottom: 70rpx;
}

.bgview {
	height: 651rpx;
	opacity: .63;
}

.tip,
.share {
	right: 0;
	border-radius: 100rpx 0 0 100rpx;
	width: 88rpx;
	height: 36rpx;
	background: #ffd300;
	color: #007142;
}

.tip {
	top: 75rpx;
}

.share {
	top: 140rpx;
}

.title-wrap {
	width: 100%;
	height: 85rpx;
	background: #fff0e5;
}

.shopping-num {
	border-radius: 15rpx;
	height: 28rpx;
	background: linear-gradient(90deg, rgba(255, 64, 0, 1) 0%, rgba(255, 163, 41, 1) 100%);
}

.page-van-popup {
	--popup-background-color: transparent;
}
.popup__content {
	width: 590rpx;
	height: 800rpx;
}

.poster {
	position: fixed;
	left: 0;
	top: -1000000px;
	z-index: 1000;
	width: 570px;
	height: 920px;
	pointer-events: none;
}

.nodata {
	padding-top: 150rpx;
	height: 700rpx;
}

.count-down .van-count-down {
	width: 200rpx;
	line-height: unset;
	font-size: 20rpx;
	color: unset;
}

.poster-image {
	width: 690rpx;
	height: 920rpx;
}

.cffffff88 {
	color: #fff88;
}

.w252 {
	width: 252rpx;
}
```

```js
// layer/component/sharePoster/index.js
import { rGetShareErCode } from '../../../../netapi/redPackets/index';
import { KEY_APP_ID } from '../../../../constants/config';
import { stringLimit } from '../../../../utils/string'

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    useSlot: {
      type: Boolean,
      value: false
    },
    showShare: {
      type: Boolean,
      value: false
    },
    pagePath: {
      type: String,
      value: '/pages/packagesSection/redPacketsDistribute/index',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    showShare: false,
    tempFilePath: '',
  },
  query: {},

  observers: {
  },

  /**
   * 组件的方法列表
   */
  methods: {
    shareClose() {
      this.setData({ showShare: false });
    },
    async sharePoster({sharePic}) {
      const { token } = await getApp().getAuthInfo();
      if (!token) {
        this.triggerEvent('isLogin')
        return;
      }

      if (this.data.tempFilePath) {
        this.setData({ showShare: true });
        return;
      }

      wx.showLoading({ title: '正在生成海报...' });

      try {
        const { userId = '', userInfo, mobile } = getApp().data.authinfo;
        const { shareId, pagePath } = this.data
        if (!this.qrcode) {
          this.qrcode = await rGetShareErCode();
        }

        const ctx = wx.createCanvasContext('poster-share', this);
        this.canvas = ctx;


        // const { height, orientation, path, type, width } = await wx.wxp.getImageInfo({
        //   src: imgSrc,
        // });
        const { path: posterBg } = await wx.wxp.getImageInfo({
          src: 'https://hyzmj.oss-cn-shenzhen.aliyuncs.com/jyh/posterBg.png',
        });
        
        await ctx.drawImage(posterBg, 0, 0, 570, 920);
        ctx.save();

        // banner
        const { path: banner } = await wx.wxp.getImageInfo({
          src: sharePic,
        });
        ctx.beginPath();
        ctx.arc(385 + 45, 500, 500, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.drawImage(banner, 45, 130, 500, 470);

        // 二维码和提示消息
        ctx.beginPath();
        ctx.arc(385 + 45, 760, 200, 0, 2 * Math.PI);
        ctx.closePath();

        ctx.clip();

        // const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(`data:image/png;base64,${this.qrcode.data}`) || [];
        // if (!format || !bodyData) {
        //   throw new Error('base64 错误');
        // }
        // const filePath = `${wx.env.USER_DATA_PATH}/tmp.base64src${new Date().getTime()}.${format}`;
        // wx.getFileSystemManager().writeFileSync(filePath, bodyData, 'base64');

        const { path: filePath } = await wx.wxp.getImageInfo({
          src: this.qrcode.data,
        });
        // 企业微信二维码
        ctx.drawImage(filePath, 360, 660, 190, 190);

        ctx.restore();
        // 获取头像
        const { statusCode, tempFilePath } = await wx.wxp.downloadFile({
          url: userInfo.imgPath || 'https://hyzmj.oss-cn-shenzhen.aliyuncs.com/zyj-weapp/note/mine_avatar.png',
        })

        ctx.setFontSize(22)
        ctx.setFillStyle('#000');
        ctx.fillText('微信零钱立即到账无需提现', 40 + 5, 640)

        if (statusCode === 200) {
          let userName = stringLimit(userInfo.userName,12)
          ctx.beginPath();
          ctx.arc(40 + 45, 710 + 45, 40, 0, 2 * Math.PI);
          ctx.closePath();
          // 绘制头像和昵称
          ctx.setFontSize(22)
          ctx.setFillStyle('#222');
          // ctx.fillText(userName, 140 + 5, 700 + 5)
          ctx.fillText('来自', 140 + 5, 740 + 5)
          ctx.fillText(mobile.replace(/^(\d{3})\d{4}(\d+)/, "$1****$2") + '推荐', 140 + 5, 780 + 5)
          ctx.clip();
          ctx.drawImage(tempFilePath, 40 + 5, 710 + 5, 80, 80);
        }
        const _this = this

        const file = await new Promise((resolve, reject) => {
          // 开始绘制
          ctx.draw(false, () => {
            // 生成临时图片文件
            wx.canvasToTempFilePath({
              canvasId: 'poster-share',
              // width,
              // height,
              // destWidth: width*(wx.getSystemInfoSync().pixelRatio),
              // destHeight: height*(wx.getSystemInfoSync().pixelRatio),
              success: resolve,
              fail: reject,
            }, _this);
          });
        });
        this.setData({ tempFilePath: file.tempFilePath, showShare: true });
        console.log(file)
        console.log(this.data)

      } catch (err) {
        console.log(err);
        wx.showToast({ title: '生成海报失败', icon: 'none' });
      }

      wx.hideLoading();
    },
    async savePicture() {
      wx.showLoading({ title: '正在保存...' });
      await wx.wxp.saveImageToPhotosAlbum({ filePath: this.data.tempFilePath }).catch((err) => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });
        throw err;
      });

      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'none' });
    },
  }
})
```


**调用组件**

```js
this.selectComponent('#poster').sharePoster({
  sharePic: shareImageUrl
})
```

**效果图**

![](https://poetries1.gitee.io/img-repo/2021/01/1.jpeg)


## 封装成组件库

```js
// utils/draw.js

class Draw {
  constructor(context, canvas, use2dCanvas = false) {
    this.ctx = context;
    this.canvas = canvas || null;
    this.use2dCanvas = use2dCanvas;
  }

  roundRect(x, y, w, h, r, fill = true, stroke = false) {
    if (r < 0) return;
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI, (Math.PI * 3) / 2);
    ctx.arc(x + w - r, y + r, r, (Math.PI * 3) / 2, 0);
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    ctx.lineTo(x, y + r);
    if (stroke) ctx.stroke();
    if (fill) ctx.fill();
  }

  drawView(box, style = {}) {
    const ctx = this.ctx;
    const { left: x, top: y, width: w, height: h } = box;
    const { borderRadius = 0, borderWidth = 0, borderColor, color = '#000', backgroundColor = 'transparent' } = style;
    ctx.save();
    // 外环
    if (borderWidth > 0) {
      ctx.fillStyle = borderColor || color;
      this.roundRect(x, y, w, h, borderRadius);
    }

    // 内环
    ctx.fillStyle = backgroundColor;
    const innerWidth = w - 2 * borderWidth;
    const innerHeight = h - 2 * borderWidth;
    const innerRadius = borderRadius - borderWidth >= 0 ? borderRadius - borderWidth : 0;
    this.roundRect(x + borderWidth, y + borderWidth, innerWidth, innerHeight, innerRadius);
    ctx.restore();
  }

  async drawImage(img, box = {}, style = {}) {
    await new Promise((resolve, reject) => {
      const ctx = this.ctx;
      const canvas = this.canvas;

      const { borderRadius = 0 } = style;
      const { left: x, top: y, width: w, height: h } = box;
      ctx.save();
      this.roundRect(x, y, w, h, borderRadius, false, false);
      ctx.clip();

      const _drawImage = (img) => {
        if (this.use2dCanvas) {
          const Image = canvas.createImage();
          Image.onload = () => {
            ctx.drawImage(Image, x, y, w, h);
            ctx.restore();
            resolve();
          };
          Image.onerror = () => {
            reject(new Error(`createImage fail: ${img}`));
          };
          Image.src = img;
        } else {
          ctx.drawImage(img, x, y, w, h);
          ctx.restore();
          resolve();
        }
      };

      const isTempFile = /^wxfile:\/\//.test(img);
      const isNetworkFile = /^https?:\/\//.test(img);
      const isBase64 = /^data:image\/(\w+);base64,/.test(img);

      if (isTempFile) {
        _drawImage(img);
      } else if (isBase64) {
        _drawImage(img);
      } else if (isNetworkFile) {
        wx.downloadFile({
          url: img,
          success(res) {
            if (res.statusCode === 200) {
              _drawImage(res.tempFilePath);
            } else {
              reject(new Error(`downloadFile:fail ${img}`));
            }
          },
          fail() {
            reject(new Error(`downloadFile:fail ${img}`));
          },
        });
      } else {
        reject(new Error(`image format error: ${img}`));
      }
    });
  }

  // eslint-disable-next-line complexity
  drawText(text, box = {}, style = {}) {
    const ctx = this.ctx;
    let { left: x, top: y, width: w, height: h } = box;
    let { color = '#000', lineHeight = '1.4em', fontSize = 14, textAlign = 'left', verticalAlign = 'top', backgroundColor = 'transparent' } = style;

    if (typeof lineHeight === 'string') {
      // 2em
      lineHeight = Math.ceil(parseFloat(lineHeight.replace('em')) * fontSize);
    }
    if (!text || lineHeight > h) return;

    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = textAlign;

    // 背景色
    ctx.fillStyle = backgroundColor;
    this.roundRect(x, y, w, h, 0);

    // 文字颜色
    ctx.fillStyle = color;

    // 水平布局
    switch (textAlign) {
      case 'left':
        break;
      case 'center':
        x += 0.5 * w;
        break;
      case 'right':
        x += w;
        break;
      default:
        break;
    }

    const textWidth = ctx.measureText(text).width;
    const actualHeight = Math.ceil(textWidth / w) * lineHeight;
    let paddingTop = Math.ceil((h - actualHeight) / 2);
    if (paddingTop < 0) paddingTop = 0;

    // 垂直布局
    switch (verticalAlign) {
      case 'top':
        break;
      case 'middle':
        y += paddingTop;
        break;
      case 'bottom':
        y += 2 * paddingTop;
        break;
      default:
        break;
    }

    const inlinePaddingTop = Math.ceil((lineHeight - fontSize) / 2);

    // 不超过一行
    if (textWidth <= w) {
      ctx.fillText(text, x, y + inlinePaddingTop);
      return;
    }

    // 多行文本
    const chars = text.split('');
    const _y = y;

    // 逐行绘制
    let line = '';
    for (const ch of chars) {
      const testLine = line + ch;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > w) {
        ctx.fillText(line, x, y + inlinePaddingTop);
        y += lineHeight;
        line = ch;
        if (y + lineHeight > _y + h) break;
      } else {
        line = testLine;
      }
    }

    // 避免溢出
    if (y + lineHeight <= _y + h) {
      ctx.fillText(line, x, y + inlinePaddingTop);
    }
    ctx.restore();
  }

  async drawNode(element) {
    const { layoutBox, computedStyle, name } = element;
    const { src, text } = element.attributes;
    if (name === 'view') {
      this.drawView(layoutBox, computedStyle);
    } else if (name === 'image') {
      await this.drawImage(src, layoutBox, computedStyle);
    } else if (name === 'text') {
      this.drawText(text, layoutBox, computedStyle);
    }
    const childs = Object.values(element.children);
    for (const child of childs) {
      await this.drawNode(child);
    }
  }
}

export default Draw;
```

**使用方式**

```
<view class="df fxdc h100v">
  <view class="df jcc aic fxa posr">
    <image
      class="posa t0 l0 w100p h100p blur"
      src="{{ bgImage }}"
      wx:if="{{ bgImage }}"
      mode="aspectFill"
    />

    <canvas type="2d" id="poster-canvas" class="poster"></canvas>
  </view>

  <view class="fxn h238 bgfff df aic jcc bdrs16t">
    <view class="fxa w0 df aic jcc">
      <view class="df fxdc posr">
        <button class="posa t0 l0 w100p h100p op0" open-type="share"></button>
        <image class="h108 w108" src="./assets/ic_fenxiang.svg" />
        <text class="mt16 c333 fz28">分享好友</text>
      </view>
    </view>
    <view class="fxa w0 df aic jcc">
      <view class="df fxdc" bind:tap="handleSave">
        <image class="h108 w108" src="./assets/ic_baocun.svg" />
        <text class="mt16 c333 fz28">保存图片</text>
      </view>
    </view>
  </view>
</view>
```

```css
page {
  background: #5c5c5c;
}

.poster {
  height: 862rpx;
  width: 558rpx;
}

.blur {
  filter: blur(100px);
}
```

```js
import Draw from '../../../utilities/draw';
import bg from './assets/bg.js';
import avatar from './assets/avatar.js';
import { rGetGoodsDetail } from '../../../netapi/goods/index';
import { rGetShortQrcode } from '../../../netapi/other/index';
import { KEY_APP_ID } from '../../../constants/config';
import { getStorageUserSettingForKey } from '../../../utilities/other';

Page({
  data: {
    bgImage: '',
  },

  query: {
    goodsId: '',
    shareId: '',
  },

  onLoad(options) {
    this.query = options;
  },

  async onReady() {
    wx.showLoading({ title: '正在生成海报...' });

    let userId = getApp().data.authinfo.userId;
    let mobile = getStorageUserSettingForKey('mobile');
    mobile = mobile.replace(/(\d{3})\d*(\d{2})/, '$1****$2');

    const response = await rGetGoodsDetail({ id: this.query.goodsId }, { catcher: this, show: true });
    const qrcode = await rGetShortQrcode(
      {
        appId: KEY_APP_ID,
        page: 'pages/packagesOther/transfer/index',
        scene: `/pages/packagesGoods/goodsDetail/index?goodsId=${this.query.goodsId}&shareId=${userId}`,
        shortScenePrefix: 'page-',
        width: 200,
      },
      { catcher: this, show: true }
    );

    if (!response || response.code !== 0) {
      this.setData({ error: response });
      wx.hideLoading();
      return;
    }
    if (!qrcode || qrcode.code !== 0) {
      this.setData({ error: qrcode });
      wx.hideLoading();
      return;
    }
    this.response = response;

    this.setData({ bgImage: response.data.goods_image[0].img });

    const query = wx.createSelectorQuery();
    query
      .select('#poster-canvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        // 558px*862px

        const canvas = res[0].node;

        const ctx = canvas.getContext('2d');

        canvas.width = 558;
        canvas.height = 862;
        const ratio = canvas.width / 558;
        ctx.scale(ratio, ratio);

        this.canvas = canvas;
        this.ratio = ratio;

        const draw = new Draw(ctx, canvas, true);

        // 背景
        await draw
          .drawImage(bg, {
            left: 0,
            top: 0,
            width: 558,
            height: 862,
          })
          .catch((e) => {
            console.log(e);
          });

        // 商品图片
        await draw.drawImage(response.data.goods_image[0].img, {
          left: 50,
          top: 122,
          width: 455,
          height: 455,
        });

        // 商品名称
        draw.drawText(
          response.data.goods_info.goods_name || '',
          {
            left: 50,
            top: 608,
            width: 455,
            height: 96,
          },
          {
            color: '#333',
            fontSize: 28,
            fontWeight: 500,
          }
        );

        // 头像
        await draw.drawImage(
          avatar,
          {
            left: 50,
            top: 720,
            width: 56,
            height: 56,
          },
          {
            borderRadius: 28,
          }
        );

        // 分享者
        draw.drawText(
          `${mobile}的分享`,
          {
            left: 116,
            top: 732,
            width: 250,
            height: 40,
          },
          {
            color: '#333',
            fontSize: 24,
          }
        );

        // 二维码
        await draw.drawImage(
          `data:image/png;base64,${qrcode.data}`,
          {
            left: 380,
            top: 650,
            width: 146,
            height: 146,
          },
          {
            borderRadius: 78,
          }
        );

        // 金额
        draw.drawText(
          `  ¥ ${response.data.goods_info.intervalPrice}`,
          {
            left: 144,
            top: 798,
            width: 200,
            height: 40,
          },
          {
            color: '#ff6c1e',
            lineHeigh: 24,
            fontSize: 26,
            fontWeight: 500,
          }
        );

        wx.hideLoading();
      });
  },

  onShareAppMessage() {

  },

  async handleSave() {
    wx.showLoading({ title: '正在保存...' });
    const res = await wx.wxp
      .canvasToTempFilePath({
        canvas: this.canvas,
        width: 558,
        height: 862,
        destWidth: 558,
        destHeight: 862,
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });

        throw err;
      });

    await wx.wxp
      .saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败', icon: 'none' });

        throw err;
      });
      
    wx.hideLoading();
  },
});
```

**效果预览**

![](https://poetries1.gitee.io/img-repo/2021/01/2.jpeg)




