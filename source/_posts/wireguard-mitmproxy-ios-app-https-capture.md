---
title: WireGuard + mitmproxy 全局抓 iOS App HTTPS 明文实战从隧道到证书一次打通
description: 一份不改手机 Wi-Fi 代理、直接用 WireGuard 隧道把 iPhone 全流量引到 Mac 上的 mitmproxy 透明代理抓 HTTPS 明文的完整实战。覆盖 Mac 装 wireguard-tools 与 mitmproxy、生成双端密钥、qrencode 扫码导入手机、pf 做 NAT 与 80/443 重定向、透明模式为何必须 sudo、iOS 装 mitmproxy CA 并在关于本机开启完全信任，以及 App 抓不到明文时的 SSL Pinning 排查清单。
date: 2026-07-08 19:05:20
tags:
  - WireGuard
  - mitmproxy
  - iOS
  - 抓包
  - HTTPS
  - 网络调试
categories: Front-End
---

> 文章首发于: https://feinterview.poetries.top/blog/wireguard-mitmproxy-ios-app-https-capture

做移动端联调，抓包是绕不过去的基本功。`Charles` / `Proxyman` 这类工具走的是「手机设 `Wi-Fi` 代理指向电脑」的老路子，够用，但有两个死穴：一是**很多 App 的流量不吃系统 `HTTP` 代理**（尤其是自己管理连接、走 `QUIC`/`WebSocket`、或用了非标准端口的），你设了代理它照样绕过去；二是**代理一开，手机所有 App 都受影响**，还容易和科学上网工具打架。这篇文章换一条更「底层」的路：用 `WireGuard` 建一条手机到 `Mac` 的隧道，把手机**全部流量**（不管走不走系统代理）都逼进这条隧道，再在 `Mac` 上用 `pf` 防火墙把 `80/443` 透明重定向到 `mitmproxy`，最后靠 `mitmproxy` 的中间人证书解出 `HTTPS` 明文。

我最近就是用这套方案抓一台 iPhone 上某交易类 App（`Binance` 港版）的真机接口，从 `Mac` 装工具、生成密钥、扫码导入、`pf` 规则、到手机装证书信任，整条链路又踩了一遍，顺手把每步都记了下来。这篇就以这套实操为线索，把 **Mac 端隧道 + 透明代理** 和 **iOS 端隧道 + 证书信任** 两段拆开讲透，让你照着做一次就能通。

在本篇文章中，我们将从浅入深，和大家一起学习以下知识：

- `WireGuard` 隧道抓包相比传统 `Wi-Fi` 代理抓包**强在哪、适合什么场景**
- 整条链路的数据流长什么样：手机 → 隧道 → `pf` 重定向 → `mitmproxy` → 出网
- `Mac` 上怎么装 `wireguard-tools` 和 `mitmproxy`（含 `brew cask` 装不出 CLI 的坑）
- 怎么用 `wg genkey` 生成双端密钥、写 `wg0.conf` / `phone.conf`、`qrencode` 扫码导入手机
- `pf` 规则怎么写才能同时做 `NAT` 出网 + `80/443` 重定向到 `mitmproxy`
- 为什么透明模式的 `mitmweb` **必须用 `sudo` 跑**，不然一直报 `Insufficient privileges`
- iOS 怎么装 `mitmproxy` 的 `CA` 证书，并在「关于本机」里开启**完全信任**这一步
- 抓不到某个 App 明文时，怎么判断是不是撞上了 `SSL Pinning`，以及能怎么办
- 怎么把整套抓包沉淀成 `Claude Code` 的 `SKILL`，让 AI **自己起服务、过滤域名、提取接口**

## 一、整体架构

先把整条链路画清楚，你就知道每个组件在干嘛、凭证从哪来：

