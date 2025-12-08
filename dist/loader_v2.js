import { createPublicClient, http, hexToBytes, toHex } from "https://esm.sh/viem@2.21.0";

// Configuration
const RPC_URL = "https://timothy.megaeth.com/rpc";
const CHUNK_SIZE = 3000;

// ABIs
const masterAbi = [
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
];
const pageAbi = [
    {
        name: 'read',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'bytes' }]
    }
];

// Create viem client
const client = createPublicClient({
    transport: http(RPC_URL)
});

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
let expectedTotal = 0;
let isRetrying = false;

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
        percentageLabel.textContent = isRetrying ? 'RETRY' : 'LOADING';
    }

    if (loadedCountDisplay) loadedCountDisplay.textContent = String(loadedChunks);
    if (scannedCountDisplay) scannedCountDisplay.textContent = String(scannedChunks);
    if (bytesLoadedDisplay) bytesLoadedDisplay.textContent = formatBytes(bytesLoaded);
}

function initChunkGrid(total) {
    if (!chunkGrid) return;
    chunkGrid.innerHTML = '';
    chunkCells = [];

    const cols = Math.min(10, Math.ceil(Math.sqrt(total)));
    chunkGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let i = 0; i < total; i++) {
        const cell = document.createElement('div');
        cell.className = 'chunk chunk-pending';
        cell.title = `Chunk #${i + 1}`;
        chunkGrid.appendChild(cell);
        chunkCells.push(cell);
    }
}

function updateChunkScanned(index) {
    if (index >= 0 && index < chunkCells.length) {
        chunkCells[index].className = 'chunk chunk-scanned';
    }
    scannedChunks++;
    updateDonutChart();
}

function updateChunkLoading(index) {
    if (index >= 0 && index < chunkCells.length) {
        chunkCells[index].className = 'chunk chunk-loading';
    }
}

function updateChunkLoaded(index) {
    if (index >= 0 && index < chunkCells.length) {
        chunkCells[index].className = 'chunk chunk-loaded';
    }
    loadedChunks++;
    updateDonutChart();
}

function updateChunkFailed(index) {
    if (index >= 0 && index < chunkCells.length) {
        chunkCells[index].className = 'chunk chunk-failed';
    }
}

function updateChunkRetrying(index) {
    if (index >= 0 && index < chunkCells.length) {
        chunkCells[index].className = 'chunk chunk-loading';
    }
}

// === NETWORK FUNCTIONS ===
// Fast sequential chunk fetch (no delay between requests)
async function fetchChunkData(address, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const data = await client.readContract({
                address,
                abi: pageAbi,
                functionName: 'read'
            });
            return hexToBytes(data);
        } catch (err) {
            if (i === retries - 1) throw err;
            const delay = 200 * Math.pow(2, i);
            await new Promise(r => setTimeout(r, Math.min(delay, 2000)));
        }
    }
}

// === PHASE 1: COLLECT ALL LEAF ADDRESSES ===
async function collectLeafAddresses(rootChunk, depth) {
    const leaves = [];
    let currentIndex = 0;

    async function traverseNode(address, nodeDepth) {
        if (nodeDepth === 0) {
            leaves.push({ index: currentIndex++, address });
            updateChunkScanned(leaves.length - 1);
            return;
        }

        try {
            const data = await fetchChunkData(address, 3);
            const childAddrs = [];
            for (let i = 0; i < data.length; i += 20) {
                childAddrs.push(toHex(data.slice(i, i + 20)));
            }

            setPhase(`SCAN DEPTH ${nodeDepth}: ${childAddrs.length} nodes`);

            for (const childAddr of childAddrs) {
                await traverseNode(childAddr, nodeDepth - 1);
            }
        } catch (err) {
            log(`Failed to traverse node: ${address.substring(0, 10)}...`);
            throw err;
        }
    }

    await traverseNode(rootChunk, depth);
    return leaves;
}

// === PHASE 2: SEQUENTIAL FAST LOADING ===
async function loadChunksSequentially(leaves) {
    const chunks = [];
    const failed = [];

    for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];

        setPhase(`LOADING ${i + 1} / ${leaves.length}`);
        updateChunkLoading(leaf.index);

        try {
            const data = await fetchChunkData(leaf.address, 2);
            chunks.push({ index: leaf.index, data });
            bytesLoaded += data.length;
            updateChunkLoaded(leaf.index);
        } catch (err) {
            failed.push(leaf);
            updateChunkFailed(leaf.index);
            log(`Failed chunk ${i + 1}: ${err.message}`);
        }
    }

    return { chunks, failed };
}

