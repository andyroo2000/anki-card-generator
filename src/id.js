import crypto from 'crypto';

/**
 * Generate a deterministic ID from source input
 * Format: jp_0001, jp_0002, etc.
 * Uses a hash of the input to ensure consistency
 */
export function generateId(sourceInput) {
  // Create a hash of the input
  const hash = crypto.createHash('md5').update(sourceInput).digest('hex');
  
  // Take first 4 hex characters and convert to decimal (0-65535)
  const num = parseInt(hash.substring(0, 4), 16);
  
  // Format as jp_XXXX where XXXX is zero-padded to 4 digits
  return `jp_${String(num).padStart(4, '0')}`;
}

