# Anki Card Generator

A local-first web application that generates Anki-ready study data from Japanese input (words or sentences). The tool uses an LLM to generate structured data (polite/casual Japanese, English translations, kana with separators), then generates images and audio, and outputs everything in Anki-compatible CSV and JSON formats.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
   AWS_REGION=us-east-1
   ```

## Usage

### Web Interface (Recommended)

Start the web server:
```bash
npm start
```

Or:
```bash
npm run server
```

Then open `http://localhost:3000` in your browser.

The web interface provides three main features:

1. **Single Input** - Paste a word or sentence, click "Process" to generate a card
2. **Bulk Upload** - Upload a CSV/txt file with one input per line for batch processing
3. **Browse Cards** - View all generated cards in a visual browser with search

### CLI Usage

For command-line processing:

1. Create an input file with one Japanese input per line (e.g., `sentences.txt`):
   ```
   明日東京へ行きます。
   傘
   ```

2. Run the CLI:
   ```bash
   npm run cli sentences.txt
   ```

3. Output files will be generated in:
   - `out/data.json` - Full data with LLM responses and media paths
   - `out/anki.csv` - Anki-compatible CSV for import
   - `media/` - Local image and audio files

## Output Format

The CSV contains 12 columns matching Anki field names:
- Expression, ExpressionReading, ExpressionKana, PitchAccent, Meaning
- SentenceJP, SentenceJPKana, SentenceEN, Photo, Notes
- AudioWord, AudioSentence

## Features

- **Web Interface** - Beautiful, modern UI for single processing and bulk uploads
- **Card Browser** - Visual browsing of all generated cards with search
- **Generates both polite (丁寧語) and casual (普通形) forms**
- **Kana with word separators (・)**
- **Image generation** with tense-appropriate styling
- **Japanese TTS** via AWS Polly
- **Local-first** - all media downloaded for Anki import
- **RESTful API** - programmable access to all features

## API Endpoints

- `POST /api/process` - Process single input
- `POST /api/bulk-upload` - Process CSV file
- `GET /api/cards` - List all cards (with pagination and search)
- `GET /api/cards/:id` - Get single card by ID
- `GET /api/stats` - Get statistics

## Project Structure

```
project-root/
  src/
    core.js          # Core processing logic
    index.js         # CLI entry point
    server.js        # Web server and API
    api/
      storage.js     # Card data access
    llm.js, image.js, audio.js, etc.
  public/
    index.html       # Web interface
    styles.css       # Styling
    app.js           # Frontend JavaScript
  out/
    data.json        # Generated cards
    anki.csv         # Anki import file
  media/             # Images and audio
```
