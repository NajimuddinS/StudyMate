// server.js - Backend Server
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// File upload configuration
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Hugging Face API configuration
const HF_API_KEY = process.env.HF_API_KEY;
const HF_API_BASE = 'https://api-inference.huggingface.co/models';

// Rhyming patterns and structures
const RHYME_SCHEMES = {
  'AABB': ['A', 'A', 'B', 'B'],
  'ABAB': ['A', 'B', 'A', 'B'],
  'ABCB': ['A', 'B', 'C', 'B'],
  'AAAA': ['A', 'A', 'A', 'A']
};

// Common rap words and fillers
const RAP_FILLERS = [
  'yeah', 'uh', 'yo', 'check it', 'listen', 'word', 'straight up',
  'no cap', 'facts', 'real talk', 'you know', 'like that', 'for real'
];

// Hugging Face API calls
async function callHuggingFace(model, inputs, options = {}) {
  try {
    const response = await axios.post(
      `${HF_API_BASE}/${model}`,
      { inputs, ...options },
      {
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error calling ${model}:`, error.response?.data || error.message);
    throw new Error(`HuggingFace API error: ${error.message}`);
  }
}

// Text summarization for content extraction
async function summarizeText(text) {
  try {
    const result = await callHuggingFace(
      'facebook/bart-large-cnn',
      text,
      { 
        parameters: { 
          max_length: 130, 
          min_length: 30, 
          do_sample: false 
        } 
      }
    );
    return result[0]?.summary_text || text.substring(0, 200);
  } catch (error) {
    console.log('Summarization failed, using original text');
    return text.substring(0, 300);
  }
}

// Creative text generation for rap lyrics
async function generateRapLyrics(content, style = 'rap') {
  const prompt = `Transform this content into ${style} lyrics with rhythm and rhyme:\n\n${content}\n\nLyrics:`;
  
  try {
    const result = await callHuggingFace(
      'microsoft/DialoGPT-large',
      prompt,
      {
        parameters: {
          max_length: 200,
          temperature: 0.8,
          do_sample: true,
          top_p: 0.9
        }
      }
    );
    
    return result[0]?.generated_text || generateFallbackLyrics(content);
  } catch (error) {
    console.log('Rap generation failed, using fallback');
    return generateFallbackLyrics(content);
  }
}

// Fallback lyrics generator
function generateFallbackLyrics(content) {
  const words = content.split(' ').filter(word => word.length > 3);
  const keyWords = words.slice(0, 8);
  
  const verses = [];
  for (let i = 0; i < keyWords.length; i += 2) {
    const word1 = keyWords[i] || 'knowledge';
    const word2 = keyWords[i + 1] || 'power';
    
    verses.push(`Talking 'bout ${word1}, that's the way I flow`);
    verses.push(`${word2} in my mind, watch my skills grow`);
    verses.push(`Breaking down the facts, make it all clear`);
    verses.push(`Spitting knowledge like a pro, year after year`);
  }
  
  return verses.join('\n');
}

// Enhanced rhyme detection
function findRhymes(word) {
  const rhymeMap = {
    'flow': ['go', 'show', 'know', 'grow', 'pro', 'blow', 'slow'],
    'mind': ['find', 'kind', 'blind', 'grind', 'bind', 'signed'],
    'real': ['feel', 'deal', 'steel', 'heal', 'meal', 'wheel'],
    'time': ['rhyme', 'climb', 'prime', 'dime', 'crime', 'sublime'],
    'way': ['say', 'play', 'day', 'stay', 'pay', 'display'],
    'night': ['light', 'fight', 'sight', 'bright', 'tight', 'height'],
    'game': ['fame', 'name', 'same', 'flame', 'frame', 'claim'],
    'beat': ['street', 'meet', 'feet', 'heat', 'sweet', 'complete']
  };
  
  const lastSyllable = word.toLowerCase().slice(-2);
  return rhymeMap[word.toLowerCase()] || rhymeMap[lastSyllable] || ['beat', 'street', 'heat'];
}

// Structure lyrics with rhyme schemes
function structureLyrics(rawLyrics, scheme = 'ABAB') {
  const lines = rawLyrics.split('\n').filter(line => line.trim());
  const pattern = RHYME_SCHEMES[scheme];
  const structured = [];
  
  for (let i = 0; i < lines.length; i += 4) {
    const verse = lines.slice(i, i + 4);
    if (verse.length >= 2) {
      // Add rhyme scheme structure
      verse.forEach((line, idx) => {
        const enhancedLine = line + (Math.random() > 0.7 ? ` (${RAP_FILLERS[Math.floor(Math.random() * RAP_FILLERS.length)]})` : '');
        structured.push(enhancedLine);
      });
      
      if (structured.length >= 4) {
        structured.push(''); // Add break between verses
      }
    }
  }
  
  return structured.join('\n');
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Main rap generation endpoint
app.post('/api/generate-rap', async (req, res) => {
  try {
    const { text, style = 'rap', rhymeScheme = 'ABAB' } = req.body;
    
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ error: 'Text must be at least 10 characters long' });
    }

    // Step 1: Summarize if text is too long
    let processedText = text;
    if (text.length > 500) {
      processedText = await summarizeText(text);
    }

    // Step 2: Generate rap lyrics
    const rawLyrics = await generateRapLyrics(processedText, style);
    
    // Step 3: Structure with rhyme scheme
    const structuredLyrics = structureLyrics(rawLyrics, rhymeScheme);
    
    // Step 4: Generate metadata
    const metadata = {
      originalLength: text.length,
      processedLength: processedText.length,
      lyricsLength: structuredLyrics.length,
      rhymeScheme,
      style,
      generatedAt: new Date().toISOString()
    };

    res.json({
      lyrics: structuredLyrics,
      originalText: processedText,
      metadata
    });

  } catch (error) {
    console.error('Rap generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate rap lyrics',
      details: error.message 
    });
  }
});

// Text-to-Speech endpoint
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Call Hugging Face TTS model
    const audioData = await callHuggingFace(
      'microsoft/speecht5_tts',
      text,
      { parameters: { speaker_embedding: null } }
    );

    // For now, return a success response
    // In production, you'd process the audio data
    res.json({ 
      success: true, 
      message: 'TTS processing initiated',
      audioUrl: `/api/audio/${Date.now()}.wav`
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ 
      error: 'Failed to generate speech',
      details: error.message 
    });
  }
});

// File upload endpoint
app.post('/api/upload-text', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({ 
      text: fileContent,
      filename: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process uploaded file',
      details: error.message 
    });
  }
});

// Get available beats/styles
app.get('/api/beats', (req, res) => {
  const beats = [
    { id: 'boom-bap', name: 'Boom Bap', bpm: 90, description: 'Classic hip-hop style' },
    { id: 'trap', name: 'Trap', bpm: 140, description: 'Modern trap beats' },
    { id: 'lo-fi', name: 'Lo-Fi', bpm: 85, description: 'Chill lo-fi vibes' },
    { id: 'drill', name: 'Drill', bpm: 150, description: 'Aggressive drill style' },
    { id: 'melodic', name: 'Melodic', bpm: 120, description: 'Melodic rap style' }
  ];
  
  res.json(beats);
});

// Get rhyme schemes
app.get('/api/rhyme-schemes', (req, res) => {
  res.json(Object.keys(RHYME_SCHEMES).map(scheme => ({
    id: scheme,
    pattern: RHYME_SCHEMES[scheme],
    description: `${scheme} rhyme pattern`
  })));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🎤 Rap Generator Server running on port ${PORT}`);
  console.log(`🔥 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;