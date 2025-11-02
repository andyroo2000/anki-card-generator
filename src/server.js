import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { processInput } from './core.js';
import { getAllCards, getCardById, getCardsPaginated } from './api/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving for frontend
app.use(express.static(join(__dirname, '..', 'public')));

// Static file serving for media and out directories
app.use('/media', express.static(join(__dirname, '..', 'media')));
app.use('/out', express.static(join(__dirname, '..', 'out')));

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// API Routes

/**
 * POST /api/process
 * Process a single Japanese input
 */
app.post('/api/process', async (req, res) => {
  try {
    const { input, credentials } = req.body;

    if (!input || !input.trim()) {
      return res.status(400).json({ error: 'Input is required' });
    }

    const result = await processInput(input, null, credentials);
    
    if (!result) {
      return res.status(400).json({ error: 'Processing failed: empty input' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error processing input:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/bulk-upload
 * Process multiple inputs from a CSV file
 */
app.post('/api/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Get credentials from request body if provided
    const credentials = req.body.credentials ? JSON.parse(req.body.credentials) : null;

    const content = req.file.buffer.toString('utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return res.status(400).json({ error: 'No valid inputs found in file' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        const result = await processInput(line, null, credentials);
        if (result) {
          results.push({ input: line, result });
        }
      } catch (error) {
        errors.push({ input: line, error: error.message });
      }
    }

    res.json({
      success: true,
      total: lines.length,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cards
 * Get all cards with pagination and optional search
 */
app.get('/api/cards', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || null;

    const data = getCardsPaginated(page, limit, search);
    res.json(data);
  } catch (error) {
    console.error('Error getting cards:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/cards/:id
 * Get a single card by ID
 */
app.get('/api/cards/:id', (req, res) => {
  try {
    const { id } = req.params;
    const card = getCardById(id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json(card);
  } catch (error) {
    console.error('Error getting card:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Get statistics about generated cards
 */
app.get('/api/stats', (req, res) => {
  try {
    const cards = getAllCards();
    const hasPoliteAndCasual = cards.filter(card => card.has_polite_and_casual).length;
    
    res.json({
      total: cards.length,
      withCasual: hasPoliteAndCasual,
      withoutCasual: cards.length - hasPoliteAndCasual,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/default-prompt
 * Get the default system prompt
 */
app.get('/api/default-prompt', (req, res) => {
  try {
    const promptPath = join(__dirname, 'prompts', 'jp-anki-system.txt');
    const prompt = readFileSync(promptPath, 'utf-8');
    res.json({ prompt });
  } catch (error) {
    console.error('Error getting default prompt:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

