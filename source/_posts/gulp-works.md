---
title: 基于gulp的工作流配置
date: 2017-01-21 17:40:43
tags:  gulp
categories: Build
---

> 配置一套基于`gulp`的工作流，满足日常的基本开发。

<!--more-->



###  一、目录结构


![](https://poetries1.gitee.io/img-repo/2019/10/221.png)


### 二、 package.json


```javascript
{
  "name": "gulp-project",
  "scripts": {
    "dev": "gulp dev", //npm run dev   开发
    "build": "gulp build", //npm run build   发布
    "upload": "gulp upload", //npm run upload 上传服务器 
    "zip": "gulp zip" ////npm run zip 打包文件
  },
  "devDependencies": {
    "babel-preset-es2015": "^6.22.0", //编译es6
    "browser-sync": "^2.15.0",  //监听改动刷新
    "gulp": "^3.9.1", //gulp
    "gulp-autoprefixer": "^3.1.1", //补齐css浏览器前缀
    "gulp-babel": "^6.1.2", // Es6
    "gulp-clean": "^0.3.2", //删除文件
    "gulp-clean-css": "^2.0.12", //css压缩，gulp-minify-css不更新了
    "gulp-concat": "^2.6.0",//合并文件
    "gulp-ftp": "^1.1.0",//提交到ftp服务器
    "gulp-git": "^1.11.3",//提交到git
    "gulp-htmlmin": "^2.0.0",//压缩html
    "gulp-imagemin": "^3.0.3",//压缩图片
    "gulp-rename": "^1.2.2",//重命名文件
    "gulp-rev-append": "^0.1.6", //添加MD5版本号，这里改成了时间戳
    "gulp-sass": "^2.3.2",//编译SASS
    "gulp-uglify": "^2.0.0",//js压缩
    "gulp-util": "^3.0.7", //说是ftp配套用的，看了下是包装了些常用函数
    "gulp-zip": "^3.2.0" // 打包文件
  }
}
```

### 三、 gulpfile.js


```javascript
//组件

let gulp = require('gulp'),
	browserSync = require('browser-sync').create(), //监听刷新
    reload = browserSync.reload,
    ftp = require('gulp-ftp'), // ftp上传
    gutil = require('gulp-util'),
    sass = require('gulp-sass'), // sass
    cleancss = require('gulp-clean-css'), // CSS压缩
    autoprefixer = require("gulp-autoprefixer"),
    uglify = require('gulp-uglify'), // js压缩
    concat = require('gulp-concat'), // 合并文件
    rename = require('gulp-rename'), // 重命名
    clean = require('gulp-clean'), //清空文件夹
    imagemin = require('gulp-imagemin'), //压缩图片
    zip = require('gulp-zip'), //打包文件
    rev = require('gulp-rev-append'), //添加MD5
    htmlmin = require('gulp-htmlmin'), // 压缩html
	git = require('gulp-git'),     //git
	babel = require("gulp-babel"); //ES6 转es5
```

```javascript
// =========== 开发构建流程 [多文件输出] ==============

//dev
gulp.task('sass:dev', () => {
    gulp.src('src/sass/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('src/css/'))
        .pipe(reload({ stream: true }))
});

// 合并、重命名css
gulp.task('css:dev', ['sass:dev'], () => {
    gulp.src(['src/css/*.css', '!src/css/areaMap.css'])
        .pipe(concat('all.css'))
        .pipe(gulp.dest('dist/css/'))
});

// 合并、重命名js
gulp.task('js:dev', () => {
    gulp.src('src/js/*.js')
    	.pipe(babel({
		      	 	presets: ['es2015']
     			})) //ES6转ES5
        //.pipe(concat('all.js')) 开发阶段分开输出js文件
        .pipe(gulp.dest('dist/js/'))
        .pipe(reload({ stream: true }))
});

// HTML

gulp.task('html:dev', () => {
    gulp.src('src/tpl/*.html')
        .pipe(gulp.dest('dist'))
});

// 将lib的库文件对应到指定位置
gulp.task('lib:dev', () => {
    gulp.src('./src/lib/*')
        .pipe(gulp.dest('./dist/lib/'));
});


//开发构建
gulp.task('dev', ['css:dev', 'js:dev', 'html:dev', 'img','copyFonts','lib'], () => {
    browserSync.init({
        server: {
            baseDir: "dist" // 设置服务器的根目录为dist目录
        },
        notify: false // 开启静默模式
    });
    // 我们使用gulp的文件监听功能，来实时编译修改过后的文件

    gulp.watch('src/js/*.js', ['js:dev']);
    gulp.watch('src/sass/*.scss', ['sass:dev']);
    gulp.watch('src/tpl/*.html', ['html:dev']);
    gulp.watch('src/fonts/**', ['copyFonts']);
    gulp.watch('src/images/**', ['img']);
    gulp.watch('src/lib/**', ['lib']);
});
```


```javascript
// =========== 正式构建 build [单文件输出] ==============

// sass解析
gulp.task('sass', () => {
    gulp.src('src/sass/*.scss')
        //输出为压缩
         .pipe(sass({
             outputStyle: 'compressed'
         }))
        .pipe(sass())
        .pipe(gulp.dest('src/css/'))
});

// 合并、压缩、重命名css

gulp.task('css', ['sass'], () => {
    gulp.src(['src/css/*.css', '!src/css/areaMap.css'])
        .pipe(concat('all.css'))
        .pipe(autoprefixer({
            browsers: ['last 2 versions', 'Android >= 4.0'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            remove: false //是否去掉不必要的前缀 默认：true 
        }))
        .pipe(cleancss()) //压缩css
        .pipe(gulp.dest('dist/css'));
});

// 合并，压缩,重命名js文件

gulp.task('js', () => {
    gulp.src('src/js/*.js')
    	.pipe(babel({
		      	 	presets: ['es2015']
     			})) //ES6转ES5
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});


// 压缩HTML

gulp.task('html', () => {
    gulp.src('src/tpl/*.html')
        .pipe(rev())//记得在引用地址后面加后缀，插件原本是ver=@@hash ,这里改成了v=@@hash
      //<link rel="stylesheet" href="css/all.css?v=@@hash">
      //<script src="js/all.js?v=@@hash"></script>
        .pipe(htmlmin({
            removeComments: true, //清除HTML注释
            collapseWhitespace: true, //压缩HTML
            collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
            removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
            removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
            removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
            minifyJS: true, //压缩页面JS
            minifyCSS: true //压缩页面CSS
        }))
        .pipe(gulp.dest('dist'))
});

//压缩图片

gulp.task('img', () => {
    gulp.src('src/images/*.{png,jpg,gif,ico}')
        .pipe(imagemin({
            optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
            interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
            multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
        }))
        .pipe(gulp.dest('dist/images'));
});

//字体文件
gulp.task('copyFonts', function () {
    gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/fonts/'))
});

// 清空图片、样式、js

gulp.task('clean', () => {
    gulp.src('dist', { read: false })
        .pipe(clean({ force: true }));
});

// 将bower的库文件对应到指定位置

gulp.task('lib', () => {
    gulp.src('/src/lib/*')
        .pipe(gulp.dest('/dist/lib/'));
});
```

```
// ================ 打包主体dist 文件夹 zip ====

//打包主体dist 文件夹并按照时间重命名
gulp.task('zip', function(){
      function checkTime(i) {
          if (i < 10) {
              i = "0" + i
          }
          return i
      }
          
      var d=new Date();
      var year=d.getFullYear();
      var month=checkTime(d.getMonth() + 1);
      var day=checkTime(d.getDate());
      var hour=checkTime(d.getHours());
      var minute=checkTime(d.getMinutes());

  return gulp.src('./dist/**')
        .pipe(zip(year+month+day +hour+minute+'.zip'))
        .pipe(gulp.dest('./zip'));
});

```

```javascript
//正式构建

gulp.task('build', ['clean','css', 'js', 'img', 'html','copyFonts','lib']);

// ================ 上传 upload ====

gulp.task('upload', () => {
    gulp.src('dist/**')
        .pipe(ftp({
            host: '8.8.8.8', // 远程主机ip
            port: 22, // 端口
            user: 'username', // 帐号
            pass: 'password', // 密码
            remotePath: '/project' // 上传路径，不存在则新建
        }))
        .pipe(gutil.noop())
})
```