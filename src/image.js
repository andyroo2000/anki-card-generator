import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate an image from a prompt and save it locally using nano banana
 * @param {string} prompt - Image generation prompt
 * @param {string} outputPath - Full path where to save the image (e.g., media/jp_0001_polite.png)
 * @param {string} [apiKey] - Nano banana API key (optional, falls back to env var)
 * @returns {Promise<string>} Local file path
 */
export async function generateImage(prompt, outputPath, apiKey) {
  // Use provided API key or fall back to environment variable
  const key = apiKey || process.env.NANO_BANANA_API_KEY;
  
  if (!key) {
    throw new Error('Nano banana API key is required for image generation');
  }
  
  try {
    // Ensure directory exists
    const dir = dirname(outputPath);
    mkdirSync(dir, { recursive: true });

    // Call nano banana API
    const response = await fetch('https://api.nanobananaapi.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nano banana API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Extract image URL from response (adjust based on actual API response structure)
    const imageUrl = result.url || result.data?.url || result.image;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from nano banana API');
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
    throw new Error(`Image generation error: ${error.message}`);
  }
}

