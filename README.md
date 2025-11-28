# MegaETH Realtime OnChain Loader 🐇

> "Follow the White Rabbit to the Live Web."
> Load HTML content directly from MegaETH with sub-millisecond latency and realtime updates.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MegaETH](https://img.shields.io/badge/Chain-MegaETH_Timothy-neongreen)](https://megaeth.com)
[![Realtime](https://img.shields.io/badge/API-Realtime-red)](https://docs.megaeth.com)

## ✨ What's New in v1.1.0 (Timothy Edition)

- ⚡ **Burst Loading**: 병렬 처리(Parallel Processing)를 통해 수십 개의 데이터 청크를 한 번에 로드합니다.
- 🐇 **Realtime Live**: WebSocket(`wss://`)을 통해 온체인 상태 변화를 감지하고, 배포 즉시 웹페이지를 자동 업데이트합니다.
- 🌐 **Timothy V2 Ready**: MegaETH Timothy Testnet V2에 최적화되었습니다.

## 🎯 Quick Start

### Universal Loader (Timothy Default)
별도의 설정 없이 바로 사용하면 기본적으로 **Timothy Testnet**에 연결됩니다.

https://planetai87.github.io/onchain-loader/dist/loader.html?master=YOUR_CONTRACT_ADDRESS


### Live Mode Example (MEGA_WARREN)
https://planetai87.github.io/onchain-loader/dist/loader.html?master=0x7c57f2A97D075fd61bE15a112E5294492DBB6079

*연결에 성공하면 우측 하단에 `🐇 TIMOTHY LIVE` 배지가 나타납니다.*

## 🔧 Usage Methods

### Method 1: URL Parameters

| Parameter | Description | Default (Timothy) |
|-----------|-------------|-------------------|
| `master` | Master Contract Address | **Required** |
| `rpc` | HTTP RPC Endpoint | `https://timothy.megaeth.com/rpc` |
| `ws` | WebSocket Endpoint | `wss://timothy.megaeth.com/wss` |

**Example:**
```html
<a href="dist/loader.html?master=0x123...&rpc=[https://timothy.megaeth.com/rpc&ws=wss://timothy.megaeth.com/wss](https://timothy.megaeth.com/rpc&ws=wss://timothy.megaeth.com/wss)">
  Load Live Content
</a>
Method 2: JavaScript Library (Custom Integration)
JavaScript

// MegaETH Realtime Loader
OnChainLoader.load({
    masterAddress: "0x7c57f2A97D075fd61bE15a112E5294492DBB6079",
    // Optional: Defaults to Timothy if omitted
    rpcUrl: "[https://timothy.megaeth.com/rpc](https://timothy.megaeth.com/rpc)", 
    wsUrl: "wss://[timothy.megaeth.com/wss](https://timothy.megaeth.com/wss)",
    enableLiveUpdates: true // Enable WebSocket subscription
});

🏗️ Architecture
Burst Loading
기존의 순차적(Sequential) 로딩 방식을 버리고, Promise.all을 사용하여 MegaETH의 높은 처리량(Throughput)을 활용합니다.

Sequential: Request -> Wait -> Request -> Wait (Slow)

Burst: Request All -> Receive All (Fast)

Live Updates (State Subscription)
eth_subscribe의 stateChange 메서드를 사용하여 Master 컨트랙트의 변경 사항을 구독합니다.

사용자가 페이지 접속 (WebSocket 연결)

개발자가 새 버전 publish()

MegaETH 시퀀서가 10ms 내 블록 생성

로더가 신호 감지 -> 즉시 자동 새로고침

⚡ MegaETH Timothy Info
Chain ID: 6343

RPC: https://timothy.megaeth.com/rpc

WSS: wss://timothy.megaeth.com/wss (Experimental)

Explorer: Timothy Explorer

📦 Project Structure
onchain-loader/
├── dist/
│   ├── loader.html              # Universal Realtime Loader
│   └── onchain-loader.js        # Core Library
├── examples/
│   └── demo.html                # Live Demo
└── src/                         # Source Code
🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

📄 License
MIT License