```
┌─────────────┐   WireGuard 加密隧道    ┌──────────────────────────────────────┐
│   iPhone    │  10.9.0.2  ─────────▶   │              Mac (10.9.0.1)          │
│             │   (全流量进隧道          │                                      │
│  WireGuard  │    AllowedIPs=0.0.0.0/0)│   utun (wg 接口)                     │
│  已装CA并信任 │                         │      │                               │
└─────────────┘                         │      ▼  pf rdr 80/443                │
                                        │   mitmproxy 透明代理 :8080           │
                                        │      │  (用自己的CA重签，解出明文)     │
                                        │      ▼  pf nat 出 en0                 │
                                        │   物理网卡 en0  ───────▶ 互联网       │
                                        │                                      │
                                        │   mitmweb 界面 :9091 (看/改报文)      │
                                        └──────────────────────────────────────┘
```

三个关键点，理解了就不会瞎调：

- **为什么用隧道而不是 `Wi-Fi` 代理**：`WireGuard` 客户端配 `AllowedIPs = 0.0.0.0/0`，意味着手机把**所有** `IP` 流量都塞进隧道，App 想绕都绕不开（这是隧道相对系统代理最大的优势）。
- **明文是怎么来的**：`HTTPS` 是加密的，`mitmproxy` 做「中间人」——用自己的根证书 `CA` 重新签发目标站点证书。手机必须先信任这张 `CA`，加密流量才能被解开，否则你只能看到一堆 `CONNECT` 和加密字节。
- **谁来把 `80/443` 交给 `mitmproxy`**：靠 `Mac` 的 `pf` 防火墙做重定向（`rdr`），其余端口（`DNS`、`WebSocket`、直连等）走 `NAT` 正常出网。

## 二、10 分钟跑通最小可用版本

下面是「复制即可跑」的最小闭环。全部操作在 `Mac`（`Apple Silicon`，`Homebrew` 装在 `/opt/homebrew`）+ 一台 iPhone 上完成，手机和电脑连**同一个 `Wi-Fi`**。

### Step 1：Mac 装 wireguard-tools 和 mitmproxy

`wireguard-tools` 直接 `brew` 装；国内网络慢可以挂 `USTC` 镜像：

```bash
# wireguard 命令行工具（wg / wg-quick）+ 生成二维码用的 qrencode
HOMEBREW_BOTTLE_DOMAIN=https://mirrors.ustc.edu.cn/homebrew-bottles \
HOMEBREW_NO_AUTO_UPDATE=1 \
brew install wireguard-tools qrencode
```

`mitmproxy` 这里有个**大坑**：`brew` 的 `mitmproxy` 现在是 `cask`，装出来只有一个 `mitmproxy.app` 的 `GUI`，**没有 `mitmweb` / `mitmdump` 命令行二进制**，透明代理根本起不来。正确做法是用 `Python venv` + `pip` 装：

```bash
mkdir -p ~/wg-capture && cd ~/wg-capture
python3 -m venv venv
# 国内用清华源；若卡在某个包的 hash 上，换官方 PyPI + 代理即可
~/wg-capture/venv/bin/pip install mitmproxy -i https://pypi.tuna.tsinghua.edu.cn/simple
# 验证：能打印版本就对了
~/wg-capture/venv/bin/mitmweb --version
```

装完先别急着跑，`mitmproxy` 第一次跑会在 `~/.mitmproxy` 生成 `CA`，我们后面手机装的就是这张证书——所以后续所有命令都要用同一个 `confdir`，否则手机装的证书对不上。

### Step 2：生成双端密钥 + 写两份配置

`WireGuard` 是公私钥体系，服务端（`Mac`）和客户端（手机）各一对。`umask 077` 保证私钥不被别的用户读到：

```bash
cd ~/wg-capture && umask 077
wg genkey | tee server.key | wg pubkey > server.pub   # Mac 端
wg genkey | tee phone.key  | wg pubkey > phone.pub    # 手机端
```

