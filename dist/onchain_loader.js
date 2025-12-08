/**
 * OnChainLoader.js v2
 * A library for loading on-chain HTML content from MegaETH smart contracts
 * Supports both v1 (flat) and v2 (tree) contract structures
 *
 * For MEGA_WARREN Project - Permanent On-Chain Content Preservation
 *
 * Usage with ethers.js (v1 flat structure):
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js"></script>
 * <script src="onchain_loader.js"></script>
 * <script>
 *   OnChainLoader.load({
 *     masterAddress: "0x...",
 *     rpcUrl: "https://timothy.megaeth.com/rpc"
 *   });
 * </script>
 *
 * Usage with viem (v2 tree structure):
 * <script type="module">
 *   import { OnChainLoaderV2 } from './onchain_loader.js';
 *   await OnChainLoaderV2.load({
 *     masterAddress: "0x...",
 *     rpcUrl: "https://timothy.megaeth.com/rpc"
 *   });
 * </script>
 */

// ============================================
// V1 Loader (Flat Structure) - ethers.js based
// ============================================
const OnChainLoader = {

  // Default ABIs for v1 flat structure
  DEFAULT_MASTER_ABI: [
    "function currentVersion() external view returns (uint256)",
    "function getCurrentChunkCount() external view returns (uint256)",
    "function resolveCurrentChunk(uint256 index) external view returns (address)"
  ],

  DEFAULT_PAGE_ABI: [
    "function read() external view returns (string)"
  ],

  /**
   * Load and execute on-chain content (v1 flat structure)
   * @param {Object} config - Configuration object
   * @param {string} config.masterAddress - Master contract address
   * @param {string} config.rpcUrl - RPC endpoint URL
   * @param {Array} config.masterABI - (Optional) Custom master contract ABI
   * @param {Array} config.pageABI - (Optional) Custom page contract ABI
   * @param {Function} config.onProgress - (Optional) Progress callback (current, total)
   * @param {Function} config.onError - (Optional) Error callback
   * @param {boolean} config.showStatus - (Optional) Show loading status (default: true)
   */
  async load(config) {
    const {
      masterAddress,
      rpcUrl,
      masterABI = this.DEFAULT_MASTER_ABI,
      pageABI = this.DEFAULT_PAGE_ABI,
      onProgress = null,
      onError = null,
      showStatus = true
    } = config;

    // Validation
    if (!masterAddress || !rpcUrl) {
      throw new Error("masterAddress and rpcUrl are required");
    }

    let statusElement = null;

    // Create status display if enabled
    if (showStatus) {
      statusElement = this._createStatusElement();
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const master = new ethers.Contract(masterAddress, masterABI, provider);

      // Get chunk count
      const count = Number(await master.getCurrentChunkCount());
      if (count === 0) throw new Error("No data found on chain");

      let fullSource = "";

      // Load all chunks
      for (let i = 0; i < count; i++) {
        if (statusElement) {
          statusElement.textContent = `Loading ${i + 1}/${count}...`;
        }

        if (onProgress) {
          onProgress(i + 1, count);
        }

        const chunkAddr = await master.resolveCurrentChunk(i);
        const page = new ethers.Contract(chunkAddr, pageABI, provider);
        fullSource += await page.read();
      }

      // Execute the loaded content
      document.open();
      document.write(fullSource);
      document.close();

    } catch (err) {
      console.error("OnChainLoader Error:", err);

      if (onError) {
        onError(err);
      } else {
        document.body.innerHTML = `<div style="color:#ff003c;font-family:monospace;padding:20px">Error: ${err.message}</div>`;
      }
    }
  },

  /**
   * Create a centered status element
   * @private
   */
  _createStatusElement() {
    const style = document.createElement('style');
    style.textContent = `
      body {
        background: #000;
        color: #00ff41;
        font-family: monospace;
        margin: 0;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
    document.head.appendChild(style);

    const status = document.createElement('div');
    status.textContent = 'Initializing...';
    document.body.appendChild(status);
    return status;
  },

  /**
   * Load with custom master contract that has different method names
   */
  async loadCustom(config) {
    const {
      masterAddress,
      rpcUrl,
      getCountMethod = "getCurrentChunkCount",
      resolveMethod = "resolveCurrentChunk",
      readMethod = "read",
      onProgress = null,
      onError = null,
      showStatus = true
    } = config;

    const masterABI = [
      `function ${getCountMethod}() external view returns (uint256)`,
      `function ${resolveMethod}(uint256 index) external view returns (address)`
    ];

    const pageABI = [
      `function ${readMethod}() external view returns (string)`
    ];

    return this.load({
      ...config,
      masterABI,
      pageABI
    });
  }
};

// ============================================
// V2 Loader (Tree Structure) - viem based
// ============================================
const OnChainLoaderV2 = {

  CHUNK_SIZE: 3000,

  // ABIs for v2 tree structure
  MASTER_ABI_V2: [
    {
      name: 'getCurrentSiteInfo',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{
        type: 'tuple',
        components: [
          { name: 'rootChunk', type: 'address' },
          { name: 'depth', type: 'uint8' },
          { name: 'totalSize', type: 'uint256' }
        ]
      }]
    }
  ],

  PAGE_ABI: [
    {
      name: 'read',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'bytes' }]
    }
  ],

  /**
   * Load on-chain content using v2 tree structure
   * Requires viem library to be imported
   *
   * @param {Object} config - Configuration object
   * @param {string} config.masterAddress - Master contract address
   * @param {string} config.rpcUrl - RPC endpoint URL
   * @param {Function} config.onProgress - (Optional) Progress callback (phase, current, total)
   * @param {Function} config.onError - (Optional) Error callback
   * @param {boolean} config.showStatus - (Optional) Show loading status (default: true)
   * @param {Object} config.viem - viem module (required: createPublicClient, http, hexToBytes, toHex)
   */
  async load(config) {
    const {
      masterAddress,
      rpcUrl,
      onProgress = null,
      onError = null,
      showStatus = true,
      viem
    } = config;

    if (!masterAddress || !rpcUrl) {
      throw new Error("masterAddress and rpcUrl are required");
    }

    if (!viem || !viem.createPublicClient) {
      throw new Error("viem module is required for v2 loader");
    }

    const { createPublicClient, http, hexToBytes, toHex } = viem;

    let statusElement = null;
    if (showStatus) {
      statusElement = this._createStatusElement();
    }

    const updateStatus = (text) => {
      if (statusElement) statusElement.textContent = text;
    };

    try {
      const client = createPublicClient({
        transport: http(rpcUrl)
      });

      updateStatus('Reading contract info...');

      // Read contract info
      const info = await client.readContract({
        address: masterAddress,
        abi: this.MASTER_ABI_V2,
        functionName: 'getCurrentSiteInfo'
      });

      const { rootChunk, depth, totalSize } = info;

      // Collect leaf addresses
      updateStatus('Scanning tree structure...');
      const leaves = await this._collectLeaves(client, rootChunk, Number(depth), hexToBytes, toHex, (count) => {
        updateStatus(`Scanning: ${count} chunks found`);
        if (onProgress) onProgress('scan', count, null);
      });

      // Load chunks
      updateStatus('Loading chunks...');
      const chunks = await this._loadChunks(client, leaves, hexToBytes, (current, total) => {
        updateStatus(`Loading: ${current}/${total}`);
        if (onProgress) onProgress('load', current, total);
      });

      // Assemble
      updateStatus('Assembling...');
      const data = this._assembleChunks(chunks);

      // Detect encoding and decode
      const htmlString = this._decodeContent(data);

      // Render
      document.open();
      document.write(htmlString);
      document.close();

    } catch (err) {
      console.error("OnChainLoaderV2 Error:", err);

      if (onError) {
        onError(err);
      } else {
        document.body.innerHTML = `<div style="color:#ff003c;font-family:monospace;padding:20px">Error: ${err.message}</div>`;
      }
    }
  },

  /**
   * Collect all leaf addresses from tree structure
   * @private
   */
  async _collectLeaves(client, rootChunk, depth, hexToBytes, toHex, onFound) {
    const leaves = [];

    const traverse = async (address, nodeDepth) => {
      if (nodeDepth === 0) {
        leaves.push(address);
        onFound(leaves.length);
        return;
      }

      const data = await this._fetchChunkData(client, address, hexToBytes);
      const childAddrs = [];
      for (let i = 0; i < data.length; i += 20) {
        childAddrs.push(toHex(data.slice(i, i + 20)));
      }

      for (const childAddr of childAddrs) {
        await traverse(childAddr, nodeDepth - 1);
      }
    };

    await traverse(rootChunk, depth);
    return leaves;
  },

  /**
   * Load chunks with retry logic
   * @private
   */
  async _loadChunks(client, leaves, hexToBytes, onProgress) {
    const chunks = [];
    const failed = [];

    for (let i = 0; i < leaves.length; i++) {
      onProgress(i + 1, leaves.length);

      try {
        const data = await this._fetchChunkData(client, leaves[i], hexToBytes, 2);
        chunks.push({ index: i, data });
      } catch (err) {
        failed.push({ index: i, address: leaves[i] });
      }
    }

    // Retry failed chunks
    let toRetry = [...failed];
    let retryRound = 0;

    while (toRetry.length > 0 && retryRound < 5) {
      retryRound++;
      const stillFailed = [];

      await new Promise(r => setTimeout(r, 500 * retryRound));

      for (const item of toRetry) {
        try {
          const data = await this._fetchChunkData(client, item.address, hexToBytes, 3);
          chunks.push({ index: item.index, data });
        } catch (err) {
          stillFailed.push(item);
        }
        await new Promise(r => setTimeout(r, 100));
      }
      toRetry = stillFailed;
    }

    return chunks;
  },

  /**
   * Fetch chunk data with retry
   * @private
   */
  async _fetchChunkData(client, address, hexToBytes, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const data = await client.readContract({
          address,
          abi: this.PAGE_ABI,
          functionName: 'read'
        });
        return hexToBytes(data);
      } catch (err) {
        if (i === retries - 1) throw err;
        const delay = 200 * Math.pow(2, i);
        await new Promise(r => setTimeout(r, Math.min(delay, 2000)));
      }
    }
  },

  /**
   * Assemble chunks into single Uint8Array
   * @private
   */
  _assembleChunks(chunks) {
    chunks.sort((a, b) => a.index - b.index);
    const totalBytes = chunks.reduce((sum, c) => sum + c.data.length, 0);
    const finalData = new Uint8Array(totalBytes);

    let offset = 0;
    for (const chunk of chunks) {
      finalData.set(chunk.data, offset);
      offset += chunk.data.length;
    }

    return finalData;
  },

  /**
   * Decode content with encoding detection
   * @private
   */
  _decodeContent(data) {
    const asciiPreview = new TextDecoder('ascii', { fatal: false }).decode(data.slice(0, 2000));
    const charsetMatch = asciiPreview.match(/charset=["']?(euc-kr|cp949|ks_c_5601-1987)/i);

    if (charsetMatch) {
      return new TextDecoder('euc-kr').decode(data);
    }
    return new TextDecoder('utf-8').decode(data);
  },

  /**
   * Create status element
   * @private
   */
  _createStatusElement() {
    const style = document.createElement('style');
    style.textContent = `
      body {
        background: #000;
        color: #00ff41;
        font-family: monospace;
        margin: 0;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
    `;
    document.head.appendChild(style);

    const status = document.createElement('div');
    status.textContent = 'Initializing...';
    document.body.appendChild(status);
    return status;
  },

  /**
   * Get raw data without rendering (useful for processing)
   */
  async getData(config) {
    const {
      masterAddress,
      rpcUrl,
      viem
    } = config;

    if (!viem || !viem.createPublicClient) {
      throw new Error("viem module is required");
    }

    const { createPublicClient, http, hexToBytes, toHex } = viem;

    const client = createPublicClient({
      transport: http(rpcUrl)
    });

    const info = await client.readContract({
      address: masterAddress,
      abi: this.MASTER_ABI_V2,
      functionName: 'getCurrentSiteInfo'
    });

    const { rootChunk, depth } = info;
    const leaves = await this._collectLeaves(client, rootChunk, Number(depth), hexToBytes, toHex, () => {});
    const chunks = await this._loadChunks(client, leaves, hexToBytes, () => {});

    return this._assembleChunks(chunks);
  }
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OnChainLoader, OnChainLoaderV2 };
}
if (typeof window !== 'undefined') {
  window.OnChainLoader = OnChainLoader;
  window.OnChainLoaderV2 = OnChainLoaderV2;
}

// ES Module export
export { OnChainLoader, OnChainLoaderV2 };
