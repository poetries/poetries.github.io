---
title: 把手把手带你基于Github Actions构建docker镜像部署到腾讯云私有仓库
date: 2026-01-15 14:40:12
description: 详解如何使用GitHub Actions自动化构建Docker镜像并推送到腾讯云私有仓库，从零开始搭建CI/CD流水线，实现代码提交自动部署。
tags:
- Docker
- GitHub Actions
- 腾讯云
- CI/CD
- 容器化部署
categories: DevOps
---

在实际项目中，你是否每次发布都需要手动登录服务器执行一系列繁琐的操作？手动构建镜像、手动登录仓库、手动拉取镜像、手动启动容器...这些重复性工作不仅耗时，还容易因为人为疏忽导致部署失败。

本文将以部署Next.js应用为例，手把手教你搭建完整的CI/CD流水线：通过GitHub Actions实现代码推送后自动构建Docker镜像，一键推送到腾讯云私有仓库，并在服务器上自动完成部署。整个过程完全自动化，开发者只需专注代码开发，部署全部由流水线自动完成。

## 准备工作

在开始配置之前，你需要准备以下内容：

1. **GitHub仓库**：用于托管代码和配置Actions工作流
2. **腾讯云账号**：需要开通容器镜像服务TCR
3. **服务器**：用于运行Docker容器（需安装Docker）

## GitHub Actions工作流配置

### 创建工作流文件

在GitHub仓库的`.github/workflows`目录下创建`build-docker.yml`文件：

```yaml
# build-docker.yml

# 填入到github的secrets中 https://github.com/test/repo/settings/secrets/actions

name: 构建和上传镜像到腾讯云私有镜像仓库

on:
  push:
    branches: [master]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    env:
      # 设置镜像名称，请根据你的实际情况修改
      IMAGE_NAME: my-app
      # 腾讯云镜像仓库命名空间，请替换为你的命名空间
      TCR_NAMESPACE: test-hk
      TZ: Asia/Shanghai # 在这里设置时区
      REGISTRY: hkccr.ccs.tencentyun.com # 腾讯云镜像仓库地址
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Generate Docker image tag with timestamp
        id: tag
        run: |
          # 验证时区设置
          echo "当前时区:"
          date
          # 生成时间戳标签，格式为 2025-10-10-12-00-00(精确到秒)
          TIMESTAMP=$(date +'%Y-%m-%d-%H-%M-%S')
          echo "生成的时间戳: $TIMESTAMP"
          echo "TIMESTAMP=$TIMESTAMP" >> $GITHUB_ENV
          # 设置镜像标签，格式为 hkccr.ccs.tencentyun.com/命名空间/镜像名:时间戳
          echo "IMAGE_TAG=${{ env.REGISTRY }}/${{ env.TCR_NAMESPACE }}/${{ env.IMAGE_NAME }}:$TIMESTAMP" >> $GITHUB_ENV

      - name: Log in to Tencent Cloud Container Registry
        uses: docker/login-action@v3
        with:
          # https://github.com/test/repo/settings/secrets/actions
          # https://github.com/docker/login-action
          # 腾讯云镜像仓库地址 https://console.cloud.tencent.com/tcr/repository/
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.TENCENT_USERNAME }}
          password: ${{ secrets.TENCENT_PASSWORD }}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # https://github.com/docker/build-push-action
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile
          platforms: linux/amd64
          push: true
          tags: ${{ env.IMAGE_TAG }}

  # https://github.com/appleboy/ssh-action/blob/master/README.zh-cn.md
  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push # 明确依赖构建任务，等构建完成在执行部署
    steps:
      - name: Execute deployment script on server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_IP }} # 服务器 IP 或域名
          username: ${{ secrets.SERVER_USERNAME }} # SSH 用户名
          password: ${{ secrets.SERVER_PASSWORD }} # SSH 密码
          # 部署成功后自动执行服务端脚本文件
          script: 'sh /www/docker-deploy.sh'
```

### 配置GitHub Secrets

在GitHub仓库的`Settings → Secrets and variables → Actions`中配置以下敏感信息。这些信息会以环境变量的形式注入到工作流中，确保敏感数据的安全：

