---
title: Nestjs学习总结
date: 2022-05-25 20:35:24
tags: 
  - Node
  - Nest
categories: Front-End
---



> Nest (NestJS) 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的开发框架。它利用 JavaScript 的渐进增强的能力，使用并完全支持 TypeScript （仍然允许开发者使用纯 JavaScript 进行开发），并结合了 OOP （面向对象编程）、FP （函数式编程）和 FRP （函数响应式编程）。

- 在底层，Nest 构建在强大的 HTTP 服务器框架上，例如 Express （默认），并且还可以通过配置从而使用 Fastify ！
- Nest 在这些常见的 Node.js 框架 (Express/Fastify) 之上提高了一个抽象级别，但仍然向开发者直接暴露了底层框架的 API。这使得开发者可以自由地使用适用于底层平台的无数的第三方模块。

本文基于nest8演示

# 基础

## 创建项目

```
$ npm i -g @nestjs/cli
```

`nest new project-name` 创建一个项目

```
$ tree
.
├── README.md
├── nest-cli.json
├── package.json
├── src
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── test
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── tsconfig.build.json
└── tsconfig.json

2 directories, 12 files
```

**以下是这些核心文件的简要概述**：

- `app.controller.ts`   带有单个路由的基本控制器示例。
- `app.module.ts`   应用程序的根模块。
- `main.ts` 应用程序入口文件。它使用 NestFactory 用来创建 Nest 应用实例。

> `main.ts` 包含一个异步函数，它负责引导我们的应用程序：

```js
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
        
async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3000);
}
bootstrap();
```

- `NestFactory` 暴露了一些静态方法用于创建应用实例
- `create()` 方法返回一个实现 `INestApplication` 接口的对象, 并提供一组可用的方法

> `nest`有两个支持开箱即用的 HTTP 平台：`express` 和 `fastify`。 您可以选择最适合您需求的产品


- `platform-express` Express 是一个众所周知的 node.js 简约 Web 框架。 这是一个经过实战考验，适用于生产的库，拥有大量社区资源。 默认情况下使用 `@nestjs/platform-express` 包。 许多用户都可以使用 `Express` ，并且无需采取任何操作即可启用它。
- `platform-fastify` `Fastify` 是一个高性能，低开销的框架，专注于提供最高的效率和速度。 


## Nest控制器

Nest中的控制器层负责处理传入的请求, 并返回对客户端的响应。

![](https://s.poetries.work/uploads/2022/05/8b2fcd207249cb37.png)

> 控制器的目的是接收应用的特定请求。路由机制控制哪个控制器接收哪些请求。通常，每个控制器有多个路由，不同的路由可以执行不同的操作

**通过NestCLi创建控制器：**

`nest -h` 可以看到`nest`支持的命令

**常用命令：**

- 创建控制器：`nest g co user module`
- 创建服务：`nest g s user module`
- 创建模块：`nest g mo user module`
- 默认以src为根路径生成

![](https://s.poetries.work/uploads/2022/05/1c412ef436a4a04d.png)

```
nest g controller posts
```

表示创建posts的控制器,这个时候会在src目录下面生成一个posts的文件夹，这个里面就是posts的控制器，代码如下

```js
import { Controller } from '@nestjs/common';

@Controller('posts')
export class PostsController {
}
```

创建好控制器后，`nestjs`会自动的在 `app.module.ts` 中引入`PostsController`，代码如下

```js
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsController } from './posts/posts.controller'
    
@Module({
    imports: [],
    controllers: [AppController, PostsController],
    providers: [AppService],
})
export class AppModule {}
```

## nest配置路由请求数据

> Nestjs提供了其他HTTP请求方法的装饰器 `@Get()` `@Post()` `@Put()` 、 `@Delete()`、 `@Patch()`、 `@Options()`、 `@Head()`和 `@All()`

在Nestjs中获取`Get`传值或者`Post提`交的数据的话我们可以使用Nestjs中的装饰器来获取。

```
@Request()  req
@Response() res
@Next() next
@Session()  req.session
@Param(key?: string)    req.params / req.params[key]
@Body(key?: string) req.body / req.body[key]
@Query(key?: string)    req.query / req.query[key]
@Headers(name?: string) req.headers / req.headers[name]
```

**示例**

```js
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post('create')
  create(@Body() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @Get('list')
  findAll(@Query() query) {
    return this.postsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postsService.remove(id);
  }
}
```

**注意**

- `关于nest的return`： 当请求处理程序返回 JavaScript 对象或数组时，它将自动序列化为 JSON。但是，当它返回一个字符串时，Nest 将只发送一个字符串而不是序列化它

## Nest服务

> Nestjs中的服务可以是`service` 也可以是`provider`。他们都可以`通过 constructor 注入依赖关系`。服务本质上就是通过`@Injectable()` 装饰器注解的类。在Nestjs中服务相当于`MVC`的`Model`

![](https://s.poetries.work/uploads/2022/05/1c607b98268d7707.png)

**创建服务**

```
nest g service posts
```

创建好服务后就可以在服务中定义对应的方法

```js
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Between, Equal, Like, In } from 'typeorm';
import * as dayjs from 'dayjs';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsEntity } from './entities/post.entity';
import { PostsRo } from './interfaces/posts.interface';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsEntity)
    private readonly postsRepository: Repository<PostsEntity>,
  ) {}

  async create(post: CreatePostDto) {
    const { title } = post;
    const doc = await this.postsRepository.findOne({ where: { title } });
    console.log('doc', doc);
    if (doc) {
      throw new HttpException('文章标题已存在', HttpStatus.BAD_REQUEST);
    }
    return {
      data: await this.postsRepository.save(post),
      message: '创建成功',
    };
  }

  // 分页查询列表
  async findAll(query = {} as any) {
    let { pageSize, pageNum, orderBy, sort, ...params } = query;
    orderBy = query.orderBy || 'create_time';
    sort = query.sort || 'DESC';
    pageSize = Number(query.pageSize || 10);
    pageNum = Number(query.pageNum || 1);
    console.log('query', query);
    
    const queryParams = {} as any;
    Object.keys(params).forEach((key) => {
      if (params[key]) {
        queryParams[key] = Like(`%${params[key]}%`); // 所有字段支持模糊查询、%%之间不能有空格
      }
    });
    const qb = await this.postsRepository.createQueryBuilder('post');

    // qb.where({ status: In([2, 3]) });
    qb.where(queryParams);
    // qb.select(['post.title', 'post.content']); // 查询部分字段返回
    qb.orderBy(`post.${orderBy}`, sort);
    qb.skip(pageSize * (pageNum - 1));
    qb.take(pageSize);

    return {
      list: await qb.getMany(),
      totalNum: await qb.getCount(), // 按条件查询的数量
      total: await this.postsRepository.count(), // 总的数量
      pageSize,
      pageNum,
    };
  }

  // 根据ID查询详情
  async findById(id: string): Promise<PostsEntity> {
    return await this.postsRepository.findOne({ where: { id } });
  }

  // 更新
  async update(id: string, updatePostDto: UpdatePostDto) {
    const existRecord = await this.postsRepository.findOne({ where: { id } });
    if (!existRecord) {
      throw new HttpException(`id为${id}的文章不存在`, HttpStatus.BAD_REQUEST);
    }
    // updatePostDto覆盖existRecord 合并，可以更新单个字段
    const updatePost = this.postsRepository.merge(existRecord, {
      ...updatePostDto,
      update_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });
    return {
      data: await this.postsRepository.save(updatePost),
      message: '更新成功',
    };
  }

  // 删除
  async remove(id: string) {
    const existPost = await this.postsRepository.findOne({ where: { id } });
    if (!existPost) {
      throw new HttpException(`文章ID ${id} 不存在`, HttpStatus.BAD_REQUEST);
    }
    await this.postsRepository.remove(existPost);
    return {
      data: { id },
      message: '删除成功',
    };
  }
}
```

## Nest模块

> 模块是具有 `@Module()` 装饰器的类。 `@Module()` 装饰器提供了元数据，Nest 用它来组织应用程序结构

![](https://s.poetries.work/uploads/2022/05/fcc23bae4de7fa32.png)

> 每个 Nest 应用程序至少有一个模块，即根模块。根模块是 Nest 开始安排应用程序树的地方。事实上，根模块可能是应用程序中唯一的模块，特别是当应用程序很小时，但是对于大型程序来说这是没有意义的。在大多数情况下，您将拥有多个模块，每个模块都有一组紧密相关的功能。

**@module() 装饰器接受一个描述模块属性的对象：**

- `providers` 由 Nest 注入器实例化的提供者，并且可以至少在整个模块中共享
- `controllers` 必须创建的一组控制器
- `imports` 导入模块的列表，这些模块导出了此模块中所需提供者
- `exports` 由本模块提供并应在其他模块中可用的提供者的子集

```js
// 创建模块 posts
nest g module posts
```

**Nestjs中的共享模块**

每个模块都是一个共享模块。一旦创建就能被任意模块重复使用。假设我们将在几个模块之间共享 PostsService 实例。 我们需要把 PostsService 放到 exports 数组中：

```js
// posts.modules.ts
import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
@Module({
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService] // 共享模块导出
})
export class PostsModule {}
```

> 可以使用 `nest g res posts` 一键创建以上需要的各个模块

![](https://s.poetries.work/uploads/2022/05/f63b444ed1c1d481.png)

## 配置静态资源

NestJS中配置静态资源目录完整代码

```
npm i @nestjs/platform-express -S
```



```js
import { NestExpressApplication } from '@nestjs/platform-express';
// main.ts
async function bootstrap() {
  // 创建实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
   //使用方式一
  app.useStaticAssets('public')  //配置静态资源目录
  
  // 使用方式二：配置前缀目录 设置静态资源目录
  app.useStaticAssets(join(__dirname, '../public'), {
    // 配置虚拟目录，比如我们想通过 http://localhost:3000/static/1.jpg 来访问public目录里面的文件
    prefix: '/static/', // 设置虚拟路径
  });
  // 启动端口
  const PORT = process.env.PORT || 9000;
  await app.listen(PORT, () =>
    Logger.log(`服务已经启动 http://localhost:${PORT}`),
  );
}
bootstrap();
```

## 配置模板引擎

```
npm i ejs --save
```

配置模板引擎

```js
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {join} from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setBaseViewsDir(join(__dirname, '..', 'views')) // 放视图的文件
  app.setViewEngine('ejs'); //模板渲染引擎

  await app.listen(9000);
}
bootstrap();
```

项目根目录新建`views`目录然后新建`根目录 -> views -> default -> index.ejs`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
<body>
   <h3>模板引擎</h3>
    <%=message%>
</body>
</html>
```

**渲染页面**

Nestjs中 `Render`装饰器可以渲染模板，**使用路由匹配渲染引擎**

```js
mport { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  @Get()
  @Render('default/index')  //使用render渲染模板引擎，参数就是文件路径：default文件夹下的index.ejs
  getUser(): any {
    return {message: "hello word"}   //只有返回参数在模板才能获取，如果不传递参数，必须返回一个空对象
  }
}
```

## Cookie的使用

> cookie和session的使用**依赖**于当前使用的平台，如：express和fastify
> 两种的使用方式不同，这里主要记录基于**express**平台的用法

cookie可以用来存储用户信息，存储购物车等信息，在实际项目中用的非常多

```js
npm instlal cookie-parser --save 
npm i -D @types/cookie-parser --save
```

引入注册

```js
// main.ts

import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  //注册cookie
  app.use(cookieParser('dafgafa'));  //加密密码
  
  await app.listen(3000);
}
bootstrap();
```

**接口中设置cookie 使用response**

请求该接口，响应一个cookie

```js
@Get()
index(@Response() res){
    //设置cookie, signed:true加密
    //参数：1：key, 2:value, 3:配置
    res.cookie('username', 'poetry', {maxAge: 1000 * 60 * 10, httpOnly: true, signed:true})
    
    //注意：
    //使用res后，返回数据必须使用res
    //如果是用了render模板渲染，还是使用return
    res.send({xxx})
}
```

**cookie相关配置参数**

- `domain`    String	指定域名下有效
- `expires`	  Date	    过期时间(秒),设置在某个时间点后会在该`cookoe`后失效
- `httpOnly`  Boolean	默认为`false` 如果为`true`表示不允许客户端(通过`js`来获取`cookie`)
- `maxAge`  String	最大失效时间(毫秒),设置在多少时间后失效
- `path`	    String	表示`cookie`影响到的路径,如:`path=/`如果路径不能匹配的时候,浏览器则不发送这个`cookie`
- `secure`	 Boolean	当 `secure` 值为 `true` 时,`cookie` 在 HTTP 中是无效,在 `HTTPS` 中才有效
- `signed`	 Boolean	表示是否签名`cookie`,如果设置为`true`的时候表示对这个`cookie`签名了,这样就需要用`res.signedCookies()`获取值`cookie`不是使用`res.cookies()`了

**获取cookie**

```js
@Get()
index(@Request() req){
      console.log(req.cookies.username)
      
      //加密的cookie获取方式
      console.log(req.signedCookies.username)  
      return req.cookies.username
}
```



**Cookie加密**

```js
// 配置中间件的时候需要传参
app.use(cookieParser('123456'));

// 设置cookie的时候配置signed属性
res.cookie('userinfo','hahaha',{domain:'.ccc.com',maxAge:900000,httpOnly:true,signed:true});

// signedCookies调用设置的cookie
console.log(req.signedCookies);  
```

## Session的使用



- `session`是另一种记录客户状态的机制，不同的是Cookie保存在客户端浏览器中，而`session`保存在服务器上
- 当浏览器访问服务器并发送第一次请求时，服务器端会创建一个session对象，生成一个类似于key,value的键值对， 然后将key(cookie)返回到浏览器(客户)端，浏览器下次再访问时，携带key(cookie)，找到对应的session(value)。 客户的信息都保存在session中

**安装 express-session**

```js
npm i express-session --save
npm i -D @types/express-session --save
```

```js
// main.ts

import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as session from 'express-seesion'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  //配置session
  app.use(session({
      secret: 'dmyxs',
      cookie: { maxAge: 10000, httpOnly: true },  //以cookie存储到客户端
      rolling: true //每次重新请求时，重新设置cookie
  }))
  
  await app.listen(3000);
}
bootstrap();

```

**session相关配置参数**

- `secret`	           String   生成`session`签名的密钥
- `name`	           String   客户端的`cookie`的名称，默认为`connect.sid`, 可自己设置
- `resave`	           Boolean	强制保存 `session` 即使它并没有变化, 默认为`true`, 建议设置成`false`
- `saveUninitalized`   Boolean	强制将未初始化的 `session` 存储。当新建了一个 `session` 且未设定属性或值时，它就处于 未初始化状态。在设定一个 `cookie` 前，这对于登陆验证，减轻服务端存储压力，权限控制是有帮助的。默认:`true`, 建议手动添加
- `cookie`	           Object   设置返回到前端`cookie`属性，默认值为`{ path: ‘/’, httpOnly: true, secure: false, maxAge: null }`。
- `rolling`	           Boolean	在每次请求时强行设置 `cookie`，这将重置 `cookie` 过期时间, 默认为`false`

**接口中设置session**

```js
@Get()
  index(@Request() req){
    //设置session
    req.session.username = 'poetry'
}
```

**获取session**

```js
@Get('/session')
  session(@Request() req, @Session() session ){
    //获取session：两种方式
    console.log(req.session.username)
    console.log(session.username)
    
    return 'hello session'
}
```

## 跨域，前缀路径、网站安全、请求限速

**跨域，路径前缀，网络安全**

```
yarn add helmet csurf
```

```js
// main.ts

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';

import * as helmet from 'helmet';
import * as csurf from 'csurf';

import { AppModule } from './app.module';

const PORT = process.env.PORT || 8000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 路径前缀：如：http://www.test.com/api/v1/user
  app.setGlobalPrefix('api/v1');

  //cors：跨域资源共享，方式一：允许跨站访问
  app.enableCors();
  // 方式二：const app = await NestFactory.create(AppModule, { cors: true });

  //防止跨站脚本攻击
  app.use(helmet());

  //CSRF保护：跨站点请求伪造
  app.use(csurf());
  
  await app.listen(PORT, () => {
    Logger.log(
      `服务已经启动,接口请访问:localhost:${PORT}${PREFIX}`,
    )
  });
}
bootstrap();
```

**限速：限制客户端在一定时间内的请求次数**

```
yarn add @nestjs/throttler
```

> 在需要使用的模块引入使用，这里是**全局**使用，在`app.module.ts`中引入。这里设置的是：**1分钟内只能请求10次，超过则报status为429的错误**

```js
app.module.ts

import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';

//引入
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
  	UserModule,
    ThrottlerModule.forRoot({
      ttl: 60,  //1分钟
      limit: 10, //请求10次
    }),
  ],
  providers: [ //全局使用
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
```



## 管道、守卫、拦截器、过滤器、中间件

- **管道**：数据处理与转换，数据验证
- **守卫**：验证用户登陆，保护路由
- **拦截器**：对请求响应进行拦截，统一响应内容
- **过滤器**：异常捕获
- **中间件**：日志打印

> 执行顺序（时机）

从客户端发送一个post请求，路径为：`/user/login`，请求参数为：`{userinfo: ‘xx’,password: ‘xx’}`，到服务器接收请求内容，触发绑定的函数并且执行相关逻辑完毕，然后返回内容给客户端的整个过程大体上要经过如下几个步骤：

![](https://s.poetries.work/uploads/2022/05/1670837aa99d6cb8.png)



> 全局使用: 管道 - 守卫 - 拦截器 - 过滤器 - 中间件。统一在main.ts文件中使用，全局生效

```js
import { NestFactory } from '@nestjs/core';
import { ParseIntPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthGuard } from './common/guard/auth.guard';
import { AuthInterceptor } from './common/interceptors/auth.interceptor';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //全局使用管道：这里使用的是内置，也可以使用自定义管道，在下文
  app.useGlobalPipes(new ParseIntPipe());

  //全局使用中间件
  app.use(LoggerMiddleware)
  
  //全局使用过滤器
  //这里使用的是自定义过滤器，先别管，先学会怎么在全局使用
  app.useGlobalFilters(new HttpExceptionFilter());  

  //全局使用守卫
  app.useGlobalGuards(new AuthGuard());
  
  //全局使用拦截器
  app.useGlobalInterceptors(new AuthInterceptor());
  
  await app.listen(3000);
}
bootstrap();
```

### 管道

常用内置管道，从`@nestjs/common`导出

- `ParseIntPipe`：将字符串数字转数字
- `ValidationPipe`：验证管道

> 局部使用管道

- 匹配整个路径，使用UsePipes

- 只匹配某个接口，使用UsePipes

- 在获取参数时匹配，一般使用内置管道

```js
import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UsePipes,
  ParseIntPipe
} from '@nestjs/common';
import { myPipe } from '../../common/pipes/user.pipe';

@Controller('user')
@UsePipes(new myPipe())  //局部方式1：匹配整个/user， get请求和put请求都会命中
export class UserController {
  @Get(':id')
  getUserById(@Param('id', new ParseIntPipe()) id) { //局部方式3：只匹配/user的get请求，使用的是内置管道
    console.log('user', typeof id);
    return id;
  }

  @Put(':id')
  @UsePipes(new myPipe())  //局部方式2：只匹配/user的put请求
  updateUser(@Body() user, @Param('id') id) {
    return {
      user,
      id,
    };
  }
}
```

> 自定义管道

使用快捷命令生成：`nest g pi myPipe common/pipes`

```js
import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';

//自定义管道必须实现自PipeTransform，固定写法，该接口有一个transform方法
//transform参数：
//value：使用myPipe时所传递的值，可以是param传递的的查询路径参数，可以是body的请求体
//metadata：元数据，可以用它判断是来自param或body或query
@Injectable()
export class myPipe implements PipeTransform<string> {
  transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type === 'body') {
      console.log('来自请求体', value);
    }
    if (metadata.type === 'param') {
      console.log('来自查询路径', value);

      const val = parseInt(value, 10);
      //如果不是传递一个数字，抛出错误
      if (isNaN(val)) {
        throw new BadRequestException('Validation failed');
      }
      return val;
    }
    return value;
  }
}
```



### 守卫

> 自定义守卫

使用快捷命令生成：`nest g gu myGuard common/guards`

```js
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; //反射器，作用与自定义装饰器桥接，获取数据

//自定义守卫必须CanActivate，固定写法，该接口只有一个canActivate方法
//canActivate参数：
//context：请求的(Response/Request)的引用
//通过守卫返回true，否则返回false，返回403状态码
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  // 白名单数组
  private whiteUrlList: string[] = ['/user'];

  // 验证该次请求是否为白名单内的路由
  private isWhiteUrl(urlList: string[], url: string): boolean {
    if (urlList.includes(url)) {
      return true;
    }
    return false;
  }

  canActivate(context: ExecutionContext): boolean {
    // 获取请求对象
    const request = context.switchToHttp().getRequest();
    //console.log('request', request.headers);
    //console.log('request', request.params);
    //console.log('request', request.query);
    //console.log('request', request.url);

    // 用法一：验证是否是白名单内的路由
    if (this.isWhiteUrl(this.whiteUrlList, request.url)) {
      return true;
    } else {
      return false;
    }

    // 用法二：使用反射器，配合装饰器使用，获取装饰器传递过来的数据
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    //console.log(roles); // [ 'admin' ]
    //http://localhost:3000/user/9?user=admin，如果与装饰器传递过来的值匹配则通过，否则不通过
    //真实开发中可能从cookie或token中获取值
    const { user } = request.query;
    if (roles.includes(user)) {
      return true;
    } else {
      return false;
    }

    // 其他用法
    // 获取请求头中的token字段
    const token = context.switchToRpc().getData().headers.token;
    // console.log('token', token);

    // 获取session
    const userinfo = context.switchToHttp().getRequest().session;
    // console.log('session', userinfo);

    return true;
  }
}
```

> 局部使用守卫

```js
import {
  Controller,
  Get,
  Delete,
  Param,
  UsePipes,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard';
import { Role } from '../../common/decorator/role.decorator'; //自定义装饰器

@UseGuards(AuthGuard) //局部使用守卫，守卫整个user路径
@Controller('user')
export class UserController {
  @Get(':id')
  getUserById(@Param('id', new ParseIntPipe()) id) {
    console.log('user', typeof id);
    return id;
  }

  @Delete(':id')
  @Role('admin')  //使用自定义装饰器，传入角色，必须是admin才能删除
  removeUser(@Param('id') id) {
    return id;
  }
}
```

### 装饰器

自定义守卫中使用到了自定义装饰器

```js
nest g d role common/decorator
```

```js
//这是快捷生成的代码

import { SetMetadata } from '@nestjs/common';

//SetMetadata作用：将获取到的值，设置到元数据中，然后守卫通过反射器才能获取到值
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

### 拦截器

使用快捷命令生成：`nest g in auth common/intercepters`

```js
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

//自定义拦截器必须实现自NestInterceptor，固定写法，该接口只有一个intercept方法
//intercept参数：
//context：请求上下文，可以拿到的Response和Request
@Injectable()
export class AuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    console.log('拦截器', request.url);
    return next.handle().pipe(
      map((data) => {
        console.log('全局响应拦截器方法返回内容后...');
        return {
          status: 200,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: '请求成功',
          data: data,
        };
      }),
    );
  }
}
```

### 过滤器

> 局部使用过滤器

```js
import {
  Controller,
  Get,
  UseFilters,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../../common/filters/http-exception.filter';

//局部使用过滤器
@UseFilters(new HttpExceptionFilter())
@Controller('/user')
export class ExceptionController {
  @Get()
  getUserById(@Query() { id }): string {
    if (!id) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: '请求参数id 必传',
          error: 'id is required',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return 'hello error';
  }
}
```

**自定义过滤器**

使用快捷命令生成：`nest g f myFilter common/filters`

```js
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

//必须实现至ExceptionFilter，固定写法，该接口只有一个catch方法
//catch方法参数：
//exception：当前正在处理的异常对象
//host：传递给原始处理程序的参数的一个包装(Response/Request)的引用
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus(); //获取状态码
    const exceptionRes: any = exception.getResponse(); //获取响应对象
    const { error, message } = exceptionRes;

    //自定义的异常响应内容
    const msgLog = {
      status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
    };

    response.status(status).json(msgLog);
  }
}
```



### 中间件

> 局部使用中间件

```js
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middlerware';
import { UserModule } from './modules/user/user.module';

