import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.0/ethers.min.js";

// Configuration
const RPC_URL = "https://timothy.megaeth.com/rpc";

// ABIs
const MASTER_ABI = [
    "function getCurrentSiteInfo() external view returns (tuple(address rootChunk, uint8 depth, uint256 totalSize))"
];
const PAGE_ABI = [
    "function read() external view returns (bytes)",
    "function DATA_POINTER() external view returns (address)"
];

// DOM Elements
const loaderContainer = document.getElementById('loader-container');
const contentFrame = document.getElementById('content-frame');
const logContainer = document.getElementById('log-container');
const donutScanned = document.getElementById('donut-scanned');
const donutLoaded = document.getElementById('donut-loaded');
const percentageDisplay = document.getElementById('percentage');
const percentageLabel = document.getElementById('percentageLabel');
const loadedCountDisplay = document.getElementById('loadedCount');
const scannedCountDisplay = document.getElementById('scannedCount');
const phaseTextDisplay = document.getElementById('phaseText');
const chunkGrid = document.getElementById('chunkGrid');
const bytesLoadedDisplay = document.getElementById('bytesLoaded');
const bytesTotalDisplay = document.getElementById('bytesTotal');

// State
let scannedChunks = 0;
let loadedChunks = 0;
let bytesLoaded = 0;
let chunkCells = [];

// Parallel system
const loadQueue = [];
const loadResults = new Map();
let scanComplete = false;
let globalProvider = null;
let expectedTotal = 0;
let loaderRunning = false;

const DONUT_CIRCUMFERENCE = 251.2;

// === UTILITY FUNCTIONS ===
function log(msg) {
    console.log(msg);
    const div = document.createElement('div');
    div.textContent = `> ${msg}`;
    logContainer?.appendChild(div);
}

function setPhase(phase) {
    if (phaseTextDisplay) phaseTextDisplay.textContent = phase;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// === UI UPDATE FUNCTIONS ===
function updateDonutChart() {
    if (!donutScanned || !donutLoaded) return;

    const scannedRatio = expectedTotal > 0 ? scannedChunks / expectedTotal : 0;
    const scannedArc = Math.min(1, scannedRatio) * DONUT_CIRCUMFERENCE;
    donutScanned.setAttribute('stroke-dasharray', `${scannedArc} ${DONUT_CIRCUMFERENCE}`);

    const loadedRatio = expectedTotal > 0 ? loadedChunks / expectedTotal : 0;
    const loadedArc = loadedRatio * DONUT_CIRCUMFERENCE;
    donutLoaded.setAttribute('stroke-dasharray', `${loadedArc} ${DONUT_CIRCUMFERENCE}`);

    const percent = Math.round(loadedRatio * 100);
    if (percentageDisplay) percentageDisplay.textContent = `${percent}%`;
    if (percentageLabel) {
        percentageLabel.textContent = scanComplete ? 'LOADED' : 'LOADING';
    }

    if (loadedCountDisplay) loadedCountDisplay.textContent = String(loadedChunks);
    if (scannedCountDisplay) scannedCountDisplay.textContent = String(scannedChunks);
    if (bytesLoadedDisplay) bytesLoadedDisplay.textContent = formatBytes(bytesLoaded);
}

function addChunkToGrid() {
    if (!chunkGrid) return;

    scannedChunks++;

    const cols = Math.min(10, Math.ceil(Math.sqrt(scannedChunks)));
    chunkGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    const cell = document.createElement('div');
    cell.className = 'chunk chunk-scanned';
    cell.title = `Chunk #${scannedChunks}`;
    chunkGrid.appendChild(cell);
    chunkCells.push(cell);

    updateDonutChart();
}

function updateChunkLoaded(index) {
    if (index >= 0 && index < chunkCells.length) {
        chunkCells[index].className = 'chunk chunk-loaded';
    }
    loadedChunks++;
    updateDonutChart();
}

function updateChunkLoading(index) {
    if (index >= 0 && index < chunkCells.length) {
        chunkCells[index].className = 'chunk chunk-loading';
    }
}

// === NETWORK FUNCTIONS ===
async function fetchWithRetry(fn, retries = 10, baseDelay = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === retries - 1) throw err;
            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, i) + Math.random() * 500;
            await new Promise(r => setTimeout(r, Math.min(delay, 10000)));
        }
    }
}

async function fetchChunk(provider, address) {
    const contract = new ethers.Contract(address, PAGE_ABI, provider);
    const dataHex = await contract.read();
    return ethers.getBytes(dataHex);
}

// === SEQUENTIAL LOADING (more reliable) ===
async function loadWorker() {
    if (loaderRunning) return;
    loaderRunning = true;

    // Process one at a time with delay
    while (loadQueue.length > 0 || !scanComplete) {
        if (loadQueue.length === 0) {
            await new Promise(r => setTimeout(r, 100));
            continue;
        }

        const chunk = loadQueue.shift();
        updateChunkLoading(chunk.index);

        try {
            const data = await fetchWithRetry(
                () => fetchChunk(globalProvider, chunk.address),
                10, 1000
            );
            loadResults.set(chunk.address, data);
            bytesLoaded += data.length;
            updateChunkLoaded(chunk.index);
        } catch (e) {
            log(`⚠️ Retry failed: ${chunk.address.substring(0, 10)}...`);
            // Re-queue at end
            loadQueue.push(chunk);
        }

        // Delay between loads
        await new Promise(r => setTimeout(r, 200));
    }

    loaderRunning = false;
}