`Mac` 端配置 `wg0.conf`——`Address` 用一个私有网段，`ListenPort` 固定 `51820`，`Peer` 填手机的公钥：

```ini
[Interface]
Address = 10.9.0.1/24
ListenPort = 51820
PrivateKey = <server.key 的内容>

[Peer]
# phone
PublicKey = <phone.pub 的内容>
AllowedIPs = 10.9.0.2/32
```

手机端配置 `phone.conf`——重点是 `AllowedIPs = 0.0.0.0/0`（全流量进隧道），`Endpoint` 填 **Mac 的 Wi-Fi 局域网 IP**（用 `ipconfig getifaddr en0` 查，比如 `192.168.5.136`）：

```ini
[Interface]
PrivateKey = <phone.key 的内容>
Address = 10.9.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = <server.pub 的内容>
Endpoint = 192.168.5.136:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

### Step 3：扫码把配置导入手机 WireGuard

iOS 上装 `WireGuard` App（若在国区商店搜不到，用**港区或美区 Apple ID** 下载即可）。然后在 `Mac` 上把 `phone.conf` 转成二维码，手机 App 里点右上角 `+` → 「从二维码创建」扫一下就导入了：

```bash
cd ~/wg-capture
qrencode -o phone-qr.png -s 12 -m 4 < phone.conf && open phone-qr.png
```

导入后**先别急着开隧道**，等 `Mac` 侧的重定向和 `mitmproxy` 都起来再连，否则手机会短暂断网。下图是手机 `WireGuard` App 里导入好的隧道（我这条起名叫「抓包」）：

![iOS WireGuard App 里导入好的名为「抓包」的隧道配置，开关已打开](https://s.poetries.top/uploads/2026/07/e82c678bc6623b66.png)

### Step 4：起隧道 + pf 重定向（一个脚本搞定）

把下面存成 `~/wg-capture/up.sh`。它做三件事：起 `WireGuard` 隧道、打开 `IP` 转发、加载 `pf` 规则（`NAT` 出网 + `80/443` 重定向到 `mitmproxy`）：

```bash
#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
CONF="$DIR/wg0.conf"
UPLINK="${UPLINK:-en0}"        # 出网物理网卡，Wi-Fi 一般是 en0
MITM_PORT="${MITM_PORT:-8080}" # mitmproxy 透明代理端口

wg-quick up "$CONF"
WG_IF="$(wg show interfaces)"  # wg-quick 在 macOS 上会映射到某个 utunN
sysctl -w net.inet.ip.forwarding=1

pfctl -f - -e <<EOF
nat on $UPLINK from 10.9.0.0/24 to any -> ($UPLINK)
rdr pass on $WG_IF inet proto tcp from 10.9.0.0/24 to any port { 80, 443 } -> 127.0.0.1 port $MITM_PORT
EOF
echo "✅ 隧道 + NAT + 重定向就绪 (WG_IF=$WG_IF, UPLINK=$UPLINK)"
```

跑它（要 `sudo`，因为动 `pf` 和路由）：

```bash
sudo ~/wg-capture/up.sh
```

### Step 5：sudo 起 mitmweb 透明代理

**这一步最容易翻车**：透明模式下 `mitmproxy` 需要读 `/dev/pf` 还原每个连接的真实目标地址，**必须用 `sudo`**，否则一直报 `Insufficient privileges to access pfctl`、解不了密。同时用 `--set confdir` 锁定到 `~/.mitmproxy`，保证复用 `Step 1` 生成的那张 `CA`：

```bash
sudo ~/wg-capture/venv/bin/mitmweb \
  --mode transparent --showhost \
  --set block_global=false \
  --set confdir=/Users/你的用户名/.mitmproxy \
  --web-host 127.0.0.1 --web-port 9091