@Module({
	imports:[ UserModule ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware) //应用中间件
      .exclude({ path: 'user', method: RequestMethod.POST })  //排除user的post方法
      .forRoutes('user'); //监听路径  参数：路径名或*，*是匹配所以的路由
      // .forRoutes({ path: 'user', method: RequestMethod.POST }, { path: 'album', method: RequestMethod.ALL }); //多个
     // .apply(UserMiddleware) //支持多个中间件
     // .forRoutes('user')
  }
}
```



**自定义中间件**

```js
nest g mi logger common/middleware
```

```js
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  //req：请求参数
  //res：响应参数
  //next：执行下一个中件间
  use(req: Request, res: Response, next: () => void) {
    const { method, path } = req;
    console.log(`${method} ${path}`);
    next();
  }
}
```



**函数式中间件**

```js
// 函数式中间件-应用于全局
export function logger(req, res, next) {
  next();
}

// main.ts
async function bootstrap() {
  // 创建实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 设置全局日志函数中间件
  app.use(logger);
}
bootstrap();
```

## 数据验证

如何 限制 和 验证 前端传递过来的数据？

常用：`dto`（data transfer object数据传输对象） + `class-validator`，自定义提示内容，还能集成swagger

**class-validator的验证项装饰器**

https://github.com/typestack/class-validator#usage

```
@IsOptional() //可选的
@IsNotEmpty({ message: ‘不能为空’ })
@MinLength(6, {message: ‘密码长度不能小于6位’})
@MaxLength(20, {message: ‘密码长度不能超过20位’})
```

```
@IsEmail({}, { message: ‘邮箱格式错误’ }) //邮箱
@IsMobilePhone(‘zh-CN’, {}, { message: ‘手机号码格式错误’ }) //手机号码
@IsEnum([0, 1], {message: ‘只能传入数字0或1’}) //枚举
```

```
@ValidateIf(o => o.username === ‘admin’) //条件判断，条件满足才验证，如：这里是传入的username是admin才验证
```

```
yarn add class-validator class-transformer
```

全局使用内置管道`ValidationPipe` ，不然会报错，无法起作用

```js
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe()); //全局内置管道
  await app.listen(3000);
}
bootstrap();
```

编写`dto`，使用`class-validator`的校验项验证

创建DTO：只需要用户名，密码即可，两种都不能为空

> 可以使用`nest g res user`一键创建带有dto的接口模块

```js
import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, {
    message: '密码长度不能小于6位',
  })
  @MaxLength(20, {
    message: '密码长度不能超过20位',
  })
  password: string;
}
```

修改DTO：用户名，密码，手机号码，邮箱，性别，状态，都是**可选的**

```js
import {
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
  IsMobilePhone,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  username: string;

  @IsOptional()
  @MinLength(6, {
    message: '密码长度不能小于6位',
  })
  @MaxLength(20, {
    message: '密码长度不能超过20位',
  })
  password: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式错误' })
  email: string;

  @IsOptional()
  @IsMobilePhone('zh-CN', {}, { message: '手机号码格式错误' })
  mobile: string;

  @IsOptional()
  @IsEnum(['male', 'female'], {
    message: 'gender只能传入字符串male或female',
  })
  gender: string;

  @IsOptional()
  @IsEnum({ 禁用: 0, 可用: 1 },{
    message: 'status只能传入数字0或1',
  })
  @Type(() => Number) //如果传递的是string类型，不报错，自动转成number类型
  status: number;
}
```

`controller`和`service`一起使用

```js
// user.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }
  
  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Body() user: CreateUserDto) { //使用创建dto
    return await this.userService.create(user);
  }
  
  @Patch(':id')
    async update(@Param('id') id: string, @Body() user: UpdateUserDto) {  //使用更新dto
      return await this.userService.update(id, user);
    }
  }
```

```js
// user.service.ts

import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './entities/user.entity';
import { ToolsService } from '../../utils/tools.service';
import { CreateUserDto } from './dto/create-user.dto';


@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) { }

  async create(user: CreateUserDto) { //使用dto
    do some thing....
  }
}
```

![image-20220525155256064](/Users/poetry/Library/Application Support/typora-user-images/image-20220525155256064.png)

![image-20220525155325809](/Users/poetry/Library/Application Support/typora-user-images/image-20220525155325809.png)



# 进阶

## 配置抽离

```
yarn add nestjs-config
```

```js
app.module.ts

import * as path from 'path';
import { Module } from '@nestjs/common';

//数据库
import { TypeOrmModule } from '@nestjs/typeorm';

//全局配置
import { ConfigModule, ConfigService } from 'nestjs-config';


