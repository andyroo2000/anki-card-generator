# Anki Card Generator

A local-first CLI tool that generates Anki-ready study data from Japanese input (words or sentences). The tool uses an LLM to generate structured data (polite/casual Japanese, English translations, kana with separators), then generates images and audio, and outputs everything in Anki-compatible CSV and JSON formats.

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

1. Create an input file with one Japanese input per line (e.g., `sentences.txt`):
   ```
   明日東京へ行きます。
   傘
   ```

2. Run the generator:
   ```bash
   node src/index.js sentences.txt
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

- Generates both polite (丁寧語) and casual (普通形) forms
- Kana with word separators (・)
- Image generation with tense-appropriate styling
- Japanese TTS via AWS Polly
- Local-first: all media downloaded for Anki import
