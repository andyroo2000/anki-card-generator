import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { generateId } from './id.js';
import { callLLM } from './llm.js';
import { generateImage } from './image.js';
import { generateAudio } from './audio.js';
import { mapToAnkiFields } from './mapper.js';
import { saveData } from './persist.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Main pipeline: process a single Japanese input
 */
async function processInput(input) {
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    console.warn('Skipping empty input');
    return;
  }

  console.log(`\nProcessing: ${trimmedInput}`);

  try {
    // Step 1: Generate ID
    const id = generateId(trimmedInput);
    console.log(`Generated ID: ${id}`);

    // Step 2: Call LLM
    console.log('Calling LLM...');
    const llmJson = await callLLM(trimmedInput);
    console.log(`LLM returned: ${llmJson.polite_jp}`);

    // Step 3: Generate images
    const mediaDir = join(__dirname, '..', 'media');
    const mediaPaths = {};

    console.log('Generating images...');
    const imagePolitePath = join(mediaDir, `${id}_polite.png`);
    await generateImage(llmJson.img_prompt_polite, imagePolitePath);
    mediaPaths.imagePolite = imagePolitePath;
    console.log(`Generated polite image: ${imagePolitePath}`);

    if (llmJson.has_polite_and_casual && llmJson.img_prompt_casual) {
      const imageCasualPath = join(mediaDir, `${id}_casual.png`);
      await generateImage(llmJson.img_prompt_casual, imageCasualPath);
      mediaPaths.imageCasual = imageCasualPath;
      console.log(`Generated casual image: ${imageCasualPath}`);
    }

    // Step 4: Generate audio
    console.log('Generating audio...');
    const audioPolitePath = join(mediaDir, `${id}_polite.mp3`);
    await generateAudio(llmJson.polite_jp, audioPolitePath);
    mediaPaths.audioPolite = audioPolitePath;
    console.log(`Generated polite audio: ${audioPolitePath}`);

    if (llmJson.has_polite_and_casual && llmJson.casual_jp) {
      const audioCasualPath = join(mediaDir, `${id}_casual.mp3`);
      await generateAudio(llmJson.casual_jp, audioCasualPath);
      mediaPaths.audioCasual = audioCasualPath;
      console.log(`Generated casual audio: ${audioCasualPath}`);
    }

    // Step 5: Map to Anki fields
    const ankiFields = mapToAnkiFields(llmJson, mediaPaths);

    // Step 6: Create full item object (LLM JSON + media paths + metadata)
    const fullItem = {
      id,
      source_input: trimmedInput,
      ...llmJson,
      media: {
        imagePolite: mediaPaths.imagePolite,
        imageCasual: mediaPaths.imageCasual || null,
        audioPolite: mediaPaths.audioPolite,
        audioCasual: mediaPaths.audioCasual || null,
      },
      ankiFields,
      timestamp: new Date().toISOString(),
    };

    // Step 7: Save to JSON and CSV
    await saveData(fullItem, ankiFields);
    console.log(`Saved data for ${id}`);

    return fullItem;
  } catch (error) {
    console.error(`Error processing "${trimmedInput}":`, error.message);
    throw error;
  }
}

/**
 * Main CLI entrypoint
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node src/index.js <input-file>');
    console.error('Example: node src/index.js sentences.txt');
    process.exit(1);
  }

  const inputFile = args[0];

  try {
    // Read input file
    const content = readFileSync(inputFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      console.error('No valid inputs found in file');
      process.exit(1);
    }

    console.log(`Found ${lines.length} input(s) to process`);

    // Process each line
    const results = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        const result = await processInput(line);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Failed to process line ${i + 1}: ${error.message}`);
        // Continue processing other lines
      }
    }

    console.log(`\n✅ Completed! Processed ${results.length} of ${lines.length} inputs`);
    console.log(`Output files:`);
    console.log(`  - out/data.json`);
    console.log(`  - out/anki.csv`);
    console.log(`Media files in media/ directory`);
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

// Run main function
main().catch(console.error);