@Module({
  imports: [
    //1.配置config目录
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),  
    
    //2.读取配置，这里读取的是数据库配置
	TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('database'), 
      inject: [ConfigService],  // 获取服务注入
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**配置数据库**

```js
src -> config -> database

import { join } from 'path';
export default {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: 'your password',
  database: 'test',
  entities: [join(__dirname, '../', '**/**.entity{.ts,.js}')],
  synchronize: true,
};
```



## 环境配置

```
yarn add cross-env
```

cross-env的作用是兼容window系统和mac系统来设置环境变量

**在package.json中配置**

```
"scripts": {
    "start:dev": "cross-env NODE_ENV=development nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "cross-env NODE_ENV=production node dist/main",
  },
```

**dotenv的使用**



```
yarn add dotenv
```



**根目录创建 env.parse.ts**

```js
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

const isProd = process.env.NODE_ENV === 'production';

const localEnv = path.resolve('.env.local');
const prodEnv = path.resolve('.env.prod');

const filePath = isProd && fs.existsSync(prodEnv) ? prodEnv : localEnv;

// 配置 通过process.env.xx读取变量
dotenv.config({ path: filePath });
```

导入环境

```
// main.ts
import '../env.parse'; // 导入环境变量
```



`.env.local`

```
PORT=9000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=123
MYSQL_DATABASE=test
```

`.env.prod`

```
PORT=9000
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=1234
MYSQL_DATABASE=test
```

读取环境变量 `process.env.MYSQL_HOST`形式

## 文件上传与下载

```
yarn add @nestjs/platform-express compressing

compressing 文件下载依赖，提供流的方式
```

配置文件的目录地址，以及文件的名字格式

```js

// src/config/file.ts 上传文件配置

import { join } from 'path';
import { diskStorage } from 'multer';

/**
 * 上传文件配置
 */
export default {
  root: join(__dirname, '../../assets/uploads'),
  storage: diskStorage({
    destination: join(
      __dirname,
      `../../assets/uploads/${new Date().toLocaleDateString()}`,
    ),
    filename: (req, file, cb) => {
      const filename = `${new Date().getTime()}.${file.mimetype.split('/')[1]}`;
      return cb(null, filename);
    },
  }),
};
```

```js
// app.module.ts
import { ConfigModule, ConfigService } from 'nestjs-config';

@Module({
  imports: [
    // 加载配置文件目录 src/config
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {}
```

```js
// upload.controller.ts
import {
  Controller,
  Get,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadDto } from './dto/upload-file.dto';
import { UploadService } from './upload.service';
import { Response } from 'express';

@Controller('common')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file) {
    this.uploadService.uploadSingleFile(file);
    return true;
  }

  // 多文件上传
  @Post('uploads')
  @UseInterceptors(FilesInterceptor('file'))
  uploadMuliFile(@UploadedFiles() files, @Body() body) {
    this.uploadService.UploadMuliFile(files, body);
    return true;
  }

  @Get('export')
  async downloadAll(@Res() res: Response) {
    const { filename, tarStream } = await this.uploadService.downloadAll();
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    tarStream.pipe(res);
  }
}
```

```js
// upload.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { tar } from 'compressing';
import { ConfigService } from 'nestjs-config';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  uploadSingleFile(file: any) {
    console.log('file', file);
  }
  UploadMuliFile(files: any, body: any) {
    console.log('files', files);
  }
  async downloadAll() {
    const uploadDir = this.configService.get('file').root;
    const tarStream = new tar.Stream();
    await tarStream.addEntry(uploadDir);
    return { filename: 'download.tar', tarStream };
  }
}


```

```js
// upload.module.ts

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigService } from 'nestjs-config';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => config.get('file'),
      inject: [ConfigService],
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
```

## 实现图片随机验证码

nest如何实现图片随机验证码？

![](https://s.poetries.work/uploads/2022/05/58d3d8e7ca89835f.png)

这里使用的是**svg-captcha**这个库，你也可以使用其他的库

```
yarn add svg-captcha
```

**封装，以便多次调用**

```js
src -> utils -> tools.service.ts

import { Injectable } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';

@Injectable()
export class ToolsService {
  async captche(size = 4) {
    const captcha = svgCaptcha.create({  //可配置返回的图片信息
      size, //生成几个验证码
      fontSize: 50, //文字大小
      width: 100,  //宽度
      height: 34,  //高度
      background: '#cc9966',  //背景颜色
    });
    return captcha;
  }
}
```

**在使用的module中引入**

```js
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ToolsService } from '../../utils/tools.service';

@Module({
  controllers: [UserController],
  providers: [UserService, ToolsService],
})
export class UserModule { }
```

**使用**

```js
import { Controller, Get, Post，Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('user')
export class UserController{
  constructor(private readonly toolsService: ToolsService,) {}  //注入服务

  @Get('authcode')  //当请求该接口时，返回一张随机图片验证码
  async getCode(@Req() req, @Res() res) {
    const svgCaptcha = await this.toolsService.captche(); //创建验证码
    req.session.code = svgCaptcha.text; //使用session保存验证，用于登陆时验证
    console.log(req.session.code);
    res.type('image/svg+xml'); //指定返回的类型
    res.send(svgCaptcha.data); //给页面返回一张图片
  }

  @Post('/login')
  login(@Body() body, @Session() session) {
  	//验证验证码，由前端传递过来
  	const { code } = body;
  	if(code?.toUpperCase() === session.code?.toUpperCase()){
		console.log(‘验证码通过’)
	}
    return 'hello authcode';
  }
}
```

**前端简单代码**

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
        form {
            display: flex;
        }

        .input {
            width: 80px;
            height: 32px;
        }

        .verify_img {
            margin: 0px 5px;
        }
    </style>
</head>

<body>
    <h2>随机验证码</h2>
    <form action="/user/login" method="post" enctype="application/x-www-form-urlencoded">
        <input type="text" name='code' class="input" />
        <img class="verify_img" src="/user/code" title="看不清？点击刷新"
            onclick="javascript:this.src='/user/code?t='+Math.random()"> //点击再次生成新的验证码
        <button type="submit">提交</button>
    </form>
</body>

</html>
```



## 邮件服务

> 邮件服务使用文档 https://nest-modules.github.io/mailer/docs/mailer

```js
// 邮件服务配置
// app.module.ts
import { MailerModule } from '@nestjs-modules/mailer';
import { resolve, join } from 'path';
import { ConfigModule, ConfigService } from 'nestjs-config';

@Module({
  imports: [
    // 加载配置文件目录 src/config
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    // 邮件服务配置
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('email'),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {}
// src/config/email.ts 邮件服务配置
import { join } from 'path';
// npm i ejs -S
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

export default {
  transport: {
    host: 'smtp.qq.com',
    secureConnection: true, // use SSL
    secure: true,
    port: 465,
    ignoreTLS: false,
    auth: {
      user: '123@test.com',
      pass: 'dfafew1',
    },
  },
  defaults: {
    from: '"nestjs" <123@test.com>',
  },
  // preview: true, // 发送邮件前预览
  template: {
    dir: join(__dirname, '../templates/email'), // 邮件模板
    adapter: new EjsAdapter(),
    options: {
      strict: true,
    },
  },
};
```

**邮件服务使用**

```js
// email.services.ts
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  // 邮件服务注入
  constructor(private mailerService: MailerService) {}

  async sendEmail() {
    console.log('发送邮件');
    await this.mailerService.sendMail({
      to: 'test@qq.com', // 收件人
      from: '123@test.com', // 发件人
      // subject: '副标题',
      text: 'welcome', // plaintext body
      html: '<h1>hello</h1>', // HTML body content
      // template: 'email', // 邮件模板
      // context: { // 传入邮件模板的data
      //   email: 'test@qq.com',
      // },
    });
    return '发送成功';
  }
}
```

## nest基于possport + jwt做登陆验证

**方式与逻辑**

- 基于possport的本地策略和jwt策略
- **本地策略**主要是验证账号和密码是否存在，如果存在就登陆，返回**token**
- **jwt策略**则是验证用户**登陆时附带的token**是否匹配和有效，如果不匹配和无效则返回**401状态码**

```
yarn add @nestjs/jwt @nestjs/passport passport-jwt passport-local passport
yarn add -D @types/passport @types/passport-jwt @types/passport-local
```


**jwt策略 jwt.strategy.ts**

```js
// src/modules/auth/jwt.strategy.ts
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('token'),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret, // 使用密钥解析
    } as StrategyOptions);
  }
	
  //token验证, payload是super中已经解析好的token信息
  async validate(payload: any) {
    return { userId: payload.userId, username: payload.username };
  }
}
```

**本地策略 local.strategy.ts**

```js
// src/modules/auth/local.strategy.ts
import { Strategy, IStrategyOptions } from 'passport-local';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from './auth.service';

//本地策略
//PassportStrategy接受两个参数：
//第一个：Strategy，你要用的策略，这里是passport-local，本地策略
//第二个：别名，可选，默认是passport-local的local，用于接口时传递的字符串
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    } as IStrategyOptions);
  }

  // validate是LocalStrategy的内置方法
  async validate(username: string, password: string): Promise<any> {
    //查询数据库，验证账号密码，并最终返回用户
    return await this.authService.validateUser({ username, password });
  }
}
```

**constants.ts**

```js
// src/modules/auth/constants.ts
export const jwtConstants = {
  secret: 'secretKey',
};
```

**使用守卫 auth.controller.ts**

```js
// src/modules/auth/auth.controller.ts
import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 登录测试 无需token
  @UseGuards(AuthGuard('local')) //本地策略，传递local，执行local里面的validate方法
  @Post('login')
  async login(@Request() req) { //通过req可以获取到validate方法返回的user，传递给login，登陆
    return this.authService.login(req.user);
  }
  // 在需要的地方使用守卫，需要带token才可访问
  @UseGuards(AuthGuard('jwt'))//jwt策略，身份鉴权
  @Get('userInfo')
  getUserInfo(@Request() req) {//通过req获取到被验证后的user，也可以使用装饰器
    return req.user;
  }
}
```

**在module引入jwt配置和数据库查询的实体 auth.module.ts**

```js
// src/modules/auth/auth.module.ts
import { LocalStrategy } from './local.strategy';
import { jwtConstants } from './constants';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersEntity } from '../user/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsersEntity]),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '10d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

**auth.service.ts**

```js
// src/modules/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
  	@InjectRepository(UsersEntity),
       private readonly usersRepository: Repository<UsersEntity>,
  	private jwtService: JwtService
    ) {}
  
  validateUser(username: string, password: string) {
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['username', 'password'],
    });
    if (!user) ToolsService.fail('用户名或密码不正确');
    //使用bcryptjs验证密码
    if (!compareSync(password, user.password)) {
      ToolsService.fail('用户名或密码不正确');
    }
    return user;
  }
  login(user: any) {
    const payload = { username: user.username };  // 把信息存在token
    return {
      token: this.jwtService.sign(payload),
    };
  }
}
```


最后在app.module.ts中导入即可测试

```js
// app.modules.ts
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ...
    AuthModule, // 导入模块
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {}
```

**使用postman测试**

