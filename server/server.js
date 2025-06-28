const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Hugging Face inference
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve static files for audio output
app.use('/audio', express.static('audio_output'));

// Rhyming dictionary - simple implementation
const rhymingWords = {
  'ay': ['day', 'way', 'say', 'play', 'stay', 'may', 'pay', 'lay'],
  'ight': ['night', 'light', 'right', 'sight', 'bright', 'fight', 'might'],
  'ow': ['flow', 'know', 'show', 'grow', 'slow', 'throw', 'glow'],
  'eet': ['sweet', 'meet', 'beat', 'neat', 'heat', 'feet', 'street'],
  'ime': ['time', 'rhyme', 'climb', 'prime', 'mime', 'chime', 'lime'],
  'ound': ['sound', 'found', 'ground', 'round', 'bound', 'pound', 'wound']
};

// Utility functions
const findRhyme = (word) => {
  const endings = Object.keys(rhymingWords);
  for (let ending of endings) {
    if (word.toLowerCase().endsWith(ending)) {
      const rhymes = rhymingWords[ending].filter(w => w !== word.toLowerCase());
      return rhymes[Math.floor(Math.random() * rhymes.length)] || word;
    }
  }
  return word;
};

const createRhymeScheme = (lines) => {
  const scheme = [];
  for (let i = 0; i < lines.length; i++) {
    if (i % 2 === 0) {
      scheme.push('A');
    } else {
      scheme.push('A'); // AABA pattern for rap
    }
  }
  return scheme;
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Rap Generator API is running' });
});

// Summarize text using Hugging Face
app.post('/api/summarize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use T5 model for summarization
    const summary = await hf.summarization({
      model: 'mrm8488/t5-base-finetuned-summarize-news',
      inputs: text,
      parameters: {
        max_length: 150,
        min_length: 50
      }
    });

    res.json({
      original_length: text.length,
      summary: summary.summary_text,
      summary_length: summary.summary_text.length
    });

  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ 
      error: 'Failed to summarize text',
      details: error.message 
    });
  }
});

// Generate rap lyrics from text
app.post('/api/generate-rap', async (req, res) => {
  try {
    const { text, style = 'rap', mood = 'energetic' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // First, summarize if text is too long
    let processedText = text;
    if (text.length > 500) {
      const summary = await hf.summarization({
        model: 'mrm8488/t5-base-finetuned-summarize-news',
        inputs: text,
        parameters: { max_length: 100, min_length: 30 }
      });
      processedText = summary.summary_text;
    }

    // Create rap prompt
    const rapPrompt = `Transform this into ${style} lyrics with a ${mood} mood. Make it rhythmic and rhyme well:

"${processedText}"

Create 4 verses with 4 lines each. Make it catchy and memorable:`;

    // Generate rap using GPT-Neo
    const response = await hf.textGeneration({
      model: 'Gustavosta/MistralLite-7B',
      inputs: rapPrompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.8,
        repetition_penalty: 1.1,
        return_full_text: false
      }
    });

    let lyrics = response.generated_text;
    
    // Post-process lyrics to improve rhyming
    const lines = lyrics.split('\n').filter(line => line.trim());
    const improvedLines = lines.map((line, index) => {
      if (index % 4 === 3) { // Every 4th line, try to rhyme with first line
        const words = line.split(' ');
        const lastWord = words[words.length - 1];
        const rhyme = findRhyme(lastWord);
        if (rhyme !== lastWord) {
          words[words.length - 1] = rhyme;
          return words.join(' ');
        }
      }
      return line;
    });

    res.json({
      original_text: text,
      processed_text: processedText,
      lyrics: improvedLines.join('\n'),
      style: style,
      mood: mood,
      metadata: {
        verse_count: Math.ceil(improvedLines.length / 4),
        line_count: improvedLines.length,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Rap generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate rap',
      details: error.message 
    });
  }
});

// Convert text to speech
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voice = 'female' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Use Hugging Face TTS model
    const audioBlob = await hf.textToSpeech({
      model: 'espnet/kan-bayashi_ljspeech_vits',
      inputs: text
    });

    // Convert blob to buffer
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    
    // Save audio file
    const filename = `audio_${Date.now()}.wav`;
    const filepath = path.join(__dirname, 'audio_output', filename);
    
    // Ensure audio_output directory exists
    await fs.mkdir(path.join(__dirname, 'audio_output'), { recursive: true });
    
    await fs.writeFile(filepath, audioBuffer);

    res.json({
      message: 'Text converted to speech successfully',
      audio_url: `/audio/${filename}`,
      filename: filename,
      text_length: text.length
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      error: 'Failed to convert text to speech',
      details: error.message 
    });
  }
});

