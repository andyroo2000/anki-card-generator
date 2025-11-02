import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import createCsvWriter from 'csv-writer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUT_DIR = join(__dirname, '..', 'out');
const DATA_JSON_PATH = join(OUT_DIR, 'data.json');
const CSV_PATH = join(OUT_DIR, 'anki.csv');

// Ensure output directories exist
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(join(__dirname, '..', 'media'), { recursive: true });

// CSV column headers matching Anki field names
const CSV_HEADERS = [
  'Expression',
  'ExpressionReading',
  'ExpressionKana',
  'PitchAccent',
  'Meaning',
  'SentenceJP',
  'SentenceJPKana',
  'SentenceEN',
  'Photo',
  'Notes',
  'AudioWord',
  'AudioSentence',
];

/**
 * Append an item to data.json
 * @param {Object} item - Full item object (LLM JSON + media paths + metadata)
 */
function appendToDataJson(item) {
  let existingData = [];
  
  // Read existing data if file exists
  if (existsSync(DATA_JSON_PATH)) {
    try {
      const content = readFileSync(DATA_JSON_PATH, 'utf-8');
      existingData = JSON.parse(content);
    } catch (error) {
      console.warn('Warning: Could not parse existing data.json, starting fresh');
      existingData = [];
    }
  }

  // Append new item
  existingData.push(item);

  // Write back
  writeFileSync(DATA_JSON_PATH, JSON.stringify(existingData, null, 2), 'utf-8');
}

/**
 * Append a row to anki.csv
 * @param {Object} ankiFields - Anki fields object
 */
async function appendToCsv(ankiFields) {
  // Check if file exists to determine if we need to write headers
  const fileExists = existsSync(CSV_PATH);

  const csvWriter = createCsvWriter.createObjectCsvWriter({
    path: CSV_PATH,
    header: CSV_HEADERS.map(header => ({ id: header, title: header })),
    append: fileExists, // Append if file exists
  });

  await csvWriter.writeRecords([ankiFields]);
}

/**
 * Save a complete item (both JSON and CSV)
 * @param {Object} item - Full item with LLM data and media paths
 * @param {Object} ankiFields - Anki fields object
 */
export async function saveData(item, ankiFields) {
  // Append to data.json
  appendToDataJson(item);

  // Append to CSV
  await appendToCsv(ankiFields);
}