![](https://s.poetries.work/uploads/2022/05/154d26405e7a471a.png)

## 对数据库的密码加密：md5和bcryptjs

**密码加密**

> 一般开发中，是不会有人直接将密码明文直接放到数据库当中的。因为这种做法是非常不安全的，需要对密码进行加密处理。
> 好处：
>
> - 预防内部网站运营人员知道用户的密码
> - 预防外部的攻击，尽可能保护用户的隐私

**加密方式**

- 使用`md5`：每次生成的值是一样的，一些网站可以破解，因为每次存储的都是一样的值
- 使用`bcryptjs`：每次生成的值是不一样的

```
yarn add md5
```

加密

```js
import * as md5 from 'md5';

const passwrod = '123456';
const transP = md5(passwrod);  // 固定值：e10adc3949ba59abbe56e057f20f883e
```

给密码加点"盐"：目的是混淆密码，其实还是得到固定的值

```js
const passwrod = '123456';
const salt = 'dmxys'
const transP = md5(passwrod + salt);  // 固定值：4e6a2881e83262a72f6c70f48f3e8022
```

验证密码：先加密，再验证

```js
const passwrod = '123456';
const databasePassword = 'e10adc3949ba59abbe56e057f20f883e'
if (md5(passwrod) === databasePassword ) {
   console.log('密码通过');
}
```

**使用bcryptjs**

```
yarn add bcryptjs
yarn add -D @types/bcryptjs
```

同一密码，每次生成不一样的值

```js
import { compareSync, hashSync } from 'bcryptjs';

const passwrod = '123456';
const transformPass = hashSync(passwrod);  $2a$10$HgTA1GX8uxbocSQlbQ42/.Y2XnIL7FyfKzn6IC69IXveD6F9LiULS
const transformPass2 = hashSync(passwrod); $2a$10$mynd130vI1vkz4OQ3C.6FeYXGEq24KLUt1CsKN2WZqVsv0tPrtOcW
const transformPass3 = hashSync(passwrod); $2a$10$bOHdFQ4TKBrtcNgmduzD8esds04BoXc0JcrLme68rTeik7U96KBvu
```

验证密码：使用不同的值 匹配 密码123456，都能通过

```js
const password = '123456';
const databasePassword1 = '$2a$10$HgTA1GX8uxbocSQlbQ42/.Y2XnIL7FyfKzn6IC69IXveD6F9LiULS'
const databasePassword2 = '$2a$10$mynd130vI1vkz4OQ3C.6FeYXGEq24KLUt1CsKN2WZqVsv0tPrtOcW'
const databasePassword3 = '$2a$10$bOHdFQ4TKBrtcNgmduzD8esds04BoXc0JcrLme68rTeik7U96KBvu'

if (compareSync(password, databasePassword3)) {
   console.log('密码通过');
}
```

推荐使用`bcryptjs`，算法要比`md5`高级



## 角色权限

### RBAC

- > - RBAC是基于角色的权限访问控制（Role-Based Access Control）一种数据库设计思想，根据设计数据库设计方案，完成项目的权限管理
  >
  > - 在RBAC中，有3个基础组成部分，分别是：`用户`、`角色`和`权限`，权限与角色相关联，用户通过成为适当角色而得到这些角色的权限

- 权限：具备操作某个事务的能力
- 角色：一系列权限的集合

> 如：一般的管理系统中：
> 销售人员：仅仅可以查看商品信息
> 运营人员：可以查看，修改商品信息
> 管理人员：可以查看，修改，删除，以及修改员工权限等等
> 管理人员只要为每个员工账号分配对应的角色，登陆操作时就只能执行对应的权限或看到对应的页面

**权限类型**

- 展示（菜单），如：显示用户列表，显示删除按钮等等…
- 操作（功能），如：增删改查，上传下载，发布公告，发起活动等等…

**数据库设计**

> 数据库设计：可简单，可复杂，几个人使用的系统和几千人使用的系统是不一样的
> 小型项目：用户表，权限表
> 中型项目：用户表，角色表，权限表
> 大型项目：用户表，用户分组表，角色表，权限表，菜单表…

**没有角色的设计**

只有用户表，菜单表，两者是多对多关系，有一个关联表

**缺点：**

- 新建一个用户时，在用户表中添加一条数据
- 新建一个用户时，在关联表中添加N条数据
- 每次新建一个用户需要添加1+N(关联几个)条数据
- 如果有100个用户，每个用户100个权限，那需要添加10000条数据

### 基于RBAC的设计

用户表和角色表的关系设计：

> 如果你希望一个用户可以有多个角色，如：一个人即是销售总监，也是人事管理，就设计多对多关系
> 如果你希望一个用户只能有一个角色，就设计一对多，多对一关系

角色表和权限表的关系设计：

> 一个角色可以拥有多个权限，一个权限被多个角色使用，设计多对多关系

**多对多关系设计**

用户表与角色表是多对多关系，角色表与菜单表是多对多关系

![](https://s.poetries.work/uploads/2022/05/df5b0726d1260958.png)



**更加复杂的设计**

![](https://s.poetries.work/uploads/2022/05/58f62ca515da28df.png)

**实现流程**

1. 数据表设计
2. 实现角色的增删改查
3. 实现用户的增删改查，增加和修改用户的时候需要选择角色
4. 实现权限的增删改查
5. 实现角色与授权的关联
6. 判断当前登录的用户是否有访问菜单的权限
7. 根据当前登录账户的角色信息动态显示左侧菜单（前端）

**代码实现**

> 这里将实现一个用户，部门，角色，权限的例子：
> 用户通过成为部门的一员，则拥有部门普通角色的权限，还可以单独给用户设置角色，通过角色，获取权限。
> 权限模块包括，模块，菜单，操作，通过type区分类型，这里就不再拆分。

**关系总览：**

- 用户 - 部门：一对多关系，这里设计用户只能加入一个部门，如果设计可以加入多个部门，设计为多对多关系
- 用户 - 角色：多对多关系，可以给用户设置多个角色
- 角色 - 部门：多对多关系，一个部门多个角色
- 角色 - 权限：多对多关系，一个角色拥有多个权限，一个权限被多个角色使用

### 数据库实体设计

**用户**

```js
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RoleEntity } from '../../role/entities/role.entity';
import { DepartmentEntity } from '../../department/entities/department.entity';

@Entity({ name: 'user' })
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: false,
    unique: true,
  })
  username: string;

  @Column({
    type: 'varchar',
    name: 'password',
    length: 100,
    nullable: false,
    select: false,
    comment: '密码',
  })
  password: string;

  @ManyToMany(() => RoleEntity, (role) => role.users)
  @JoinTable({ name: 'user_role' })
  roles: RoleEntity[];

  @ManyToOne(() => DepartmentEntity, (department) => department.users)
  @JoinColumn({ name: 'department_id' })
  department: DepartmentEntity;
}
```

**角色**

```js
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UsersEntity } from '../../user/entities/user.entity';
import { DepartmentEntity } from '../../department/entities/department.entity';
import { AccessEntity } from '../../access/entities/access.entity';

@Entity({ name: 'role' })
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  rolename: string;

  @ManyToMany(() => UsersEntity, (user) => user.roles)
  users: UsersEntity[];

  @ManyToMany(() => DepartmentEntity, (department) => department.roles)
  department: DepartmentEntity[];

  @ManyToMany(() => AccessEntity, (access) => access.roles)
  @JoinTable({ name: 'role_access' })
  access: AccessEntity[];
}
```

**部门**

```js
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { UsersEntity } from '../../user/entities/user.entity';
import { RoleEntity } from '../../role/entities/role.entity';

@Entity({ name: 'department' })
export class DepartmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  departmentname: string;

  @OneToMany(() => UsersEntity, (user) => user.department)
  users: UsersEntity[];

  @ManyToMany(() => RoleEntity, (role) => role.department)
  @JoinTable({ name: 'department_role' })
  roles: RoleEntity[];
}
```

**权限**

```js
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Tree,
  TreeChildren,
  TreeParent,
  ManyToMany,
} from 'typeorm';
import { RoleEntity } from '../../role/entities/role.entity';

@Entity({ name: 'access' })
@Tree('closure-table')
export class AccessEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, comment: '模块' })
  module_name: string;

  @Column({ type: 'varchar', length: 30, nullable: true, comment: '操作' })
  action_name: string;

  @Column({ type: 'tinyint', comment: '类型：1:模块，2：菜单，3：操作' })
  type: number;

  @Column({ type: 'text', nullable: true, comment: '操作地址' })
  url: string;

  @TreeParent()
  parentCategory: AccessEntity;

  @TreeChildren()
  childCategorys: AccessEntity[];

  @ManyToMany(() => RoleEntity, (role) => role.access)
  roles: RoleEntity[];
}
```

### 接口实现

由于要实现很多接口，这里只说明一部分，其实都是数据库的操作，所有接口如下：

![](https://s.poetries.work/uploads/2022/05/ea6301b6c0da9373.png)

**根据用户的id获取信息**：id，用户名，部门名，角色，这些信息在做用户登陆时传递到token中。

> 这里设计的是：创建用户时，添加部门，就会成为部门的普通角色，也可单独设置角色，但不是每个用户都有单独的角色。

```js
async getUserinfoByUid(uid: number) {
	获取用户
    const user = await this.usersRepository.findOne(
      { id: uid },
      { relations: ['roles'] },
    );
    if (!user) ToolsService.fail('用户ID不存在');

    const sql = `
    select 
    user.id as user_id, user.username, user.department_id, department.departmentname, role.id as role_id, rolename
    from
    user, department, role, department_role as dr
    where 
    user.department_id = department.id
    and department.id = dr.departmentId
    and role.id = dr.roleId
    and user.id = ${uid}`;
    
    const result = await this.usersRepository.query(sql);
    const userinfo = result[0];
    
    const userObj = {
      user_id: userinfo.user_id,
      username: userinfo.username,
      department_id: userinfo.department_id,
      departmentname: userinfo.departmentname,
      roles: [{ id: userinfo.role_id, rolename: userinfo.rolename }],
    };

	// 如果用户的角色roles有值，证明单独设置了角色，所以需要拼接起来
    if (user.roles.length > 0) {
      const _user = JSON.parse(JSON.stringify(user));
      userObj.roles = [...userObj.roles, ..._user.roles];
    }
    return userObj;
}

// 接口请求结果：
{
    "status": 200,
    "message": "请求成功",
    "data": {
        "user_id": 1,
        "username": "admin",
        "department_id": 1,
        "departmentname": "销售部",
        "roles": [
            {
                "id": 1,
                "rolename": "销售部员工"
            },
            {
                "id": 5,
                "rolename": "admin"
            }
        ]
    }
}
```

**结合possport + jwt 做用户登陆授权验证**

> 在验证账户密码通过后，possport 返回用户，然后根据用户id获取用户信息，存储token，用于路由守卫，还可以使用redis存储，以作他用。

```js
async login(user: any): Promise<any> {
    const { id } = user;
    const userResult = await this.userService.getUserinfoByUid(id);
    const access_token = this.jwtService.sign(userResult);
    await this.redisService.set(`user-token-${id}`, access_token, 60 * 60 * 24);
    return { access_token };
}

{
    "status": 200,
    "message": "请求成功",
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwiZGVwYXJ0bWVudF9pZCI6MSwiZGVwYXJ0bWVudG5hbWUiOiLplIDllK7pg6giLCJyb2xlcyI6W3siaWQiOjEsInJvbGVuYW1lIjoi6ZSA5ZSu6YOo5ZGY5belIn0seyJpZCI6NSwicm9sZW5hbWUiOiJhZG1pbiJ9XSwiaWF0IjoxNjIxNjA1Nzg5LCJleHAiOjE2MjE2OTIxODl9.VIp0MdzSPM13eq1Bn8bB9Iu_SLKy4yoMU2N4uwgWDls"
    }
}
```

### **后端的权限访问**

> 使用守卫，装饰器，结合token，验证访问权限

**逻辑：**

- 第一步：在`controller`使用自定义守卫装饰接口路径，在请求该接口路径时，全部进入守卫逻辑
- 第二步：使用自定义装饰器装饰特定接口，传递角色，自定义守卫会使用反射器获取该值，以判断该用户是否有权限

如下：`findOne`接口使用了自定义装饰器装饰接口，意思是只能`admin`来访问

```js
import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../../common/guard/auth.guard';
import { Roles } from '../../common/decorator/role.decorator';

@UseGuards(AuthGuard)   // 自定义守卫
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async findAll() {
    const [data, count] = await this.userService.findAll();
    return { count, data };
  }

  @Get(':id')
  @Roles('admin')  // 自定义装饰器
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    return await this.userService.findOne(id);
  }
}
```

**装饰器**

```js
import { SetMetadata } from '@nestjs/common';

// SetMetadata作用：将获取到的值，设置到元数据中，然后守卫通过反射器才能获取到值
export const Roles = (...args: string[]) => SetMetadata('roles', args);
```

**自定义守卫**

> 返回`true`则有访问权限，返回`false`则直接报`403`

```js
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core'; // 反射器，作用与自定义装饰器桥接
import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) { }

  // 白名单数组
  private whiteUrlList: string[] = [];

  // 验证该次请求是否为白名单内的路由
  private isWhiteUrl(urlList: string[], url: string): boolean {
    if (urlList.includes(url)) {
      return true;
    }
    return false;
  }

  canActivate(context: ExecutionContext): boolean {
    // 获取请求对象
    const request = context.switchToHttp().getRequest();

    // 验证是否是白名单内的路由
    if (this.isWhiteUrl(this.whiteUrlList, request.url)) return true;

    // 获取请求头中的token字段，解析获取存储在token的用户信息
    const token = context.switchToRpc().getData().headers.token;
    const user: any = this.jwtService.decode(token);
    if (!user) ToolsService.fail('token获取失败，请传递token或书写正确');

    // 使用反射器，配合装饰器使用，获取装饰器传递过来的数据
    const authRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    // 如果没有使用roles装饰，就获取不到值，就不鉴权，等于白名单
    if (!authRoles) return true;

    // 如果用户的所属角色与装饰器传递过来的值匹配则通过，否则不通过
    const userRoles = user.roles;
    for (let i = 0; i < userRoles.length; i++) {
      if (authRoles.includes(userRoles[i].rolename)) {
        return true;
      }
    }
    return false;
  }
}
```

**简单测试**

> 两个用户，分别对应不同的角色，分别请求user的findOne接口
> 用户1：销售部员工和admin
> 用户2：人事部员工

```
用户1：销售部员工和admin
{
    "status": 200,
    "message": "请求成功",
    "data": {
        "user_id": 1,
        "username": "admin",
        "department_id": 1,
        "departmentname": "销售部",
        "roles": [
            {
                "id": 1,
                "rolename": "销售部员工"
            },
            {
                "id": 5,
                "rolename": "admin"
            }
        ]
    }
}

用户2：人事部员工
{
    "status": 200,
    "message": "请求成功",
    "data": {
        "user_id": 2,
        "username": "admin2",
        "department_id": 2,
        "departmentname": "人事部",
        "roles": [
            {
                "id": 3,
                "rolename": "人事部员工"
            }
        ]
    }
}


不出意外的话：2号用户的请求结果
{
    "status": 403,
    "message": "Forbidden resource",
    "error": "Forbidden",
    "path": "/user/1",
    "timestamp": "2021-05-21T14:44:04.954Z"
}
```

> 前端的权限访问则是通过权限表url和type来处理

## 定时任务

nest如何开启定时任务？

**定时任务场景**

> 每天定时更新，定时发送邮件

没有controller，因为定时任务是自动完成的

```
yarn add @nestjs/schedule
```

```js
// src/tasks/task.module.ts
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Module({
  providers: [TasksService],
})
export class TasksModule {}
```

在这里编写你的定时任务

```js
// src/tasks/task.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')  每隔45秒执行一次
  handleCron() {
    this.logger.debug('Called when the second is 45');
  }

  @Interval(10000)  每隔10秒执行一次
  handleInterval() {
    this.logger.debug('Called every 10 seconds');
  }

  @Timeout(5000)  5秒只执行一次
  handleTimeout() {
    this.logger.debug('Called once after 5 seconds');
  }
}
```

自定义定时时间

```js
* * * * * * 分别对应的意思：
第1个星：秒
第2个星：分钟
第3个星：小时
第4个星：一个月中的第几天
第5个星：月
第6个星：一个星期中的第几天

如：
45 * * * * *：每隔45秒执行一次
```

**挂载-使用**

```js
// app.module.ts

import { TasksModule } from './tasks/task.module';
import { ScheduleModule } from '@nestjs/schedule';

imports: [
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    ScheduleModule.forRoot(),
    TasksModule,
  ],
```



## 接入Swagger接口文档

- 优点：不用写接口文档，在线生成，自动生成，可操作数据库，完美配合`dto`
- 缺点：多一些代码，显得有点乱，习惯就好

```
yarn add @nestjs/swagger swagger-ui-express -D
```

```js
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  // 创建实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 创建接口文档服务
  const options = new DocumentBuilder()
    .addBearerAuth() // token认证，输入token才可以访问文档
    .setTitle('接口文档')
    .setDescription('接口文档介绍') // 文档介绍
    .addServer('http://localhost:9000', '开发环境')
    .addServer('https://test.com/release', '正式环境')
    .setVersion('1.0.0') // 文档版本
    .setContact('poetry', '', 'test@qq.com')
    .build();
  // 为了创建完整的文档（具有定义的HTTP路由），我们使用类的createDocument()方法SwaggerModule。此方法带有两个参数，分别是应用程序实例和基本Swagger选项。
  const document = SwaggerModule.createDocument(app, options, {
    extraModels: [], // 这里导入模型
  });
  // 启动swagger
  SwaggerModule.setup('api-docs', app, document); // 访问路径 http://localhost:9000/api-docs
  
  // 启动端口
  const PORT = process.env.PORT || 9000;
  await app.listen(PORT, () =>
    Logger.log(`服务已经启动 http://localhost:${PORT}`),
  );
}
bootstrap();
```



**swagger装饰器**

https://swagger.io/

```js
@ApiTags('user')   // 设置模块接口的分类，不设置默认分配到default
@ApiOperation({ summary: '标题', description: '详细描述'})  // 单个接口描述

// 传参
@ApiQuery({ name: 'limit', required: true})    // query参数
@ApiQuery({ name: 'role', enum: UserRole })    // query参数
@ApiParam({ name: 'id' })      // parma参数
@ApiBody({ type: UserCreateDTO, description: '输入用户名和密码' })   // 请求体

// 响应
@ApiResponse({
    status: 200,
    description: '成功返回200，失败返回400',
    type: UserCreateDTO,
})

// 验证
@ApiProperty({ example: 'Kitty', description: 'The name of the Cat' })
name: string;
```

在`controller`引入`@nestjs/swagger`， 并配置`@ApiBody() `和 `@ApiParam() `不写也是可以的

```js
user.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
@ApiTags('user')  // 设置分类
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post()
  @ApiOperation({ summary: '创建用户', description: '创建用户' })  // 该接口
  @HttpCode(HttpStatus.OK)
  async create(@Body() user: CreateUserDto) {
    return await this.userService.create(user);
  }

  @Get()
  @ApiOperation({ summary: '查找全部用户', description: '创建用户' })
  @ApiQuery({ name: 'limit', required: true })  请求参数
  @ApiQuery({ name: 'offset', required: true }) 请求参数
  async findAll(@Query() query) {
    console.log(query);
    const [data, count] = await this.userService.findAll(query);
    return { count, data };
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查找用户' })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    return await this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiBody({ type: UpdateUserDto, description: '参数可选' })  请求体
  @ApiResponse({   响应示例
    status: 200,
    description: '成功返回200，失败返回400',
    type: UpdateUserDto,
  })
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() user: UpdateUserDto,
  ) {
    return await this.userService.update(id, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id', new ParseIntPipe()) id: number) {
    return await this.userService.remove(id);
  }
}
```

**编写dto，引入@nestjs/swagger**

创建

```js
import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'kitty', description: '用户名' })  添加这里即可
  @IsNotEmpty({ message: '用户名不能为空' })
  username: string;

  @ApiProperty({ example: '12345678', description: '密码' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, {
    message: '密码长度不能小于6位',
  })
  @MaxLength(20, {
    message: '密码长度不能超过20位',
  })
  password: string;
}
```

更新

```js
import {
  IsEnum,
  MinLength,
  MaxLength,
  IsOptional,
  ValidateIf,
  IsEmail,
  IsMobilePhone,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({ description: '用户名', example: 'kitty', required: false })  不是必选的
  @IsOptional()
  username: string;

  @ApiProperty({ description: '密码', example: '12345678', required: false })
  @IsOptional()
  @MinLength(6, {
    message: '密码长度不能小于6位',
  })
  @MaxLength(20, {
    message: '密码长度不能超过20位',
  })
  password: string;

  @ApiProperty({
    description: '邮箱',
    example: 'llovenest@163.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式错误' })
  @ValidateIf((o) => o.username === 'admin')
  email: string;

  @ApiProperty({
    description: '手机号码',
    example: '13866668888',
    required: false,
  })
  @IsOptional()
  @IsMobilePhone('zh-CN', {}, { message: '手机号码格式错误' })
  mobile: string;

  @ApiProperty({
    description: '性别',
    example: 'female',
    required: false,
    enum: ['male', 'female'],
  })
  @IsOptional()
  @IsEnum(['male', 'female'], {
    message: 'gender只能传入字符串male或female',
  })
  gender: string;

  @ApiProperty({
    description: '状态',
    example: 1,
    required: false,
    enum: [0, 1],
  })
  @IsOptional()
  @IsEnum(
    { 禁用: 0, 可用: 1 },
    {
      message: 'status只能传入数字0或1',
    },
  )
  @Type(() => Number)
  status: number;
}
```

打开：localhost:3000/api-docs，开始测试接口

![](https://s.poetries.work/uploads/2022/05/dd04126877af210f.png)

![](https://s.poetries.work/uploads/2022/05/98f40271e2f2ed11.png)

# 数据库

## nest连接Mongodb

mac中，直接使用`brew install mongodb-community`安装MongoDB，然后启动服务`brew services start mongodb-community` 查看服务已经启动`ps aux | grep mongo`

> Nestjs中操作Mongodb数据库可以使用Nodejs封装的DB库，也可以使用Mongoose。

```js
// https://docs.nestjs.com/techniques/mongodb

npm install --save @nestjs/mongoose mongoose
npm install --save-dev @types/mongoose
```

**在app.module.ts中配置数据库连接**

```js
// app.module.ts
import { ConfigModule, ConfigService } from 'nestjs-config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongodbModule } from '../examples/mongodb/mongodb.module';

@Module({
  imports: [
    // 加载配置文件目录
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    
    // mongodb
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) =>
        configService.get('mongodb'),
      inject: [ConfigService],
    }),
    MongodbModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {}
```

```js
// mongodb配置
// src/config/mongodb.ts

export default {
  uri: 'mongodb://localhost:27017/nest', // 指定nest数据库
};
```



**配置Schema**

```js
// article.schema
import * as mongoose from 'mongoose';
export const ArticleSchema = new mongoose.Schema({
  title: String,
  content:String,
  author: String,
  status: Number,
});
```

**在控制器对应的Module中配置Model**

```js
// mongodb.module.ts
import { Module } from '@nestjs/common';
import { MongodbService } from './mongodb.service';
import { MongodbController } from './mongodb.controller';
import { ArticleSchema } from './schemas/article.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Article', // schema名称对应
        schema: ArticleSchema, // 引入的schema
        collection: 'article', // 数据库名称
      },
    ]),
  ],
  controllers: [MongodbController],
  providers: [MongodbService],
})
export class MongodbModule {}
```

**在服务里面使用@InjectModel 获取数据库Model实现操作数据库**

```js
// mongodb.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class MongodbService {
  // 注入模型
  constructor(@InjectModel('Article') private readonly articleModel) {}

  async findAll() {
    return await this.articleModel.find().exec();
  }

  async findById(id) {
    return await this.articleModel.findById(id);
  }

  async create(body) {
    return await this.articleModel.create(body);
  }

  async update(body) {
    const { id, ...params } = body;
    return await this.articleModel.findByIdAndUpdate(id, params);
  }

  async delete(id) {
    return await this.articleModel.findByIdAndDelete(id);
  }
}
```

浏览器测试 http://localhost:9000/api/mongodb/list

![](https://s.poetries.work/uploads/2022/05/e14c1f5173139807.png)

## typeORM操作Mysql数据库

mac中，直接使用`brew install mysql`安装mysql，然后启动服务`brew services start mysql` 查看服务已经启动`ps aux | grep mysql`

Nest 操作Mysql官方文档：https://docs.nestjs.com/techniques/database

```
npm install --save @nestjs/typeorm typeorm mysql
```

**配置数据库连接地址**

```js
// src/config/typeorm.ts

const { MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } =
  process.env;

const config = {
  type: 'mysql',
  host: MYSQL_HOST,
  port: MYSQL_PORT,
  username: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  synchronize: process.env.NODE_ENV !== 'production', // 生产环境不要开启
  autoLoadEntities: true, // 如果为true,将自动加载实体(默认：false)
  keepConnectionAlive: true, // 如果为true，在应用程序关闭后连接不会关闭（默认：false)
  retryDelay: 3000, // 两次重试连接的间隔(ms)（默认：3000）
  retryAttempts: 10, // 重试连接数据库的次数（默认：10）
  dateStrings: 'DATETIME', // 转化为时间
  timezone: '+0800', // +HHMM -HHMM
  // 自动需要导入模型
  entities: ['dist/**/*.entity{.ts,.js}'],
};

export default config;
```

```js
// app.module.ts中配置
import { resolve, join } from 'path';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    // 加载配置文件目录
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),

    // 连接mysql数据库
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => config.get('typeorm'),
      inject: [ConfigService],
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {}
```



**配置实体entity**

```js
// photo.entity.ts

import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PostsEntity } from './post.entity';

@Entity('photo')
export class PhotoEntity {
  // @PrimaryGeneratedColumn()
  // id: number; // 标记为主列，值自动生成
  @PrimaryGeneratedColumn('uuid')
  id: string; // 该值将使用uuid自动生成

  @Column({ length: 50 })
  url: string;

  // 多对一关系，多个图片对应一篇文章
  @ManyToMany(() => PostsEntity, (post) => post.photos)
  posts: PostsEntity;
}
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PhotoEntity } from './photo.entity';