// Upload and process text file
app.post('/api/upload-text', upload.single('textFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = await fs.readFile(req.file.path, 'utf8');
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      message: 'File uploaded and processed successfully',
      content: fileContent,
      file_size: req.file.size,
      original_name: req.file.originalname
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process uploaded file',
      details: error.message 
    });
  }
});

// Get rhyming suggestions
app.post('/api/rhyme-suggestions', (req, res) => {
  try {
    const { word } = req.body;
    
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const suggestions = [];
    const wordLower = word.toLowerCase();
    
    // Find rhymes based on endings
    Object.entries(rhymingWords).forEach(([ending, words]) => {
      if (wordLower.endsWith(ending)) {
        suggestions.push(...words.filter(w => w !== wordLower));
      }
    });

    // If no exact rhymes found, provide near rhymes
    if (suggestions.length === 0) {
      const allWords = Object.values(rhymingWords).flat();
      const nearRhymes = allWords.filter(w => 
        w.includes(wordLower.slice(-2)) || wordLower.includes(w.slice(-2))
      );
      suggestions.push(...nearRhymes.slice(0, 5));
    }

    res.json({
      word: word,
      rhymes: [...new Set(suggestions)].slice(0, 10), // Remove duplicates and limit
      count: suggestions.length
    });

  } catch (error) {
    console.error('Rhyme suggestion error:', error);
    res.status(500).json({ 
      error: 'Failed to get rhyme suggestions',
      details: error.message 
    });
  }
});

// Complete pipeline: Text -> Rap -> Audio
app.post('/api/complete-pipeline', async (req, res) => {
  try {
    const { text, style = 'rap', mood = 'energetic', generate_audio = false } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const results = {
      original_text: text,
      processing_steps: []
    };

    // Step 1: Summarize if needed
    let processedText = text;
    if (text.length > 500) {
      const summary = await hf.summarization({
        model: 'mrm8488/t5-base-finetuned-summarize-news',
        inputs: text,
        parameters: { max_length: 100, min_length: 30 }
      });
      processedText = summary.summary_text;
      results.processing_steps.push('Text summarized');
      results.summary = processedText;
    }

    // Step 2: Generate rap
    const rapPrompt = `Transform this into ${style} lyrics with a ${mood} mood:

"${processedText}"

Create catchy, rhythmic lyrics:`;

    const rapResponse = await hf.textGeneration({
      model: 'Gustavosta/MistralLite-7B',
      inputs: rapPrompt,
      parameters: {
        max_new_tokens: 250,
        temperature: 0.8,
        repetition_penalty: 1.1,
        return_full_text: false
      }
    });

    results.lyrics = rapResponse.generated_text;
    results.processing_steps.push('Rap lyrics generated');

    // Step 3: Generate audio if requested
    if (generate_audio) {
      try {
        const audioBlob = await hf.textToSpeech({
          model: 'espnet/kan-bayashi_ljspeech_vits',
          inputs: results.lyrics
        });

        const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
        const filename = `complete_rap_${Date.now()}.wav`;
        const filepath = path.join(__dirname, 'audio_output', filename);
        
        await fs.mkdir(path.join(__dirname, 'audio_output'), { recursive: true });
        await fs.writeFile(filepath, audioBuffer);

        results.audio_url = `/audio/${filename}`;
        results.processing_steps.push('Audio generated');
      } catch (audioError) {
        console.error('Audio generation failed:', audioError);
        results.audio_error = 'Audio generation failed, but lyrics were created successfully';
      }
    }

    results.style = style;
    results.mood = mood;
    results.completed_at = new Date().toISOString();

    res.json(results);

  } catch (error) {
    console.error('Complete pipeline error:', error);
    res.status(500).json({ 
      error: 'Pipeline processing failed',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /api/health',
      'POST /api/summarize',
      'POST /api/generate-rap',
      'POST /api/text-to-speech',
      'POST /api/upload-text',
      'POST /api/rhyme-suggestions',
      'POST /api/complete-pipeline'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎤 Rap Generator API running on port ${PORT}`);
  console.log(`📖 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/summarize`);
  console.log(`   POST /api/generate-rap`);
  console.log(`   POST /api/text-to-speech`);
  console.log(`   POST /api/upload-text`);
  console.log(`   POST /api/rhyme-suggestions`);
  console.log(`   POST /api/complete-pipeline`);
});

module.exports = app;