| 变量名 | 说明 |
|--------|------|
| SERVER_USERNAME | 服务器SSH登录用户名 |
| SERVER_PASSWORD | 服务器SSH登录密码 |
| SERVER_IP | 服务器公网IP地址 |
| TENCENT_USERNAME | 腾讯云账户名 |
| TENCENT_PASSWORD | 腾讯云镜像仓库的密码 |

**安全建议**：生产环境建议使用SSH密钥而非密码认证，并将敏感信息的访问权限限制为最小必要范围。

## 腾讯云私有仓库配置

### 创建私有镜像仓库

首先登录[腾讯云容器镜像控制台](https://console.cloud.tencent.com/tcr/repository)，创建私有镜像仓库：

1. 创建命名空间：点击「命名空间」→「创建」，输入命名空间名称（如`test-hk`）

2. 创建镜像仓库：点击「镜像仓库」→「创建」，填写仓库名称和描述

![创建私有镜像仓库](https://s.poetries.top/uploads/2026/03/4318219148ce5012.png)

### 获取镜像仓库地址

在镜像仓库详情页面可以查看仓库的访问地址：

![获取镜像仓库地址](https://s.poetries.top/uploads/2026/03/e7bd82653a736bdb.png)

### 设置镜像仓库登录密码

首次使用需要设置登录密码，用于Docker login认证：

1. 进入「访问凭证」页面
2. 点击「设置密码」
3. 设置完成后，该密码即用于后续Docker登录认证

![重置镜像仓库登录密码](https://s.poetries.top/uploads/2026/03/cdd08d3cc8bd08c4.png)

## 服务器端配置

### 安装腾讯云CLI

在服务器上安装腾讯云CLI工具，用于查询镜像版本：

```bash
# 安装腾讯云CLI
pip3 install tccli

# 配置访问凭证
tccli configure
# 依次输入：
# SecretId: <你的SecretId>
# SecretKey: <你的SecretKey>
# Region: ap-guangzhou
# Output format: json
```

### 创建部署脚本

将一键部署脚本放到服务器目录 `/www/deploy-scripts/docker-deploy.sh`：

## 部署应用

当GitHub Action构建成功后，会自动推送镜像到私有仓库：

![GitHub Actions构建结果](https://s.poetries.top/uploads/2026/03/21fd2ac5d06f7c4b.png)

然后我们在服务器端拉取镜像并启动容器即可完成部署：

```bash
# 查询指定镜像仓库的版本：然后获取最新版本的TagName用于拉取镜像
tccli tcr DescribeImagePersonal --cli-unfold-argument --region ap-guangzhou --RepoName tcb-8121221-mope/my-app --Offset 0 --Limit 2
```

```bash
# 登录镜像仓库
docker login hkccr.ccs.tencentyun.com --username=12312 --password="123132123"

# 拉取镜像对应的版本
docker pull hkccr.ccs.tencentyun.com/tcb-test-mope/my-app:202510281002
# 获取版本号 https://console.cloud.tencent.com/tcr/repository/

# 删除当前运行的服务
docker ps
docker rm xx -f

# 先暂停之前的容器，防止部署出问题可以回滚
docker stop xx

# 启动镜像
docker run -d -p 3000:3000 --name my-app-202510281002 hkccr.ccs.tencentyun.com/tcb-100008440496-mope/my-app:202510281002
```

## 完整部署流程总结

整个自动化部署流程如下：

1. **代码推送**：开发人员将代码推送到GitHub master分支

2. **自动触发**：GitHub Actions检测到push事件，自动开始执行工作流

3. **构建镜像**：基于Dockerfile构建Docker镜像，使用时间戳作为版本标签

4. **推送仓库**：登录腾讯云私有仓库，将构建好的镜像推送到仓库

5. **自动部署**：通过SSH连接到服务器，执行部署脚本拉取最新镜像并启动容器

6. **验证服务**：确认服务正常运行，部署完成

整个过程完全自动化，无需人工干预，大大提高了部署效率和可靠性。