```

起来后终端会打印一行带 `token` 的地址，浏览器打开它就是抓包界面：

```
Web server listening at http://127.0.0.1:9091/?token=xxxxxxxx
```

这个窗口会常驻刷屏，**别关它**。现在手机把 `WireGuard` 隧道打开，`Mac` 上 `sudo wg show` 能看到 `latest handshake` 和双向流量，就说明隧道通了。

至此链路已经全通，唯一还差的就是——手机还没信任 `mitmproxy` 的证书，所以 `HTTPS` 现在还是加密的。下一节解决它。

## 三、iOS 装 mitmproxy 证书并开启完全信任

手机连上隧道后，用 `Safari` 打开 `mitmproxy` 官方的证书分发页：

```
http://mitm.it
```

⚠️ 注意必须是手机**已连上隧道**的状态访问，`mitm.it` 才能识别到走的是 `mitmproxy`、给出下载入口。页面会按平台列出证书，**iOS 要选 iOS 那一栏**（不要点成 macOS）：

![mitm.it 证书安装页，按平台列出 Windows/Linux/macOS/iOS/Android，红框标注 iOS 那一栏的 Get mitmproxy-ca-cert.pem](https://s.poetries.top/uploads/2026/07/af18472bfabe9b44.jpg)

点 iOS 的 `Get mitmproxy-ca-cert.pem` 会提示「已下载描述文件」。这时候证书**还没生效**，要分两步在系统设置里手动开：

第一步，去 `设置 → 通用 → VPN 与设备管理`，能看到刚下载的 `mitmproxy` 描述文件，点进去「安装」：

![iOS 设置里的 VPN 与设备管理页，VPN 显示已连接，配置描述文件列表里有 mitmproxy 和 Charles Proxy CA](https://s.poetries.top/uploads/2026/07/29b2393635dd2e41.jpg)

第二步——**这一步最容易被漏**——去 `设置 → 通用 → 关于本机 → 证书信任设置`，把 `mitmproxy` 那个开关**手动打开**（针对根证书启用完全信任）。装了描述文件但没开这个开关，`HTTPS` 照样解不出明文：

![iOS 证书信任设置页，针对根证书启用完全信任列表里 mitmproxy 开关已打开为绿色](https://s.poetries.top/uploads/2026/07/e7ffaf37b7092714.jpg)

两步都做完，回到 `mitmweb` 界面刷新，`HTTPS` 请求就是明文了。下图是我抓到的 `Binance` 港版 App 的真实接口——`native.binance.com/bapi/...` 的业务接口、`fstream.binance.com/market/stream` 的 `WebSocket` 行情推送，`Response` 里的 `JSON` 已经完全解密可读：

![mitmweb 抓包界面，左侧 Flow List 是 native.binance.com 的一系列 bapi 接口和 fstream WebSocket，右侧 Response 面板显示 HTTP/2 200 的 JSON 明文](https://s.poetries.top/uploads/2026/07/50b139194e95f1df.jpg)

## 四、可复用的收摊脚本

抓完包记得恢复网络，否则 `pf` 规则和 `IP` 转发会一直挂着影响正常上网。把下面存成 `~/wg-capture/down.sh`：

```bash
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
wg-quick down "$DIR/wg0.conf" 2>/dev/null || true
pfctl -F all 2>/dev/null || true   # 清空所有 pf 规则
pfctl -d 2>/dev/null || true       # 停用 pf
sysctl -w net.inet.ip.forwarding=0 # 关掉 IP 转发
echo "✅ 已恢复。mitmweb 窗口去 Ctrl-C 停掉即可。"
```

用 `sudo ~/wg-capture/down.sh` 收摊，再去 `mitmweb` 那个窗口 `Ctrl-C`。手机端把 `WireGuard` 开关关掉就行，证书可以留着下次复用。

## 五、抓不到某个 App 明文怎么办

链路全通、证书也信任了，但某个 App 就是抓不到明文、或者干脆连不上网——大概率是撞上了 **`SSL Pinning`（证书绑定）**。App 把服务端证书的指纹硬编码在代码里，发现当前证书是 `mitmproxy` 重签的、指纹对不上，就直接掐断连接。这不是你配错了，是 App 主动防抓包。判断和应对：

- **先确认是不是 `Pinning`**：浏览器和不设防的 App 能抓到明文，唯独目标 App 抓不到 / 一直转圈 / 报网络错，基本就是 `Pinning`。`mitmweb` 里通常能看到该域名的连接建立后立刻 `client disconnect`。
- **越狱设备**：用 `Frida` + `objection` 的 `ios sslpinning disable`，或 `SSL Kill Switch 2`，在运行时把校验函数 `hook` 掉。这是最通用的解法，但需要越狱。
- **非越狱设备**：可以砸壳后用 `Frida gadget` 重签名注入，或者拿到脱壳 `ipa` 静态改；成本高，视目标价值决定。
- **换目标**：很多时候你要的接口在 Web 端 / 小程序端 / 或 App 的某些非核心模块也有，那些往往没做 `Pinning`，绕开正面硬刚。

另外有几个**不是 `Pinning` 但同样抓不到**的常见原因，先排除掉再怀疑 `Pinning`：

- `mitmweb` 没用 `sudo` 起 → 报 `Insufficient privileges`，全部 `HTTPS` 都解不了（不只是某个 App）。
- 手机装了证书但**没开「证书信任设置」的完全信任开关** → 同样全站解不了。
- App 走的是 `QUIC`（`HTTP/3`，`UDP 443`）→ `mitmproxy` 默认不解 `QUIC`，表现为该域名没有 `443` 的 `TCP` 流。可以在 `pf` 里把 `UDP 443` 也 `block` 掉，逼 App 回落到 `TCP` 的 `HTTP/2`。

## 六、把抓包交给 AI 自动跑（Claude Code SKILL）

上面这套流程手动跑一遍不难，但每次都要「`sudo up.sh` → 单开窗口 `sudo mitm.sh` → 手机开隧道 → 盯着 `mitmweb` 界面从几百条 `flow` 里翻目标域名」，重复且枯燥。既然我平时用 `Claude Code` 干活，索性把整套操作沉淀成一个 **SKILL**，让 AI 在我说「**抓一下 XX App 的接口**」时**自己起服务、引导我连手机、再把目标接口过滤好丢给我**。这一节讲怎么把抓包这件事「喂」给 AI。

### 为什么要为抓包写一个 SKILL

`Claude Code` 的 `SKILL` 本质是一份「触发条件 + 标准作业流程（SOP）」的说明书：命中触发词后，AI 会按里面写好的步骤执行，而不是每次现场瞎摸。抓包这件事天然适合 SKILL 化——步骤固定、坑固定、判断路径固定（比如「抓不到就先排除没 `sudo` / 没开信任 / `QUIC`，再怀疑 `Pinning`」），把这些经验写进 SKILL，AI 下次就能少走弯路。

SKILL 放在 `~/.claude/skills/packet-capture-wireguard/SKILL.md`，`frontmatter` 里最关键的是 `description`——它决定 AI 在什么时候「想起」这个 SKILL：

```yaml
---
name: packet-capture-wireguard
description: >
  用 WireGuard 隧道 + mitmproxy 透明代理抓 iOS/Android 真机 App 的 HTTPS 明文接口。
  当用户说"抓一下 XX App 的包 / 抓 XX 的接口 / 看看 XX App 请求了什么 / 帮我抓包"时触发。
  命中后由助手自己启动/复用抓包服务，引导手机连隧道，再从落盘的 flow 里过滤目标 App
  的域名、提取接口清单（method/url/status/请求体/响应体）给用户。环境固定在 ~/wg-capture/。
