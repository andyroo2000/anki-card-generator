import OpenAI from 'openai';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate an image from a prompt and save it locally
 * @param {string} prompt - Image generation prompt
 * @param {string} outputPath - Full path where to save the image (e.g., media/jp_0001_polite.png)
 * @param {string} [apiKey] - OpenAI API key (optional, falls back to env var)
 * @returns {Promise<string>} Local file path
 */
export async function generateImage(prompt, outputPath, apiKey) {
  // Use provided API key or fall back to environment variable
  const key = apiKey || process.env.OPENAI_API_KEY;
  
  if (!key) {
    throw new Error('OpenAI API key is required for image generation');
  }
  
  const openai = new OpenAI({
    apiKey: key,
  });
  
  try {
    // Ensure directory exists
    const dir = dirname(outputPath);
    mkdirSync(dir, { recursive: true });

    // Call OpenAI DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0].url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E');
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local file
    writeFileSync(outputPath, buffer);

    return outputPath;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error during image generation: ${error.message}`);
    }
    throw error;
  }
}

