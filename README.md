# MegaETH OnChain Loader

> Load HTML content directly from MegaETH smart contracts with a single URL

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MegaETH](https://img.shields.io/badge/Chain-MegaETH-blue)](https://megaeth.com)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://planetai87.github.io/onchain-loader/examples/demo.html)

## ✨ Why MegaETH?

MegaETH is the world's first real-time blockchain, offering:

- ⚡ **Real-time Performance** - Sub-millisecond block times
- 💰 **Ultra-low Gas Fees** - Store large HTML files on-chain affordably
- 🚀 **High Throughput** - Perfect for on-chain web applications
- 🌐 **EVM Compatible** - Works with standard Ethereum tools

OnChain Loader leverages MegaETH's speed to deliver instant on-chain content loading.

## 🎯 Quick Start

### Use it right now (no installation):

```
https://planetai87.github.io/onchain-loader/dist/loader.html?master=YOUR_CONTRACT
```

### Example

- [Live Demo 1](https://planetai87.github.io/onchain-loader/dist/loader.html?master=0x7c57f2A97D075fd61bE15a112E5294492DBB6079&rpc=https://timothy.megaeth.com/rpc)
- [Live Demo 2](https://planetai87.github.io/onchain-loader/dist/loader.html?master=0x3A640e0139f0c389Da72a8d2BA49F108cE3387D4&rpc=https://timothy.megaeth.com/rpc)

## 📖 How It Works

OnChain Loader fetches HTML content stored across multiple MegaETH smart contracts and renders it instantly in your browser. 

Thanks to MegaETH's real-time performance:
- 🚀 Lightning-fast chunk retrieval
- ⚡ Near-instant page loading
- 💰 Affordable on-chain storage costs

Perfect for:
- 📄 Fully on-chain websites
- 🎨 NFT metadata and dynamic art
- 📚 Decentralized documentation
- 🎮 On-chain games and interactive apps

## 🔧 Usage Methods

### Method 1: Direct URL (Recommended)

Simply add your MegaETH contract address:

```
?master=0xYOUR_CONTRACT_ADDRESS&rpc=https://timothy.megaeth.com/rpc
```

**Example:**
```html
<a href="https://planetai87.github.io/onchain-loader/dist/loader.html?master=0x123...&rpc=https://timothy.megaeth.com/rpc">
  View On-Chain Content
</a>
```

### Method 2: Hash Configuration

Pass configuration in URL hash:

```
#{"masterAddress":"0x...","rpcUrl":"https://timothy.megaeth.com/rpc"}
```

### Method 3: Base64 Config

Encode your config and pass it:

```javascript
const config = {
  masterAddress: "0x...",
  rpcUrl: "https://timothy.megaeth.com/rpc"
};
const encoded = btoa(JSON.stringify(config));
// Use: ?config=BASE64_STRING
```

### Method 4: JavaScript Library

For developers who want more control:

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/planetai87/onchain-loader/dist/onchain-loader.js"></script>
</head>
<body>
    <script>
        OnChainLoader.load({
            masterAddress: "0x7c57f2A97D075fd61bE15a112E5294492DBB6079",
            rpcUrl: "https://timothy.megaeth.com/rpc",
            onProgress: (current, total) => {
                console.log(`Loading: ${current}/${total}`);
            }
        });
    </script>
</body>
</html>
```

## 🏗️ Smart Contract Interface

Deploy your contracts on MegaETH with these interfaces:

### Master Contract

```solidity
interface IMasterContract {
    function getCurrentChunkCount() external view returns (uint256);
    function resolveCurrentChunk(uint256 index) external view returns (address);
}
```

### Chunk Contract

```solidity
interface IChunkContract {
    function read() external view returns (string memory);
}
```

## ⚡ MegaETH Network Info

- **RPC Endpoint**: `https://timothy.megaeth.com/rpc`
- **Chain Name**: MegaETH Timothy Testnet
- **Performance**: Real-time, sub-millisecond blocks
- **Gas**: Ultra-low fees for on-chain storage

## 📝 API Reference

### OnChainLoader.load(config)

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `masterAddress` | string | ✅ | - | Master contract address on MegaETH |
| `rpcUrl` | string | ✅ | - | MegaETH RPC endpoint |
| `masterABI` | Array | ❌ | Default ABI | Custom master contract ABI |
| `pageABI` | Array | ❌ | Default ABI | Custom page contract ABI |
| `onProgress` | Function | ❌ | null | Progress callback `(current, total) => {}` |
| `onError` | Function | ❌ | null | Error callback `(error) => {}` |
| `showStatus` | boolean | ❌ | true | Show loading status |

## 🎨 Examples

### Basic Usage
```
https://planetai87.github.io/onchain-loader/dist/loader.html?master=0xYOUR_ADDRESS&rpc=https://timothy.megaeth.com/rpc
```

### Embed in iframe
```html
<iframe 
  src="https://planetai87.github.io/onchain-loader/dist/loader.html?master=0x...&rpc=https://timothy.megaeth.com/rpc"
  width="100%" 
  height="600">
</iframe>
```

### Custom Error Handling
```javascript
OnChainLoader.load({
    masterAddress: "0x...",
    rpcUrl: "https://timothy.megaeth.com/rpc",
    onError: (err) => {
        alert(`Failed to load: ${err.message}`);
    }
});
```

### Progress Tracking
```javascript
OnChainLoader.load({
    masterAddress: "0x...",
    rpcUrl: "https://timothy.megaeth.com/rpc",
    onProgress: (current, total) => {
        const percent = Math.round((current / total) * 100);
        console.log(`Loading: ${percent}%`);
    }
});
```

## 🚀 CDN Links

### Loader Page
- [jsDelivr CDN](https://cdn.jsdelivr.net/gh/planetai87/onchain-loader/dist/loader.html)
- [GitHub Pages](https://planetai87.github.io/onchain-loader/dist/loader.html)

### JavaScript Library
- [jsDelivr CDN](https://cdn.jsdelivr.net/gh/planetai87/onchain-loader/dist/onchain-loader.js)

## 📦 Project Structure

```
onchain-loader/
├── dist/
│   ├── loader.html              # Universal loader (use this!)
│   └── onchain-loader.js        # JavaScript library
├── examples/
│   └── demo.html                # Demo page
├── README.md
└── LICENSE
```

## 🛠️ Development

### Clone Repository
```bash
git clone https://github.com/planetai87/onchain-loader.git
cd onchain-loader
```

### Local Testing
Simply open `dist/loader.html` in a browser with URL parameters.

### Deploy Your Own
1. Fork this repository
2. Enable GitHub Pages in Settings
3. Use your own URL: `https://yourusername.github.io/onchain-loader/dist/loader.html`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🌟 Use Cases on MegaETH

- **On-Chain Websites**: Host entire websites on MegaETH with instant loading
- **NFT Galleries**: Dynamic, interactive NFT experiences stored fully on-chain
- **Documentation**: Decentralized docs that load in real-time
- **Games**: On-chain game clients with sub-millisecond response times
- **DApps**: Full-featured decentralized applications with no off-chain dependencies

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [ethers.js](https://ethers.org/)
- Powered by [MegaETH](https://megaeth.com)
- Inspired by the fully on-chain movement

## 📞 Support

- 🐛 [Report Issues](https://github.com/planetai87/onchain-loader/issues)
- 💡 [Request Features](https://github.com/planetai87/onchain-loader/issues/new)
- 📖 [Documentation](https://github.com/planetai87/onchain-loader)
- 🌐 [MegaETH Docs](https://docs.megaeth.com)

## 🌟 Show Your Support

Give a ⭐️ if this project helped you build on MegaETH!

---

Made with ❤️ for MegaETH and the decentralized web