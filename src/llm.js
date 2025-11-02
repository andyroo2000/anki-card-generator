import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Load the system prompt from file
 */
function loadSystemPrompt() {
  const promptPath = join(__dirname, 'prompts', 'jp-anki-system.txt');
  return readFileSync(promptPath, 'utf-8');
}

/**
 * Call the LLM with the input and return structured JSON
 * @param {string} input - Japanese input (word or sentence)
 * @returns {Promise<Object>} Structured JSON matching the contract
 */
export async function callLLM(input) {
  const systemPrompt = loadSystemPrompt();
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate data for this Japanese input: ${input}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = completion.choices[0].message.content;
    
    // Parse JSON response
    let jsonResponse;
    try {
      // Remove markdown code blocks if present
      const cleaned = content.trim().replace(/^```json\s*|\s*```$/g, '').trim();
      jsonResponse = JSON.parse(cleaned);
    } catch (parseError) {
      throw new Error(`Failed to parse LLM response as JSON: ${parseError.message}\nResponse: ${content}`);
    }

    // Validate required fields
    const requiredFields = [
      'source_input',
      'tense',
      'has_polite_and_casual',
      'polite_jp',
      'polite_kana',
      'polite_reading',
      'translation_polite',
      'casual_jp',
      'casual_kana',
      'translation_casual',
      'notes',
      'img_prompt_polite',
      'img_prompt_casual',
    ];

    const missingFields = requiredFields.filter(field => !(field in jsonResponse));
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in LLM response: ${missingFields.join(', ')}`);
    }

    // Validate tense
    if (!['past', 'present', 'future'].includes(jsonResponse.tense)) {
      throw new Error(`Invalid tense: ${jsonResponse.tense}. Must be 'past', 'present', or 'future'`);
    }

    return jsonResponse;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

