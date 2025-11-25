# OnChain Loader

Load HTML content from Ethereum smart contracts with a single URL.

## 🚀 Quick Start

Just add your contract address to this URL:

https://github.com/planetai87/onchain-loader/dist/loader.html?master=0xYOUR_ADDRESS&rpc=https://YOUR_RPC

## 📖 Examples

- [Demo](https://github.com/planetai87/onchain-loader/examples/demo.html)
- [MEGA_WARREN](https://github.com/planetai87/onchain-loader/dist/loader.html?master=0x7c57f2A97D075fd61bE15a112E5294492DBB6079&rpc=https://timothy.megaeth.com/rpc)

## 💡 Usage Methods

### Method 1: URL Parameters (Recommended)
master=CONTRACT_ADDRESS&rpc=RPC_URL

### Method 2: Hash Config
#{"masterAddress":"0x...","rpcUrl":"https://..."}

### Method 3: Base64 Config
?config=BASE64_ENCODED_JSON

## 🔧 For Developers

Use jsDelivr CDN:
https://cdn.jsdelivr.net/gh/planetai87/onchain-loader/dist/loader.html

## License
MIT