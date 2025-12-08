# OnChain Loader

> Permanent on-chain content loader for MegaETH blockchain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MegaETH](https://img.shields.io/badge/Chain-MegaETH-blue)](https://megaeth.com)

## Why This Exists

This loader was created as part of the **MEGA_WARREN** project to ensure that on-chain content stored on MegaETH remains **permanently accessible** - even after the original project ends.

**Key Principle**: Data stored on-chain lives forever. This loader ensures you can always read it.

When content is deployed to the blockchain, it becomes immutable and permanent. This open-source loader guarantees that anyone can retrieve and display this content at any time, without depending on any centralized service.

## Features

- **V2 Tree Structure**: Efficient loading of large content via tree-structured contracts
- **V1 Legacy Support**: Backward compatible with flat chunk structure
- **Auto-Detection**: Automatically detects contract version (v1/v2)
- **Encoding Support**: Handles UTF-8 and EUC-KR encoded content
- **Retry Logic**: Built-in retry mechanism for network reliability
- **Simple UI**: Minimal, distraction-free loading interface

## Quick Start

### Direct URL (Recommended)

```
https://[your-host]/dist/loader.html?master=0xYOUR_CONTRACT_ADDRESS
```

With custom RPC:
```
https://[your-host]/dist/loader.html?master=0x...&rpc=https://timothy.megaeth.com/rpc
```

### GitHub Pages

```
https://planetai87.github.io/onchain-loader/dist/loader.html?master=0x...
```

### Live Demo

- [V2 Tree Structure Demo](https://planetai87.github.io/onchain-loader/dist/loader.html?master=0x6bA2C7509cD342137d8275d1e4506A177Ea2d0f5) - MEGA_WARREN on-chain content

## Contract Structures

### V2 Tree Structure (Current)

The v2 structure uses a tree hierarchy for efficient storage and retrieval of large content.

```solidity
// Master Contract
interface IMasterV2 {
    struct SiteInfo {
        address rootChunk;  // Root of the tree
        uint8 depth;        // Tree depth
        uint256 totalSize;  // Total content size in bytes
    }
    function getCurrentSiteInfo() external view returns (SiteInfo memory);
}

// Chunk Contract (leaf nodes contain data, non-leaf nodes contain child addresses)
interface IChunk {
    function read() external view returns (bytes memory);
}
```

### V1 Flat Structure (Legacy)

The v1 structure uses a simple indexed array of chunks.

```solidity
// Master Contract
interface IMasterV1 {
    function getCurrentChunkCount() external view returns (uint256);
    function resolveCurrentChunk(uint256 index) external view returns (address);
}

// Chunk Contract
interface IChunkV1 {
    function read() external view returns (string memory);
}
```

## JavaScript Library

### V2 Loader (Tree Structure)

```html
<script type="module">
  import { createPublicClient, http, hexToBytes, toHex } from "https://esm.sh/viem@2.21.0";
  import { OnChainLoaderV2 } from "./onchain_loader.js";

  await OnChainLoaderV2.load({
    masterAddress: "0x...",
    rpcUrl: "https://timothy.megaeth.com/rpc",
    viem: { createPublicClient, http, hexToBytes, toHex },
    onProgress: (phase, current, total) => {
      console.log(`${phase}: ${current}/${total || '?'}`);
    }
  });
</script>
```

### V1 Loader (Flat Structure)

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js"></script>
<script src="onchain_loader.js"></script>
<script>
  OnChainLoader.load({
    masterAddress: "0x...",
    rpcUrl: "https://timothy.megaeth.com/rpc",
    onProgress: (current, total) => {
      console.log(`Loading: ${current}/${total}`);
    }
  });
</script>
```

## API Reference

### OnChainLoaderV2.load(config)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `masterAddress` | string | Yes | Master contract address |
| `rpcUrl` | string | Yes | RPC endpoint URL |
| `viem` | object | Yes | viem module with required functions |
| `onProgress` | function | No | Progress callback `(phase, current, total)` |
| `onError` | function | No | Error callback `(error)` |
| `showStatus` | boolean | No | Show loading status (default: true) |

### OnChainLoaderV2.getData(config)

Returns raw `Uint8Array` data without rendering. Useful for processing content programmatically.

### OnChainLoader.load(config) - V1 Legacy

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `masterAddress` | string | Yes | Master contract address |
| `rpcUrl` | string | Yes | RPC endpoint URL |
| `masterABI` | array | No | Custom master contract ABI |
| `pageABI` | array | No | Custom page contract ABI |
| `onProgress` | function | No | Progress callback `(current, total)` |
| `onError` | function | No | Error callback `(error)` |
| `showStatus` | boolean | No | Show loading status (default: true) |

## Project Structure

```
onchain-loader/
├── dist/
│   ├── loader.html           # Universal loader (auto-detects v1/v2)
│   └── onchain_loader.js     # JavaScript library
├── examples/
│   ├── demo.html
│   └── loader.html
├── src/
│   └── onchain_loader_lib.js
├── README.md
└── LICENSE
```

## Network Info

- **RPC Endpoint**: `https://timothy.megaeth.com/rpc`
- **Chain**: MegaETH Timothy Testnet

## Self-Hosting

1. Clone or download this repository
2. Host the `dist/` folder on any static web server
3. Access via: `https://your-host/dist/loader.html?master=0x...`

Alternatively, use services like:
- GitHub Pages
- Netlify
- Vercel
- IPFS

## The Promise of On-Chain Data

Content deployed to blockchain is:

- **Immutable**: Cannot be modified or deleted
- **Permanent**: Exists as long as the blockchain exists
- **Accessible**: Anyone can read it with the right tools

This loader is that tool. Keep a copy, host it yourself, or use any public instance. Your on-chain content will always be readable.

## Contributing

Contributions are welcome. Please submit pull requests for any improvements.

## License

MIT License - See [LICENSE](LICENSE) for details.

---

Built for permanence. Data on-chain lives forever.
