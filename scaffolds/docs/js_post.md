---
title: iframe+表单跨域提交POST请求
date: 2017-09-04 09:30:43
tags: 
   - JavaScript
   - 跨域
categories: Front-End
---

 ## 虚拟表单的形式提交post请求

- 现需要把数据源解析提交到表单，创建一个隐藏的表单、隐藏的`iframe`,表单的target指向`iframe`的`name`

```javacript
var str = 'hfrom_handle=206438&dnid=&dgroup_items__x_countz_=1&dgroup_items=1&dgroup_items_group=dl%2ets&dgroup_items_mirror_count=1&dgroup_items_flags__x_countz_=1&dgroup_items_flags=4&dgroup_items_keys__x_countz_=1&dgroup_items_keys=1jfiegbp3oyma&dgroup_items_tokens__x_countz_=1&dgroup_items_tokens=123456&dgroup_items_datas__x_countz_=1&dgroup_items_datas={%22key%22%3a%221jfiegbp3oyma%22,%22type%22%3a%22test%2epcba%22,%22time%22%3a%2220170904004724%2e838%22,%22g%22%3a[{%22n%22%3a%22mfc%22,%22p%22%3a[{%22n%22%3a%22factory%22,%22v%22%3a%22%22},{%22n%22%3a%22operator%22,%22v%22%3a%22xiaoming%22},{%22n%22%3a%22work%2eorder%22,%22v%22%3a%221889%22},{%22n%22%3a%22materal%2ecode%22,%22v%22%3a%22%22},{%22n%22%3a%22materal%2edesc%22,%22v%22%3a%22%22}]},{%22n%22%3a%22env%22,%22p%22%3a[{%22n%22%3a%22dev%2ehardware%2ecpu%2emodel%22,%22v%22%3a%22gm8136%22},{%22n%22%3a%22dev%2ehardware%2emodel%22,%22v%22%3a%22f127%22},{%22n%22%3a%22dev%2ehardware%2esensor%2emodel%22,%22v%22%3a%22soih42%22},{%22n%22%3a%22dev%2ehardware%2ewifi%2emac%22,%22v%22%3a%2228%3af3%3a66%3a1c%3aac%3a30%22},{%22n%22%3a%22dev%2ehardware%2ewifi%2emodel%22,%22v%22%3a%22rtl8188%22},{%22n%22%3a%22dev%2eversion%2ecurrent%22,%22v%22%3a%22v4%2e8%2e1%2e1708141702%22},{%22n%22%3a%22vtest%5fver%22,%22v%22%3a%224%2e8%2e1%2e1708031358%22},{%22n%22%3a%22dev%2eversion%2ebase%22,%22v%22%3a%22v3%2e3%2e2%2e1603301301%22},{%22n%22%3a%22pc%2eip%2epublic%22,%22v%22%3a%22120%2e236%2e230%2e234%22},{%22n%22%3a%22pc%2eip%2eprivate%22,%22v%22%3a%22192%2e168%2e3%2e180%22}]},{%22n%22%3a%22appearance%22,%22p%22%3a[{%22n%22%3a%22result%22,%22v%22%3a%22ok%22},{%22n%22%3a%22duration%22,%22v%22%3a%221605ms%22}]},{%22n%22%3a%22wifi%5fsignal%22,%22p%22%3a[{%22n%22%3a%22quality%22,%22v%22%3a%2284%22},{%22n%22%3a%22ssid%22,%22v%22%3a%22HW11%22},{%22n%22%3a%22result%22,%22v%22%3a%22ok%22}]},{%22n%22%3a%22activate%22,%22p%22%3a[{%22n%22%3a%22result%22,%22v%22%3a%22ccm%2esecurity%5fchip%2eactived%22},{%22n%22%3a%22code%22,%22v%22%3a%22%22}]}]}&dgroup_items_offsets__x_countz_=1&dgroup_items_offsets=0'
```

- 解码后的数据

![image.png](http://upload-images.jianshu.io/upload_images/1480597-06cd3b80809500c0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

- 创建一个隐藏的`input(type="hidden")`,然后把解码得到的数据处理填充到`input`的`name` `value`中，最后通过表单提交到`iframe`，此过程提交不会刷新页面

 ```javascript
/*iframe post cross domain*/
 function js_iframe(c) {
     var i, e, key, n, v, inp, a, form, iframe;
      
     // 原理：创建一个隐藏的form、一个隐藏的iframe,把表单的target指向iframe的name即可
     form = document.createElement("form");
     iframe = document.createElement("iframe");
     iframe.style.display = "none";
     iframe.name = "frame_post";
     document.body.appendChild(iframe);

     form.action = url;
     form.target = "frame_post";		
     form.method = "post";
     form.style.display = "none";
     for(i = 0, a = (decodeURIComponent(str)).split("&");i<a.length;i++) {
         inp = document.createElement("input");
         e = a[i].split("=")
         inp.type = "hidden";
         inp.name = e[0];
         inp.value = e[1];
         form.appendChild(inp);
     }
     document.body.appendChild(form);
     form.submit(); 
 }
```

- 提交后表单处理的结果是这样：

![](https://poetries1.gitee.io/img-repo/2019/10/311.png)

 