export type UserRoleType = 'admin' | 'editor' | 'ghost';
export type postStatus = 1 | 2 | 3;

// mysql的列类型: type
/**
 * int, tinyint, smallint, mediumint, bigint, float, double, dec, decimal,
 * numeric, date, datetime, timestamp, time, year, char, varchar, nvarchar,
 * text, tinytext, mediumtext, blob, longtext, tinyblob, mediumblob, longblob, enum,
 * json, binary, geometry, point, linestring, polygon, multipoint, multilinestring,
 * multipolygon, geometrycollection
 */
/**
 * ColumnOptions中可用选项列表：
 * length: number - 列类型的长度。 例如，如果要创建varchar（150）类型，请指定列类型和长度选项。
  width: number - 列类型的显示范围。 仅用于MySQL integer types(opens new window)
  onUpdate: string - ON UPDATE触发器。 仅用于 MySQL (opens new window).
  nullable: boolean - 在数据库中使列NULL或NOT NULL。 默认情况下，列是nullable：false。
  update: boolean - 指示"save"操作是否更新列值。如果为false，则只能在第一次插入对象时编写该值。 默认值为"true"。
  select: boolean - 定义在进行查询时是否默认隐藏此列。 设置为false时，列数据不会显示标准查询。 默认情况下，列是select：true
  default: string - 添加数据库级列的DEFAULT值。
  primary: boolean - 将列标记为主要列。 使用方式和@ PrimaryColumn相同。
  unique: boolean - 将列标记为唯一列（创建唯一约束）。
  comment: string - 数据库列备注，并非所有数据库类型都支持。
  precision: number - 十进制（精确数字）列的精度（仅适用于十进制列），这是为值存储的最大位数。仅用于某些列类型。
  scale: number - 十进制（精确数字）列的比例（仅适用于十进制列），表示小数点右侧的位数，且不得大于精度。 仅用于某些列类型。
  zerofill: boolean - 将ZEROFILL属性设置为数字列。 仅在 MySQL 中使用。 如果是true，MySQL 会自动将UNSIGNED属性添加到此列。
  unsigned: boolean - 将UNSIGNED属性设置为数字列。 仅在 MySQL 中使用。
  charset: string - 定义列字符集。 并非所有数据库类型都支持。
  collation: string - 定义列排序规则。
  enum: string[]|AnyEnum - 在enum列类型中使用，以指定允许的枚举值列表。 你也可以指定数组或指定枚举类。
  asExpression: string - 生成的列表达式。 仅在MySQL (opens new window)中使用。
  generatedType: "VIRTUAL"|"STORED" - 生成的列类型。 仅在MySQL (opens new window)中使用。
  hstoreType: "object"|"string" -返回HSTORE列类型。 以字符串或对象的形式返回值。 仅在Postgres中使用。
  array: boolean - 用于可以是数组的 postgres 列类型（例如 int []）
  transformer: { from(value: DatabaseType): EntityType, to(value: EntityType): DatabaseType } - 用于将任意类型EntityType的属性编组为数据库支持的类型DatabaseType。
  注意：大多数列选项都是特定于 RDBMS 的，并且在MongoDB中不可用
 */

@Entity('posts')
export class PostsEntity {
  // @PrimaryGeneratedColumn()
  // id: number; // 标记为主列，值自动生成
  @PrimaryGeneratedColumn('uuid')
  id: string; // 该值将使用uuid自动生成

  @Column({ length: 50 })
  title: string;

  @Column({ length: 18 })
  author: string;

  @Column({ type: 'longtext', default: null })
  content: string;

  @Column({ default: null })
  cover_url: string;

  @Column({ default: 0 })
  type: number;

  @Column({ type: 'text', default: null })
  remark: string;

  @Column({
    type: 'enum',
    enum: [1, 2, 3],
    default: 1,
  })
  status: postStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  create_time: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  update_time: Date;

  @Column({
    type: 'enum',
    enum: ['admin', 'editor', 'ghost'],
    default: 'ghost',
    select: false, // 定义在进行查询时是否默认隐藏此列
  })
  role: UserRoleType;

  // 一对多关系，一篇文章对应多个图片
  // 在service中查询使用 .find({relations: ['photos]}) 查询文章对应的图片
  @OneToMany(() => PhotoEntity, (photo) => photo.posts)
  photos: [];
}
```

**参数校验**

Nest 与 [class-validator](https://github.com/pleerock/class-validator) 配合得很好。这个优秀的库允许您使用基于装饰器的验证。装饰器的功能非常强大，尤其是与 Nest 的 Pipe 功能相结合使用时，因为我们可以通过访问 `metatype` 信息做很多事情，在开始之前需要安装一些依赖。

```
npm i --save class-validator class-transformer
```

```js
// posts.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: '文章标题必填' })
  readonly title: string;

  @IsNotEmpty({ message: '缺少作者信息' })
  readonly author: string;

  readonly content: string;

  readonly cover_url: string;

  @IsNotEmpty({ message: '缺少文章类型' })
  readonly type: number;

  readonly remark: string;
}
```

**在控制器对应的Module中配置Model**

```js
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsEntity } from './entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostsEntity])],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
```

**在服务里面使用@InjectRepository获取数据库Model实现操作数据库**

```js
// posts.services.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, Between, Equal, Like, In } from 'typeorm';
import * as dayjs from 'dayjs';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsEntity } from './entities/post.entity';
import { PostsRo } from './interfaces/posts.interface';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostsEntity)
    private readonly postsRepository: Repository<PostsEntity>,
  ) {}

  async create(post: CreatePostDto) {
    const { title } = post;
    const doc = await this.postsRepository.findOne({ where: { title } });
    console.log('doc', doc);
    if (doc) {
      throw new HttpException('文章标题已存在', HttpStatus.BAD_REQUEST);
    }
    return {
      data: await this.postsRepository.save(post),
      message: '创建成功',
    };
  }

  // 分页查询列表
  async findAll(query = {} as any) {
    // eslint-disable-next-line prefer-const
    let { pageSize, pageNum, orderBy, sort, ...params } = query;
    orderBy = query.orderBy || 'create_time';
    sort = query.sort || 'DESC';
    pageSize = Number(query.pageSize || 10);
    pageNum = Number(query.pageNum || 1);
    console.log('query', query);

    const queryParams = {} as any;
    Object.keys(params).forEach((key) => {
      if (params[key]) {
        queryParams[key] = Like(`%${params[key]}%`); // 所有字段支持模糊查询、%%之间不能有空格
      }
    });
    const qb = await this.postsRepository.createQueryBuilder('post');

    // qb.where({ status: In([2, 3]) });
    qb.where(queryParams);
    // qb.select(['post.title', 'post.content']); // 查询部分字段返回
    qb.orderBy(`post.${orderBy}`, sort);
    qb.skip(pageSize * (pageNum - 1));
    qb.take(pageSize);

    return {
      list: await qb.getMany(),
      totalNum: await qb.getCount(), // 按条件查询的数量
      total: await this.postsRepository.count(), // 总的数量
      pageSize,
      pageNum,
    };
  }

  // 根据ID查询详情
  async findById(id: string): Promise<PostsEntity> {
    return await this.postsRepository.findOne({ where: { id } });
  }

  // 更新
  async update(id: string, updatePostDto: UpdatePostDto) {
    const existRecord = await this.postsRepository.findOne({ where: { id } });
    if (!existRecord) {
      throw new HttpException(`id为${id}的文章不存在`, HttpStatus.BAD_REQUEST);
    }
    // updatePostDto覆盖existRecord 合并，可以更新单个字段
    const updatePost = this.postsRepository.merge(existRecord, {
      ...updatePostDto,
      update_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    });
    return {
      data: await this.postsRepository.save(updatePost),
      message: '更新成功',
    };
  }

  // 删除
  async remove(id: string) {
    const existPost = await this.postsRepository.findOne({ where: { id } });
    if (!existPost) {
      throw new HttpException(`文章ID ${id} 不存在`, HttpStatus.BAD_REQUEST);
    }
    await this.postsRepository.remove(existPost);
    return {
      data: { id },
      message: '删除成功',
    };
  }
}
```



## nest统一处理数据库操作的查询结果

> 操作数据库时，如何做异常处异常？ 比如id不存在，用户名已经存在？如何统一处理请求失败和请求成功？

**处理方式**：

- 在nest中，一般是在**service**中处理异常，如果有异常，直接抛出错误，由**过滤器**捕获，统一格式返回，如果成功，service把结果返回，controller直接return结果即可，由**拦截器**捕获，统一格式返回
- 失败：过滤器统一处理
- 成功：拦截器统一处理
- 当然你也可以在`controller`处理

```js
// user.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }
  @Post()
  @HttpCode(HttpStatus.OK) //创建成功返回的是201状态码，这里重置为200，需要用到的可以使用HttpCode设置
  async create(@Body() user) {
    return await this.userService.create(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }
}
```

```js
// user.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>
  ) { }

  async create(user) {
    const { username } = user;
    const result = await this.usersRepository.findOne({ username });
    if (result) {  //如果用户名已经存在，抛出错误
      throw new HttpException(
        { message: '请求失败', error: '用户名已存在' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.usersRepository.save(user);
  }

  async findOne(id: string) {
    const result = await this.usersRepository.findOne(id);
    if (!result) { //如果用户id不存在，抛出错误
      throw new HttpException(
        { message: '请求失败', error: '用户id不存在' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return result;
  }
}
```

> 可以将`HttpException`再简单封装一下，或者使用继承，这样代码更简洁一些

```js
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class ToolsService {
  static fail(error, status = HttpStatus.BAD_REQUEST) {
    throw new HttpException(
      {
        message: '请求失败',
        error: error,
      },
      status,
    );
  }
}
```

**简洁代码**

```js
// user.service.ts

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './entities/user.entity';
import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>
  ) { }

  async create(user) {
    const { username } = user;
    const result = await this.usersRepository.findOne({ username });
    if (result) ToolsService.fail('用户名已存在');
    return await this.usersRepository.save(user);
  }

  async findOne(id: string) {
    const result = await this.usersRepository.findOne(id);
    if (!result) ToolsService.fail('用户id不存在');
    return result;
  }
}
```

**全局使用filter过滤器**

```js
// src/common/filters/http-execption.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionRes: any = exception.getResponse();
    const { error, message } = exceptionRes;

    const msgLog = {
      status,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(msgLog);
  }
}
```

**全局使用interceptor拦截器**

```js
// src/common/inteptors/transform.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return {
          status: 200,
          message: '请求成功',
          data: data,
        };
      }),
    );
  }
}
```

```js
// main.ts
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // 创建实例
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  // 全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  // 启动端口
  const PORT = process.env.PORT || 9000;
  await app.listen(PORT, () =>
    Logger.log(`服务已经启动 http://localhost:${PORT}`),
  );
}
bootstrap();
```

失败

![](https://s.poetries.work/uploads/2022/05/fe6da80fe7b316ce.png)

成功

![](https://s.poetries.work/uploads/2022/05/e0c55c5a0e22af66.png)

## 数据库实体设计与操作

> typeorm的数据库实体如何编写？
> 数据库实体的监听装饰器如何使用？

### 实体设计

简单例子：下面讲解

```js
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn} from "typeorm";

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn()
    id: number;         // 默认是int(11)类型

    @Column()
    username: string;   // 默认是varchar(255)类型

    @Column()
    password: string;
   
    @Column()
    status: boolean;
   
    @CreateDateColumn()
    created_at:date;
       
    @UpdateDateColumn()
    updated_at:date;

	@DeleteDateColumn()
    deleted_at:date;
}
```

**装饰器说明**

- `Entity`    实体声明，程序运行时，自动创建的数据库表，`@Entity({ name: 'users' })`， `name`则是给该表命名，否则自动命名
- `PrimaryColumn`   设置主键，没有自增
- `PrimaryGeneratedColumn`    设置主键和自增，一般是`id`
- `Column`   设置数据库列字段，在下面说明
- `CreateDateColumn`          创建时间，自动填写
- `UpdateDateColumn`          更新时间，自动填写
- `DeleteDateColumn`          删除时间，自动填写

**列字段参数**

```js
// 写法：
@Column("int")
@Column("varchar", { length: 200 })
@Column({ type: "int", length: 200 })  // 一般采用这种


// 常用选项参数：
@Column({
    type: 'varchar',   //  列的数据类型，参考mysql
    name: 'password',   // 数据库表中的列名，string，如果和装饰的字段是一样的可以不指定
    length: 30,         // 列类型的长度，number
    nullable: false,    // 是否允许为空，boolean，默认值是false
    select：false,      // 查询数据库时是否显示该字段，boolean，默认值是true，密码一般使用false
    comment: '密码'     // 数据库注释，stirng
})
password:string;

@Column({
    type:'varchar',  
    unique: true,      // 将列标记为唯一列，唯一约束，比如账号不能有相同的
})
username:string;

@Column({
    type:'tinyint',  
    default: () => 1,  // 默认值，创建时自动填写的值
    comment: '0：禁用，1：可用'
})
status:number;

@Column({
    type: 'enum',
    enum: ['male', 'female'],   // 枚举类型，只能是数组中的值
    default: 'male'   默认值          
})
gender:string;
```

**完整例子**

```js
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: false,
    unique: true, 
  })
  username: string;

  @Column({
    type: 'varchar',
    name: 'password', 
    length: 100,
    nullable: false, 
    select: false,
    comment: '密码',
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 11,
    select: false,
    nullable: true,
    comment: '手机号码',
  })
  mobile: string;

  @Column({
    type: 'varchar',
    length: 50,
    select: false,
    nullable: true,
    comment: '邮箱',
  })
  email: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female'], 
    default: 'male',
  })
  gender: string;

  @Column({
    type: 'tinyint',
    default: () => 1,
    comment: '0：禁用，1：可用',
  })
  status: number;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
    name: 'deleted_at',
    comment: '删除时间',
  })
  deletedAt: Date;
}
```

![](https://s.poetries.work/uploads/2022/05/648cf1e9823e51c1.png)

### **抽离部分重复的字段：使用继承**

> `baseEntity`：将id，创建时间，更新时间，删除时间抽离成`BaseEntity`

```js
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity()
export class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp',
    nullable: false,
    name: 'deleted_at',
    comment: '删除时间',
  })
  deletedAt: Date;
}
```

`users`表继承自`baseEntity`，就不需要写创建时间，修改时间，自增`ID`等重复字段了。其他的表也可以继承自`baseEntity`，减少重复代码

```js
import { Column,Entity } from 'typeorm';
import { BaseEntity } from './user.baseEntity';

@Entity({ name: 'users' })
export class UsersEntity extends BaseEntity {  // 继承
  @Column({
    type: 'varchar',
    length: 30,
    nullable: false,
    unique: true, 
  })
  username: string;

  @Column({
    type: 'varchar',
    name: 'password', 
    length: 100,
    nullable: false, 
    select: false,
    comment: '密码',
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 11,
    select: false,
    nullable: true,
    comment: '手机号码',
  })
  mobile: string;

  @Column({
    type: 'varchar',
    length: 50,
    select: false,
    nullable: true,
    comment: '邮箱',
  })
  email: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female'], 
    default: 'male',
  })
  gender: string;

  @Column({
    type: 'tinyint',
    default: () => 1,
    comment: '0：禁用，1：可用',
  })
  status: number;
}
```

### **实体监听装饰器**

- 其实是typeorm在操作数据库时的生命周期，可以更方便的操作数据
- 查找后：`@AfterLoad`
- 插入前：`@BeforeInsert`
- 插入后：`@AfterInsert`
- 更新前：`@BeforeUpdate`
- 更新后：`@AfterUpdate`
- 删除前：`@BeforeRemove`

> `AfterLoad`例子：其他的装饰器是一样的用法

```js
import {
  Column,
  Entity,
  AfterLoad,
} from 'typeorm';


@Entity({ name: 'users' })
export class UsersEntity extends BaseEntity {

  // 查找后，如果age小于20，让age = 20
  @AfterLoad()    // 装饰器固定写
  load() {        // 函数名字随你定义
    console.log('this', this);
    if (this.age < 20) {
      this.age = 20;
    }
  }

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'tinyint',
    default: () => 18,
  })
  age: number;
}