// === TREE SCANNING ===
async function collectLeafChunks(provider, address, depth, offset = 0) {
    const contract = new ethers.Contract(address, PAGE_ABI, provider);

    let dataHex;
    try {
        dataHex = await fetchWithRetry(() => contract.read(), 10, 1000);
    } catch (e) {
        log(`❌ Scan failed: ${address.substring(0, 10)}...`);
        throw e;
    }

    const data = ethers.getBytes(dataHex);

    if (depth === 0) {
        const index = scannedChunks;
        addChunkToGrid();
        loadQueue.push({ address, offset, size: data.length, index });

        // Start loader if not running
        if (!loaderRunning) {
            loadWorker(); // Don't await - run in background
        }

        return [{ address, offset, size: data.length }];
    }

    // Parse child addresses
    const children = [];
    for (let i = 0; i < data.length; i += 20) {
        children.push(ethers.hexlify(data.slice(i, i + 20)));
    }

    setPhase(`DEPTH ${depth}: ${children.length} nodes`);

    // Scan ONE at a time with delay (conservative to avoid rate limits)
    const results = [];

    for (let i = 0; i < children.length; i++) {
        try {
            const childResults = await collectLeafChunks(provider, children[i], depth - 1, 0);
            results.push(...childResults);
        } catch (e) {
            log(`⚠️ Retrying child ${i + 1}/${children.length}...`);
            // Wait and retry once
            await new Promise(r => setTimeout(r, 2000));
            try {
                const childResults = await collectLeafChunks(provider, children[i], depth - 1, 0);
                results.push(...childResults);
            } catch (e2) {
                throw e2; // Give up
            }
        }

        // Delay between each child to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
    }

    // Fix offsets
    let currentOffset = offset;
    return results.map(chunk => {
        const fixed = { ...chunk, offset: currentOffset };
        currentOffset += chunk.size;
        return fixed;
    });
}

// === MAIN LOADING FUNCTION ===
async function fetchTree(provider, rootChunk, depth) {
    globalProvider = provider;
    scanComplete = false;

    log("📋 Starting scan + load...");
    setPhase('SCANNING');

    // Scan tree (loader runs in background)
    const leafChunks = await collectLeafChunks(provider, rootChunk, depth);
    scanComplete = true;
    expectedTotal = leafChunks.length;

    log(`✅ Scan complete: ${leafChunks.length} chunks`);
    setPhase('LOADING');

    // Wait for all loads
    const maxWait = 120000; // 2 minutes
    const start = Date.now();
    while (loadResults.size < leafChunks.length) {
        if (Date.now() - start > maxWait) {
            throw new Error(`Timeout: ${loadResults.size}/${leafChunks.length}`);
        }
        updateDonutChart();
        await new Promise(r => setTimeout(r, 500));
    }

    log(`✅ All ${leafChunks.length} chunks loaded!`);

    // Recalculate offsets
    let currentOffset = 0;
    for (const chunk of leafChunks) {
        const data = loadResults.get(chunk.address);
        chunk.size = data.length;
        chunk.offset = currentOffset;
        currentOffset += chunk.size;
    }

    // Assemble
    const totalSize = leafChunks.reduce((sum, c) => sum + c.size, 0);
    const finalData = new Uint8Array(totalSize);

    setPhase('ASSEMBLING');

    for (const chunk of leafChunks) {
        finalData.set(loadResults.get(chunk.address), chunk.offset);
    }

    if (bytesTotalDisplay) bytesTotalDisplay.textContent = formatBytes(totalSize);

    return finalData;
}

// === INIT ===
async function init() {
    const params = new URLSearchParams(window.location.search);
    const masterAddress = params.get('master');

    if (!masterAddress) {
        setPhase('ERROR: NO ADDRESS');
        return;
    }

    try {
        setPhase('CONNECTING');
        const provider = new ethers.JsonRpcProvider(RPC_URL);

        setPhase('READING CONTRACT');
        const master = new ethers.Contract(masterAddress, MASTER_ABI, provider);
        const info = await master.getCurrentSiteInfo();

        const { rootChunk, depth, totalSize } = info;
        log(`Root: ${rootChunk.substring(0, 10)}..., Depth: ${depth}`);

        expectedTotal = Math.ceil(Number(totalSize) / 3000);
        if (bytesTotalDisplay) bytesTotalDisplay.textContent = formatBytes(Number(totalSize));

        const htmlData = await fetchTree(provider, rootChunk, Number(depth));

        setPhase('RENDERING');
        const htmlString = new TextDecoder().decode(htmlData);

        loaderContainer.style.display = 'none';
        contentFrame.style.display = 'block';
        contentFrame.srcdoc = htmlString;

    } catch (err) {
        log(`❌ Error: ${err.message}`);
        setPhase('ERROR');
        console.error(err);
    }
}

init();
