---
title: HTML5中的视频音频使用详解
date: 2016-12-30 14:35:24
tags: 
  - HTML5
  - video
categories: Front-End
---


## 一、video
---

### 1.1 video支持视频格式
---

- 常见的视频格式
	- 视频的组成部分：画面、音频、编码格式
	- 视频编码：`H.264`、`Theora`、`VP8(google开源)`
	<!--more-->
- `HTML5`支持的视频格式：
	- `Ogg`
	   - 带有`Theora`视频编码+`Vorbis`音频编码的`Ogg`文件
	    - 支持的浏览器:`F`、`C`、`O`
	- `MEPG4`
	    - 带有`H.264`视频编码+`AAC`音频编码的`MPEG4`文件
	    - 支持的浏览器: `S`、`C`
	- `WebM`
	    - 带有`VP8`视频编码+`Vorbis`音频编码的`WebM`格式
	    - 支持的浏览器: `I`、`F`、`C`、`O`
	    - 劣势：视频少、转码器几乎没有，不好转码
		
- 想要`video`能自动填充慢父div的大小，只要给`video`标签加上`style="width= 100%; height=100%; object-fit: fill"`即可

### 1.2 标签原型
---

- 指定一种视频格式，不能播就提示

```html
<video id="media" src="examp.mp4" width="500" 
poster="examp1.jpg" >您的浏览器不支持video</video>
```

- 给定多种视频格式，浏览器根据自身支持程度选择播放哪一种
- 注意：多个`source`标签，浏览器会从第一个开始识别，如果第一个不被识别，则会继续识别第二个；如果第一个识别成功，则会直接播放第一种格式视频

```html
<video controls = “controls”>

   <source src=”1.mp4” type=”video/mp4” />  //src属性写到source标签中，要指定视频的type类型，例如MP4的即为type=“video/mp4”

   <source src = “2.ogg” type=”video/ogg” />  //ogg格式

   <source src=”3.webm” type=”video/webm” />   //webm格式

</video>
```

### 1.3 重要的video标签属性
---

|属性(常用)| 值| 功能描述|
| --- | --- | --- | 
|**controls**| controls |是否显示播放控件|
|**autoplay**| autoplay   |  设置是否打开浏览器后自动播放  |
|**width**|  Pilex（像素）  |   设置播放器的宽度 |
|**height**|  Pilex（像素）  | 设置播放器的高度   |
|**loop**|  loop  |  设置视频是否循环播放（即播放完后继续重新播放）  |
|**preload**|   preload |   设置是否等加载完再播放 |
|**src**|  url  |  设置要播放视频的url地址  |
|**poster**| imgurl   | 设置播放器初始默认显示图片   |
|**autobuffer**| autobuffer   | 设置为浏览器缓冲方式，不设置autoply才有效   |

- API 属性

|属性|描述|
|---|---|
|audioTracks	|返回表示可用音轨的 AudioTrackList 对象|
|buffered	|返回表示音频/视频已缓冲部分的 TimeRanges 对象|
|controller	|返回表示音频/视频当前媒体控制器的 MediaController 对象|
|crossOrigin	|设置或返回音频/视频的 CORS 设置|
|currentSrc	|返回当前音频/视频的 URL|
|currentTime	|设置或返回音频/视频中的当前播放位置（以秒计）|
|defaultMuted|	设置或返回音频/视频默认是否静音|
|defaultPlaybackRate	|设置或返回音频/视频的默认播放速度|
|duration|	返回当前音频/视频的长度（以秒计）|
|ended	|返回音频/视频的播放是否已结束|
|error|	返回表示音频/视频错误状态的 MediaError 对象|
|mediaGroup	|设置或返回音频/视频所属的组合（用于连接多个音频/视频元素）|
|muted|	设置或返回音频/视频是否静音|
|networkState	|返回音频/视频的当前网络状态|
|paused	|设置或返回音频/视频是否暂停|
|playbackRate|设置或返回音频/视频播放的速度|
|played|	返回表示音频/视频已播放部分的 TimeRanges 对象|
|readyState	|返回音频/视频当前的就绪状态|
|seekable	|返回表示音频/视频可寻址部分的 TimeRanges 对象|
|seeking|	返回用户是否正在音频/视频中进行查找|
|startDate	|返回表示当前时间偏移的 Date 对象|
|textTracks|	返回表示可用文本轨道的 TextTrackList 对象|
|videoTracks|	返回表示可用视频轨道的 VideoTrackList 对象|
|volume	|设置或返回音频/视频的音量|

 - 常用API属性
 
	- `duration`：返回当前音频/视频的长度（以秒计） 
	- `paused`：设置或返回音频/视频是否暂停 
	- `currentTime`：设置或返回音频/视频中的当前播放位置（以秒计）
	- `ended`：返回音频/视频的播放是否已结束
  
 ### 1.4 Video  API
 ---
 
 #### 1.4.1 Video 方法
 ---

