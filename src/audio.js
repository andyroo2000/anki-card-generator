import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pollyClient = new PollyClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate audio from Japanese text using AWS Polly
 * @param {string} text - Japanese text to convert to speech
 * @param {string} outputPath - Full path where to save the audio (e.g., media/jp_0001_polite.mp3)
 * @param {string} voice - Voice ID (default: 'Takumi' for Japanese)
 * @returns {Promise<string>} Local file path
 */
export async function generateAudio(text, outputPath, voice = 'Takumi') {
  try {
    // Ensure directory exists
    const dir = dirname(outputPath);
    mkdirSync(dir, { recursive: true });

    // Synthesize speech
    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: voice,
      Engine: 'neural', // Use neural engine for better quality
      LanguageCode: 'ja-JP',
    });

    const response = await pollyClient.send(command);

    if (!response.AudioStream) {
      throw new Error('No audio stream returned from Polly');
    }

    // Convert stream to buffer and save
    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    throw new Error(`AWS Polly error: ${error.message}`);
  }
}

