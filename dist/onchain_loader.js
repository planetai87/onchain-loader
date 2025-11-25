/**
 * OnChainLoader.js
 * A library for loading on-chain HTML content from Ethereum smart contracts
 * 
 * Usage:
 * <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.umd.min.js"></script>
 * <script src="onchain-loader.js"></script>
 * <script>
 *   OnChainLoader.load({
 *     masterAddress: "0x7c57f2A97D075fd61bE15a112E5294492DBB6079",
 *     rpcUrl: "https://timothy.megaeth.com/rpc"
 *   });
 * </script>
 */

const OnChainLoader = {
  
  // Default ABIs
  DEFAULT_MASTER_ABI: [
    "function currentVersion() external view returns (uint256)",
    "function getCurrentChunkCount() external view returns (uint256)",
    "function resolveCurrentChunk(uint256 index) external view returns (address)"
  ],
  
  DEFAULT_PAGE_ABI: [
    "function read() external view returns (string)"
  ],

  /**
   * Load and execute on-chain content
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

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OnChainLoader;
}
if (typeof window !== 'undefined') {
  window.OnChainLoader = OnChainLoader;
}