---
```

### 让 AI 能「读」到接口：一个 mitmproxy addon

这是整套 AI 化的**技术关键**。`mitmweb` 的界面是给人看的，AI 读不了；要让 AI 拿到结构化数据，得让 `mitmproxy` 把每条 `flow` 落成机器可读的 `jsonl`。`mitmproxy` 支持加载 `addon` 脚本，我写了个 `~/wg-capture/dump_flows.py`，在每条响应完成时把关键字段追加写文件：

```python
import json, os, time
FLOW_DIR = os.path.expanduser("~/wg-capture/flows")
os.makedirs(FLOW_DIR, exist_ok=True)
OUT = os.path.join(FLOW_DIR, f"session-{os.getpid()}.jsonl")

def response(flow):  # mitmproxy 在每条响应完成时回调
    req, resp = flow.request, flow.response
    rec = {
        "method": req.method, "host": req.host, "path": req.path,
        "url": req.pretty_url, "status": resp.status_code if resp else None,
        "req_body": req.get_text()[:4096], "resp_body": resp.get_text()[:4096],
    }
    with open(OUT, "a") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")
```

启动 `mitmweb` 时用 `-s` 挂上它，抓到的每条请求就会实时落到 `~/wg-capture/flows/session-<pid>.jsonl`（`body` 只截前 `4KB` 防止超大响应撑爆文件）：

```bash
sudo ~/wg-capture/venv/bin/mitmweb \
  --mode transparent --showhost --set block_global=false \
  --set confdir=/Users/你的用户名/.mitmproxy \
  -s ~/wg-capture/dump_flows.py \
  --web-host 127.0.0.1 --web-port 9091