// 使用生命周期前是18，查找后就变成了20
{
    "status": 200,
    "message": "请求成功",
    "data": {
        "id": 1,
        "username": "admin",
        "age": 20,
    }
}
```

## typeorm增删改查操作

> 访问数据库的方式有哪些？
> typeorm增删改查操作的方式有哪些？

### **多种访问数据库的方式**

第一种：`Connection`

```js
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { UsersEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly connection: Connection,
  ) { }

  async test() {
    // 使用封装好方法：
    return await this.connection
      .getRepository(UsersEntity)
      .findOne({ where: { id: 1 } });

	// 使用createQueryBuilder：
    return await this.connection
      .createQueryBuilder()
      .select('user')
      .from(UsersEntity, 'user')
      .where('user.id = :id', { id: 1 })
      .getOne();
  }
}
```

第二种：`Repository`，需要`@nestjs/typeorm`的`InjectRepository`来注入实体

```js
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
  	@InjectRepository(UsersEntity)  注入实体
	private readonly usersRepository: Repository<UsersEntity>,
  ) { }

  async test() {
  	// 使用封装好方法：
    return await this.usersRepository.find({ where: { id: 1 } });

	// 使用createQueryBuilder：
    return await this.usersRepository
      .createQueryBuilder('user')
      .where('id = :id', { id: 1 })
      .getOne();
  }
}
```

第三种：`getConnection()`：语法糖，是`Connection`类型

```js
import { Injectable } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { UsersEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  async test() {
  	// 使用封装好方法：
    return await getConnection()
      .getRepository(UsersEntity)
      .find({ where: { id: 1 } });

	// 使用createQueryBuilder：
    return await getConnection()
      .createQueryBuilder()
      .select('user')
      .from(UsersEntity, 'user')
      .where('user.id = :id', { id: 1 })
      .getOne();
  }
}
```

第四种：`getRepository`：语法糖

```js
import { Injectable } from '@nestjs/common';
import { getRepository } from 'typeorm';
import { UsersEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  async test() {
  // 使用封装好方法：
    return await getRepository(UsersEntity).find({ where: { id: 1 } });

	// 使用createQueryBuilder：
    return await getRepository(UsersEntity)
      .createQueryBuilder('user')
      .where('user.id = :id', { id: 1 })
      .getOne();
  }
}
```

第五种：`getManager`

```js
import { Injectable } from '@nestjs/common';
import { getManager } from 'typeorm';
import { UsersEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  async test() {
  // 使用封装好方法：
    return await getManager().find(UsersEntity, { where: { id: 1 } });

	// 使用createQueryBuilder：
	return await getManager()
      .createQueryBuilder(UsersEntity, 'user')
      .where('user.id = :id', { id: 1 })
      .getOne();
  }
}
```

**简单总结**

使用的方式太多，建议使用：`2，4`，比较方便

**Connection核心类：**

- `connection`                           等于`getConnection`
- `connection.manager`                   等于`getManager`， 等于`getConnection.manager`
- `connection.getRepository`             等于`getRepository`， 等于`getManager.getRepository`
- `connection.createQueryBuilder`        使用`QueryBuilder`
- `connection.createQueryRunner`         开启事务


1. `EntityManager` 和 `Repository`都封装了操作数据的方法，注意：两者的使用方式是不一样的，（实在不明白搞这么多方法做什么，学得头大）
`getManager`是`EntityManager`的类型，`getRepository`是`Repository`的类型
2. 都可以使用`createQueryBuilder`，但使用的方式略有不同

### **增删改查的三种方式**

- 第一种：使用sql语句，适用于sql语句熟练的同学
- 第二种：`typeorm`封装好的方法，增删改 + 简单查询
- 第三种：`QueryBuilder`查询生成器，适用于关系查询，多表查询，复杂查询
- 其实底层最终都会生成`sql`语句，只是封装了几种方式而已，方便人们使用。

**第一种：sql语句**

```js
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) { }

  async findAll() {
    return await this.usersRepository.query('select * from users');  // 在query中填写sql语句
  }
}
```

**第二种：typeorm封装好的api方法**

这里使用第二种访问数据库的方式

```js
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) { }

  async findAll() {
    return await this.usersRepository.findAndCount();  // 封装好的方法
  }
}
```

**api方法**

```js
增
save(user)            创建：返回该数据的所有字段
insert(user)          快速插入一条数据，插入成功：返回插入实体，与save方法不同的是，它不执行级联、关系和其他操作。
删
remove(user)          删除：返回该数据的可见字段
softRemove(user);     拉黑：返回该数据的可见字段，该删除实体必须拥有@DeleteDateColumn()字段，被拉黑的用户还存在数据库中，但无法被find查找到，会在@DeleteDateColumn()字段中添加删除时间，可使用recover恢复
改
update(id, user)      更新：返回更新实体，不是该数据的字段
恢复
recover({ id })       恢复：返回id，将被softRemove删除（拉黑）的用户恢复，恢复成功后可以被find查找到


查找全部
find()
find({id:9})                   条件查找，写法一，找不到返回空对象
find({where:{id:10}})          条件查找，写法二，找不到返回空对象
findAndCount()                 返回数据和总的条数

查找一个
findOne(id);                       根据ID查找，找不到返回undefined
findOne({ where: { username } });  条件查找，找不到返回undefined

根据ID查找一个或多个
findByIds([1,2,3]);            查找n个，全部查找不到返回空数组，找到就返回找到的

其他
hasId(new UsersEntity())       检测实体是否有合成ID，返回布尔值
getId(new UsersEntity())       获取实体的合成ID，获取不到返回undefined
create({username: 'admin12345', password: '123456',})  创建一个实体，需要调用save保存
count({ status: 1 })           计数，返回数量，无返回0
increment({ id }, 'age', 2);   增加，给条件为id的数据的age字段增加2，成功返回改变实体
decrement({ id }, 'age', 2)    减少，给条件为id的数据的age字段增加2，成功返回改变实体

谨用
findOneOrFail(id)              找不到直接报500错误，无法使用过滤器拦截错误，不要使用
clear()                        清空该数据表，谨用！！！
```

**find更多参数**

```js
this.userRepository.find({
    select: ["firstName", "lastName"],             要的字段
    relations: ["photos", "videos"],               关系查询
    where: {                                       条件查询
        firstName: "Timber",
        lastName: "Saw"
    },
    where: [{ username: "li" }, { username: "joy" }],   多个条件or, 等于：where username = 'li' or username = 'joy'
    order: {                                       排序
        name: "ASC",
        id: "DESC"
    },
    skip: 5,                                       偏移量
    take: 10,                                      每页条数
    cache: 60000                                   启用缓存：1分钟
});
```

**find进阶选项**

TypeORM 提供了许多内置运算符，可用于创建更复杂的查询

```js
import { Not, Between, In } from "typeorm";
return await this.usersRepository.find({
    username: Not('admin'),
});
将执行以下查询：
SELECT * FROM "users" WHERE "username" != 'admin'


return await this.usersRepository.find({
    likes: Between(1, 10)
});
SELECT * FROM "users" WHERE "likes" BETWEEN 1 AND 10


return await this.usersRepository.find({
    username: In(['admin', 'admin2']),
});
SELECT * FROM "users" WHERE "title" IN ('admin', 'admin2')
```

[更多查看官网](https://typeorm.biunav.com/zh/find-options.html#%E8%BF%9B%E9%98%B6%E9%80%89%E9%A1%B9)

**第三种**：`QueryBuilder`查询生成器

使用链式操作

**QueryBuilder增，删，改**

```js
// 增加
return await this.usersRepository
  .createQueryBuilder()
  .insert()                       声明插入操作
  .into(UsersEntity)              插入的实体
  .values([                       插入的值，可插入多个
    { username: 'Timber', password: '123456' },
    { username: 'Timber2', password: '123456' },
  ])
  .execute();                     执行


// 修改
return this.usersRepository
  .createQueryBuilder()
  .update(UsersEntity)
  .set({ username: 'admin22' })
  .where('id = :id', { id: 2 })
  .execute();


// 删除
return this.usersRepository
  .createQueryBuilder()
  .delete()
  .from(UsersEntity)
  .where('id = :id', { id: 8 })
  .execute();


// 处理异常：请求成功会返回一个对象， 如果raw.affectedRows != 0 就是成功
"raw": {
      "fieldCount": 0,
      "affectedRows": 2,
      "insertId": 13,
      "serverStatus": 2,
      "warningCount": 0,
      "message": "&Records: 2  Duplicates: 0  Warnings: 0",
      "protocol41": true,
      "changedRows": 0
}
```

**查询**

简单例子

```js
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
  ) { }

  async findAll() {
    return await this.usersRepository
    .createQueryBuilder('user')                      创建生成器，参数：别名
    .where('user.id = :id', { id: id })              条件
    .innerJoinAndSelect('user.avatar', 'avatar')     关系查询
    .addSelect('user.password')                      添加显示字段
    .getOne();                                       获取一条数据
  }
}
```

**QueryBuilder查询生成器说明**

查询单表

```js
访问数据库的方式不同：

方式一：没有指定实体，需要使用from指定实体
return await getConnection()
      .createQueryBuilder()
      .select('user.username')             ‘user’：全部字段，‘user.username’：只获取username
      .from(UsersEntity, 'user')           参1：连接的实体， 参2：别名
      .where('user.id = :id', { id: 1 })
      .getOne();

方式二：指定实体：默认获取全部字段
return await getConnection()
      .createQueryBuilder(UsersEntity, 'user')   指定实体
      .where('user.id = :id', { id: 1 })
      .getOne();

方式三： 已经在访问时指定了实体：默认获取全部字段
return await this.usersRepository
      .createQueryBuilder('user')          别名
      .where('user.id = :id', { id: 1 })
      .getOne();
```

获取结果

```js
.getSql();          获取实际执行的sql语句，用于开发时检查问题
.getOne();          获取一条数据（经过typeorm的字段处理）
.getMany();         获取多条数据
.getRawOne();       获取一条原数据（没有经过typeorm的字段处理）
.getRawMany();      获取多条原数据
.stream();          返回流数据

如：经过typeorm的字段处理，获取到的就是实体设计时的字段
{
    "status": 200,
    "message": "请求成功",
    "data": {
        "id": 1,
        "username": "admin",
        "gender": "male",
        "age": 18,
        "status": 1,
        "createdAt": "2021-04-26T09:58:54.469Z",
        "updatedAt": "2021-04-28T14:47:36.000Z",
        "deletedAt": null
    }
}

如：没有经过typeorm的字段处理，将数据库的字段原生不动的显示出来
{
    "status": 200,
    "message": "请求成功",
    "data": {
        "user_id": 1,
        "user_username": "admin",
        "user_gender": "male",
        "user_age": 18,
        "user_status": 1,
        "user_created_at": "2021-04-26T09:58:54.469Z",
        "user_updated_at": "2021-04-28T14:47:36.000Z",
        "user_deleted_at": null
    }
}
```

查询部分字段

```js
.select(["user.id", "user.name"])
实际执行的sql语句：SELECT user.id, user.name FROM users user；

添加隐藏字段：实体中设置select为false时，是不显示字段，使用addSelect会将字段显示出来
.addSelect('user.password')
```

`where`条件

```js
.where("user.name = :name", { name: "joy" })
等于
.where("user.name = :name")
.setParameter("name", "Timber")
实际执行的sql语句：SELECT * FROM users user WHERE user.name = 'joy'

多个条件
.where("user.firstName = :firstName", { firstName: "Timber" })
.andWhere("user.lastName = :lastName", { lastName: "Saw" });
实际执行的sql语句：SELECT * FROM users user WHERE user.firstName = 'Timber' AND user.lastName = 'Saw'

in
.where("user.name IN (:...names)", { names: [ "Timber", "Cristal", "Lina" ] })
实际执行的sql语句：SELECT * FROM users user WHERE user.name IN ('Timber', 'Cristal', 'Lina')

or
.where("user.firstName = :firstName", { firstName: "Timber" })
.orWhere("user.lastName = :lastName", { lastName: "Saw" });
实际执行的sql语句：SELECT * FROM users user WHERE user.firstName = 'Timber' OR user.lastName = 'Saw'

子句
const posts = await connection
  .getRepository(Post)
  .createQueryBuilder("post")
  .where(qb => {
    const subQuery = qb
      .subQuery()
      .select("user.name")
      .from(User, "user")
      .where("user.registered = :registered")
      .getQuery();
    return "post.title IN " + subQuery;
  })
  .setParameter("registered", true)
  .getMany();
实际执行的sql语句：select * from post where post.title in (select name from user where registered = true)
```

`having`筛选

```js
.having("user.firstName = :firstName", { firstName: "Timber" })
.andHaving("user.lastName = :lastName", { lastName: "Saw" });
实际执行的sql语句：SELECT ... FROM users user HAVING user.firstName = 'Timber' AND user.lastName = 'Saw'
```

`orderBy`排序

```js
.orderBy("user.name", "DESC")
.addOrderBy("user.id", "asc");
等于
.orderBy({
  "user.name": "ASC",
  "user.id": "DESC"
});

实际执行的sql语句：SELECT * FROM users user order by user.name asc, user.id desc;
```

`group`分组

```js
.groupBy("user.name")
.addGroupBy("user.id");
```

关系查询（多表）

```js
1参：你要加载的关系，2参：可选，你为此表分配的别名，3参：可选，查询条件

左关联查询
.leftJoinAndSelect("user.profile", "profile")     

右关联查询
.rightJoinAndSelect("user.profile", "profile")    

内联查询
.innerJoinAndSelect("user.photos", "photo", "photo.isRemoved = :isRemoved", { isRemoved: false })         


例子：
const result = await this.usersRepository
	.createQueryBuilder('user')
    .leftJoinAndSelect("user.photos", "photo")
    .where("user.name = :name", { name: "joy" })
  	.andWhere("photo.isRemoved = :isRemoved", { isRemoved: false })
  	.getOne();

实际执行的sql语句：
SELECT user.*, photo.* 
FROM users user
LEFT JOIN photos photo ON photo.user = user.id
WHERE user.name = 'joy' AND photo.isRemoved = FALSE;


const result = await this.usersRepository
	.innerJoinAndSelect("user.photos", "photo", "photo.isRemoved = :isRemoved", { isRemoved: false })
    .where("user.name = :name", { name: "Timber" })
    .getOne();

实际执行的sql语句：
SELECT user.*, photo.* FROM users user
INNER JOIN photos photo ON photo.user = user.id AND photo.isRemoved = FALSE
WHERE user.name = 'Timber'；


多个关联
const result = await this.usersRepository
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.profile", "profile")
  .leftJoinAndSelect("user.photos", "photo")
  .leftJoinAndSelect("user.videos", "video")
  .getOne();
```

## typeorm使用事务的3种方式

`typeorm`使用事务的方式有哪些？如何使用？

**事务**

> - 在操作多个表时，或者多个操作时，如果有一个操作失败，所有的操作都失败，要么全部成功，要么全部失
> - **解决问题**：在多表操作时，因为各种异常导致一个成功，一个失败的数据错误。

> 例子：银行转账
> 如果用户1向用户2转了100元，但因为各种原因，用户2没有收到，如果没有事务处理，用户1扣除的100元就凭空消失了
> 如果有事务处理，只有用户2收到100元，用户1才会扣除100元，如果没有收到，则不会扣除。

**应用场景**

> 多表的增，删，改操作

**nest-typrorm事务的使用方式**

1. 使用装饰器，在`controller`中编写，传递给`service`使用
2. 使用`getManager` 或 `getConnection`，在`service`中编写与使用
3. 使用`connection` 或 `getConnection`，开启`queryRunner`，在`service`中编写与使用

**方式一：使用装饰器**

controller

```js
import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Transaction, TransactionManager, EntityManager } from 'typeorm';  开启事务第一步：引入
import { UserService } from './user.service-oto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post(':id')
  @Transaction() 开启事务第二步：装饰接口
  async create(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,  开启事务第三步：获取事务管理器
  ) {
    return await this.userService.create(id, maneger);  开启事务第四步：传递给service，使用数据库时调用
  }
}
```

service

- 这里处理的是1对1关系：保存头像地址到`avatar`表，同时关联保存用户的`id`
- 如果你不会1对1关系，请先去学习对应的知识

![](https://s.poetries.work/uploads/2022/05/24be5e00069ab400.png)

```js
import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersEntity } from './entities/user.entity';
import { AvatarEntity } from './entities/avatar.entity';
import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(AvatarEntity)
    private readonly avatarRepository: Repository<AvatarEntity>,
  ) { }

  async create(id: number, manager: EntityManager) {
    const urlObj = {
      url: `http://www.dmyxs.com/images/${id}.png`,
    };
    const user = await this.usersRepository.findOne({ id });                 先查找用户，因为要保存用户的id
    if (!user) ToolsService.fail('用户id不存在');                              找不到用户抛出异常
    
    const avatarEntity = this.avatarRepository.create({ url: urlObj.url });  创建头像地址的实体
    const avatarUrl = await manager.save(avatarEntity);                      使用事务保存副表
    user.avatar = avatarUrl;                                                 主表和副表建立关系
    await manager.save(user);                                                使用事务保存主表
    return '新增成功';                                                        如果过程出错，不会保存
  }
}
```

**方式二：使用getManager 或 getConnection**

service

```js
import { Injectable } from '@nestjs/common';
import { Connection, Repository, getManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './entities/user.entity';
import { AvatarEntity } from './entities/avatar.entity';
import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    private readonly connection: Connection,
  ) { }

  async test(id: string) {
    const urlObj = {
      url: `http://www.dmyxs.com/images/${id}.png`,
    };
    const user = await this.usersRepository.findOne(id);                        先查找用户
    if (!user) ToolsService.fail('用户id不存在');                                 找不到用户抛出异常

	//getConnection的方式：await getConnection().transaction(manager=> {});
	//getManager的方式：
    const result = await getManager().transaction(async (manager) => {
      const avatarEntity = manager.create(AvatarEntity, { url: urlObj.url });   创建头像地址的实体
      const avatarUrl = await manager.save(AvatarEntity, avatarEntity);         使用事务保存副表
      user.avatar = avatarUrl;                                                  创建关联
      return await manager.save(UsersEntity, user);                             使用事务保存主表，并返回结果
    });
    return result;
  }
}

