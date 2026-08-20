---
title: Nestjs 学习总结 从控制器到 TypeORM 的后端实战笔记
description: 一份完整的 NestJS 学习笔记，讲清控制器、服务、模块的分工，中间件守卫管道拦截器过滤器的执行顺序，以及 JWT 鉴权、RBAC 权限、Swagger 文档、TypeORM 增删改查与关系设计、Redis 单点登录。
date: 2022-05-25 20:35:24
tags:
  - Node
  - Nest
  - TypeORM
categories: Front-End
---

前端写久了总想把一个接口从头到尾自己做完。Express 上手最快，可写到第三个模块就开始难受，路由、参数校验、数据库连接、异常处理各写各的，没有统一约定，换个人接手得重读一遍代码才敢改。NestJS 给的正是这层约定，控制器收请求，服务干活，模块负责组装，中间还塞了五种切面能力去接管横切逻辑。这篇是我把 NestJS 从建项目一路做到接 MySQL 和 Redis 之后攒下来的完整笔记，配置、代码、踩坑点都在里面，需要哪块直接翻到哪块抄走。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- NestJS 的项目结构，控制器、服务、模块分别在解决什么问题
- 静态资源、模板引擎、Cookie 与 Session 这几个 Express 老熟人在 Nest 里怎么配
- 中间件、守卫、拦截器、管道、异常过滤器的职责边界和真实执行顺序
- 用 DTO 配合 class-validator 做参数校验，把校验规则从业务代码里摘出去
- 配置抽离、多环境变量、文件上传下载、图片验证码、邮件服务、定时任务
- passport + JWT 登录鉴权、密码加密方案、RBAC 角色权限的表设计和守卫实现
- 接入 Swagger 自动生成可调试的接口文档
- MongoDB 与 TypeORM 操作 MySQL，实体设计、五种访问方式、三种增删改查写法
- 事务的三种用法，一对一、一对多、多对多关系怎么设计和增删改查
- 接入 Redis，以及用它实现单点登录

先把 Nest 是个什么东西说清楚。

> Nest (NestJS) 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的开发框架。它利用 JavaScript 的渐进增强的能力，使用并完全支持 TypeScript （仍然允许开发者使用纯 JavaScript 进行开发），并结合了 OOP （面向对象编程）、FP （函数式编程）和 FRP （函数响应式编程）。

- 在底层，Nest 构建在强大的 HTTP 服务器框架上，例如 Express （默认），并且还可以通过配置从而使用 Fastify ！
- Nest 在这些常见的 Node.js 框架 (Express/Fastify) 之上提高了一个抽象级别，但仍然向开发者直接暴露了底层框架的 API。这使得开发者可以自由地使用适用于底层平台的无数的第三方模块。

我一直觉得 Nest 最值钱的地方不是某个 API，而是它把「一个后端项目该怎么分层」这件事变成了框架级别的强制约定。你写了三个月，别人接手也知道去哪找登录逻辑。

本文基于 nest8 演示。这里必须提前说一句，这篇写于 2022 年 5 月，之后 NestJS 又发过大版本，TypeORM 也从 0.2 升到了 0.3，一些 API 的签名有变化，最典型的就是 `findOne` 从接受裸 id 改成必须传 `where` 对象、`Connection` 相关的一批全局函数被重新组织过。下文我把原始写法原样保留了，因为很多人手上的老项目还跑在这套 API 上，但如果你是新起项目，装完包之后请以官方文档的当前版本为准，不要照抄我这里的旧签名。

## 一、基础篇 项目结构与请求生命周期

这一部分解决的是「怎么把一个 Nest 项目跑起来并且组织好」。控制器、服务、模块是三个必须先分清的角色，之后的静态资源、模板引擎、Cookie 和 Session 都是把 Express 的能力接进 Nest 的写法，最后那一大块中间件守卫管道过滤器拦截器，是 Nest 区别于裸 Express 最核心的东西。

### 创建项目

Nest 的 CLI 不是可选项，是这个框架的一部分。手写目录结构当然也行，但控制器、服务、模块、DTO 之间有一套固定的文件命名和注册关系，用 CLI 生成能省掉一堆「忘了在 module 里注册」的低级错误。所以第一步先全局装它。

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

目录很干净，真正要看的就三个文件。

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

`main.ts` 这个 `app` 实例后面会被反复用到。全局管道、全局守卫、全局过滤器、静态资源目录、Swagger 挂载，全都是在这里往 `app` 上挂，所以看一个 Nest 项目，先翻 `main.ts` 基本就知道它开了哪些全局能力。

底层跑的是谁也可以换。

> `nest`有两个支持开箱即用的 HTTP 平台：`express` 和 `fastify`。 您可以选择最适合您需求的产品


- `platform-express` Express 是一个众所周知的 node.js 简约 Web 框架。 这是一个经过实战考验，适用于生产的库，拥有大量社区资源。 默认情况下使用 `@nestjs/platform-express` 包。 许多用户都可以使用 `Express` ，并且无需采取任何操作即可启用它。
- `platform-fastify` `Fastify` 是一个高性能，低开销的框架，专注于提供最高的效率和速度。

这里有个坑要注意。选 Express 还是 Fastify，会影响到后面 Cookie、Session、静态资源、文件上传这些能力的写法，因为它们说到底就是在调底层平台的 API。下文所有例子都是 Express 平台的写法，如果你换了 Fastify，对应的中间件包和调用方式要跟着换。我自己只在 Express 平台上完整跑过，Fastify 那条线没验证过。


### Nest控制器

Nest中的控制器层负责处理传入的请求, 并返回对客户端的响应。

下面这张图是 Nest 官方对控制器位置的示意，客户端请求先落到控制器，控制器再决定交给谁处理。