// === PHASE 3: RETRY FAILED CHUNKS ===
async function retryFailedChunks(failed, chunks) {
    if (failed.length === 0) return;

    isRetrying = true;
    let retryRound = 0;
    let toRetry = [...failed];

    while (toRetry.length > 0 && retryRound < 5) {
        retryRound++;
        const stillFailed = [];

        setPhase(`RETRY ${retryRound}: ${toRetry.length} chunks`);
        log(`Retry round ${retryRound}: ${toRetry.length} chunks`);

        await new Promise(r => setTimeout(r, 500 * retryRound));

        for (const leaf of toRetry) {
            updateChunkRetrying(leaf.index);

            try {
                const data = await fetchChunkData(leaf.address, 3);
                chunks.push({ index: leaf.index, data });
                bytesLoaded += data.length;
                updateChunkLoaded(leaf.index);
            } catch (err) {
                stillFailed.push(leaf);
                updateChunkFailed(leaf.index);
            }

            await new Promise(r => setTimeout(r, 100));
        }

        toRetry = stillFailed;
    }

    isRetrying = false;

    if (toRetry.length > 0) {
        log(`${toRetry.length} chunks permanently failed`);
    }
}

// === MAIN LOADER (SEQUENTIAL) ===
async function fetchTreeSequential(rootChunk, depth, totalSize) {
    initChunkGrid(expectedTotal);

    log("Starting sequential fast load...");

    // Phase 1: Collect all leaf addresses
    setPhase('PHASE 1: SCANNING');
    log("Phase 1: Collecting chunk addresses...");
    const leaves = await collectLeafAddresses(rootChunk, depth);
    log(`Found ${leaves.length} leaf chunks`);

    // Phase 2: Sequential fast loading
    setPhase('PHASE 2: LOADING');
    log("Phase 2: Sequential loading...");
    const { chunks, failed } = await loadChunksSequentially(leaves);
    log(`Loaded: ${chunks.length}, Failed: ${failed.length}`);

    // Phase 3: Retry failed chunks
    if (failed.length > 0) {
        setPhase('PHASE 3: RETRY');
        log("Phase 3: Retrying failed chunks...");
        await retryFailedChunks(failed, chunks);
    }

    // Sort by index and assemble
    chunks.sort((a, b) => a.index - b.index);

    setPhase('ASSEMBLING');
    const totalBytes = chunks.reduce((sum, c) => sum + c.data.length, 0);
    const finalData = new Uint8Array(totalBytes);

    let offset = 0;
    for (const chunk of chunks) {
        finalData.set(chunk.data, offset);
        offset += chunk.data.length;
    }

    if (bytesTotalDisplay) bytesTotalDisplay.textContent = formatBytes(totalBytes);

    log(`Complete! ${chunks.length} chunks, ${formatBytes(totalBytes)}`);
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

        setPhase('READING CONTRACT');
        const info = await client.readContract({
            address: masterAddress,
            abi: masterAbi,
            functionName: 'getCurrentSiteInfo'
        });

        const { rootChunk, depth, totalSize } = info;
        log(`Root: ${rootChunk.substring(0, 10)}..., Depth: ${depth}`);

        expectedTotal = Math.ceil(Number(totalSize) / CHUNK_SIZE);
        if (bytesTotalDisplay) bytesTotalDisplay.textContent = formatBytes(Number(totalSize));

        // Use sequential loader (no multicall)
        const htmlData = await fetchTreeSequential(rootChunk, Number(depth), Number(totalSize));

        setPhase('RENDERING');

        // Encoding detection and decoding
        const asciiPreview = new TextDecoder('ascii', { fatal: false }).decode(htmlData.slice(0, 2000));
        const charsetMatch = asciiPreview.match(/charset=["']?(euc-kr|cp949|ks_c_5601-1987)/i);

        let htmlString;
        if (charsetMatch) {
            log(`Encoding detected: ${charsetMatch[1]}`);
            htmlString = new TextDecoder('euc-kr').decode(htmlData);
        } else {
            htmlString = new TextDecoder('utf-8').decode(htmlData);
        }

        loaderContainer.style.display = 'none';
        contentFrame.style.display = 'block';
        contentFrame.srcdoc = htmlString;

    } catch (err) {
        log(`Error: ${err.message}`);
        setPhase('ERROR');
        console.error(err);
    }
}

init();
