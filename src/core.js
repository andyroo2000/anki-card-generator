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
 * Progress callback function signature
 * @callback ProgressCallback
 * @param {string} stage - Current processing stage
 * @param {string} message - Progress message
 */

/**
 * Main pipeline: process a single Japanese input
 * @param {string} input - Japanese input (word or sentence)
 * @param {ProgressCallback} [onProgress] - Optional progress callback
 * @param {Object} [credentials] - Optional API credentials
 * @param {string} [credentials.openaiApiKey] - OpenAI API key
 * @param {string} [credentials.nanoBananaApiKey] - Nano banana API key
 * @param {Object} [credentials.awsCredentials] - AWS credentials { accessKeyId, secretAccessKey, region }
 * @returns {Promise<Object>} Full result object with LLM data and media
 */
export async function processInput(input, onProgress, credentials) {
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    if (onProgress) onProgress('validate', 'Empty input skipped');
    return null;
  }

  if (onProgress) onProgress('start', `Processing: ${trimmedInput}`);

  try {
    // Step 1: Generate ID
    const id = generateId(trimmedInput);
    if (onProgress) onProgress('id', `Generated ID: ${id}`);

    // Step 2: Call LLM
    if (onProgress) onProgress('llm', 'Calling LLM...');
    const llmJson = await callLLM(trimmedInput, credentials?.openaiApiKey);
    if (onProgress) onProgress('llm', `LLM returned: ${llmJson.polite_jp}`);

    // Step 3: Generate images
    const mediaDir = join(__dirname, '..', 'media');
    const mediaPaths = {};

    if (onProgress) onProgress('image', 'Generating polite image...');
    const imagePolitePath = join(mediaDir, `${id}_polite.png`);
    await generateImage(llmJson.img_prompt_polite, imagePolitePath, credentials?.nanoBananaApiKey);
    mediaPaths.imagePolite = imagePolitePath;

    if (llmJson.has_polite_and_casual && llmJson.img_prompt_casual) {
      if (onProgress) onProgress('image', 'Generating casual image...');
      const imageCasualPath = join(mediaDir, `${id}_casual.png`);
      await generateImage(llmJson.img_prompt_casual, imageCasualPath, credentials?.nanoBananaApiKey);
      mediaPaths.imageCasual = imageCasualPath;
    }

    // Step 4: Generate audio
    if (onProgress) onProgress('audio', 'Generating polite audio...');
    const audioPolitePath = join(mediaDir, `${id}_polite.mp3`);
    await generateAudio(llmJson.polite_jp, audioPolitePath, 'Takumi', credentials?.awsCredentials);
    mediaPaths.audioPolite = audioPolitePath;

    if (llmJson.has_polite_and_casual && llmJson.casual_jp) {
      if (onProgress) onProgress('audio', 'Generating casual audio...');
      const audioCasualPath = join(mediaDir, `${id}_casual.mp3`);
      await generateAudio(llmJson.casual_jp, audioCasualPath, 'Takumi', credentials?.awsCredentials);
      mediaPaths.audioCasual = audioCasualPath;
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
    if (onProgress) onProgress('save', `Saved data for ${id}`);

    return fullItem;
  } catch (error) {
    if (onProgress) onProgress('error', `Error: ${error.message}`);
    throw error;
  }
}

