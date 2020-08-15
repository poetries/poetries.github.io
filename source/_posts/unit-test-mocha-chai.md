---
title: Mocha+Chai+Istanbul单元测试
date: 2017-10-22 15:35:43
tags: 
  - JavaScript
  - 测试
categories: Front-End
---


一、简介
---

- `Istanbul`是`JavaScript`程序的代码覆盖率工具
- `Mocha`是一种测试框架，也就是运行测试的工具。用`descibe`和`it`方法，来定义`test suit`，为不同的测试分组。
- `mocha`本身并不提供`assert`断言，所以要提供更加有表现力的断言，可以搭配`chai`使用，当然也可以使用`nodejs`提供的`assert`模块

二、配置测试环境
---

**安装相应的依赖包**

```javascript
npm install --save-dev mocha chai  istanbul
```

- 安装完成之后，在`package.json`文件的`scripts`下，添加执行测试和测试覆盖率检查的命令

```javascript
{
  
  "scripts":{
    "cover": "istanbul cover _mocha -- -R spec --timeout 5000 --recursive",
    "cover:check": "istanbul check-coverage",
  }
  
}
```
- 注意，`window`下必须要这样才可以执行`cover`

```javascript
"cover": "istanbul cover C:\Users\Administrator\Desktop\test\node_modules\mocha\bin\_mocha --reporter test/mocha.js"
```


- 运行`npm run cover`和`npm run cover:check`，就可以生成测试报告，前者生成测试报告，后者则是检查测试覆盖率是否达到要求

![](https://poetries1.gitee.io/img-repo/2019/10/586.png)

**配置Istanbul**

> `istanbul`相关的执行参数，可以在命令行下执行时传递参数来制定，也可以在`yaml`格式的`.istanbul.yml`文件中配置。简单贴出一些重要的配置项

```javascript
instrumentation:
  root: .   # 执行的根目录
  extensions:
    - .js   # 检查覆盖率的文件扩张名
  excludes: ['**/benchmark/**']

  ... ...

reporting:
  print: summary
  reports: [lcov, text, html, text-summary] # 生成报告的格式
  dir: ./coverage   # 生成报告保存的目录
  watermarks:       # 在不同覆盖率下会显示使用不同颜色
    statements: [80, 95]
    ... ...
check:
  global:
    statements: 100
    branches: 100
    lines: 100
    functions: 100
```

> 最后的`check`是项目要通过覆盖率检查需要达到的测试覆盖率，测试覆盖率包括四个维度，分别是语句覆盖率、分支覆盖率、行覆盖率和函数覆盖率。如果达不到设定的指标，在执行的时候会报错，项目的测试就无法通过自动化的持续集成

三、编写测试代码
---

> - 利用`chai`提供的`expect`断言，我们可以用`BDD`的方式，写出更加符合代码预期行为的测试用例.
> - 通常，测试脚本与所要测试的源码脚本同名，但是后缀名为`.test.js`（表示测试）或者`.spec.js`（表示规格）。比如，`add.js`的测试脚本名字就是`add.test.js`

```javascript
const {should, expect, assert} = require('chai');

describe('#math', () => {
  describe('add', () => {
    it('should return 5 when 2 + 3', () => {
      expect(add(2, 3), 5);
    });

    it('should return 5 when 2 + 3', () => {
      expect(add(2, -3), -1);
    });
  });

  describe('mul', () => {
    it('should return 6 when 2 * 3', () => {
      expect(mul(2, 3), 6);
    });
  });

  describe('cover', () => {
    it('should return 1 when cover(2, 1)', () => {
      expect(cover(2, 1)).to.equal(1);
    });

    it('should return 3 when cover(1, 2)', () => {
      expect(cover(1, 2)).to.equal(3);
    });

    it('should return 4 when cover(2, 2)', () => {
      expect(cover(2, 2)).to.equal(4);
    });
  });
});
```

- 测试脚本里面应该包括一个或多个`describe`块，每个`describe`块应该包括一个或多个`it`块
- `describe`中的名字是自己定义的，为了方便查看
- `describe`块称为"测试套件"（`test suite`），表示一组相关的测试。它是一个函数，第一个参数是测试套件的名称（"加法函数的测试"），第二个参数是一个实际执行的函数
- it块称为"测试用例"（`test case`），表示一个单独的测试，是测试的最小单位


四、断言库的用法
---

> 所谓"断言"，就是判断源码的实际执行结果与预期结果是否一致，如果不一致就抛出一个错误

- 所有的测试用例（`it`块）都应该含有一句或多句的断言。它是编写测试用例的关键。断言功能由断言库来实现，`Mocha`本身不带断言库，所以必须先引入断言库

```javascript
var expect = require('chai').expect;
```

- 断言库有很多种，`Mocha`并不限制使用哪一种。上面代码引入的断言库是`chai`，并且指定使用它的`expect`断言风格。`chai`包含了几种风格，如`should` `expect` `assert`。`expect`断言的优点是很接近自然语言.

```javascript
// 相等或不相等
expect(4 + 5).to.be.equal(9);
expect(4 + 5).to.be.not.equal(10);
expect(foo).to.be.deep.equal({ bar: 'baz' });

// 布尔值为true
expect('everthing').to.be.ok;
expect(false).to.not.be.ok;

// typeof
expect('test').to.be.a('string');
expect({ foo: 'bar' }).to.be.an('object');
expect(foo).to.be.an.instanceof(Foo);

// include
expect([1,2,3]).to.include(2);
expect('foobar').to.contain('foo');
expect({ foo: 'bar', hello: 'universe' }).to.include.keys('foo');

// empty
expect([]).to.be.empty;
expect('').to.be.empty;
expect({}).to.be.empty;

// match
expect('foobar').to.match(/^foo/);
```

- 基本上，`expect`断言的写法都是一样的。头部是`expect`方法，尾部是断言方法，比如`equal`、`a/an`、`ok`、`match`等。两者之间使用`to`或`to.be`连接
- 如果`expect`断言不成立，就会抛出一个错误。事实上，只要不抛出错误，测试用例就算通过。


五、持续集成
---

> 完成所有代码之后，我们可以将代码发布到`github`，然后使用持续集成工具`travis`检查代码，将生成的测试报告上传到`coverall`上，这样就可以在项目中显示项目状态和测试覆盖率的badges

- 持续集成是一种软件开发流程
- 频繁将代码集成到主干
- 每次集成都通过自动化的构建来验证
- 尽早发现错误
- 防止防止大幅偏离主干

- 通常的`nodejs`项目`.travis.yml`配置如下

```javascript
language: node_js
node_js:
  - "6"
  - "8"
brancher:
  only:
    - "dev"
    - "master"
install:
  - "npm install"
  - "npm install -g codecov"
script:
  - "npm run cover"
  - "codecov"

```

- 测试代码预览 https://github.com/poetries/test


六、Mocha的命令行参数
---

- `--help`或`-h`参数，用来查看`Mocha`的所有命令行参数
- `--reporter, -R` `--reporter`参数用来指定测试报告的格式，默认是`spec`格式

```javascript
$ mocha
# 等同于
$ mocha --reporter spec
```


