import fs from "fs";
import path from "path";
import shell from "./shell";
import { ethers } from "ethers";

const batchSize = 50; // Fetch blocks in batches of n
const blocksDir = "blocks";

// Block numbers are extracted from the file names to check the lastest fetched block
// Number are padded by 0s for auto-ordering
const getBlockPath = (blockNumber: number) =>
  path.join(blocksDir, `block-${String(blockNumber).padStart(8, "0")}.json`);
const getBlockNumFromPath = (name: string) =>
  parseInt(name.slice(6).slice(0, -5));

/**
 * Fetches all blocks from Ethereum mainnet and commits them individually to this repo
 */
async function recordBlockchain() {
  if (!fs.existsSync(blocksDir)) fs.mkdirSync(blocksDir);

  const provider = new ethers.providers.InfuraProvider();
  const highestBlock = await provider.getBlockNumber();

  const onDiskBlockNames = fs.readdirSync(blocksDir);
  const onDiskBlockNumbers = onDiskBlockNames.map(getBlockNumFromPath);
  const firstBlock =
    (onDiskBlockNumbers.length > 0 && Math.max(...onDiskBlockNumbers)) || 0;

  console.log(`Running blocks from ${firstBlock} to ${highestBlock}`);

  for (
    let blockNumber = firstBlock + 1;
    blockNumber < highestBlock;
    blockNumber += batchSize
  ) {
    const from = blockNumber;
    const to = blockNumber + batchSize;
    const blockNumbersToFetch: number[] = [];
    for (let i = from; i < to; i++) blockNumbersToFetch.push(i);

    // Fetch blocks in batch
    console.log(`Fetching blocks ${from} to ${to}`);
    const blocks = await Promise.all(
      blockNumbersToFetch.map(i => provider.getBlock(i, true))
    );

    // Commit blocks in batch
    for (const block of blocks) {
      const blockNumber = block.number;
      const filePath = getBlockPath(blockNumber);
      // Write block to disk
      fs.writeFileSync(filePath, JSON.stringify(block, null, 2));
      // Commit block
      await shell(`git add ${filePath}`);
      await shell(`git commit -m "Add block ${blockNumber}"`);
      console.log(`Commited block ${blockNumber}`);
    }

    // Push commit batch
    console.log(`Pushing block commits ${from} to ${to}`);
    await shell(`git push`);
  }
}

recordBlockchain();
