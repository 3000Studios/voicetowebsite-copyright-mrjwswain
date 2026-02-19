import { classifyIntents } from "../worker/intentClassifier.js";
import { extractEntities } from "../worker/entityExtractor.js";
import fs from "node:fs";

const intentMap = JSON.parse(fs.readFileSync("./config/intent-map.json", "utf8"));

const rawInput = "add adsense and affiliate engine to my midnight steel site, also ship it";
const entities = extractEntities(rawInput);

const ITERATIONS = 100000;

console.log(`Running benchmark with ${ITERATIONS} iterations...`);
const start = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  classifyIntents(rawInput, entities, intentMap);
}
const end = performance.now();

const totalTime = end - start;
console.log(`Total time: ${totalTime.toFixed(2)}ms`);
console.log(`Average time: ${(totalTime / ITERATIONS).toFixed(4)}ms per call`);
