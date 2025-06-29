import { useState } from 'react';
import { FileText, Wand2, Volume2, Shuffle } from 'lucide-react';

export default function TextInput({ onGenerate, onTextToSpeech, isLoading }) {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('hip-hop');

  const styles = [
    { id: 'hip-hop', name: 'Hip-Hop', icon: '🎤' },
    { id: 'pop', name: 'Pop', icon: '🎵' },
    { id: 'rock', name: 'Rock', icon: '🎸' },
    { id: 'r&b', name: 'R&B', icon: '🎹' },
    { id: 'country', name: 'Country', icon: '🤠' },
    { id: 'electronic', name: 'Electronic', icon: '🎛️' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onGenerate(text, style);
    }
  };

  const handleTTS = () => {
    if (text.trim()) {
      onTextToSpeech(text);
    }
  };

  const sampleTexts = [
    "The photosynthesis process converts light energy into chemical energy through chloroplasts in plant cells.",
    "JavaScript is a versatile programming language that runs in browsers and servers, enabling dynamic web applications.",
    "The Renaissance was a period of cultural rebirth in Europe, marked by advances in art, science, and philosophy."
  ];

  const loadSample = () => {
    const randomSample = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setText(randomSample);
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-primary-400" />
        <h2 className="text-2xl font-bold text-white">Input Your Text</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-white/90 font-medium">Enter your text (study notes, articles, etc.)</label>
            <button
              type="button"
              onClick={loadSample}
              className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              Try Sample
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your study notes, blog post, or any text you want to turn into rhymes..."
            className="input-field w-full h-32 resize-none"
            required
          />
          <p className="text-white/60 text-sm mt-2">{text.length} characters</p>
        </div>

        <div>
          <label className="text-white/90 font-medium mb-3 block">Choose Your Style</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {styles.map((styleOption) => (
              <button
                key={styleOption.id}
                type="button"
                onClick={() => setStyle(styleOption.id)}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  style === styleOption.id
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : 'bg-white/10 border-white/30 text-white/80 hover:bg-white/20'
                }`}
              >
                <div className="text-2xl mb-1">{styleOption.icon}</div>
                <div className="text-sm font-medium">{styleOption.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Generate Rap'}
          </button>
          
          <button
            type="button"
            onClick={handleTTS}
            disabled={!text.trim() || isLoading}
            className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Volume2 className="w-5 h-5" />
            Preview TTS
          </button>
        </div>
      </form>
    </div>
  );
}