```

有了这个 `jsonl`，AI 就能用几行 `python` 按域名过滤、按 `path` 提取请求体响应体，而不用去解析给人看的 web 界面。

### AI 提取接口的核心逻辑

SKILL 里给了 AI 两段可复制的处理脚本。第一段是**域名发现**——抓完一顿操作后往往有几十上百个 `host`（各种 `SDK`、埋点、`CDN` 混在一起），先按出现频次列出来，帮我认出目标 App 到底用哪个域名：

```bash
F=$(ls -t ~/wg-capture/flows/*.jsonl | head -1)
python3 -c "
import json, collections
c = collections.Counter()
for l in open('$F'):
    c[json.loads(l)['host']] += 1
for h, n in c.most_common(30): print(f'{n:5d}  {h}')
"
```

第二段是**按域名提取接口清单**，把 `KEY` 换成目标域名关键字（如 `binance`），输出 `method + status + url`，AI 再据此整理成表格、猜每个接口的用途、需要时展开某个接口的完整请求响应明文：

```bash
F=$(ls -t ~/wg-capture/flows/*.jsonl | head -1)
python3 -c "
import json
for l in open('$F'):
    r = json.loads(l)
    if 'binance' in r['host']:
        print(f\"{r['method']:5s} {r['status']} {r['url'][:120]}\")
"
```

### sudo 这道坎怎么过

有一个绕不开的现实约束：`Claude Code` 的 `Bash` **不能交互式输入密码**，而起服务的 `up.sh` / `mitm.sh` 全要 `sudo`。SKILL 里写死了处理策略，让 AI 不至于卡死：

- 先探测免密：`sudo -n true`。返回成功说明有 `sudo` 缓存或配了 `NOPASSWD`，AI 可以直接跑。
- 不免密时**绝不硬跑**（会卡在等密码），改为让我在会话输入框用 `!` 前缀执行，输出会回到对话里给 AI 看：`! sudo ~/wg-capture/up.sh`。
- `mitmweb` 是常驻前台进程，让它单开一个窗口跑、别关。

### 一次真实的 AI 抓包对话长什么样

把上面这些串起来，实际用起来就是一句话触发、AI 自动往下推：

- 我：「帮我抓一下 `Binance` App 的行情接口」
- AI：自检 → 发现隧道和 `mitmweb` 已在跑（复用，不重启）→ 让我确认手机隧道开关已开、证书已信任
- AI：「现在去 App 里进行你要抓的操作，做完告诉我」
- 我：在 App 里刷了一遍行情、下了个单，回来说「好了」
- AI：读最新 `jsonl` → 先列高频域名认出 `native.binance.com` / `fstream.binance.com` → 过滤出这两个域名下的接口 → 整理成「接口总览表（`method` / `path` / `status` / 用途猜测）」→ 针对我关心的下单接口展开完整请求响应，并**把 `token` / `cookie` 自动脱敏**再贴出来

原本要盯着界面翻半天的活，变成了「说一句话 + 在 App 上操作一下」。AI 不只是执行命令，还顺手做了域名归类、接口用途推断、敏感字段脱敏这些人工干起来很烦的事。

### 落地这套 AI 化的成本

除了前面搭好的抓包环境，AI 化只多两个文件：`~/wg-capture/dump_flows.py`（`addon`，约 60 行）和 `~/.claude/skills/packet-capture-wireguard/SKILL.md`（把本文的流程 + 坑 + 判断路径写成 SOP）。写一次，之后每次抓包都省下翻界面的功夫。这也是 SKILL 的价值所在——**把一次性摸索出来的经验，固化成 AI 可复用的作业流程**。

## 七、上生产（长期复用）前的 checklist

这套环境搭一次可以反复用，但每次抓完 / 长期保留前，建议逐项确认：

- [ ] 抓完立刻跑 `down.sh` 恢复 `pf` 与 `IP` 转发，别让 `Mac` 长期处于「路由器 + 中间人」状态
- [ ] `wg-capture` 目录里的 `*.key` 私钥权限是 `600`（`umask 077` 已保证），不要提交到任何仓库
- [ ] `mitmproxy` 的 `CA`（`~/.mitmproxy`）等同于「能解你手机所有 `HTTPS`」的钥匙，别拷给别人、别进云盘
- [ ] 手机上抓包用的证书信任开关，**不抓包时手动关掉**，避免长期暴露在被中间人风险下
- [ ] 只抓**你有权抓的流量**（自己的 App、自己账号、授权测试对象），抓第三方 App 的接口注意合规边界
- [ ] `Endpoint` 里的 `Mac IP` 是局域网 `IP`，换了 `Wi-Fi` 网段要同步改 `phone.conf` 重新扫码
- [ ] 日志 / 导出的 `flow` 里可能含 `token` / `cookie` / 手机号，分享前务必脱敏

## 八、总结

`WireGuard + mitmproxy` 这套方案，本质是把 `Mac` 临时变成一台「会解密的路由器」：`WireGuard` 负责把手机全流量无差别引过来（解决系统代理抓不全的问题），`pf` 负责把 `80/443` 精准喂给 `mitmproxy`（解决透明重定向），`mitmproxy` 的 `CA` 负责解出明文（解决 `HTTPS` 加密）。相比 `Charles` 设 `Wi-Fi` 代理，它更全（不吃系统代理的流量也能抓）、更干净（不改手机代理设置），代价是首次搭建步骤多一点。

时间预估：**最小可用版本 10 分钟**（装工具 + 密钥 + 扫码 + 起隧道），**证书信任 5 分钟**，把 `up.sh` / `mitm.sh` / `down.sh` 固化成脚本半小时；之后每次抓包只要 `sudo up.sh` → `sudo mitmweb` → 手机开隧道，三条命令就能开工。真正的难点从来不在搭建，而在遇到 `SSL Pinning` 时的判断和取舍——先按第五节的清单排除环境问题，确认是 `Pinning` 再决定要不要上越狱 / `Frida` 那一套重武器。

## 参考

- `mitmproxy` 官方文档 - Transparent Proxying：https://docs.mitmproxy.org/stable/howto-transparent/
- `WireGuard` 官方 Quick Start：https://www.wireguard.com/quickstart/
- `mitmproxy` 证书安装说明：https://docs.mitmproxy.org/stable/concepts-certificates/