|API |事件说明|
|---|---|
|**play**  | video.play();    播放视频 |
|**pause**  | video.pause();  暂停播放视频 |
|**load**  |  video.load();   将全部属性回复默认值，视频恢复重新开始状态|
|**canPlayType**  |var support = videoid.canPlayType(‘video/mp4′);   <br /><br />判断浏览器是否支持当前类型的视频格式<br /><br />返回值：<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;空字符串：不支持Maybe：可能支持Probably：完全支持  |
 

- 常用方法

  - `play()`：开始播放音频/视频 
  - `pause()`：暂停当前播放的音频/视频

#### 1.4.2网络状态 
---

- 获取video对象

  ```javascript
  Media = document.getElementById("media"); 
  ```
  
- **Media.currentSrc**; 
  - 返回当前资源的URL
- **Media.src = value**; 
  - 返回或设置当前资源的URL
- **Media.canPlayType(type)**; 
  - 是否能播放某种格式的资源
- **Media.networkState**; 
  - 0.此元素未初始化 
  - 1.正常但没有使用网络 
  - 2.正在下载数据 
  - 3.没有找到资源
- **Media.load()**; 
  - 重新加载src指定的资源
- **Media.buffered**; 
  - 返回已缓冲区域，TimeRanges
- **Media.preload**; 
  - none:不预载 
  - metadata:预载资源信息 
  - auto:

#### 1.4.3 准备状态 
---

- **Media.readyState**
- **Media.seeking**; 
  - 是否正在seeking

#### 1.4.4 回放状态
---

- **Media.currentTime = value**; 
  - 当前播放的位置，赋值可改变位置
- **Media.startTime;** 
  - 一般为0，如果为流媒体或者不从0开始的资源，则不为0
- **Media.duration**; 
  - 当前资源长度 流返回无限
- **Media.paused**; 
  - 是否暂停
- **Media.defaultPlaybackRate = value**;
  - 默认的回放速度，可以设置
- **Media.playbackRate = value**;
  - 当前播放速度，设置后马上改变
- **Media.played**; 
  - 返回已经播放的区域，TimeRanges，关于此对象见下文
- **Media.seekable**; 
  - 返回可以seek的区域 TimeRanges
- **Media.ended**; 
  - 是否结束
- **Media.autoPlay**; 
  - 是否自动播放
- **Media.loop**; 
  - 是否循环播放
- **Media.play()**; 
  - 播放
- **Media.pause()**; 
  - 暂停


#### 1.4.5 视频控制
---

- Media.controls;//是否有默认控制条
- Media.volume = value; //音量
- Media.muted = value; //静音
- TimeRanges(区域)对象
- TimeRanges.length; //区域段数
- TimeRanges.start(index) //第index段区域的开始位置
- TimeRanges.end(index) //第index段区域的结束位置

#### 1.4.6 相关事件
---

- 首先绑定事件的话可以通过js中的addEventListener方法来绑定事件

|事件|说明|
|---|---|
|**loadstart**|客户端开始请求数据|
|**progress** | 客户端正在请求数据|
|**suspend** | 延迟下载|
|**abort** | 客户端主动终止下载（不是因为错误引起）|
|**loadstart** |客户端开始请求数据 |
|**progress** | 客户端正在请求数据|
|**error** | 请求数据时遇到错误|
|**stalled** | 网速失速|
|**play** | play()和autoplay开始播放时触发|
|**pause** | pause()触发|
|**loadedmetadata** |成功获取资源长度 |
|**loadeddata** |- |
|**waiting** |等待数据，并非错误 |
|**playing** |开始回放 |
|**canplay** |可以播放，但中途可能因为加载而暂停 |
|**canplaythrough** | 可以播放，歌曲全部加载完毕|
|**seeking** | 寻找中|
|**seeked** | 寻找完毕|
|**timeupdate** |播放时间改变 |
|**ended** |播放结束 |
|**ratechange** | 播放速率改变|
|**durationchange** | 资源长度改变|
|**volumechange** |音量改变 |