{
    "status": 200,
    "message": "请求成功",
    "data": {
        "id": 1,
        "createdAt": "2021-04-26T09:58:54.469Z",
        "updatedAt": "2021-04-28T14:47:36.000Z",
        "deletedAt": null,
        "username": "admin",
        "gender": "male",
        "age": 18,
        "status": 1,
        "avatar": {
            "url": "http://www.dmyxs.com/images/1.png",
            "id": 52
        }
    }
}
```

**方式三：使用 connection 或 getConnection**

service

```js
import { Injectable } from '@nestjs/common';
import { Connection, Repository, getManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './entities/user.entity';
import { AvatarEntity } from './entities/avatar.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    private readonly connection: Connection,
  ) { }

  async test(id: string) {
    const urlObj = {
      url: `http://www.test.com/images/${id}.png`,
    };
    const user = await this.usersRepository.findOne(id);         先查找用户
    if (!user) ToolsService.fail('用户id不存在');                 找不到用户抛出异常

    const queryRunner = this.connection.createQueryRunner();     获取连接并创建新的queryRunner
    await queryRunner.connect();                                 使用我们的新queryRunner建立真正的数据库连
    await queryRunner.startTransaction();                        开始事务

    const avatarEntity = new AvatarEntity();                     创建实体：要保存的数据
    avatarEntity.url = urlObj.url;

    try {
      const result = await queryRunner.manager                  使用事务保存到副表
        .getRepository(AvatarEntity)
        .save(avatarEntity);

      user.avatar = result;                                     主表和副表建立连接
 
      const userResult = await queryRunner.manager              使用事务保存到副表
        .getRepository(UsersEntity)
        .save(user);

      await queryRunner.commitTransaction();                   提交事务
      return userResult;                                       返回结果
    } catch (error) {
      console.log('创建失败，取消事务');
      await queryRunner.rollbackTransaction();                 出错回滚
    } finally {
      await queryRunner.release();                             释放
    }
  }
}
```

## typeorm 一对一关系设计与增删改查

实体如何设计一对一关系？如何增删改查？

**一对一关系**

> - 定义：一对一是一种 A 只包含一个 B ，而 B 只包含一个 A 的关系
> - 其实就是要设计两个表：一张是主表，一张是副表，查找主表时，关联查找副表
> - 有外键的表称之为副表，不带外键的表称之为主表
> - 如：一个账户对应一个用户信息，主表是账户，副表是用户信息
> - 如：一个用户对应一张用户头像图片，主表是用户信息，副表是头像地址

**一对一实体设计**

主表：

>- 使用`@OneToOne()` 来建立关系
>- 第一个参数：`() => AvatarEntity`， 和谁建立关系？ 和`AvatarEntity`建立关系
>- 第二个参数：`(avatar) => avatar.user)`，和哪个字段联立关系？ `avatar`就是`AvatarEntity`的别名，可随便写，和`AvatarEntity`的`userinfo`字段建立关系
>- 第三个参数：`RelationOptions`关系选项

```js
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { AvatarEntity } from './avatar.entity';

@Entity({ name: 'users' })
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @OneToOne(() => AvatarEntity, (avatar) => avatar.userinfo)
  avatar: AvatarEntity;
}
```

副表

> 参数：同主表一样
> 主要：根据`@JoinColumn({ name: ‘user_id’ })`来分辨副表，`name`是设置数据库的外键名字，如果不设置是`userId`

```js
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UsersEntity } from './user.entity';

@Entity({ name: 'avatar' })
export class AvatarEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  url: string;

  @OneToOne(() => UsersEntity, (user) => user.avatar)
  @JoinColumn({ name: 'userinfo_id' })
  userinfo: UsersEntity;
}
```

**一对一增删改查**

> - **注意**：只要涉及两种表操作的，就需要开启事务：同时失败或同时成功，避免数据不统一
> - **在这里**：创建，修改，删除都开启了事务
> - **注意**：所有数据应该是由前端传递过来的，这里为了方便，直接硬编码了（写死）

```js
// user.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { Transaction, TransactionManager, EntityManager } from 'typeorm';  开启事务第一步：引入
import { UserService } from './user.service-oto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async findAll() {
    const [data, count] = await this.userService.findAll();
    return { count, data };
  }

  @Get(':id')
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    return await this.userService.findOne(id);
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @Transaction() 开启事务第二步：装饰接口
  async create(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,  开启事务第三步：获取事务管理器
  ) {
    return await this.userService.create(id, maneger);  开启事务第四步：传递给service，使用数据库时调用
  }

  @Patch(':id')
  @Transaction()
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,
  ) {
    return await this.userService.update(id, maneger);
  }

  @Delete(':id')
  @Transaction()
  async remove(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,
  ) {
    return await this.userService.remove(id, maneger);
  }
}
```

```js
// user.service.ts

import { Injectable } from '@nestjs/common';
import { Repository, Connection, UpdateResult, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersEntity } from './entities/user.entity';
import { AvatarEntity } from './entities/avatar.entity';
import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(AvatarEntity)
    private readonly avatarRepository: Repository<AvatarEntity>,
    private connection: Connection,
  ) { }

  一对一增删改查
  查找全部
  async findAll() {
    使用封装好的方式
    // return await this.usersRepository.findAndCount({ relations: ['avatar'] });

	使用QueryBuilder的方式
    const list = await this.usersRepository
      .createQueryBuilder('UsersEntity')
      .leftJoinAndSelect('UsersEntity.avatar', 'AvatarEntity.userinfo')
      .getManyAndCount();
    return list;
  }

  根据主表id查找一对一
  async findOne(id: number) {
    const result = await this.usersRepository.findOne(id, {
      relations: ['avatar'],
    });
    if (!result) ToolsService.fail('用户id不存在');
    return result;
  }

  根据主表id创建一对一
  async create(id: number, manager: EntityManager) {
    const urlObj = {
      url: `http://www.dmyxs.com/images/${id}.png`,
    };
    const user = await this.usersRepository.findOne({ id });      先查找用户
    if (!user) ToolsService.fail('用户id不存在');                  如果没找到，抛出错误，由过滤器捕获错误
    
    创建实体的两种方式：new 和 create，new的方式方便条件判断
    创建实体方式一：
    const avatarEntity = this.avatarRepository.create({ url: urlObj.url });  创建实体

	创建实体方式二：
	//const avatarEntity = new AvatarEntity();
	//avatarEntity.url = urlObj.url;
	
    const avatarUrl = await manager.save(avatarEntity);          使用事务保存副表
    user.avatar = avatarUrl;                                     主表和副表建立关系
    await manager.save(user);                                    使用事务保存主表
    return '新增成功';                                            如果过程出错，不会保存
  }

  根据主表id更改一对一
  要更改的副表id，会从前端传递过来
  async update(id: number, manager: EntityManager) {
    const urlObj = {
      id: 18,
      url: `http://www.dmyxs.com/images/${id}-update.jpg`,
    };
    
    const user = await this.usersRepository.findOne( { id } );       先查找用户
    if (!user) ToolsService.fail('用户id不存在');                      如果没找到id抛出错误，由过滤器捕获错误
    
    const avatarEntity = this.avatarRepository.create({ url: urlObj.url });    创建要修改的实体

	使用事务更新方法：1参：要修改的表，2参：要修改的id， 3参：要更新的数据
    await manager.update(AvatarEntity, urlObj.id, avatarEntity);   
    return '更新成功';
  }

  根据主表id删除一对一
  async remove(id: number, manager: EntityManager): Promise<any> {
    const user = await this.usersRepository.findOne(id);
    if (!user) ToolsService.fail('用户id不存在');

    只删副表的关联数据
    await manager.delete(AvatarEntity, { user: id });
    
    如果连主表用户一起删，加下面这行代码
    //await manager.delete(UsersEntity, id);
    return '删除成功';
  }
}
```

## typeorm 一对多和多对一关系设计与增删改查

实体如何设计一对多与多对一关系，如何关联查询

**一对多关系，多对一关系**

> 定义：一对多是一种一个 A 包含多个 B ，而多个B只属于一个 A 的关系
> 其实就是要设计两个表：一张是主表（一对多），一张是副表（多对一），查找主表时，关联查找副表
> 有外键的表称之为副表，不带外键的表称之为主表
> 如：一个用户拥有多个宠物，多个宠物只属于一个用户的（每个宠物只能有一个主人）
> 如：一个用户拥有多张照片，多张照片只属于一个用户的
> 如：一个角色拥有多个用户，多个用户只属于一个角色的（每个用户只能有一个角色）

**一对多和多对一实体设计**

一对多

> 使用`@OneToMany() `来建立一对多关系
> 第一个参数：`() => PhotoEntity`， 和谁建立关系？ 和`PhotoEntity`建立关系
> 第二个参数：`(user) => user.photo`，和哪个字段联立关系？ `user`就是`PhotoEntity`的别名，可随便写，和`PhotoEntity`的`userinfo`字段建立关系
> 第三个参数：`RelationOptions`关系选项

```js
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
} from 'typeorm';
import { AvatarEntity } from './avatar.entity';

@Entity({ name: 'users' })
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @OneToMany(() => PhotoEntity, (avatar) => avatar.userinfo)
  photos: PhotoEntity;
}
```

多对一

> 使用`@ManyToOne() `来建立多对一关系，参数如同上

```js
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { UsersEntity } from './user.entity';

@Entity({ name: 'photo' })
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  url: string;

  @ManyToOne(() => UsersEntity, (user) => user.photos)
  @JoinColumn({ name: 'userinfo_id' })
  userinfo: UsersEntity;
}
```

**一对多和多对一增删改查**

> 只要涉及两种表操作的，就需要开启事务：同时失败或同时成功，避免数据不统一
> 注意：所有数据应该是由前端传递过来的，这里为了方便，直接硬编码了（写死）
> 比较复杂的是更新操作

user.controller.ts

```js
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { Transaction, TransactionManager, EntityManager } from 'typeorm';  开启事务第一步：引入
import { UserService } from './user.service-oto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async findAll() {
    const [data, count] = await this.userService.findAll();
    return { count, data };
  }

  @Get(':id')
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    return await this.userService.findOne(id);
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @Transaction() 开启事务第二步：装饰接口
  async create(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,  开启事务第三步：获取事务管理器
  ) {
    return await this.userService.create(id, maneger);  开启事务第四步：传递给service，使用数据库时调用
  }

  @Patch(':id')
  @Transaction()
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,
  ) {
    return await this.userService.update(id, maneger);
  }

  @Delete(':id')
  @Transaction()
  async remove(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,
  ) {
    return await this.userService.remove(id, maneger);
  }
}
```

user.service.ts

**令人头大的地方**：建立关系和查找使用实体，删除使用实体的id，感觉设计得不是很合理，违背人的常识

```js
import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersEntity } from './entities/user.entity';
import { PhotoEntity } from './entities/photo.entity';

import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(PhotoEntity)
    private readonly photoRepository: Repository<PhotoEntity>,
  ) { }

  一对多增删改查
  async findAll() {
    // return await this.usersRepository.findAndCount({ relations: ['photos'] });

    const list = await this.usersRepository
      .createQueryBuilder('UsersEntity')
      .leftJoinAndSelect('UsersEntity.photos', 'PhotoEntity.userinfo')
      .getManyAndCount();
    return list;
  }

  根据主表id查找一对多
  async findOne(id: number) {
    查询一个用户有多少张照片（一对多）
    const result = await this.usersRepository.findOne(id, {
      relations: ['photos'],
    });
    if (!result) ToolsService.fail('用户id不存在');
    return result;

    查询这张照片属于谁（多对一）
    // const result = await this.photoRepository.findOne(id, {
    //   relations: ['userinfo'],
    // });
    // if (!result) ToolsService.fail('图片id不存在');
    // return result;
  }

  根据主表id创建一对多
  async create(id: number, manager: EntityManager) {
    const urlList = [
      {
        url: `http://www.dmyxs.com/images/${id}.png`,
      },
      {
        url: `http://www.dmyxs.com/images/${id}.jpg`,
      },
    ];
    const user = await this.usersRepository.findOne({ id });
    if (!user) ToolsService.fail('用户id不存在');

	遍历传递过来的数据
    if (urlList.length !== 0) {
		for (let i = 0; i < urlList.length; i++) {
	       创建实体的两种方式：new 和 create，new的方式方便条件判断
	       // const photo = new PhotoEntity();
	       // photo.url = urlList[i].url;
	       // photo.user = user;
	       // await manager.save(PhotoEntity, photo);
	
	       const photoEntity = this.photoRepository.create({
	         url: urlList[i].url,
	         userinfo: user,  注意：这里是使用实体建立关系，而不是实体id
	       });
	       await manager.save(photoEntity);
	    }
    }
    return '新增成功';
  }

  根据主表id更改一对多
  示例：删除一张，修改一张(修改的有id)，新增一张
  先使用创建，创建两张photo
  async update(id: number, manager: EntityManager) {
    const urlList = [
      {
        id: 22,
        url: `http://www.dmyxs.com/images/${id}-update.png`,
      },
      {
        url: `http://www.dmyxs.com/images/${id}-create.jpeg`,
      },
    ];
    const user = await this.usersRepository.findOne({ id });
    if (!user) ToolsService.fail('用户id不存在');
    
    如果要修改主表，先修改主表用户信息，后修改副表图片信息
    修改主表
    const userEntity = this.usersRepository.create({
      id,
      username: 'admin7',
      password: '123456',
    });
    await manager.save(userEntity);

    修改副表
    如果前端附带了图片list
    if (urlList.length !== 0) {
      查询数据库已经有的图片
      const databasePhotos = await manager.find(PhotoEntity, { userinfo: user });
      
      如果有数据，则进行循环判断，先删除多余的数据
      if (databasePhotos.length >= 1) {
        for (let i = 0; i < databasePhotos.length; i++) {
        
          以用户传递的图片为基准，数据库的图片id是否在用户传递过来的表里，如果不在，就是要删除的数据
          const exist = urlList.find((item) => item.id === databasePhotos[i].id);
          
          if (!exist) {
            await manager.delete(PhotoEntity, { id: databasePhotos[i].id });
          }
        }
      }

      否则就是新增和更改的数据
      for (let i = 0; i < urlList.length; i++) {
        const photoEntity = new PhotoEntity();
        photoEntity.url = urlList[i].url;
        
        如果有id则是修改操作，因为前端传递的数据是从服务端获取的，会附带id，新增的没有
        if (!!urlList[i].id) {
        
          修改则让id关联即可
          photoEntity.id = urlList[i].id;
          await manager.save(PhotoEntity, photoEntity);
        } else {
        
          否则是新增操作,关联用户实体
          photoEntity.userinfo = user;
          await manager.save(PhotoEntity, photoEntity);
        }
      }
    } else {
      如果前端把图片全部删除，删除所有关联的图片
      await manager.delete(PhotoEntity, { userinfo: id });
    }
    return '更新成功';
  }

  根据主表id删除一对多
  async remove(id: number, manager: EntityManager): Promise<any> {
    const user = await this.usersRepository.findOne(id);
    if (!user) ToolsService.fail('用户id不存在');

    只删副表的关联数据
    await manager.delete(PhotoEntity, { userinfo: id });
    如果连主表用户一起删，加下面这行代码
    //await manager.delete(UsersEntity, id);
    return '删除成功';
  }
}
```



## typeorm 多对多关系设计与增删改查

> 实体如何设计多对多关系？如何增删改查？

**多对多关系**

> 定义：多对多是一种 A 包含多个 B，而 B 包含多个 A 的关系
> 如：一个粉丝可以关注多个主播，一个主播可以有多个粉丝
> 如：一篇文章属于多个分类，一个分类下有多篇文章
> 比如这篇文章，可以放在nest目录，也可以放在typeorm目录或者mysql目录

**实现方式**

> 第一种：建立两张表，使用装饰器`@ManyToMany`建立关系，`typeorm`会自动生成三张表
> 第二种：手动建立3张表

这里使用第一种

### **实体设计**

这里将设计一个用户（粉丝） 与 明星的 多对多关系

用户（粉丝）可以主动关注明星，让`users`变为主表，加入`@JoinTable()`

> 使用`@ManyToMany()` 来建立多对多关系
> 第一个参数：`() => StarEntity`， 和谁建立关系？ 和`StarEntity`建立关系
> 第二个参数：`(star) => star.photo`，和哪个字段联立关系？ `star`就是`StarEntity`的别名，可随便写，和`PhotoEntity`的`followers`字段建立关系

用户（粉丝）表：follows关注/跟随

```js
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AvatarEntity } from './avatar.entity';

