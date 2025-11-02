import { readFileSync } from 'fs';
import { processInput } from './core.js';

/**
 * Console progress callback for CLI usage
 */
function consoleProgress(stage, message) {
  if (stage === 'error') {
    console.error(message);
  } else {
    console.log(message);
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
        console.log(`\nProcessing line ${i + 1}/${lines.length}`);
        const result = await processInput(line, consoleProgress);
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

