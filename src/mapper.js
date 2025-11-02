/**
 * Maps LLM JSON response + media paths to Anki field format
 * @param {Object} llmJson - The LLM response JSON
 * @param {Object} mediaPaths - Object with image and audio paths:
 *   { imagePolite, imageCasual, audioPolite, audioCasual }
 * @returns {Object} Anki fields object
 */
export function mapToAnkiFields(llmJson, mediaPaths) {
  const {
    imagePolite,
    imageCasual,
    audioPolite,
    audioCasual,
  } = mediaPaths;

  // Extract just the filename from the path for Anki
  const getFilename = (path) => {
    if (!path) return '';
    // Extract just the filename (e.g., jp_0001_polite.png)
    return path.split('/').pop() || '';
  };

  // Photo defaults to polite image
  const photo = getFilename(imagePolite);

  // Map to 12 Anki fields
  return {
    Expression: llmJson.polite_jp || '',
    ExpressionReading: llmJson.polite_reading || '',
    ExpressionKana: llmJson.polite_kana || '',
    PitchAccent: '', // Empty for now
    Meaning: llmJson.translation_polite || '',
    SentenceJP: llmJson.has_polite_and_casual ? (llmJson.casual_jp || '') : '',
    SentenceJPKana: llmJson.has_polite_and_casual ? (llmJson.casual_kana || '') : '',
    SentenceEN: llmJson.has_polite_and_casual ? (llmJson.translation_casual || '') : '',
    Photo: photo,
    Notes: llmJson.notes || '',
    AudioWord: getFilename(audioPolite),
    AudioSentence: llmJson.has_polite_and_casual ? getFilename(audioCasual) : '',
  };
}