@Entity({ name: 'users' })
export class UsersEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @ManyToMany(() => StarEntity, (star) => star.followers)
  @JoinTable()
  follows: StarEntity[]; 注意这里是数组类型
}
```

明星表：followers跟随者

```js
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { UsersEntity } from './user.entity';

@Entity({ name: 'star' })
export class StarEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @ManyToMany(() => UsersEntity, (user) => user.follows)
  followers: UsersEntity;
}
```

**注意：**

> 程序运行后，将会默认在数据库中生成三张表，users，star，users_follows_star，users_follows_star是中间表，用于记录users和star之间的多对多关系，它是自动生成的。

为了测试方便，你可以在users表和star表创建一些数据：这些属于单表操作
![](https://s.poetries.work/uploads/2022/05/f9afb65f660699e8.png)

### **多对多增删改查**

> 只要涉及两种表操作的，就需要开启事务：同时失败或同时成功，避免数据不统一
注意：所有数据应该是由前端传递过来的，这里为了方便，直接硬编码了（写死）

user.controller.ts

```js
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { Transaction, TransactionManager, EntityManager } from 'typeorm';  开启事务第一步：引入
import { UserService } from './user.service-oto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async findAll() {
    const [data, count] = await this.userService.findAll();
    return { count, data };
  }

  @Get(':id')
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    return await this.userService.findOne(id);
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @Transaction() 开启事务第二步：装饰接口
  async create(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,  开启事务第三步：获取事务管理器
  ) {
    return await this.userService.create(id, maneger);  开启事务第四步：传递给service，使用数据库时调用
  }

  @Patch(':id')
  @Transaction()
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,
  ) {
    return await this.userService.update(id, maneger);
  }

  @Delete(':id')
  @Transaction()
  async remove(
    @Param('id', new ParseIntPipe()) id: number,
    @TransactionManager() maneger: EntityManager,
  ) {
    return await this.userService.remove(id, maneger);
  }
}
```

user.service.ts

```js
import { Injectable } from '@nestjs/common';
import { Repository, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { UsersEntity } from './entities/user.entity';
import { StarEntity } from './entities/star.entity';

import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(StarEntity)
    private readonly starRepository: Repository<StarEntity>,
  ) { }

  一对多增删改查
  async findAll() {
    // return await this.usersRepository.findAndCount({ relations: ['follows'] });

    const list = await this.usersRepository
      .createQueryBuilder('UsersEntity')
      .leftJoinAndSelect('UsersEntity.follows', 'StarEntity.followers')
      .getManyAndCount();
    return list;
  }

  根据主表id查找多对多
  async findOne(id: number) {
    查询一个用户关注了哪些明星
    // const result = await this.usersRepository.findOne(id, {
    //   relations: ['follows'],
    // });
    // if (!result) ToolsService.fail('用户id不存在');
    // return result;

    查询一个明星有多少粉丝
    const result = await this.starRepository.findOne(id, {
      relations: ['followers'],
    });
    if (!result) ToolsService.fail('明星id不存在');
    return result;
  }

  根据主表id创建多对多
  粉丝关注明星
  async create(id: number, manager: EntityManager) {
  	要关注的明星id数组
    const willFollow = [3, 4];
    const user = await this.usersRepository.findOne({ id });
    if (!user) ToolsService.fail('用户id不存在');

    if (willFollow.length !== 0) {
      const followList = [];
      for (let i = 0; i < willFollow.length; i++) {
        const star = await manager.findOne(StarEntity, {
          id: willFollow[i],
        });
        if (!star) ToolsService.fail('主播id不存在');
        followList.push(star);
      }

      const userEntity = new UsersEntity();
      重点：
      不指定id是创建新的用户，还需要填写username和password等必填的字段
      指定id就是更新某些字段：只关注明星，不创建新的用户，同样可用于修改
      userEntity.id = id; 
      userEntity.follows = followList; 建立关联，数据表会自动更新
      await manager.save(userEntity);
    }
    return '新增成功';
  }

  根据主表id更改多对多
  假设：某用户关注了id为[3, 4]的明星, 现在修改为只关注[2]
  逻辑和创建一样
  async update(id: number, manager: EntityManager) {
    const willFollow = [2];
    const user = await this.usersRepository.findOne({ id });
    if (!user) ToolsService.fail('用户id不存在');

    if (willFollow.length !== 0) {
      const followList = [];
      for (let i = 0; i < willFollow.length; i++) {
        const listOne = await manager.findOne(StarEntity, {
          id: willFollow[i],
        });
        if (!listOne) ToolsService.fail('主播id不存在');
        followList.push(listOne);
      }

      const userEntity = new UsersEntity();
      userEntity.id = id;
      userEntity.follows = followList;
      await manager.save(userEntity);
    }
    return '更新成功';
  }

  根据主表id删除多对多
  多种删除
  async remove(id: number, manager: EntityManager): Promise<any> {
    const user = await this.usersRepository.findOne(id, {
      relations: ['follows'],
    });
    if (!user) ToolsService.fail('用户id不存在');

    根据id删除一个：取消关注某个明星，明星id应由前端传递过来，这里写死
    需要获取当前用户的的follows，使用关系查询
    const willDeleteId = 2;
    if (user.follows.length !== 0) {
      过滤掉要删除的数据，再重新赋值
      const followList = user.follows.filter((star) => star.id != willDeleteId);
      const userEntity = new UsersEntity();
      userEntity.id = id;
      userEntity.follows = followList;
      await manager.save(userEntity);
    }

    全部删除关联数据，不删用户
    // const userEntity = new UsersEntity();
    // userEntity.id = id;
    // userEntity.follows = [];
    // await manager.save(userEntity);

    如果连用户一起删，会将关联数据一起删除
    // await manager.delete(UsersEntity, id);
    return '删除成功';
  }
}
```



## nest连接Redis

> Redis 字符串数据类型的相关命令用于管理 redis 字符串值

- 查看所有的key:  `keys *`
- 普通设置： `set key value`
- 设置并加过期时间：`set key value EX 30` 表示30秒后过期
- 获取数据： `get key`
- 删除指定数据：`del key`
- 删除全部数据: `flushall`
- 查看类型：`type key`
- 设置过期时间: `expire key  20` 表示指定的`key5`秒后过期

> Redis列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边）

- 列表右侧增加值：`rpush key value`
- 列表左侧增加值：`lpush key value`
- 右侧删除值：`rpop key`
- 左侧删除值： `lpop key`
- 获取数据： `lrange key`
- 删除指定数据：`del key`
- 删除全部数据: `flushall`
- 查看类型： `type key`

> Redis 的 Set 是 String 类型的无序集合。集合成员是唯一的，这就意味着集合中不能出现重复的数据。它和列表的最主要区别就是没法增加重复值

- 给集合增数据：`sadd key value`
- 删除集合中的一个值：`srem key value`
- 获取数据：`smembers key`
- 删除指定数据： `del key`
- 删除全部数据:  `flushall`

> Redis hash 是一个string类型的field和value的映射表，hash特别适合用于存储对象。

- 设置值hmset ：`hmset zhangsan name "张三" age 20  sex “男”`
- 设置值hset ： `hset zhangsan name "张三"`
- 获取数据：`hgetall key`
- 删除指定数据：`del key`
- 删除全部数据:  `flushall`

> Redis 发布订阅(pub/sub)是一种消息通信模式：发送者(pub)发送消息，订阅者(sub)接收消息

```js
// 发布
client.publish('publish', 'message from publish.js');

// 订阅
client.subscribe('publish');
client.on('message', function(channel, msg){
console.log('client.on message, channel:', channel, ' message:', msg);
});
```

**Nestjs中使用redis**

> Nestjs Redis 官方文档：https://github.com/kyknow/nestjs-redis

```
npm install nestjs-redis --save
```

如果是nest8需要注意该问题：https://github.com/skunight/nestjs-redis/issues/82

```js
// app.modules.ts
import { RedisModule } from 'nestjs-redis';
import { RedisTestModule } from '../examples/redis-test/redis-test.module';

@Module({
  imports: [
    // 加载配置文件目录
    ConfigModule.load(resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    // redis连接
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.get('redis'),
      inject: [ConfigService],
    }),
    RedisTestModule,
  ],
  controllers: [],
  providers: [ ],
})
export class AppModule implements NestModule {}
```

```js
// src/config/redis.ts 配置
export default {
  host: '127.0.0.1',
  port: 6379,
  db: 0,
  password: '',
  keyPrefix: '',
  onClientReady: (client) => {
    client.on('error', (err) => {
      console.log('-----redis error-----', err);
    });
  },
};
```

**创建一个cache.service.ts 服务 封装操作redis的方法**

```js
// src/common/cache.service.ts 
import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';

@Injectable()
export class CacheService {
  public client;
  constructor(private redisService: RedisService) {
    this.getClient();
  }
  async getClient() {
    this.client = await this.redisService.getClient();
  }

  //设置值的方法
  async set(key: string, value: any, seconds?: number) {
    value = JSON.stringify(value);
    if (!this.client) {
      await this.getClient();
    }
    if (!seconds) {
      await this.client.set(key, value);
    } else {
      await this.client.set(key, value, 'EX', seconds);
    }
  }

  //获取值的方法
  async get(key: string) {
    if (!this.client) {
      await this.getClient();
    }
    const data = await this.client.get(key);
    if (!data) return;
    return JSON.parse(data);
  }

  // 根据key删除redis缓存数据
  async del(key: string): Promise<any> {
    if (!this.client) {
      await this.getClient();
    }
    await this.client.del(key);
  }

  // 清空redis的缓存
  async flushall(): Promise<any> {
    if (!this.client) {
      await this.getClient();
    }
    await this.client.flushall();
  }
}
```

> 使用redis服务

**redis-test.controller**

```js
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CacheService } from 'src/common/cache/redis.service';

@Controller('redis-test')
export class RedisTestController {
  // 注入redis服务
  constructor(private readonly cacheService: CacheService) {}

  @Get('get')
  async get(@Query() query) {
    return await this.cacheService.get(query.key);
  }

  @Post('set')
  async set(@Body() body) {
    const { key, ...params } = body as any;
    return await this.cacheService.set(key, params);
  }

  @Get('del')
  async del(@Query() query) {
    return await this.cacheService.del(query.key);
  }

  @Get('delAll')
  async delAll() {
    return await this.cacheService.flushall();
  }
}
```

**redis-test.module.ts**

```js
import { Module } from '@nestjs/common';
import { RedisTestService } from './redis-test.service';
import { RedisTestController } from './redis-test.controller';
import { CacheService } from 'src/common/cache/redis.service';

@Module({
  controllers: [RedisTestController],
  providers: [RedisTestService, CacheService], // 注入redis服务
})
export class RedisTestModule {}
```

**redis-test.service.ts**

```js
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisTestService {}
```

## 集成redis实现单点登录

**在要使用的controller或service中使用redis**

- 这里以实现`token`存储在`redis`为例子，实现**单点登陆**

- 需要在`passport`的`login`中，存储`token`，如果不会`passport`验证

**单点登陆原理**

> - 一个账户在第一个地方登陆，登陆时，JWT生成token，保存token到redis，同时返回token给前端保存到本地
>
> - 同一账户在第二个地方登陆，登陆时，JWT生成新的token，保存新的token到redis。（token已经改变）
>   此时，第一个地方登陆的账户在请求时，使用的本地token就会和redis里面的新token不一致（注意：都是有效的token）

```js
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync, hashSync } from 'bcryptjs';

import { UsersEntity } from '../user/entities/user.entity';
import { ToolsService } from '../../utils/tools.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CacheService } from '../../common/db/redis-ceche.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    private readonly jwtService: JwtService,
    private readonly redisService: CacheService,
  ) { }

  async create(user: CreateUserDto) {
    const { username, password } = user;
    const transformPass = hashSync(password);
    user.password = transformPass;
    const result = await this.usersRepository.findOne({ username });
    if (result) ToolsService.fail('用户名已存在');
    return await this.usersRepository.insert(user);
  }

  async validateUser(userinfo): Promise<any> {
    const { username, password } = userinfo;
    const user = await this.usersRepository.findOne({
      where: { username },
      select: ['username', 'password', 'id'],
    });
    if (!user) ToolsService.fail('用户名或密码不正确');
    //使用bcryptjs验证密码
    if (!compareSync(password, user.password)) {
      ToolsService.fail('用户名或密码不正确');
    }
    return user;
  }

  async login(user: any): Promise<any> {
    const { id, username } = user;
    const payload = { id, username };
    const access_token = this.jwtService.sign(payload);
    await this.redisService.set(`user-token-${id}`, access_token, 60 * 60 * 24);  在这里使用redis
    return access_token;
  }
}
```

![](https://s.poetries.work/uploads/2022/05/f134cb6419f34607.png)

**验证token**

```js
import { Strategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { jwtConstants } from './constants';
import { CacheService } from '../../common/db/redis-ceche.service';
import { Request } from 'express';
import { ToolsService } from '../../utils/tools.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private redisService: CacheService) {
    super({
      jwtFromRequest: ExtractJwt.fromHeader('token'), //使用ExtractJwt.fromHeader从header获取token
      ignoreExpiration: false, //如果为true，则不验证令牌的过期时间。
      secretOrKey: jwtConstants.secret, //使用密钥解析，可以使用process.env.xxx
      passReqToCallback: true,
    } as StrategyOptions);
  }

  //token验证, payload是super中已经解析好的token信息
  async validate(req: Request, payload: any) {
    console.log('payload', payload);
    const { id } = payload;
    const token = ExtractJwt.fromHeader('token')(req);
    const cacheToken = await this.redisService.get(`user-token-${id}`);  获取redis的key

    //单点登陆验证
    if (token !== JSON.parse(cacheToken)) {
      ToolsService.fail('您账户已经在另一处登陆，请重新登陆', 401);
    }
    return { username: payload.username };
  }
}
```



# QA

### Q：nestJS注入其他依赖时为什么还需要导入其module

> A模块的Service需要调用B模块的service中一个方法，则需要在A的Service导入B的service
> 场景如下：

```js
// A.Service
import { BService } from '../B/B.service';

@Injectable()
export class A {
  constructor(
    private readonly _BService: BService,
  ) {}
}
```

我的理解

- 在此处@Injectable装饰器已经将B的Service类实例化了，
- 已经可以使用B的类方法了。
- 但为什么还需要在A的module.ts中导入B模块呢？像是这样:

```js
// A.module.ts
import { BModule } from '../B/B.module';

@Module({
  imports: [BModule],
  controllers: [AController],
  providers: [AService],
  exports: [AService],
})
export class AModule {}
```

**A**

为啥"为什么还需要在A的module.ts中导入B模块呢"？

因为 `BService`的作用域只在 `BModule`里，所以你要在 `AController`里直接用，就会报错拿不到实例。

再来说，"有什么办法可以让 `BService`随处直接用么？"，参考如下手段：

B 的module 声明时，加上`@Global`，如下：

```js
import { Module, Global } from '@nestjs/common';
import { BService } from './B.service';

@Global()
@Module({
  providers: [BService],
  exports: [BService],
})
export class BModule {}
```

这样，你就不用在 `AModule`的声明里引入 `BModule`了。

关于『你的理解』部分，貌似你把`@Inject` 和 `@Injectable` 搞混了，建议再读一读这个部分的文档，多做些练习/尝试，自己感受下每个api的特点。

最后，官网文档里其实有介绍 ，看`依赖注入`:https://docs.nestjs.com/modules#dependency-injection
