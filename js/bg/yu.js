
 window.requestAnimFrame = ( function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function( callback ) {
      window.setTimeout( callback, 1000 / 60 );
    };
  })();
  
  var can = document.getElementById('canvas');
  var cxt = can.getContext('2d');
  can.width = window.screen.width;
  can.height = window.screen.height;
  var size = 14; //字体大小
  var cols = can.width / size; //多少列数字
  var y = []; 
  for (var i=0;i<cols;i++ )y[i] = 0;//存储每列数字的y坐标
        
  (function draw(){
    cxt.fillStyle = 'rgba(0,0,0,.1)';
    cxt.fillRect(0,0,can.width,can.height);  //每次都画一个0.1透明度的遮盖层
    cxt.fillStyle = '#33ff00';
    cxt.font = 'bold '+size+'px Microsoft yahei'; //规定字体样式
    for (var i=0;i<cols;i++ ) //循环给每一行添加数组
    {
      var s = Math.floor( Math.random()*10 )+''; //生成一个0~9随机数
      var textX = i*size; // 文字x坐标
      var textY = y[i]; //文字 y坐标
      cxt.fillText(s,textX,textY); // 绘制文字
      y[i] += size; // y坐标逐渐增加
      if ( y[i] >= can.height && Math.random() >= 0.9 )
      {
        y[i] = 0;
      };//y坐标到头之后回0，Mat.random()的作用是让每一行不一定同时回去
    }
    requestAnimFrame(draw);
  })()		  		