- 常用事件
	- `oncanplay`：当文件就绪可以开始播放时运行的脚本（缓冲已足够开始时）。
	- `ontimeupdate`： 当播放位置改变时（比如当用户快进到媒介中一个不同的位置时）运行的脚本。 
	- `onended`：当媒介已到达结尾时运行的脚本（可发送类似“感谢观看”之类的消息）。

#### 1.4.7 其他

- 全屏:   
  -  ` element.webkitRequestFullScreen();`( webkit)
  -  ` element.mozRequestFullScreen();` (Firefox )
  -   `element.requestFullscreen();` (W3C )

- 退出全屏：
  -  `document.webkitCancelFullScreen()`; (webkit )
  - `document.mozCancelFullScreen()`;  (Firefox)
  -  `document.exitFullscreen();` (W3C)
  
  


## 二、audio
---

### 2.1 audio格式
---

- 常见的音频格式

	- 音频编码：`ACC`、`MP3`、`Vorbis`

- HTML5支持的音频格式：

  - `Ogg` 免费	支持的浏览器:`C`、`F`、`O`
  - `MP3` 收费	支持的浏览器: `I`、`C`、`S`
  - `Wav` 收费	支持的浏览器: `F`、`O`、`S`

### 2.2 audio标签中的一些常用属性
	

|属性	|属性值	|注释|
|---|---|---|
|**src**|	url	|播放的音乐的url地址（火狐只支持ogg的音乐，而IE9只支持MP3格式的音乐。chrome貌似全支持）|
|**preload**	|preload	|预加载（在页面被加载时进行加载或者说缓冲音频），如果使用了autoplay的话那么该属性失效。|
|**loop** |loop|	循环播放|
|**controls** |controls|	是否显示默认控制条（控制按钮）|
|**autoplay**|	autoplay|	自动播放|

- 对于音乐格式的支持

|音频格式	|Chrome	|Firefox|	IE9|	Opera|	Safari|
|---|---|---|---|---|---|
|OGG	|支持|	支持|	支持	|不支持	|不支持|
|MP3|	支持	|不支持|	支持	|不支持|	支持|
|WAV	|不支持|	支持|	不支持	|支持	|不支持|

- audio可通过new来创建。也可以通过用document来获取

```javascript
//通过new关键字来创建Audio对象
var Music = new Audio("test.mp3");

//通过document来获取已经存在的Audio对象
var Music = document.getElementById("audio");
//当然这里也可以使用document.getElementsByClassName('className')等其他的方法来获取。
```

### 2.3 api所提供的对audio标签操作的一些属性和方法
---

|属性|注释|
|---|---|
|**duration**|获取媒体文件的总时长，以s为单位，如果无法获取，返回NaN|
|**paused** | 如果媒体文件被暂停，那么paused属性返回true，反之则返回false|
|**ended** |如果媒体文件播放完毕返回true |
|**muted** | 用来获取或设置静音状态。值为boolean|
|**volume** |控制音量的属性值为0-1;0为音量最小，1为音量最大 |
|**startTime** |返回起始播放时间 |
|**error** |返回错误代码，为uull的时候为正常。否则可以通过Music.error.code来获取 |
|**currentTime** |用来获取或控制当前播放的时间，单位为s。 |
|**currentSrc** |以字符串形式返回正在播放或已加载的文件 |

### 2.4 常用的控制用的函数
---


|函数 |作用|
|---|---|
|**load()**| 加载音频、视频软件|
|**play()** |加载并播放音频、视频文件或重新播放暂停的的音频、视频|
|**pause()** |暂停出于播放状态的音频、视频文件|
|**canPlayType(obj)** |测试是否支持给定的Mini类型的文件|

### 2.5 audio标签API中的常用事件
---

- 首先绑定事件的话可以通过js中的addEventListener方法来绑定事件

|事件名称	|事件作用|
|---|---|
|**loadstart**	|客户端开始请求数据|
|**progress**	|客户端正在请求数据（或者说正在缓冲）|
|**play**	|play()和autoplay播放时|
|**pause**	|pause()方法促发时|
|**ended**	|当前播放结束|
|**timeupdate**	|当前播放时间发生改变的时候。播放中常用的时间处理|
|**canplaythrough**|	歌曲已经载入完全完成|
|**canplay**|	缓冲至目前可播放状态。|

其实`video`的`api`和`audio`几乎一致。稍稍有点不同。所以基本上会了一个其他的也就都会了