![Nest 控制器在请求链路中的位置示意图](https://s.poetries.top/uploads/2022/05/8b2fcd207249cb37.png)

> 控制器的目的是接收应用的特定请求。路由机制控制哪个控制器接收哪些请求。通常，每个控制器有多个路由，不同的路由可以执行不同的操作

有一条纪律建议一开始就守住，控制器里不写业务逻辑。它只干三件事，声明路由、从请求里取参数、把结果 return 出去。查库、算数据、调第三方全部丢给 service。这条守住了，后面写单元测试和换数据源的时候会轻松很多。

**通过NestCLi创建控制器：**

`nest -h` 可以看到`nest`支持的命令

**常用命令：**

- 创建控制器：`nest g co user module`
- 创建服务：`nest g s user module`
- 创建模块：`nest g mo user module`
- 默认以src为根路径生成

执行 `nest -h` 之后能看到完整的命令列表，长这样。

![nest -h 输出的 CLI 命令列表](https://s.poetries.top/uploads/2022/05/1c412ef436a4a04d.png)

实际用起来，比如要建一个文章模块的控制器。

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

CLI 自动改 `app.module.ts` 这个行为很关键。Nest 的依赖注入是靠模块元数据串起来的，控制器不写进 `controllers` 数组就不会被扫描到，路由自然也不存在。手写文件最容易漏的就是这一步。

### nest配置路由请求数据

路由声明完，下一个问题就是怎么把请求里的数据拿出来。Express 里是从 `req.query`、`req.body`、`req.params` 上手动抠，Nest 把这套包成了参数装饰器，写在形参上，框架帮你注进来。

> Nestjs提供了其他HTTP请求方法的装饰器 `@Get()` `@Post()` `@Put()` 、 `@Delete()`、 `@Patch()`、 `@Options()`、 `@Head()`和 `@All()`

在Nestjs中获取`Get`传值或者`Post提`交的数据的话我们可以使用Nestjs中的装饰器来获取。

左边是 Nest 的装饰器，右边是它对应到 Express 原生对象上的哪个字段，对照着看就很清楚了。

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

上面这段是一个标准的 RESTful 控制器。注意 `@Param('id')` 拿到的永远是字符串，哪怕路径里写的是数字，这个在后面讲管道的时候还会再遇到一次。

**注意**

- `关于nest的return`： 当请求处理程序返回 JavaScript 对象或数组时，它将自动序列化为 JSON。但是，当它返回一个字符串时，Nest 将只发送一个字符串而不是序列化它

这个 return 的行为差异，是后面要做「统一响应体」的直接原因。接口有的返对象有的返字符串，前端接起来就得写两套判断，所以正经项目都会加一个响应拦截器把结构拍平，这块下文会讲。

### Nest服务

控制器只管收发，真正的活在服务里。

> Nestjs中的服务可以是`service` 也可以是`provider`。他们都可以`通过 constructor 注入依赖关系`。服务其实就是通过`@Injectable()` 装饰器注解的类。在Nestjs中服务相当于`MVC`的`Model`

![Nest 服务作为提供者被注入控制器的示意图](https://s.poetries.top/uploads/2022/05/1c607b98268d7707.png)

`@Injectable()` 这个装饰器做的事情是告诉 Nest 的 IoC 容器「这个类可以被托管」。之后你只要在别的类的构造函数里声明这个类型，容器就会自己把实例送进来，不需要手动 `new`。这也是为什么 Nest 里几乎看不到 `new SomeService()` 这种代码。

**创建服务**

```
nest g service posts
```

创建好服务后就可以在服务中定义对应的方法。下面这段是一个完整的文章 CRUD 服务，包含了创建去重、分页模糊查询、按 ID 查详情、合并更新和删除，后面数据库那一节讲到的 TypeORM 用法基本都能在这里找到影子。先扫一眼有个印象，细节到下面再拆。

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

这里插一句上面那段分页查询的写法。`Like('%' + value + '%')` 会让这个字段的索引失效，数据量小的时候无所谓，表大了就是慢查询。真做全字段模糊搜索，还是得上专门的搜索引擎，别指望 MySQL 的 LIKE。

### Nest模块

控制器和服务写完了，谁把它们装起来？模块。

> 模块是具有 `@Module()` 装饰器的类。 `@Module()` 装饰器提供了元数据，Nest 用它来组织应用程序结构

![Nest 模块树结构示意图，根模块下挂载多个功能模块](https://s.poetries.top/uploads/2022/05/fcc23bae4de7fa32.png)

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

这四个字段里，`providers` 和 `exports` 的区别是最容易搞混的。`providers` 是「我这个模块内部能用哪些服务」，`exports` 是「我允许别的模块用我的哪些服务」。只写 providers 不写 exports，别的模块 import 了你也拿不到实例，会直接抛依赖解析失败。文末的 QA 那一节还专门聊了这个问题。

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

`nest g res` 是我用得最多的命令，一条命令把 controller、service、module、DTO、entity 全生成好并注册进去，生成结果如下。

![nest g res 一键生成的资源模块文件结构](https://s.poetries.top/uploads/2022/05/f63b444ed1c1d481.png)

到这里，控制器、服务、模块这三个角色就齐了。剩下的内容都是在这个骨架上往里填能力。

### 配置静态资源

接口写完，总有场景要直接吐文件出去，比如上传后的图片、导出的报表、给运营看的一个静态页。Nest 本身不管这个，得让底层的 Express 去挂目录。

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

两种写法的区别在于有没有虚拟前缀。方式一直接把 `public` 挂到根路径，文件名容易和你的接口路由撞车。方式二加了 `prefix: '/static/'`，所有静态文件都在 `/static` 下面，接口和资源井水不犯河水。真实项目里我一律用第二种。

注意 `join(__dirname, '../public')` 里的 `__dirname` 在编译后指向的是 `dist` 目录，所以这个相对路径是相对编译产物算的，不是相对源码。这个我踩过，本地 `nest start` 好好的，打包完就 404。

### 配置模板引擎

如果你要做的是服务端直出的页面，比如一个后台登录页、一个邮件预览页，就得挂模板引擎。Nest 支持 ejs、hbs、pug 这些，下面用 ejs 演示。

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

`setBaseViewsDir` 指模板文件放哪，`setViewEngine` 指用哪个引擎渲染，两个都要设，少一个都渲不出来。

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
import { Controller, Get, Render } from '@nestjs/common';
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

`@Render()` 的参数是模板相对 views 目录的路径，方法的返回值就是丢给模板的数据。这里有个坑，用了 `@Render()` 之后哪怕不传数据也得 return 一个空对象，直接不 return 会渲染失败。

### Cookie的使用

登录态要落地，绕不开 Cookie 和 Session 这一对。

> cookie和session的使用**依赖**于当前使用的平台，如：express和fastify
> 两种的使用方式不同，这里主要记录基于**express**平台的用法

cookie可以用来存储用户信息，存储购物车等信息，在实际项目中用的非常多

```js
npm install cookie-parser --save
npm i -D @types/cookie-parser --save
```

`cookie-parser` 是 Express 生态的中间件，Nest 这边直接 `app.use()` 挂上去就行，不需要额外的 Nest 封装包。

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

`cookieParser('dafgafa')` 这个参数就是签名密钥。传了它才能用签名 Cookie，也就是下面那个 `signed: true`。签名不等于加密，Cookie 的值前端照样看得见，它防的是被人在浏览器里随手改掉。真要藏东西还得自己加密或者干脆别放前端。

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

代码注释里那句「使用 res 后返回数据必须使用 res」很关键。一旦你用 `@Response()` 把原生响应对象拿出来了，Nest 就不再接管这个方法的返回值，你 return 什么它都不发，请求会一直挂着直到超时。这个我排查过一下午，接口在 Postman 里一直转圈，最后发现就是少了一行 `res.send()`。

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

这几个参数里，`httpOnly` 和 `secure` 是安全底线，生产环境的登录态 Cookie 这两个都该开。`maxAge` 单位是毫秒，`expires` 是具体时间点，两个都设的话 `maxAge` 优先。

### Session的使用

Cookie 存在浏览器，Session 存在服务端，这是它俩最根本的分工。

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
import * as session from 'express-session'

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

默认的 `express-session` 把数据存在 Node 进程的内存里。单机跑没问题，一旦上了 PM2 多实例或者多台机器，用户这次请求打到 A 进程、下次打到 B 进程，Session 就丢了。生产上要么配 Redis 作为 session store，要么干脆走 JWT 那条路，后面鉴权那一节会讲。

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

### 跨域，前缀路径、网站安全、请求限速

这一节的四件事都在 `main.ts` 里，属于「项目起来第一天就该配好」的那类东西。放着不配，等到联调时前端一片 CORS 报错、上线后被扫描器扫出一堆头缺失，再回来补就很被动。

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
const PREFIX = 'api/v1';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 路径前缀：如：http://www.test.com/api/v1/user
  app.setGlobalPrefix(PREFIX);

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

四个东西的分工是这样的。`setGlobalPrefix` 给所有路由加统一前缀，配合网关做路径转发很省事。`enableCors()` 不带参数是全开，正式环境应该传 `origin` 白名单，别真的对全世界开放。`helmet` 帮你把一堆安全响应头补上，比如 `X-Content-Type-Options`、`X-Frame-Options`。`csurf` 是防 CSRF 的，注意它依赖 Session 或者 Cookie，纯 JWT 的前后端分离项目其实用不上，开了反而会让接口全挂。

这里再多说一句，helmet 和 csurf 后来都改过导出方式，有的版本要写成 `helmet()` 有的要 `helmet.default()`，装完之后跑不起来先去看包的 README，以官方文档为准。

**限速：限制客户端在一定时间内的请求次数**

登录、发短信、发邮件这类接口不限速就是在等着被刷。

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

注意这里是通过 `APP_GUARD` 这个注入令牌把 `ThrottlerGuard` 注册成全局守卫的，而不是在 `main.ts` 里 `useGlobalGuards`。两种写法都能全局生效，区别在于用 `APP_GUARD` 注册的守卫可以正常注入其它依赖，`main.ts` 里 `new` 出来的那个不行，因为它没走 IoC 容器。这是很多人第一次写全局守卫时踩的坑，构造函数里注入的东西全是 `undefined`。

### 管道、守卫、拦截器、过滤器、中间件

到这里终于要说 Nest 最有辨识度的东西了。裸 Express 里，鉴权、日志、参数校验、异常处理全塞在中间件里，写着写着就成了一坨。Nest 把它们按职责拆成五种切面，每种有自己的接入时机和上下文对象。

- **管道**：数据处理与转换，数据验证
- **守卫**：验证用户登陆，保护路由
- **拦截器**：对请求响应进行拦截，统一响应内容
- **过滤器**：异常捕获
- **中间件**：日志打印

先记住这个分工，再看顺序。

> 执行顺序（时机）

从客户端发送一个post请求，路径为：`/user/login`，请求参数为：`{userinfo: 'xx', password: 'xx'}`，到服务器接收请求内容，触发绑定的函数并且执行相关逻辑完毕，然后返回内容给客户端的整个过程大体上要经过如下几个步骤。

下面这张流程图值得多看两眼，它把一次请求从进来到出去经过的所有关卡按顺序画出来了。

![一次请求依次经过中间件、守卫、拦截器、管道、路由处理函数再回到拦截器的流程图](https://s.poetries.top/uploads/2022/05/1670837aa99d6cb8.png)

从图里能读出一个很重要的结论，中间件最早，管道最晚，拦截器被劈成了前后两半。这个顺序决定了你的逻辑该放在哪一层。比如你想在鉴权之前打全量请求日志，就只能放中间件，放守卫里那些被拦掉的请求根本记不上。

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

这五个 `useGlobalXxx` 就是全局挂载的入口。下面把每一种单独拆开讲用法，最后再用一个完整例子把它们串起来跑一遍。

#### 管道

管道干两件事，转换和校验。控制器拿到的参数默认都是字符串，管道可以在参数进入方法之前把它变成你要的类型，或者直接判定不合法把请求打回去。

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

三种局部用法的粒度不一样。类上的 `@UsePipes` 管这个控制器的所有路由，方法上的只管这个方法，写在参数里的 `@Param('id', new ParseIntPipe())` 只管这一个参数。粒度越小越可控，我一般只在参数级用内置管道，全局那种大范围的留给 `ValidationPipe`。

> 自定义管道

内置的不够用就自己写。自定义管道的用武之地是那种业务特有的转换规则，比如把前端传的逗号分隔字符串转成数组。

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



#### 守卫

守卫只回答一个问题，这个请求能不能往下走。返回 `true` 放行，返回 `false` 直接 403。所有跟「你是谁、你有没有权限」相关的判断都应该落在这一层，而不是在控制器里写 `if (!user) return`。

> 自定义守卫

使用快捷命令生成：`nest g gu myGuard common/guards`

下面这段代码要先说明一下，它把白名单、反射器取角色、读 token、读 session 四种用法堆在同一个 `canActivate` 里做展示，实际上第一个 `return` 之后的代码永远执行不到。抄的时候按你的场景挑一种留下，别整段复制。

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

#### 装饰器

守卫要知道「这个接口允许哪些角色访问」，这个信息得有地方写。Nest 的做法是用自定义装饰器把它塞进元数据，守卫再用 `Reflector` 读出来。这套组合是 Nest 做权限控制的标准姿势。

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

`SetMetadata` 的第一个参数是 key，守卫里 `reflector.get<string[]>('roles', context.getHandler())` 用的就是同一个 key。这两处必须写一致，写错了守卫读到 `undefined`，看起来像是装饰器没生效。上面示例里 CLI 生成的名字是 `Roles`，前面守卫代码里读的也是 `'roles'` 这个 key，对得上。

#### 拦截器

拦截器是唯一能同时管到「请求进来之前」和「响应出去之后」的切面。最常见的用途就是统一响应体，把所有接口的返回值包一层 `{ status, message, data }`，前端接起来省心。

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

`next.handle()` 之前的代码在路由函数执行前跑，`.pipe(map(...))` 里的代码在路由函数返回之后跑。拦截器基于 RxJS，所以你能用上 `map`、`tap`、`timeout`、`catchError` 这一整套操作符，做超时控制和响应缓存都很顺手。

#### 过滤器

过滤器管的是异常。业务代码里直接 `throw`，不用管怎么组织错误响应，全部交给过滤器统一格式化。这样 service 层就能写得很干净，一行 `if (!user) throw ...` 就结束了。

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

`@Catch(HttpException)` 括号里写什么，决定了这个过滤器管哪一类异常。写 `HttpException` 只接住 HTTP 异常，数据库连接失败这种非 HTTP 异常会漏出去变成 500 白屏。想全接住就写成不带参数的 `@Catch()`，但那样 `exception.getStatus()` 可能不存在，得先判断类型，后面完整例子里的写法就处理了这一点。

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



#### 中间件

中间件就是 Express 那套原班人马，位置最靠前，拿到的是最原始的 `req` 和 `res`。它跑在守卫之前，所以做全量访问日志、请求体格式转换、把 traceId 塞进请求这类事最合适。反过来说，需要知道「这个请求最终会走到哪个控制器方法」的逻辑就别放这儿，那时候路由还没匹配完。

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



`exclude` 和 `forRoutes` 这一对很实用。`forRoutes('user')` 是「哪些路由要过这个中间件」，`exclude` 是从里面再刨掉几个。顺序是按 `.apply()` 里写的顺序执行的，多个中间件之间有依赖关系时要注意别写反。

**函数式中间件**

类中间件能注入依赖，函数式中间件不能，但胜在轻。只做一件小事、也不需要注入 service 的时候，写成函数更省事。

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

### 一例看懂中间件、守卫、管道、异常过滤器、拦截器

上面把五种切面一个一个讲了，但分开看永远不如串起来跑一遍。这一节做一个完整的 `/user/login` 接口，五种切面全部挂上，每一层都打一句 log，然后从终端输出里直接看它们的真实执行顺序。这是我当初理解这块最有效的办法。

> 从客户端发送一个post请求，路径为：`/user/login`，请求参数为：`{userinfo: 'xx', password: 'xx'}`，到服务器接收请求内容，触发绑定的函数并且执行相关逻辑完毕，然后返回内容给客户端的整个过程大体上要经过如下几个步骤。

![一次 POST /user/login 请求穿过五种切面的完整时序图](https://s.poetries.top/uploads/2022/05/8bb8d3e0e2bdaebe.png)

项目需要包支持：

```
npm install --save rxjs xml2js class-validator class-transformer
```

- `rxjs` 针对JavaScript的反应式扩展,支持更多的转换运算

- `xml2js` 转换xml内容变成json格式
- `class-validator`、`class-transformer` 管道验证包和转换器

建立user模块：模块内容结构：

`nest g res user`

生成出来的目录长这样，controller、service、module、dto 一应俱全。

![nest g res user 生成的 user 模块目录结构](https://s.poetries.top/uploads/2022/05/6b74e9b59b24a0fd.png)

user.controller.ts文件

```js
import {
  Controller,
  Post,
  Body
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserLoginDTO } from './dto/user.login.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('test')
  loginIn(@Body() userlogindto: UserLoginDTO) {
    return userlogindto;
  }

}
```



user.module.ts文件

```js
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```



user.service.ts文件

```js
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {}
```



user.login.dto.ts文件。DTO 是这一整套的关键，校验规则写在这里，管道靠读它上面的装饰器来决定放不放行。

```js
// user / dto / user.login.dto.ts

import { IsNotIn, MinLength } from 'class-validator';
export class UserLoginDTO{
  /*
  * 账号
  */
  @IsNotIn(['',undefined,null],{message: '账号不能为空'})
  username: string;

  /*
  * 密码
  */
  @MinLength(6,{
    message: '密码长度不能小于6位数'
  })
  password: string;
}
```

app.module.ts文件

```js
import { Module } from '@nestjs/common';

// 子模块加载
import { UserModule } from './user/user.module'

@Module({
  imports: [
    UserModule
  ]
})
export class AppModule {}
```

> 新建common文件夹里面分别建立对应的文件夹以及文件，中间件(middleware) 对应 xml.middleware.ts，守卫(guard) 对应 auth.guard.ts，管道(pipe) 对应 validation.pipe.ts，异常过滤器(filters) 对应 http-exception.filter.ts，拦截器(interceptor) 对应 response.interceptor.ts

按类型分目录放在 `common` 下面，结构如下。这套目录划分我一直沿用，跨模块复用的切面全在 `common`，业务模块目录里只留业务。

![common 目录下按类型划分的中间件、守卫、管道、过滤器、拦截器文件结构](https://s.poetries.top/uploads/2022/05/b0bafbf19bde075f.png)

```js
// main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { ValidationPipe } from './common/pipe/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { XMLMiddleware } from './common/middleware/xml.middleware';
import { AuthGuard } from './common/guard/auth.guard';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局注册通用验证管道ValidationPipe
  app.useGlobalPipes(new ValidationPipe());

  // 全局注册通用异常过滤器HttpExceptionFilter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局注册xml支持中间件(这里必须调用.use才能够注册)
  app.use(new XMLMiddleware().use);

  // 全局注册权限验证守卫
  app.useGlobalGuards(new AuthGuard());

  // 全局注册响应拦截器
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(3001);
}
bootstrap();
```

上面 `main.ts` 里五个全局注册的顺序，跟它们真正的执行顺序没有关系。执行顺序是框架定死的，写在代码里的先后只是登记，这点别搞混。下面按真实的执行顺序一关一关看。

#### 中间件是请求的第一道关卡

中间件能做的事：

1. 执行任何代码。
2. 对请求和响应对象进行更改。
3. 结束请求-响应周期。
4. 调用堆栈中的下一个中间件函数。
5. 如果当前的中间件函数没有结束请求-响应周期, 它必须调用 next() 将控制传递给下一个中间件函数。否则, 请求将被挂起

最后那条是最容易出事的。忘了调 `next()`，请求就卡在这一层，前端看到的现象是接口一直 pending 最后超时，而服务端一点错误日志都没有。

本例中：使用中间件让express支持xml请求并且将xml内容转换为json数组。这是个很典型的中间件场景，改的是请求体本身的格式，跟具体业务无关，往下游走的每一层都直接受益。

```js
// common/middleware/xml.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
const xml2js = require('xml2js');
const parser = new xml2js.Parser();

@Injectable()
export class XMLMiddleware implements NestMiddleware {
  // 参数是固定的Request/Response/next,
  // Request/Response/next对应请求体和响应体和下一步函数
  use(req: Request, res: Response, next: Function) {
    console.log('进入全局xml中间件...');
    // 获取express原生请求对象req,找到其请求头内容，如果包含application/xml，则执行转换
    if(req.headers['content-type'] && req.headers['content-type'].includes('application/xml')){
      // 监听data方法获取到对应的参数数据(这里的方法是express的原生方法)
      req.on('data', mreq => {
        // 使用xml2js对xml数据进行转换
        parser.parseString(mreq,function(err,result){
          // 将转换后的数据放入到请求对象的req中
          console.log('parseString转换后的数据',result);
          // 这里之后可以根据需要对result做一些补充完善
          req['body']= result;
        })
      })
    }
    // 调用next方法进入到下一个中间件或者路由
    next();
  }
}
```

**注册方式**

- 全局注册：在`main.ts`中导入需要的中间件模块如：XMLMiddleware然后使用 `app.use(new XMLMiddleware().use)`即可

- 模块注册：在对应的模块中注册如：`user.module.ts`

在模块里注册的写法是这样。

![在 user.module.ts 中通过 configure 方法注册中间件的代码截图](https://s.poetries.top/uploads/2022/05/7985e11265cdecc2.png)

> 同一路由注册多个中间件的执行顺序为，先是全局中间件执行，然后是模块中间件执行，模块中的中间件顺序按照`.apply`中注册的顺序执行

顺带说一句这段代码里的坑。它在 `req.on('data')` 的回调里改 `req.body`，但 `next()` 是同步调用的，也就是说数据还没读完，请求就已经往下走了。演示原理没问题，真要在生产上做 XML 解析，得把 `next()` 放到 `end` 事件里再调，或者直接用现成的 body parser。

#### 守卫是第二道关卡

> 守卫控制一些权限内容，如：一些接口需要带上token标记，才能够调用，守卫则是对这个标记进行验证操作的。
> 本例中代码如下：

```js
// common/guard/auth.guard.ts

import {Injectable,CanActivate,HttpException,HttpStatus,ExecutionContext,} from '@nestjs/common';
@Injectable()
export class AuthGuard implements CanActivate {
  // context 请求的(Response/Request)的引用
  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('进入全局权限守卫...');
    // 获取请求对象
    const request = context.switchToHttp().getRequest();
    // 获取请求头中的token字段
    const token = context.switchToRpc().getData().headers.token;
    // 如果白名单内的路由就不拦截直接通过
    if (this.hasUrl(this.urlList, request.url)) {
      return true;
    }
    // 验证token的合理性以及根据token做出相应的操作
    if (token) {
      try {
        // 这里可以添加验证逻辑
        return true;
      } catch (e) {
        throw new HttpException(
          '没有授权访问,请先登录',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } else {
      throw new HttpException(
        '没有授权访问,请先登录',
        HttpStatus.UNAUTHORIZED,
      );
    }
  };
  // 白名单数组
  private urlList: string[] = [
    '/user/login'
  ];

  // 验证该次请求是否为白名单内的路由
  private hasUrl(urlList: string[], url: string): boolean {
    let flag: boolean = false;
    if (urlList.indexOf(url) >= 0) {
      flag = true;
    }
    return flag;
  }
};

```

**注册方式**

- 全局注册：在`main.ts`中导入需要的守卫模块如：`AuthGuard`。然后使用 `app.useGlobalGuards(new AuthGuard())` 即可
- 模块注册：在需要注册的`controller`控制器中导入`AuthGuard`。然后从`@nestjs/common`中导`UseGuards`装饰器。最后直接放置在对应的`@Controller()`或者`@Post/@Get…`等装饰器之下即可

控制器里挂守卫的写法如下。

![在控制器上使用 UseGuards 装饰器注册守卫的代码截图](https://s.poetries.top/uploads/2022/05/976e8bcbe31b38ce.png)

> 同一路由注册多个守卫的执行顺序为，先是全局守卫执行，然后是模块中守卫执行

守卫这一层要留意白名单的写法。上面用的是 `urlList.indexOf(url) >= 0` 做全等匹配，一旦接口带了 query 参数，比如 `/user/login?from=h5`，`request.url` 就不再是 `/user/login`，白名单直接失效，登录接口自己被自己的守卫拦住。稳妥点应该用 `request.path` 或者前缀匹配。

#### 拦截器是第三道关卡

守卫放行之后就到拦截器。为什么要它？因为接口的返回结构需要统一。

想到自定义返回内容如

```
{
    "statusCode": 400,
    "timestamp": "2022-05-14T08:06:45.265Z",
    "path": "/user/login",
    "message": "请求失败",
    "data": {
        "isNotIn": "账号不能为空"
    }
}
```

这个时候就可以使用拦截器来做一下处理了。
**拦截器作用：**

1. 在函数执行之前/之后绑定额外的逻辑
2. 转换从函数返回的结果
3. 转换从函数抛出的异常
4. 扩展基本函数行为
5. 根据所选条件完全重写函数 (例如, 缓存目的)

**拦截器的执行顺序分为两个部分：**

- 第一个部分在管道和自定义逻辑(next.handle()方法)之前。
- 第二个部分在管道和自定义逻辑(next.handle()方法)之后。

```js
// common/interceptor/response.interceptor.ts

/*
 * 全局响应拦截器，统一返回体内容
 *
*/

import {
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
// 返回体结构
interface Response<T> {
  data: T;
}
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> {
    // 解析ExecutionContext的数据内容获取到请求体
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    // 实现数据的遍历与转变
    console.log('进入全局响应拦截器...');
    return next.handle().pipe(
      map(data => {
        console.log('全局响应拦截器方法返回内容后...');
        return {
          statusCode: 0,
          timestamp: new Date().toISOString(),
          path: request.url,
          message: '请求成功',
          data:data
        };
      }),
    );
  }
}
```

跑起来之后看终端输出，拦截器的两句 log 中间夹着管道和路由函数的 log，一眼就能看出它被劈成了前后两段。

![终端日志显示拦截器进入、全局管道、路由函数、拦截器返回内容后的执行顺序](https://s.poetries.top/uploads/2022/05/8d262c4c5dcad632.png)

> 中间多了个全局管道以及自定义逻辑，即只有路由绑定的函数有正确的返回值之后才会有`next.handle()`之后的内容

这句话反过来读更有用。路由函数抛异常了，`next.handle()` 后面那段 `map` 根本不执行，响应会被异常过滤器接管。所以千万别把「统一成功响应」和「统一失败响应」都指望拦截器，失败那条线是过滤器的活。

**注册方式**

- 全局注册：在`main.ts`中导入需要的模块如：`ResponseInterceptor`。然后使用 `app.useGlobalInterceptors(new ResponseInterceptor()) `即可
- 模块注册：在需要注册的`controller`控制器中导入`ResponseInterceptor`。然后从`@nestjs/common`中导入`UseInterceptors`装饰器。最后直接放置在对应的`@Controller()`或者`@Post/@Get`…等装饰器之下即可

控制器上挂拦截器的写法如下。

![在控制器上使用 UseInterceptors 装饰器注册拦截器的代码截图](https://s.poetries.top/uploads/2022/05/099d67812f591bc5.png)

> 同一路由注册多个拦截器时候，优先执行模块中绑定的拦截器，然后其拦截器转换的内容将作为全局拦截器的内容，即包裹两次返回内容如：

```
{ // 全局拦截器效果
    "statusCode": 0,
    "timestamp": "2022-05-14T08:20:06.159Z",
    "path": "/user/login",
    "message": "请求成功",
    "data": {
        "pagenum": 1,
        "pageSize": 10,
        "list": []
    }
}
```

上面这个结构就是被包了两层的样子，外面那层来自全局拦截器，`data` 里面那层来自模块拦截器。这个我踩过，全局已经包了一次结构，模块里图省事又包了一次，前端拿到的是 `res.data.data.data`，找了半天才定位到是两个拦截器叠上了。

#### 管道是第四道关卡

管道是请求过程中的第四个环节，主要用于对请求参数的验证和转换操作。项目中用 `class-validator` 和 `class-transformer` 这两个包来配合，把校验规则写成装饰器挂在 DTO 字段上。

管道排在这么靠后是有道理的。它拿到的是已经解析好的参数和参数的元类型，能知道这个值该是 `CreateUserDto` 还是一个裸字符串，前面几层都没有这个信息。

**认识官方的三个内置管道**

`ValidationPipe` 是基于`class-validator`和`class-transformer`这两个npm包编写的一个常规的验证管道，可以从`class-validator`导入配置规则，然后直接使用验证。当前不需要了解`ValidationPipe`的原理，只需要知道从`class-validator`引规则，设定到对应字段，然后使用`ValidationPipe`即可。

`ParseIntPipe` 负责把传入的参数转成数字，用法如下。

![在参数上使用 ParseIntPipe 把字符串 id 转成数字的代码截图](https://s.poetries.top/uploads/2022/05/9b73303097ddcf73.png)

比如请求 `/test?id=123`，这里会把字符串 `'123'` 转换成数字 `123`。转不动的时候它会直接抛 400，不用你自己写 `isNaN` 判断。

`ParseUUIDPipe` 则是验证字符串是否是 UUID(通用唯一识别码)。

![在参数上使用 ParseUUIDPipe 校验 uuid 格式的代码截图](https://s.poetries.top/uploads/2022/05/ea2ed3388b228548.png)

比如请求 `/test?id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`，这里会验证格式是否正确，不正确则抛出错误，否则调用 `findOne` 方法。主键用 uuid 的表，加这个管道能挡掉一大批乱传 id 的请求，省得脏参数打到数据库上。

本例中管道使用如下：

```js
// common/pipe/validation.pipe.ts

/*
 * 全局dto验证管道
 *
*/

import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform<any>{
  // value 是当前处理的参数，而 metatype 是属性的元类型
  async transform(value: any, { metatype }: ArgumentMetadata) {
    console.log('进入全局管道...');
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    // plainToClass方法将普通的javascript对象转换为特定类的实例
    const object = plainToClass(metatype, value);
    // 验证该对象返回出错的数组
    const errors = await validate(object);
    if (errors.length > 0) {
      // 将错误信息数组中的第一个内容返回给异常过滤器
      let errormsg = errors.shift().constraints;
      throw new BadRequestException(errormsg);
    }
    return value;
  }
  // 验证属性值的元类型是否是String, Boolean, Number, Array, Object中的一种
  private toValidate(metatype: any): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

}
```

**注册方式**

- 全局注册：在`main.ts`中导入需要的模块如：`ValidationPipe`；然后使用 `app.useGlobalPipes(new ValidationPipe())` 即可
- 模块注册：在需要注册的`controller`控制器中导入`ValidationPipe`；然后从`@nestjs/common`中导入`UsePipes`装饰器；最后直接放置在对应的`@Controller()`或者`@Post/@Get…`等装饰器之下即可，管道还允许注册在相关的参数上如：`@Body/@Query… `等

代码里长这样。

![在控制器上使用 UsePipes 装饰器注册验证管道的代码截图](https://s.poetries.top/uploads/2022/05/d9c2b21c632c9baa.png)

> **注意：**同一路由注册多个管道的时候，优先执行全局管道，然后再执行模块管道

上面那段自定义 `ValidationPipe` 里有个细节值得单独说。`toValidate` 判断的是元类型在不在 `String, Boolean, Number, Array, Object` 里，如果在，就直接放行不做校验。原因是这几个原生类型上根本挂不了 `class-validator` 的装饰器，只有你自己定义的 DTO 类才有校验元数据。所以 `@Param('id') id: string` 这种参数，`ValidationPipe` 是不管的，得靠 `ParseIntPipe` 之类的内置管道。

最后一道是异常过滤器。

- 异常过滤器是所有抛出的异常的统一处理方案
- 简单来讲就是捕获系统抛出的所有异常，然后自定义修改异常内容，抛出友好的提示。

**内置异常类**

> 系统提供了不少内置的系统异常类，需要的时候直接使用throw new XXX(描述,状态)这样的方式即可抛出对应的异常,一旦抛出异常，当前请求将会终止。

**注意每个异常抛出的状态码有所不同**。常用的对照如下。

| 内置异常类 | HTTP 状态码 |
|------------|-------------|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `NotFoundException` | 404 |
| `NotAcceptableException` | 406 |
| `RequestTimeoutException` | 408 |
| `ConflictException` | 409 |
| `GoneException` | 410 |
| `PayloadTooLargeException` | 413 |
| `UnsupportedMediaTypeException` | 415 |
| `UnprocessableEntityException` | 422 |
| `InternalServerErrorException` | 500 |
| `NotImplementedException` | 501 |
| `BadGatewayException` | 502 |
| `ServiceUnavailableException` | 503 |
| `GatewayTimeoutException` | 504 |

用内置异常类比自己 `new HttpException(msg, 400)` 强，语义更清楚，读代码的人一眼知道这是什么错。业务里最常用的其实就是 400、401、403、404 这四个。

本例中使用的是自定义的异常类，代码如下：

```js
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException,Logger,HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  // exception 当前正在处理的异常对象
  // host 是传递给原始处理程序的参数的一个包装(Response/Request)的引用
  catch(exception: HttpException, host: ArgumentsHost) {
    console.log('进入全局异常过滤器...');
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    // HttpException 属于基础异常类，可自定义内容
    // 如果是自定义的异常类则抛出自定义的status
    // 否则就是内置HTTP异常类，然后抛出其对应的内置Status内容
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    // 抛出错误信息
    const message =
      exception.message ||
      exception.message.message ||
      exception.message.error ||
      null;
    let msgLog = {
      statusCode: status, // 系统错误状态
      timestamp: new Date().toISOString(), // 错误日期
      path: request.url, // 错误路由
      message: '请求失败',
      data: message // 错误消息内容体(争取和拦截器中定义的响应体一样)
    }
     // 打印错误综合日志
     Logger.error(
      '错误信息',
      JSON.stringify(msgLog),
      'HttpExceptionFilter',
    );
    response
      .status(status)
      .json(msgLog);
  }
}
```

**注册方式**

- 全局注册：在`main.ts`中导入需要的模块如：`HttpExceptionFilter` 然后使用 `app.useGlobalFilters(new HttpExceptionFilter())` 即可
- 模块注册：在需要注册的`controller`控制器中导入`HttpExceptionFilter`然后从`@nestjs/common`中导入`UseFilters`装饰器；最后直接放置在对应的`@Controller()`或者`@Post/@Get…`等装饰器之下即可

控制器上挂过滤器的写法如下。

![在控制器上使用 UseFilters 装饰器注册异常过滤器的代码截图](https://s.poetries.top/uploads/2022/05/0263be3b963d942b.png)

> **注意：** 同一路由注册多个过滤器的时候，只会执行一个异常过滤器，优先执行模块中绑定的异常过滤器，如果模块中无绑定异常过滤则执行全局异常过滤器

这一点和拦截器的行为正好相反。拦截器是层层包裹全都执行，过滤器是就近命中只执行一个。记住这个差别，不然你会奇怪为什么模块里的过滤器生效了，全局那个的日志一句都没打出来。

五道关卡到这里就走完了一遍。回过头看这套设计，它真正的价值在于把「跟业务无关但每个接口都要做」的事情从控制器里全部剥离出去了。控制器最后只剩下几行，读起来非常舒服。

### 数据验证

上面反复提到 DTO，这一节把它单独讲透。

如何 限制 和 验证 前端传递过来的数据？

常用：`dto`（data transfer object数据传输对象） + `class-validator`，自定义提示内容，还能集成swagger

这套方案好在校验规则和业务逻辑彻底分家。service 里不用再写一堆 `if (!body.username) return xxx`，参数不合法的请求压根进不到 service。而且同一份 DTO 还能被 Swagger 读去生成接口文档，一份声明三处受益。

**class-validator的验证项装饰器**

完整列表见官方仓库 https://github.com/typestack/class-validator#usage ，常用的这几个基本够覆盖八成场景。

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

`@ValidateIf` 是里面最容易被忽略的一个，它让校验变成有条件的。像「只有管理员账号才必须填邮箱」这种需求，不用它就得在 service 里写补充判断，用了它规则还是集中在 DTO 上。

```
yarn add class-validator class-transformer
```

装完之后有一步不能省，必须全局挂上内置管道`ValidationPipe`，不然 DTO 上的装饰器写了也不生效，参数照样能穿过去。这个是新手最常见的疑问，规则明明写了却一点用没有，原因就在这。

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

修改DTO：用户名，密码，手机号码，邮箱，性别，状态，都是**可选的**。创建和更新分成两个 DTO 是有必要的，创建时必填的字段，更新时往往允许只传其中一个，共用一份 DTO 会让规则互相打架。

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

`@IsOptional()` 配合 `@Type(() => Number)` 这个组合值得留意。HTTP 传上来的东西全是字符串，`status=1` 到手是 `'1'`，直接进 `@IsEnum` 会挂。加了 `@Type` 之后 `class-transformer` 会先做类型转换再校验，前端传数字还是字符串都能过。

参数不合法时接口的返回长这样，错误信息就是你在 DTO 的 `message` 里写的那句。

![参数校验失败时接口返回的错误响应截图](https://s.poetries.top/uploads/2022/05/21f5a8f9dbfad1f0.png)

换一个字段传错，提示也跟着变。

![另一个字段校验失败时的错误提示截图](https://s.poetries.top/uploads/2022/05/38a1ae106ec9638c.png)

`message` 里写中文提示这件事，前端会很感激你。默认的英文报错像 `password must be longer than or equal to 6 characters`，直接甩给用户看是不合适的。


## 二、进阶篇 配置、鉴权、权限与接口文档

基础那块跑通之后，真实项目里绕不开的就是这几件事。配置怎么按环境拆、文件怎么传、验证码和邮件怎么发、登录态怎么做、权限怎么控、接口文档怎么不用手写。这一节把它们一个一个过。

### 配置抽离

数据库地址、Redis 地址、JWT 密钥、邮箱账号，这些东西散在各个文件里写死，是老项目最常见的技术债。换个环境就要全局搜索改一遍，还很容易把测试库的地址带上生产。配置抽离要解决的就是这个，所有配置进 `src/config` 目录，用的时候统一从 `ConfigService` 里取。

```
yarn add nestjs-config
```

需要说明一下，`nestjs-config` 是当年的社区方案，Nest 官方后来提供了 `@nestjs/config`，用法思路一致但 API 不同。新项目建议直接用官方那个，具体以官方文档为准。下面这套写法给还在用老包的项目做参考。

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

`forRootAsync` 加 `useFactory` 这个组合是关键。数据库模块初始化的时候需要读配置，而配置本身也是一个模块，两者有先后依赖。用异步工厂就是在说「等 ConfigService 准备好了，再拿它的返回值来初始化我」，同步写法在这里会拿到 undefined。

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



这里有个必须提醒的点，`synchronize: true` 千万别带上生产环境。它会让 TypeORM 按实体定义自动改表结构，本地开发很爽，线上一次误改能把字段删掉。正确做法是本地开、生产关，靠 migration 走变更，下面 typeorm 配置那节的写法就是 `process.env.NODE_ENV !== 'production'`。

### 环境配置

配置抽出来之后，下一个问题是同一份配置在开发和生产要取不同的值。

```
yarn add cross-env
```

cross-env的作用是兼容window系统和mac系统来设置环境变量。Windows 上设置环境变量的语法和 macOS、Linux 不一样，团队里有人用 Win 就会踩到，加一层 cross-env 就统一了。

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

这个文件干的事很简单，根据 `NODE_ENV` 决定读哪个 `.env` 文件，然后把里面的键值对灌进 `process.env`。

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

这行 import 必须放在 `main.ts` 的最顶上，比其它 import 都早。因为 `AppModule` 一被导入就会去读 `process.env`，那时候环境变量还没灌进去的话，拿到的全是 undefined。这个顺序问题很隐蔽，本地跑着跑着突然连不上数据库，多半是有人调整了 import 顺序。

还有一条纪律，`.env.prod` 这类含真实密码的文件必须进 `.gitignore`，仓库里只留一份 `.env.example` 说明有哪些字段。



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

读取环境变量 `process.env.MYSQL_HOST`形式。

这套 env 拆分方式和部署是配套的，服务器上放一份 `.env.prod`，构建产物里不带任何密码。具体怎么把 Nest 应用发到服务器上，我另外写过一篇 [Nest 项目部署总结](https://feinterview.poetries.top/blog/nest-deploy-summary)，PM2、Docker、Nginx 那一套都在里面，这里就不重复了。

### 文件上传与下载

文件上传在 Nest 里是用拦截器实现的，这个设计初看有点意外，但想想也合理，`multer` 要在参数注入之前把 multipart 请求体解析完，正好是拦截器的位置。

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

`diskStorage` 里那个 `filename` 回调决定了落盘后的文件名。这里用时间戳加原始 mimetype 的后缀，避免了两个坑，一是中文文件名在某些系统上乱码，二是同名文件互相覆盖。真上生产的话我会再拼一段随机串，光靠毫秒时间戳，并发上传还是可能撞。

单文件上传用 `FileInterceptor`，多文件用 `FilesInterceptor`，参数是前端 formData 里的字段名，前后端对不上就会拿到 undefined。

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

下载那个接口值得单独看一眼。它用 `@Res()` 拿到原生响应对象，手动设了 `Content-Type` 和 `Content-Disposition`，然后把 tar 流直接 pipe 给响应。用流而不是先读进内存再发，是因为导出的文件可能很大，一次性读进内存等着被 OOM。

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

### 实现图片随机验证码

登录接口做了限速还不够，验证码这一层能把脚本刷号的成本再抬一截。

nest如何实现图片随机验证码？先看效果，就是这么一张歪歪扭扭的图。

![svg-captcha 生成的四位随机图形验证码效果图](https://s.poetries.top/uploads/2022/05/58d3d8e7ca89835f.png)

这里使用的是**svg-captcha**这个库，你也可以使用其他的库。选它的理由是输出的是 SVG 而不是位图，不依赖 `canvas` 那套原生编译，Docker 里装起来省心很多。

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
import { Controller, Get, Post, Body, Req, Res, Session } from '@nestjs/common';
import { ToolsService } from '../../utils/tools.service';

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
		console.log('验证码通过')
	}
    return 'hello authcode';
  }
}
```

这段代码有两个点要说。第一，比对的时候两边都 `toUpperCase()` 了，因为 svg-captcha 生成的字符大小写混排，让用户去分辨大小写属于自找麻烦。第二，验证码存在 session 里，所以这个方案依赖前面配好的 `express-session`，多实例部署的话 session 得放 Redis，不然验证码接口和登录接口打到不同进程就永远对不上。

还有一件事这段代码没做，验证一次之后应该立刻把 session 里的 code 清掉。不清的话同一个验证码可以被反复提交，防刷的效果就打折了。

**前端简单代码**

前端就是一个 `img` 指向验证码接口，点击时给 URL 加个随机数强制刷新。

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



### 邮件服务

注册验证、找回密码、异常告警，这几个场景都得发邮件。Nest 这边用 `@nestjs-modules/mailer`，底层是 nodemailer，配置项基本可以照抄 nodemailer 的文档。

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

用 QQ 邮箱当发信服务器有个坑，`auth.pass` 填的不是你的登录密码，是在邮箱设置里单独生成的授权码。填登录密码会一直报认证失败，我第一次接就卡在这儿。另外 465 端口配套的是 `secure: true`，如果改用 587 端口，`secure` 要设成 false 走 STARTTLS。

`template` 那一段是可选的，配上之后可以用 ejs 写邮件模板，比在代码里拼 HTML 字符串舒服太多。开发阶段把 `preview: true` 打开，发信前会自动在浏览器里弹出预览，不用真的发一封出去看效果。

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

发信是个耗时操作，接口里直接 `await` 会把响应时间拉长到好几秒。量大的话建议丢队列异步发，接口只管入队。

### nest基于passport + jwt做登陆验证

终于到登录鉴权。这块是整篇里最值得花时间搞明白的部分，因为它把前面讲的守卫、装饰器、模块导出全用上了。

passport 的核心概念叫策略。一种策略就是一种验证方式，本地账号密码是一种，JWT 是一种，微信扫码、GitHub OAuth 也各是一种。你要做的是实现策略里的 `validate` 方法，剩下的握手流程 passport 帮你走完。

**方式与逻辑**

- 基于passport的本地策略和jwt策略
- **本地策略**主要是验证账号和密码是否存在，如果存在就登陆，返回**token**
- **jwt策略**则是验证用户**登陆时附带的token**是否匹配和有效，如果不匹配和无效则返回**401状态码**

```
yarn add @nestjs/jwt @nestjs/passport passport-jwt passport-local passport
yarn add -D @types/passport @types/passport-jwt @types/passport-local
```


两种策略的分工要分清。本地策略只在登录接口用一次，负责核对账号密码；JWT 策略在之后的每个受保护接口上用，负责验令牌。前者是发通行证，后者是查通行证。

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

`jwtFromRequest` 决定从哪儿取 token。这里用的是 `ExtractJwt.fromHeader('token')`，也就是自定义请求头 `token`。更常见的是 `fromAuthHeaderAsBearerToken()`，走标准的 `Authorization: Bearer xxx`。选哪个都行，关键是前后端约定一致，我见过前端按 Bearer 传、后端按自定义头取，调了半天 401。

`validate` 的返回值会被 passport 挂到 `request.user` 上，后面控制器里 `@Request() req` 拿到的 `req.user` 就是这个东西。所以这里 return 什么，下游就能拿到什么，需要用户角色做鉴权的话记得带上。

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

这个密钥是演示用的，真实项目里必须从环境变量读，也就是前面配好的 `process.env.JWT_SECRET`。硬编码在仓库里等于把签发权公开了，任何人都能伪造出合法的 token。

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

`AuthGuard('local')` 和 `AuthGuard('jwt')` 里那个字符串就是策略名。注意这个 `AuthGuard` 是从 `@nestjs/passport` 导入的，跟前面自己写的那个同名守卫不是一回事，两个都在项目里的话记得改个名字，不然 import 错了很难查。

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

`signOptions: { expiresIn: '10d' }` 这个有效期要按业务定。后台管理系统给 10 天太长了，token 一旦泄露十天内都有效；纯 App 端又不能太短，天天让用户重登会被骂。常见做法是短 token 加 refresh token，这篇没展开。

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

这里有两个细节。第一，查用户时写了 `select: ['username', 'password']`，因为实体里密码字段被标成了 `select: false` 默认不查出来，验证密码时得手动把它加回来。第二，无论是用户名不存在还是密码错误，返回的都是同一句「用户名或密码不正确」，这是刻意的，分开提示等于告诉攻击者哪些账号是存在的。

**使用postman测试**

登录拿到 token，再带着 token 请求受保护接口，效果是这样。

![Postman 中登录获取 token 并携带 token 访问受保护接口的截图](https://s.poetries.top/uploads/2022/05/154d26405e7a471a.png)

### 对数据库的密码加密：md5和bcryptjs

上面登录流程里用到了 `compareSync`，这一节把密码存储单独说清楚。

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

md5 的问题在于同样的输入永远得到同样的输出，网上的彩虹表把常见密码的 md5 值全存好了，一查就还原。上面那个 `e10adc3949ba59abbe56e057f20f883e` 就是 `123456` 的 md5，随便找个在线网站粘进去就能反查出来。

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

加盐能挡住通用彩虹表，但全站共用一个固定盐还是不够。盐一旦泄露，攻击者针对这个盐重新算一遍表就行了。所以真正的答案是下面这个。

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

为什么三个不一样的值都能验证通过？因为 bcrypt 每次哈希会自动生成一个随机盐，并且把盐直接编码进结果字符串里了。看 `$2a$10$` 这个前缀，`2a` 是算法版本，`10` 是计算成本因子，后面那一大串前 22 个字符就是盐。`compareSync` 拿到数据库里的值之后，先把盐抠出来，再用同样的盐去哈希你输入的密码做比对。

所以 bcrypt 根本不需要你自己管盐，也不存在「盐泄露」这回事，每条记录的盐都不一样。那个成本因子还能调，数字越大算得越慢，暴力破解的成本就越高。

推荐使用`bcryptjs`，算法要比`md5`高级。这条结论到今天依然成立，密码存储别用 md5，哪怕加了盐。



### 角色权限

登录解决的是「你是谁」，权限解决的是「你能干什么」。后台管理系统里这块的复杂度往往超出预期，所以值得先把表结构想清楚再动手。

#### RBAC

> RBAC是基于角色的权限访问控制（Role-Based Access Control）一种数据库设计思想，根据设计数据库设计方案，完成项目的权限管理。在RBAC中，有3个基础组成部分，分别是`用户`、`角色`和`权限`，权限与角色相关联，用户通过成为适当角色而得到这些角色的权限。

两个基本概念先定义清楚。

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

先看一个反面例子，理解为什么必须要有「角色」这一层。

只有用户表，菜单表，两者是多对多关系，有一个关联表

**缺点：**

- 新建一个用户时，在用户表中添加一条数据
- 新建一个用户时，在关联表中添加N条数据
- 每次新建一个用户需要添加1+N(关联几个)条数据
- 如果有100个用户，每个用户100个权限，那需要添加10000条数据

数据量只是表象，真正致命的是改起来要命。产品说「所有销售都不能看利润字段了」，你得把每个销售账号的关联记录一条条改。加了角色这一层，改一次角色配置就完事了。

#### 基于RBAC的设计

用户表和角色表的关系设计：

> 如果你希望一个用户可以有多个角色，如：一个人即是销售总监，也是人事管理，就设计多对多关系
> 如果你希望一个用户只能有一个角色，就设计一对多，多对一关系

角色表和权限表的关系设计：

> 一个角色可以拥有多个权限，一个权限被多个角色使用，设计多对多关系

**多对多关系设计**

用户表与角色表是多对多关系，角色表与菜单表是多对多关系。落到表上是这个样子，中间两张关联表是 typeorm 自动生成的。

![用户表、角色表、菜单表以及两张中间关联表的 ER 关系图](https://s.poetries.top/uploads/2022/05/df5b0726d1260958.png)

**更加复杂的设计**

大型系统还会再加上部门、用户组、数据权限这些维度，表就长成下面这样。

![包含部门、用户组、数据权限的复杂 RBAC 表结构设计图](https://s.poetries.top/uploads/2022/05/58f62ca515da28df.png)

不是说越复杂越好。表越多，联表查询越慢，后台配置界面也越难做，选哪个方案取决于你的系统真的有多少角色和多少人在用。

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

#### 数据库实体设计

把上面的关系翻译成 typeorm 实体，一共四个。看的时候重点盯 `@ManyToMany` 和 `@JoinTable` 出现在哪一侧，`@JoinTable` 只写在关系的主导方，写两边会生成两张中间表。

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

权限表这里用了 `@Tree('closure-table')`，因为权限天然是树形的，模块下面挂菜单，菜单下面挂按钮操作。闭包表这种存储方式查任意层级的子孙节点很快，代价是额外维护一张关系表。层级不深的话用 `materialized-path` 也行。

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

#### 接口实现

由于要实现很多接口，这里只说明一部分，其实都是数据库的操作，所有接口如下。

![RBAC 权限系统涉及的全部接口列表截图](https://s.poetries.top/uploads/2022/05/ea6301b6c0da9373.png)

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
    if (!userinfo) ToolsService.fail('用户所属部门或角色数据异常');

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

这段里那句拼接 SQL 必须提醒一下。`and user.id = ${uid}` 是字符串拼接，虽然这里 `uid` 已经被 `ParseIntPipe` 转成了数字风险不大，但这个写法本身是 SQL 注入的标准姿势，换个地方接了个字符串参数就出事了。TypeORM 的 `query` 支持参数占位，写成 `query(sql, [uid])` 并把 SQL 里改成 `?`，成本几乎为零。我把这条当成硬性纪律，任何时候都不在 SQL 里拼变量。

另外原代码里 `result[0]` 直接取值，如果这个用户没配部门，联表查出来是空数组，下一行访问属性就是 `Cannot read property of undefined`，所以上面补了一句判空。

**结合passport + jwt 做用户登陆授权验证**

> 在验证账户密码通过后，passport 返回用户，然后根据用户id获取用户信息，存储token，用于路由守卫，还可以使用redis存储，以作他用。

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

把角色信息塞进 token 是这套设计的关键取舍。好处是每次鉴权不用再查库，守卫直接解 token 就知道你是谁、有什么角色。代价是角色变更不能实时生效，管理员刚把你降级，你手上的旧 token 在过期前还是有效的。要实时就得每次查 Redis 或者数据库，看你的业务能接受哪种。

#### **后端的权限访问**

> 使用守卫，装饰器，结合token，验证访问权限

前面讲切面的时候埋的伏笔在这里收线，守卫加自定义装饰器加反射器，三个东西合起来才是一套可用的权限控制。

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

这个守卫里有一处设计值得学，`if (!authRoles) return true`。没被 `@Roles()` 装饰过的接口默认放行，只有明确声明了需要什么角色的接口才做校验。这样加权限是「加装饰器」而不是「改守卫」，新接口默认可访问，符合大多数后台系统的习惯。

反过来如果你的系统是「默认全部禁止」，那这行就要改成 `return false`，然后给公开接口单独标白名单。两种策略没有绝对优劣，但必须在项目开始时就定下来，中途换会漏。

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

这里补一句我的看法。前端根据权限表隐藏菜单和按钮，那只是体验优化，不是安全措施。真正的防线永远在后端的守卫上，前端藏了按钮，接口地址照样能被直接调。两边都要做，但优先级不一样。

### 定时任务

有些活不是请求触发的，比如每天凌晨算一遍报表、每小时同步一次第三方数据、定时清理过期文件。

nest如何开启定时任务？

**定时任务场景**

> 每天定时更新，定时发送邮件

没有controller，因为定时任务是自动完成的。这也是它和普通模块最大的区别，没有入口路由，模块被加载时任务就自动注册到调度器里了。

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

  @Cron('45 * * * * *')  // 每分钟的第45秒执行一次
  handleCron() {
    this.logger.debug('Called when the second is 45');
  }

  @Interval(10000)  // 每隔10秒执行一次
  handleInterval() {
    this.logger.debug('Called every 10 seconds');
  }

  @Timeout(5000)  // 服务启动5秒后执行一次，只执行这一次
  handleTimeout() {
    this.logger.debug('Called once after 5 seconds');
  }
}
```

三个装饰器的语义完全不同，别混着用。`@Cron` 按 cron 表达式在固定时刻触发，`@Interval` 按固定间隔重复，`@Timeout` 只在服务启动后延迟执行一次。做数据初始化预热用 `@Timeout`，做心跳用 `@Interval`，做「每天凌晨两点」这种用 `@Cron`。

自定义定时时间

```js
// * * * * * * 六位分别对应
// 第1个星：秒
// 第2个星：分钟
// 第3个星：小时
// 第4个星：一个月中的第几天
// 第5个星：月
// 第6个星：一个星期中的第几天

// 如：
// 45 * * * * *  每分钟走到第45秒时执行一次，一小时执行60次
// 0 0 2 * * *   每天凌晨2点整执行一次
```

这里更正一下原来笔记里的说法。`45 * * * * *` 不是「每隔 45 秒执行一次」，它是「每分钟的第 45 秒执行一次」，效果上是每 60 秒一次。cron 表达式描述的是时刻不是间隔，要表达真正的固定间隔应该用 `@Interval` 或者写成 `*/45 * * * * *` 这种步长语法。这个坑我一开始也踩过，以为配了个 45 秒的轮询，实际跑起来完全对不上。

还有个更要紧的事，定时任务在多实例部署下会被重复执行。PM2 起了四个进程，凌晨两点的任务就跑四遍。要么用分布式锁（Redis 的 `SET NX` 就够），要么单独起一个只跑任务的实例。

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



### 接入Swagger接口文档

手写接口文档这件事，写的时候烦，更烦的是改完代码忘了同步文档，前端照着过期文档联调，最后互相扯皮。Swagger 把文档从代码里直接生成出来，改了代码文档自动跟着变。

- 优点：不用写接口文档，在线生成，自动生成，可操作数据库，完美配合`dto`
- 缺点：多一些代码，显得有点乱，习惯就好

我自己的感受是，缺点那条确实存在，控制器上会多出一堆 `@ApiOperation`，一眼看过去有点糊。但跟「文档和实现对不上」比起来，这点代码噪音完全能接受。

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



`addBearerAuth()` 加上之后，Swagger 页面右上角会出现一个 Authorize 按钮，把登录拿到的 token 填进去，后续所有接口调试都会自动带上，不用每个接口手动加请求头。`addServer` 可以配多个环境，在页面上切换就能对着不同的后端调。

生产环境要不要暴露这个文档页，得想清楚。它把你所有接口的入参出参都写在明面上了，至少加个访问控制或者干脆按环境变量决定挂不挂。

**swagger装饰器**

规范本身见 https://swagger.io/ ，Nest 这边常用的装饰器就下面这些。

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
  @ApiOperation({ summary: '查找全部用户', description: '分页查询用户列表' })
  @ApiQuery({ name: 'limit', required: true })  // 请求参数
  @ApiQuery({ name: 'offset', required: true }) // 请求参数
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
  @ApiBody({ type: UpdateUserDto, description: '参数可选' })  // 请求体
  @ApiResponse({   // 响应示例
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

这就是前面说的「一份 DTO 三处受益」。同一个类上，`class-validator` 的装饰器管校验，`@ApiProperty` 管文档，TypeScript 的类型管编译期检查。

创建

```js
import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'kitty', description: '用户名' })  // 添加这里即可
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
  @ApiProperty({ description: '用户名', example: 'kitty', required: false })  // 不是必选的
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

配置完打开 `localhost:3000/api-docs` 就能看到文档并直接测试接口。注意端口要和你 `main.ts` 里 `app.listen` 的实际端口对上。

![Swagger 文档首页，按 ApiTags 分组展示所有接口](https://s.poetries.top/uploads/2022/05/dd04126877af210f.png)

展开某个接口，参数示例、字段说明、响应结构全是从 DTO 上的装饰器生成的，还能直接点 Try it out 发请求。

![Swagger 接口详情页，展示由 DTO 生成的请求参数和响应示例](https://s.poetries.top/uploads/2022/05/98f40271e2f2ed11.png)

到这里，一个能跑的后端服务该有的东西基本齐了。剩下的就是数据怎么存。

## 三、数据库篇 MongoDB、TypeORM 与 Redis

后端最后都要落到数据上。这一节先过一遍 MongoDB 的接法，然后重点是 TypeORM 操作 MySQL，实体怎么设计、有几种访问数据库的姿势、增删改查有哪几种写法、事务怎么开、一对一一对多多对多的关系怎么落到表结构上，最后是 Redis 的接入和单点登录。

### nest连接Mongodb

先从简单的开始。MongoDB 不用建表、字段随时能加，做原型和存日志类数据很方便，Nest 这边通过 `@nestjs/mongoose` 接。

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

Mongo 本身不校验结构，Schema 是 mongoose 在应用层加的一层约束。不定义也能存，但那样字段拼错了都没人告诉你，几个月后集合里就会出现 `autor` 和 `author` 并存的惨状。

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

`forFeature` 和 `forRoot` 的分工要分清。`forRoot`（或 `forRootAsync`）在根模块里建连接，全局只做一次；`forFeature` 在业务模块里注册这个模块要用哪些 Model，做的是局部绑定。漏了 `forFeature` 的表现是注入时报「找不到 ArticleModel」。

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

浏览器测试 http://localhost:9000/api/mongodb/list ，能看到列表数据就说明连通了。

![浏览器访问 mongodb 列表接口返回的 JSON 数据截图](https://s.poetries.top/uploads/2022/05/e14c1f5173139807.png)

### typeORM操作Mysql数据库

Mongo 那套接完，重头戏才开始。国内绝大多数业务系统还是跑在 MySQL 上，Nest 官方推荐的 ORM 是 TypeORM，接下来几节都围绕它展开。

mac中，直接使用`brew install mysql`安装mysql，然后启动服务`brew services start mysql` 查看服务已经启动`ps aux | grep mysql`

Nest 操作Mysql官方文档：https://docs.nestjs.com/techniques/database

```
npm install --save @nestjs/typeorm typeorm mysql
```

**配置数据库连接地址**

下面这份配置里有几个选项是踩过坑才加上的，值得逐条看。

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

`synchronize` 前面说过了，生产必关。`timezone: '+0800'` 不配的话，存进去的时间和查出来的时间会差八小时，这是国内项目百分之百会遇到的问题。`autoLoadEntities: true` 开了之后就不用手动维护 `entities` 数组，凡是 `forFeature` 注册过的实体自动加载。`retryAttempts` 和 `retryDelay` 是给容器化部署准备的，数据库容器比应用容器起得慢的时候，应用会重试而不是直接崩掉。

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

实体就是「一个 TS 类对应一张表」。类名映射表名，属性映射列，装饰器上的选项映射列定义。下面这段还顺带把 MySQL 支持的列类型和 `ColumnOptions` 的全部可用选项列了出来，当速查表用很方便。

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

和 Mongo 那边一样，实体也要在业务模块里用 `forFeature` 注册一遍才能注入。

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



### nest统一处理数据库操作的查询结果

数据库能连上、能读能写之后，第一个绕不开的工程问题就是错误怎么返回。

> 操作数据库时，如何做异常处理？比如id不存在，用户名已经存在？如何统一处理请求失败和请求成功？

前面讲过滤器和拦截器的时候埋的伏笔，在这里正式用起来。

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

这套写法的好处，是 service 里再也不用写 `return { code: -1, msg: 'xxx' }` 这种东西。直接 throw，剩下的交给框架。controller 也干净了，一行 `return await this.userService.findOne(id)` 结束。

不过每次都写六行 `throw new HttpException({...})` 太啰嗦，封装一下。

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

封装成 `ToolsService.fail('用户名已存在')` 之后，一行搞定，可读性反而更好。这里用的是静态方法，不需要注入就能调，写业务的时候很顺手。

配好之后，失败的响应长这样，格式来自过滤器。

![请求失败时统一格式的错误响应截图](https://s.poetries.top/uploads/2022/05/fe6da80fe7b316ce.png)

成功的响应长这样，格式来自拦截器。两条路径的结构对齐了，前端只需要判断 `status` 一个字段。

![请求成功时统一格式的响应截图](https://s.poetries.top/uploads/2022/05/e0c55c5a0e22af66.png)

这套「service 抛异常、过滤器管失败、拦截器管成功」的组合，是我从这篇笔记里带走的最实用的一个模式，后来的项目基本都是这么搭的。

### 数据库实体设计与操作

> typeorm的数据库实体如何编写？
> 数据库实体的监听装饰器如何使用？

实体写得好不好，直接决定了后面写查询有多痛苦。这一节把常用装饰器和列选项过一遍。

#### 实体设计

先看一个最简单的例子。



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

`@DeleteDateColumn` 值得单独说，它开启的是软删除。加上这个字段之后，`softRemove` 删掉的记录还在表里，只是被打了删除时间，`find` 默认查不到，需要的时候还能 `recover` 回来。业务数据基本都该用软删，用户点了删除又后悔的情况太常见了。

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

这几个选项里，`select: false` 是最容易被忽略但最该用的一个。密码、手机号、身份证这类字段设成 `false`，默认查询就不会带出来，从源头上避免了「接口不小心把密码返回给前端」这种事故。要用的时候再用 `addSelect` 显式加回来。

`comment` 也建议每个字段都写。别人用 Navicat 直接看表结构时，中文注释比字段名管用多了。

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

程序跑起来之后，`synchronize` 会按这份实体自动建表，在数据库里看到的结构是这样的，注释和默认值都对上了。

![Navicat 中查看自动生成的 users 表结构，含中文注释和默认值](https://s.poetries.top/uploads/2022/05/648cf1e9823e51c1.png)

#### **抽离部分重复的字段：使用继承**

每张表都要写一遍 id、创建时间、更新时间、删除时间，抄四遍就烦了，而且哪天要改字段名得改一圈。

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

`users`表继承自`baseEntity`，就不需要写创建时间，修改时间，自增`ID`等重复字段了。其他的表也可以继承自`baseEntity`，减少重复代码。

这里有个细节要注意，基类上不应该加 `@Entity()`，否则 TypeORM 会把它也当成一张真表去建。正确的做法是基类只用普通类或者标 `@Entity()` 的抽象形式，具体以你所用版本的官方文档为准。原文这段代码基类上带了 `@Entity()`，跑起来数据库里会多一张空的 `base_entity` 表，去掉就好。

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

#### **实体监听装饰器**

实体上还能挂生命周期钩子，在数据进出数据库的那一刻做点手脚。典型场景是插入前自动加密密码、查出后自动脱敏手机号，把这类逻辑固定在实体上，比散在每个 service 里可靠得多，不会有人忘了调。

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

用生命周期钩子有个前提，它只在通过实体对象操作时才触发。用 `QueryBuilder` 批量 update 或者直接跑原生 SQL，钩子是不会执行的。所以别把关键的业务约束只放在钩子里。

### typeorm增删改查操作

这一节信息量最大，也是最容易劝退的地方。TypeORM 提供的写法实在太多了，先建立一张地图，再挑两种常用的深入。

> 访问数据库的方式有哪些？
> typeorm增删改查操作的方式有哪些？

#### **多种访问数据库的方式**

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

使用的方式太多，建议使用第二种和第四种，比较方便。

我的建议更明确一点，在 Nest 项目里就用第二种，也就是 `@InjectRepository` 注入。理由是它走的是依赖注入，测试时能轻松替换成 mock，而 `getConnection()` 这类全局函数是硬编码的模块级依赖，写单测的时候会很难受。

顺便提醒，`getConnection`、`getRepository`、`getManager` 这批全局函数在 TypeORM 后来的版本里被标记废弃并做了调整，新项目别再用了。具体的替代方案以官方文档为准，思路上都是转向显式的 DataSource。

**Connection核心类：**

- `connection`                           等于`getConnection`
- `connection.manager`                   等于`getManager`， 等于`getConnection.manager`
- `connection.getRepository`             等于`getRepository`， 等于`getManager.getRepository`
- `connection.createQueryBuilder`        使用`QueryBuilder`
- `connection.createQueryRunner`         开启事务


`EntityManager` 和 `Repository`都封装了操作数据的方法，注意两者的使用方式是不一样的。`getManager`是`EntityManager`的类型，`getRepository`是`Repository`的类型。两者都可以使用`createQueryBuilder`，但使用的方式略有不同。

区别其实就一条，`Repository` 是绑定了某个实体的，方法里不用再传实体；`EntityManager` 是不绑定的，每个方法第一个参数都得告诉它操作哪张表。日常写业务用 Repository，事务里跨多张表用 EntityManager，分工就这么简单。

原作者在这里吐槽了一句「实在不明白搞这么多方法做什么，学得头大」，这个感受我完全共鸣。刚上手确实容易被这几套 API 绕晕，但记住上面那条区别之后就清楚了。

#### **增删改查的三种方式**

- 第一种：使用sql语句，适用于sql语句熟练的同学
- 第二种：`typeorm`封装好的方法，增删改 + 简单查询
- 第三种：`QueryBuilder`查询生成器，适用于关系查询，多表查询，复杂查询
- 其实底层最终都会生成`sql`语句，只是封装了几种方式而已，方便人们使用。

选哪种不是品味问题，是场景问题。单表简单查询用封装好的方法最省事，多表关联和动态条件拼接用 QueryBuilder，遇到复杂统计、窗口函数这种 ORM 表达不了的，老老实实写 SQL。三种混着用完全正常。

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

写原生 SQL 的时候再强调一遍，参数一律用占位符传，别拼字符串。`query('select * from users where id = ?', [id])` 和 `query('select * from users where id = ' + id)` 看起来只差几个字符，安全性差了一个数量级。

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

下面这份是 Repository 上常用方法的速查表，按增删改查分类整理。这块建议收藏，写业务的时候查起来比翻文档快。

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

`save` 和 `insert` 的区别值得单独记一下。`save` 会先查一下这条记录在不在，在就更新不在就插入，还会级联处理关联关系，方便但慢；`insert` 直接执行 INSERT，不管关系也不做检查，快但你得自己保证数据是新的。批量导入用 `insert`，日常业务用 `save`。

另外注意最后那两个「谨用」的方法。`findOneOrFail` 抛的是 TypeORM 自己的错误，绕过了我们前面配好的异常过滤器，最后会变成一个没有任何有用信息的 500。`clear()` 就更狠了，它是 TRUNCATE，一秒清空整张表且不可回滚，我建议直接在代码规范里禁掉。

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

`relations` 这个选项很方便，一行就把关联表带出来了，但它生成的是 LEFT JOIN，关联多了会让查询变重。列表接口尤其要克制，用户列表里带出每个人的所有订单，翻两页就卡住了。

`cache: 60000` 是 TypeORM 自带的查询缓存，默认存在数据库的一张表里，也可以配成 Redis。字典类、配置类的查询开一下很划算。

**find进阶选项**

TypeORM 提供了许多内置运算符，可用于创建更复杂的查询。这些运算符让你不用写字符串条件也能表达 `!=`、`BETWEEN`、`IN` 这类逻辑。

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

使用链式操作。QueryBuilder 是三种方式里最灵活的，条件可以按业务动态往上加，也能拿到生成的 SQL 去核对。前面文章服务里那段分页查询就是用它写的。

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

用 QueryBuilder 做增删改有一点要注意，它返回的不是实体对象而是原始执行结果，得看 `raw.affectedRows` 判断到底改动了几行。想拿到改完之后的完整数据，还得再查一次。

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

下面把 QueryBuilder 的各个环节拆开讲，从最基础的单表查询开始。

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

三种方式的差别只在于「实体是在哪一步指定的」，写法不同结果一样。用 Repository 注入的话就是方式三，最简洁。

获取结果的方法有好几个，选错了拿到的数据结构完全不一样。

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

对比一下上面两个返回结果就明白了。`getOne` 出来的字段名是实体里定义的驼峰命名，`getRawOne` 出来的是「别名下划线数据库列名」这种原始形态。日常业务用 `getOne` 和 `getMany`，只有做聚合统计、返回的东西已经不是一个完整实体的时候才用 raw 系列。

`getSql()` 强烈建议养成习惯。写复杂查询的时候先把它 log 出来，扔进数据库客户端跑一遍，比对着代码猜快多了。

查询部分字段

```js
.select(["user.id", "user.name"])
实际执行的sql语句：SELECT user.id, user.name FROM users user；

添加隐藏字段：实体中设置select为false时，是不显示字段，使用addSelect会将字段显示出来
.addSelect('user.password')
```

`where`条件是最常用的一块，注意这里用的是 `:name` 这种命名占位符，TypeORM 会做参数绑定，不存在注入问题。

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

这里有个坑我踩过，多个条件时 `.where()` 只能调一次，第二个条件之后要用 `.andWhere()` 或 `.orWhere()`。连着写两个 `.where()`，后面那个会把前面的覆盖掉，查出来的数据莫名其妙多了一堆，还很难发现。

`having`筛选，注意它作用在分组之后，跟 `where` 的执行阶段不一样。

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

关系查询（多表）是 QueryBuilder 真正比封装方法强的地方，join 的类型和附加条件都能自己控制。

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

`leftJoinAndSelect` 和 `leftJoin` 差一个 `AndSelect`，效果差很多。带 `AndSelect` 的会把关联表的字段一起查出来放进结果，不带的只做连接用于筛选条件，结果里看不到关联数据。想「按订单状态筛用户但不需要订单详情」，就用不带 Select 的那个，能省不少传输量。

到这里 TypeORM 的查询部分就过完了。接下来是写操作里最需要小心的东西。

### typeorm使用事务的3种方式

`typeorm`使用事务的方式有哪些？如何使用？

**事务**

> - 在操作多个表时，或者多个操作时，如果有一个操作失败，所有的操作都失败，要么全部成功，要么全部失
> - **解决问题**：在多表操作时，因为各种异常导致一个成功，一个失败的数据错误。

> 例子：银行转账
> 如果用户1向用户2转了100元，但因为各种原因，用户2没有收到，如果没有事务处理，用户1扣除的100元就凭空消失了
> 如果有事务处理，只有用户2收到100元，用户1才会扣除100元，如果没有收到，则不会扣除。

**应用场景**

> 多表的增，删，改操作

**nest-typeorm事务的使用方式**

1. 使用装饰器，在`controller`中编写，传递给`service`使用
2. 使用`getManager` 或 `getConnection`，在`service`中编写与使用
3. 使用`connection` 或 `getConnection`，开启`queryRunner`，在`service`中编写与使用

先说结论，我推荐第二种。第一种把事务边界暴露到了 controller 层，controller 本不该知道底层有没有事务这回事，而且 `@Transaction()` 这套装饰器在 TypeORM 后续版本里已经被废弃了。第三种手动控制粒度最细，能自己选隔离级别，但要记得 commit、rollback、release 一个都不能漏，代码噪音大。第二种在灵活性和简洁度之间最平衡。

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
- 如果你不会1对1关系，请先去学习对应的知识，下一节就会讲

两张表的关系是这样的，`users` 是主表，`avatar` 带外键是副表。

![users 表与 avatar 表的一对一关系示意，avatar 表持有 user 外键](https://s.poetries.top/uploads/2022/05/24be5e00069ab400.png)

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

这里有个关键点很容易写错。事务里的所有数据库操作必须都走 `manager`，只要有一句用了外面注入的 `usersRepository`，那句就跑在事务之外，出错时不会回滚。上面代码里查用户用的是 `usersRepository`（只读，无所谓），保存全用的 `manager`，这个分寸要拿捏好。

**方式二：使用getManager 或 getConnection**

这种写法把事务边界收在了 service 内部，controller 完全不知情，我平时用的就是它。

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

回调函数正常返回就自动提交，抛异常就自动回滚，不用自己写 try catch。这个 API 设计得很省心。

**方式三：使用 connection 或 getConnection**

手动挡。粒度最细，也最容易出错，`release()` 忘了写会泄露连接，压测时表现为连接池被耗干。

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

注意方式三的 catch 分支里只做了回滚没有重新抛出异常，这样上层拿到的是 `undefined`，接口会返回一个空成功。实际项目里 catch 完应该 `throw` 出去，让异常过滤器接管，不然出了问题前端完全无感知。

事务讲完，接下来三节是关系设计，这是 ORM 里最绕但也最有价值的部分。

### typeorm 一对一关系设计与增删改查

实体如何设计一对一关系？如何增删改查？

**一对一关系**

> - 定义：一对一是一种 A 只包含一个 B ，而 B 只包含一个 A 的关系
> - 其实就是要设计两个表：一张是主表，一张是副表，查找主表时，关联查找副表
> - 有外键的表称之为副表，不带外键的表称之为主表
> - 如：一个账户对应一个用户信息，主表是账户，副表是用户信息
> - 如：一个用户对应一张用户头像图片，主表是用户信息，副表是头像地址

判断谁是主表谁是副表，只看外键在哪边，外键在谁那儿谁就是副表。这个规则贯穿后面三节，记住能省很多事。

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

`@JoinColumn()` 是这里的关键，它只写在副表一侧，写了它 TypeORM 才知道该在哪张表上生成外键列。两边都写或者都不写都会出问题。

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

这段 service 代码里有几个可以直接拿走的写法。查关联数据有两条路，`findOne(id, { relations: ['avatar'] })` 简洁，`leftJoinAndSelect` 灵活，看需求选。创建实体也有两条路，`repository.create({...})` 一行搞定，`new Entity()` 再逐个赋值适合有条件判断的场景。删除的时候注意，`manager.delete(AvatarEntity, { user: id })` 只删了副表数据，用户还在，这通常才是你想要的行为。

### typeorm 一对多和多对一关系设计与增删改查

一对多是实际项目里出现频率最高的关系，用户和订单、文章和评论、分类和商品，都是它。

实体如何设计一对多与多对一关系，如何关联查询

**一对多关系，多对一关系**

> 定义：一对多是一种一个 A 包含多个 B ，而多个B只属于一个 A 的关系
> 其实就是要设计两个表：一张是主表（一对多），一张是副表（多对一），查找主表时，关联查找副表
> 有外键的表称之为副表，不带外键的表称之为主表
> 如：一个用户拥有多个宠物，多个宠物只属于一个用户的（每个宠物只能有一个主人）
> 如：一个用户拥有多张照片，多张照片只属于一个用户的
> 如：一个角色拥有多个用户，多个用户只属于一个角色的（每个用户只能有一个角色）

一对多和多对一其实是同一个关系的两个视角。从用户看是「一个用户多张照片」，从照片看是「多张照片属于一个用户」，数据库里只有一个外键，就在照片表上。

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
  photos: PhotoEntity[];
}
```

这里更正原文一处类型笔误，`@OneToMany` 修饰的属性应该是数组类型 `PhotoEntity[]`，写成单个实体在 TypeScript 层面就说不通了，运行时拿到的确实是数组。

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

**令人头大的地方**：建立关系和查找使用实体，删除使用实体的id，感觉设计得不是很合理，违背人的常识。

这个吐槽很到位，我第一次写也别扭了半天。建立关系时 `photoEntity.userinfo = user` 要传整个实体对象，删除时 `manager.delete(PhotoEntity, { userinfo: id })` 又只要 id。原因是前者走的是 ORM 的对象关系映射，后者走的是直接生成 DELETE 语句，两条路径根本不是一套逻辑。知道原因之后就不别扭了，但确实不够直观。

下面这段更新逻辑是全文最复杂的一块，值得慢慢看。它要处理的场景是前端传来一个新的图片列表，其中有的是老图（带 id）、有的是新图（无 id）、还有的老图被删掉了（不在列表里）。

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



这段更新逻辑的思路可以总结成一句话，以前端传来的列表为基准，数据库里有但列表里没有的就删，列表里有 id 的就改，没 id 的就新增。这个模式在做「编辑带子表的表单」时会反复用到，图片列表、SKU 列表、附件列表都是这个套路。

有个性能上的小提醒，这段代码在循环里逐条 `await`，图片多了就是 N 次数据库往返。数据量大的话可以攒成数组批量操作，或者用 `In()` 一次删掉所有多余的。

### typeorm 多对多关系设计与增删改查

最后一种关系，也是唯一需要中间表的。

> 实体如何设计多对多关系？如何增删改查？

**多对多关系**

> 定义：多对多是一种 A 包含多个 B，而 B 包含多个 A 的关系
> 如：一个粉丝可以关注多个主播，一个主播可以有多个粉丝
> 如：一篇文章属于多个分类，一个分类下有多篇文章
> 比如这篇文章，可以放在nest目录，也可以放在typeorm目录或者mysql目录

**实现方式**

> 第一种：建立两张表，使用装饰器`@ManyToMany`建立关系，`typeorm`会自动生成三张表
> 第二种：手动建立3张表

这里使用第一种。什么时候需要第二种？当中间表本身要带业务字段的时候，比如「关注时间」「是否特别关注」。这种情况下中间表其实已经变成了一个独立实体，得手动建，然后拆成两个一对多关系来处理。

#### **实体设计**

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

为了测试方便，你可以在users表和star表创建一些数据，这些属于单表操作，直接在数据库客户端里插几行就行。

![数据库中 users 表和 star 表的测试数据截图](https://s.poetries.top/uploads/2022/05/f9afb65f660699e8.png)

`@JoinTable()` 写在哪一边，就决定了自动生成的中间表叫什么名字、字段顺序如何。写在 users 这边生成的是 `users_follows_star`。业务上通常把「主动方」当主表，粉丝主动关注明星，所以 `@JoinTable` 放在用户这一侧。

#### **多对多增删改查**

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



多对多的增删改在写法上反而是最统一的，全都是「构造一个只带 id 的主表实体，把 follows 数组设成你想要的最终状态，然后 save」。TypeORM 会自己算出中间表要加哪几行、删哪几行，不用你手动操作中间表。删除某一个关注就是先查出当前列表、filter 掉一个、再整体赋值回去，这个思路很好用。

有一点要小心，`userEntity.follows = []` 会清空所有关联。如果你只是想更新用户名却顺手 `new` 了个实体没带 follows，TypeORM 不会动关联；但显式赋了空数组就是真的全删。这个边界搞错过一次，用户的关注列表全没了。

数据库这块到这里就完整了。最后补上缓存。

### nest连接Redis

Redis 在后端项目里的位置很特殊，它不是「另一个数据库」，而是挡在数据库前面的一层。缓存热点数据、存登录 token、做分布式锁、做限流计数器，都靠它。

先把常用命令过一遍，这些在 `redis-cli` 里直接敲就能验证。

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

- 设置值hmset ：`hmset zhangsan name "张三" age 20 sex "男"`
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

这五种数据结构对应的场景很清楚。String 存序列化后的对象和 token，List 做简单队列，Set 做去重和标签，Hash 存对象的部分字段更新，发布订阅做跨进程通知。选对结构比写多少代码都管用。

顺便强调一下，`flushall` 是清空所有数据库的所有 key，线上敲这个命令等于自杀，很多公司会在 redis 配置里直接把它 rename 掉。

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

不建议在业务代码里到处直接调 redis client。封装一层 `CacheService`，把 JSON 序列化反序列化、client 未就绪的兜底都收在里面，业务侧只管 `set` 和 `get`。哪天要换 redis 客户端库，改一个文件就行。

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

这段封装里 `set` 方法做了 `JSON.stringify`，所以 `get` 出来必须 `JSON.parse`。看起来是小事，但它决定了后面单点登录那段代码里为什么要写 `JSON.parse(cacheToken)`，两边必须成对，少一边就永远比不上。

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

### 集成redis实现单点登录

Redis 接好了，来看一个真实场景。JWT 本身是无状态的，服务端不存任何东西，这是它的优点也是它的短板，你没法主动让一个已签发的 token 失效。想做「一个账号只能在一处登录」，就必须借助一个有状态的存储，Redis 正合适。

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
    await this.redisService.set(`user-token-${id}`, access_token, 60 * 60 * 24);  // 在这里使用redis
    return access_token;
  }
}
```

登录之后去 Redis 里看，`user-token-1` 这个 key 里存的就是刚签发的 token，过期时间设成了 24 小时，和 JWT 的有效期保持一致。

![Redis 中存储的 user-token 键值以及过期时间截图](https://s.poetries.top/uploads/2022/05/f134cb6419f34607.png)

有了这个 key，踢人下线就变成了一件很简单的事，删掉对应的 key 就行。

**验证token**

关键在 JWT 策略的 `validate` 里加一次比对。

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
    const cacheToken = await this.redisService.get(`user-token-${id}`);  // 获取redis的key

    //单点登陆验证
    if (!cacheToken || token !== JSON.parse(cacheToken)) {
      ToolsService.fail('您账户已经在另一处登陆，请重新登陆', 401);
    }
    return { username: payload.username };
  }
}
```

注意这里必须加 `passReqToCallback: true`，不然 `validate` 的第一个参数拿不到 `req`，也就没法把请求头里的原始 token 抠出来做比对。这是我实现这套东西时卡住的地方，`validate(payload)` 里只有解出来的载荷，没有原文。

思路本身很直白，同一个账号第二次登录会覆盖 Redis 里的 token，第一处登录的客户端下次请求时，本地 token 和 Redis 里的对不上，就被判定为「已在别处登录」。两个 token 都是合法有效的 JWT，区分它们的唯一依据就是 Redis 里那份。

这套方案我只在单机 Redis 上验证过，主从或集群模式下有没有主从延迟导致的边界问题，我没实测过。

## 四、常见问题

这些是我自己学的时候真的卡住过、翻了半天文档才想明白的点。

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

先回答「为什么还需要在A的module.ts中导入B模块」。

因为 `BService`的作用域只在 `BModule`里，所以你要在 `AController`里直接用，就会报错拿不到实例。

这里的关键是要把两件事分开看。`@Injectable()` 只是给这个类打了个标记，说「我可以被容器管理」，它不负责决定谁能拿到实例。真正决定可见性的是模块的 `exports` 和 `imports` 这一对。B 模块 `exports` 了 BService，A 模块 `imports` 了 BModule，A 的容器里才有 BService 这个 provider 可以注入。少任何一环，启动时就会报 `Nest can't resolve dependencies`。

所以 TypeScript 层面 import 成功、编译也过，跟运行时能不能注入，完全是两回事。这一点想通了，Nest 的依赖注入基本就没什么坑了。

再来说「有什么办法可以让 `BService`随处直接用」，参考如下手段。

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

`@Global()` 好用但别滥用。全局模块适合的是那种真的到处都要用的基础设施，比如配置、日志、Redis 缓存服务。业务模块一旦标成全局，模块边界就形同虚设了，过半年再看这个项目，你根本说不清哪个模块依赖了哪个模块。我自己的原则是，全局模块不超过三个。

关于『你的理解』部分，`@Inject` 和 `@Injectable` 是两个不同的东西，很容易混。`@Injectable()` 装饰的是「被注入的那个类」，`@Inject()` 用在「注入的位置」上，一般配合自定义 token 使用。建议再读一读这个部分的文档，多做些练习和尝试，自己感受下每个 api 的特点。

最后，官网文档里其实有介绍，看`依赖注入`这一节 https://docs.nestjs.com/modules#dependency-injection

### Q：循环依赖怎么办

A 模块要用 B 的服务，B 模块又要用 A 的服务，启动直接失败。这个我踩过，两个模块拆得不够干净就会撞上。Nest 提供了 `forwardRef()` 来打破这个环，两边的 imports 和构造函数注入都要包一层。

不过我更建议先想想能不能不循环。大多数循环依赖是分层没分好的信号，把两个模块共用的那部分逻辑抽成第三个模块，环自然就断了。`forwardRef` 是止血，不是治本。

### Q：为什么全局守卫里注入的依赖是 undefined

这个在前面限速那一节提过一次，值得单独拎出来。用 `app.useGlobalGuards(new AuthGuard())` 注册的守卫是你手动 `new` 出来的，没有经过 IoC 容器，构造函数里声明的 `Reflector`、`JwtService` 一个都注不进来。

解法是改用 `APP_GUARD` 这个注入令牌，在模块的 `providers` 里注册。过滤器、拦截器、管道也有对应的 `APP_FILTER`、`APP_INTERCEPTOR`、`APP_PIPE`。凡是全局切面里需要注入服务的，一律走这条路。

### Q：数据存进去查出来差了 8 小时

TypeORM 连接配置里加 `timezone: '+0800'`，同时确认 MySQL 服务端的时区设置。这两处对不上就会差八小时，几乎是国内每个项目都要处理一次的问题。

更稳妥的做法是数据库统一存 UTC，展示层再按用户时区转换，但那需要前后端一起配合，改造成本不低。小项目直接锁东八区最省事。

## 总结

把这一整篇顺下来，NestJS 真正需要你转变思路的其实就三件事。

第一件是分层。控制器只做收发，服务承载业务，模块负责组装和暴露边界。这套约定听起来像老生常谈，但 Nest 把它变成了框架层面的强制，你想违反都得费点劲。写惯了之后回头看裸 Express 项目，会很不适应。

第二件是切面。中间件、守卫、拦截器、管道、异常过滤器，五个位置各司其职，顺序是框架定死的。理解这个顺序之后，很多问题都有了固定答案，鉴权放守卫、参数校验放管道、统一响应放拦截器、统一报错放过滤器、全量日志放中间件。业务代码因此能保持干净。

第三件是数据层。TypeORM 提供的写法确实太多了，但真正日常要用的就是 `@InjectRepository` 注入加上 Repository 的封装方法，复杂查询上 QueryBuilder，跨表写操作套一层 `transaction`。关系设计记住那条判据就够了，外键在哪张表，哪张表就是副表。

如果你只想带走一个可复用的模式，我推荐那套「service 抛异常、过滤器统一失败格式、拦截器统一成功格式」的组合。它让 service 层可以只关心业务，controller 层几乎不用写逻辑，前端拿到的响应结构永远一致。这是我从这次梳理里获益最大的一处。

最后再提醒一遍时效性。这篇写于 2022 年，基于 nest8 和 TypeORM 0.2，之后两者都发过大版本，`getConnection` 这批全局函数、`@Transaction()` 装饰器、`findOne` 的参数形式都变过。文中保留的是当时的写法，老项目仍然适用，新项目请对照官方文档的当前版本调整。

## 参考

- [NestJS 官方文档](https://docs.nestjs.com/)
- [NestJS 依赖注入](https://docs.nestjs.com/modules#dependency-injection)
- [NestJS 数据库集成](https://docs.nestjs.com/techniques/database)
- [NestJS MongoDB 集成](https://docs.nestjs.com/techniques/mongodb)
- [TypeORM 中文文档](https://typeorm.biunav.com/zh/)
- [class-validator 使用说明](https://github.com/typestack/class-validator#usage)
- [nestjs-modules/mailer 邮件服务文档](https://nest-modules.github.io/mailer/docs/mailer)
- [Swagger 官网](https://swagger.io/)
- [前端进阶之旅](https://interview.poetries.top)
