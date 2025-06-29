const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Hugging Face API configuration
const HF_API_TOKEN = process.env.HUGGING_FACE_TOKEN;
const HF_API_BASE = 'https://api-inference.huggingface.co/models';

// Rhyming words database (simple implementation)
const rhymingWords = {
    'ay': ['day', 'way', 'say', 'play', 'stay', 'today', 'away', 'okay'],
    'ight': ['night', 'light', 'right', 'bright', 'sight', 'fight', 'tight', 'might'],
    'ow': ['now', 'how', 'wow', 'allow', 'somehow', 'endow', 'row', 'show'],
    'ee': ['free', 'tree', 'see', 'be', 'key', 'spree', 'degree', 'agree'],
    'ame': ['name', 'fame', 'game', 'same', 'frame', 'claim', 'blame', 'shame'],
    'ove': ['love', 'above', 'dove', 'shove', 'glove', 'move', 'prove', 'groove']
};

// Helper function to find rhyming words
function findRhymes(word) {
    const lowerWord = word.toLowerCase();
    for (const [ending, words] of Object.entries(rhymingWords)) {
        if (lowerWord.endsWith(ending)) {
            return words.filter(w => w !== lowerWord);
        }
    }
    return [];
}

// Helper function to create rap structure
function createRapStructure(text, style = 'rap') {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const lines = [];
    
    for (let i = 0; i < sentences.length; i += 2) {
        const line1 = sentences[i]?.trim();
        const line2 = sentences[i + 1]?.trim();
        
        if (line1) {
            if (style === 'rap') {
                lines.push(`${line1}, yo`);
                if (line2) {
                    lines.push(`${line2}, let's go`);
                }
            } else {
                lines.push(line1);
                if (line2) {
                    lines.push(line2);
                }
            }
        }
    }
    
    return lines;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Rap Generator API is running!' });
});

// Text summarization endpoint
app.post('/api/summarize', async (req, res) => {
    try {
        const { text, maxLength = 150 } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const response = await axios.post(
            `${HF_API_BASE}/mrm8488/t5-base-finetuned-summarize-news`,
            {
                inputs: text,
                parameters: {
                    max_length: maxLength,
                    min_length: 30,
                    do_sample: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const summary = response.data[0]?.summary_text || response.data[0]?.generated_text || text;
        
        res.json({
            originalText: text,
            summary: summary,
            wordCount: {
                original: text.split(' ').length,
                summary: summary.split(' ').length
            }
        });

    } catch (error) {
        console.error('Summarization error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to summarize text',
            details: error.response?.data || error.message 
        });
    }
});

// Creative text generation for rap lyrics
app.post('/api/generate-rap', async (req, res) => {
    try {
        const { text, style = 'rap', theme = 'general' } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Create a rap-style prompt
        const rapPrompt = `Transform this into ${style} lyrics with rhymes and rhythm:\n\n${text}\n\nRap lyrics:`;

        const response = await axios.post(
            `${HF_API_BASE}/EleutherAI/gpt-neo-1.3B`,
            {
                inputs: rapPrompt,
                parameters: {
                    max_new_tokens: 200,
                    temperature: 0.8,
                    top_p: 0.9,
                    repetition_penalty: 1.1
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let generatedText = response.data[0]?.generated_text || '';
        
        // Clean up the generated text
        generatedText = generatedText.replace(rapPrompt, '').trim();
        
        // Create structured rap verses
        const rapStructure = createRapStructure(generatedText, style);
        
        res.json({
            originalText: text,
            rapLyrics: generatedText,
            structuredLyrics: rapStructure,
            style: style,
            theme: theme,
            metadata: {
                verses: Math.ceil(rapStructure.length / 4),
                totalLines: rapStructure.length,
                estimatedDuration: `${Math.ceil(rapStructure.length * 2)}s`
            }
        });

    } catch (error) {
        console.error('Rap generation error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to generate rap lyrics',
            details: error.response?.data || error.message 
        });
    }
});

// Rhyme suggestion endpoint
app.post('/api/rhymes', (req, res) => {
    try {
        const { word } = req.body;
        
        if (!word) {
            return res.status(400).json({ error: 'Word is required' });
        }

        const rhymes = findRhymes(word);
        
        res.json({
            word: word,
            rhymes: rhymes,
            count: rhymes.length
        });

    } catch (error) {
        console.error('Rhyme generation error:', error.message);
        res.status(500).json({ 
            error: 'Failed to find rhymes',
            details: error.message 
        });
    }
});

// Text-to-Speech endpoint (placeholder for TTS integration)
app.post('/api/text-to-speech', async (req, res) => {
    try {
        const { text, voice = 'default', speed = 1.0 } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Placeholder for TTS integration
        // You can integrate with services like:
        // - Google Cloud Text-to-Speech
        // - Amazon Polly
        // - Azure Cognitive Services Speech
        // - Or use Hugging Face TTS models
        
        res.json({
            message: 'TTS endpoint ready for integration',
            text: text,
            voice: voice,
            speed: speed,
            audioUrl: null, // Will contain the generated audio URL
            status: 'pending_implementation'
        });

    } catch (error) {
        console.error('TTS error:', error.message);
        res.status(500).json({ 
            error: 'Failed to generate speech',
            details: error.message 
        });
    }
});

// Batch processing endpoint
app.post('/api/batch-process', async (req, res) => {
    try {
        const { texts, style = 'rap', options = {} } = req.body;
        
        if (!texts || !Array.isArray(texts)) {
            return res.status(400).json({ error: 'Texts array is required' });
        }

        const results = [];
        
        for (const text of texts) {
            try {
                // Process each text
                const rapStructure = createRapStructure(text, style);
                results.push({
                    originalText: text,
                    structuredLyrics: rapStructure,
                    status: 'success'
                });
            } catch (error) {
                results.push({
                    originalText: text,
                    error: error.message,
                    status: 'failed'
                });
            }
        }

        res.json({
            totalProcessed: texts.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'failed').length,
            results: results
        });

    } catch (error) {
        console.error('Batch processing error:', error.message);
        res.status(500).json({ 
            error: 'Failed to process batch',
            details: error.message 
        });
    }
});

// Get supported styles and themes
app.get('/api/styles', (req, res) => {
    res.json({
        styles: [
            { id: 'rap', name: 'Rap', description: 'Fast-paced rhythmic lyrics' },
            { id: 'melodic', name: 'Melodic', description: 'Smooth flowing lyrics' },
            { id: 'trap', name: 'Trap', description: 'Modern trap style' },
            { id: 'boom-bap', name: 'Boom Bap', description: 'Classic hip-hop style' }
        ],
        themes: [
            { id: 'general', name: 'General', description: 'Versatile theme' },
            { id: 'motivational', name: 'Motivational', description: 'Inspiring and uplifting' },
            { id: 'educational', name: 'Educational', description: 'Learning focused' },
            { id: 'storytelling', name: 'Storytelling', description: 'Narrative driven' }
        ],
        voices: [
            { id: 'default', name: 'Default', description: 'Standard voice' },
            { id: 'deep', name: 'Deep', description: 'Lower pitch voice' },
            { id: 'energetic', name: 'Energetic', description: 'High energy voice' }
        ]
    });
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
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /health',
            'POST /api/summarize',
            'POST /api/generate-rap',
            'POST /api/rhymes',
            'POST /api/text-to-speech',
            'POST /api/batch-process',
            'GET /api/styles'
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🎤 Rap Generator API running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`🎵 API Documentation: http://localhost:${PORT}/api/styles`);
});

module.exports = app;