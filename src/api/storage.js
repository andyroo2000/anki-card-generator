import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_JSON_PATH = join(__dirname, '..', '..', 'out', 'data.json');

/**
 * Load all cards from data.json
 * @returns {Array<Object>} Array of card objects
 */
export function getAllCards() {
  if (!existsSync(DATA_JSON_PATH)) {
    return [];
  }

  try {
    const content = readFileSync(DATA_JSON_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading data.json:', error.message);
    return [];
  }
}

/**
 * Get a single card by ID
 * @param {string} id - Card ID (e.g., jp_0001)
 * @returns {Object|null} Card object or null if not found
 */
export function getCardById(id) {
  const cards = getAllCards();
  return cards.find(card => card.id === id) || null;
}

/**
 * Get the total number of cards
 * @returns {number} Total card count
 */
export function getCardCount() {
  return getAllCards().length;
}

/**
 * Search cards by query string
 * @param {string} query - Search query
 * @returns {Array<Object>} Matching cards
 */
export function searchCards(query) {
  const cards = getAllCards();
  const lowerQuery = query.toLowerCase();
  
  return cards.filter(card => {
    // Search in Japanese text
    if (card.polite_jp && card.polite_jp.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (card.casual_jp && card.casual_jp.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in English translations
    if (card.translation_polite && card.translation_polite.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    if (card.translation_casual && card.translation_casual.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    // Search in source input
    if (card.source_input && card.source_input.toLowerCase().includes(lowerQuery)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Get cards with pagination
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Number of cards per page
 * @param {string} [search] - Optional search query
 * @returns {Object} Object with cards array, pagination info
 */
export function getCardsPaginated(page = 1, limit = 20, search = null) {
  let cards = search ? searchCards(search) : getAllCards();
  
  // Sort by timestamp (newest first)
  cards.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Calculate pagination
  const total = cards.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedCards = cards.slice(startIndex, endIndex);
  
  return {
    cards: paginatedCards,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

