import React, { useState, useRef } from 'react';
import { Play, Pause, Upload, Download, Mic, Music, Zap, FileText, Copy, Share2, Settings } from 'lucide-react';

const App = () => {
  const [inputText, setInputText] = useState('');
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('rap');
  const [selectedBeat, setSelectedBeat] = useState('boom-bap');
  const [rhymeScheme, setRhymeScheme] = useState('ABAB');
  const [audioUrl, setAudioUrl] = useState('');
  const [metadata, setMetadata] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const styles = [
    { id: 'rap', name: 'Classic Rap', icon: '🎤' },
    { id: 'melodic', name: 'Melodic', icon: '🎵' },
    { id: 'trap', name: 'Trap', icon: '🔥' },
    { id: 'boom-bap', name: 'Boom Bap', icon: '💥' },
    { id: 'drill', name: 'Drill', icon: '⚡' }
  ];

  const beats = [
    { id: 'boom-bap', name: 'Boom Bap', bpm: 90, color: 'bg-orange-500' },
    { id: 'trap', name: 'Trap', bpm: 140, color: 'bg-red-500' },
    { id: 'lo-fi', name: 'Lo-Fi', bpm: 85, color: 'bg-purple-500' },
    { id: 'drill', name: 'Drill', bpm: 150, color: 'bg-yellow-500' },
    { id: 'melodic', name: 'Melodic', bpm: 120, color: 'bg-blue-500' }
  ];

  const rhymeSchemes = [
    { id: 'AABB', name: 'AABB', description: 'Couplets' },
    { id: 'ABAB', name: 'ABAB', description: 'Alternating' },
    { id: 'ABCB', name: 'ABCB', description: 'Ballad' },
    { id: 'AAAA', name: 'AAAA', description: 'Monorhyme' }
  ];

  const generateRap = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to convert to rap!');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-rap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          style: selectedStyle,
          rhymeScheme: rhymeScheme
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate rap');
      }

      const data = await response.json();
      setGeneratedLyrics(data.lyrics);
      setMetadata(data.metadata);
    } catch (error) {
      console.error('Error generating rap:', error);
      generateFallbackRap();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFallbackRap = () => {
    const words = inputText.split(' ').filter(w => w.length > 3).slice(0, 6);
    const fallbackLyrics = `
Yo, let me break it down, here's what I know (uh)
${words[0] || 'Knowledge'} in my mind, watch my skills grow (yeah)
${words[1] || 'Learning'} every day, that's how I stay real (real talk)
${words[2] || 'Wisdom'} is the power, that's the way I feel (facts)

Check it, ${words[3] || 'understanding'} is the key to success (key)
${words[4] || 'Education'} in my veins, I'm blessed, no stress (blessed)
${words[5] || 'Knowledge'} turns to rhythm, flowing through my brain (flow)
Spitting facts like fire, driving y'all insane (insane)

(Yeah! That's how we turn knowledge into bars!)
    `.trim();
    
    setGeneratedLyrics(fallbackLyrics);
    setMetadata({
      style: selectedStyle,
      rhymeScheme: rhymeScheme,
      generatedAt: new Date().toISOString()
    });
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInputText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const playTTS = async () => {
    if (!generatedLyrics) return;
    
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
    }, 5000);
  };

  const copyLyrics = () => {
    navigator.clipboard.writeText(generatedLyrics);
    alert('Lyrics copied to clipboard!');
  };

  const downloadLyrics = () => {
    const blob = new Blob([generatedLyrics], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rap-lyrics.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const BeatVisualizer = ({ isActive }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4].map((bar) => (
        <div 
          key={bar} 
          className={`w-1 bg-gradient-to-t from-blue-400 to-purple-500 rounded-full transition-all duration-200 ${
            isActive ? 'animate-pulse' : ''
          }`}
          style={{
            height: isActive ? `${Math.random() * 20 + 10}px` : '4px',
            animationDelay: `${bar * 0.1}s`
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-md border-b border-purple-500/30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Mic className="w-8 h-8 text-purple-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  RapAI Generator
                </h1>
                <p className="text-gray-400 text-sm">Turn knowledge into rhymes</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <BeatVisualizer isActive={isPlaying || isGenerating} />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  <span>Input Text</span>
                </h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload File</span>
                </button>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your study notes, blog post, or any text you want to turn into rap lyrics..."
                className="w-full h-40 bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
              />
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
                <span>{inputText.length} characters</span>
                <span>Supports .txt and .md files</span>
              </div>
            </div>

            {/* Style Selection */}
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span>Style & Beat</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedStyle === style.id
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{style.icon}</span>
                      <span className="font-medium">{style.name}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">Beat Selection</label>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {beats.map((beat) => (
                    <button
                      key={beat.id}
                      onClick={() => setSelectedBeat(beat.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-all ${
                        selectedBeat === beat.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${beat.color} mb-1`} />
                      <div className="text-xs font-medium">{beat.name}</div>
                      <div className="text-xs text-gray-400">{beat.bpm} BPM</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Rhyme Scheme</label>
                <select
                  value={rhymeScheme}
                  onChange={(e) => setRhymeScheme(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {rhymeSchemes.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.name} - {scheme.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateRap}
              disabled={isGenerating || !inputText.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center space-x-3"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  <span>Generating Rap...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span>Generate Rap Lyrics</span>
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-purple-400" />
                  <span>Generated Lyrics</span>
                </h2>
                {generatedLyrics && (
                  <div className="flex space-x-2">
                    <button
                      onClick={copyLyrics}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Copy lyrics"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadLyrics}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Download lyrics"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Share lyrics"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 min-h-[300px]">
                {generatedLyrics ? (
                  <pre className="whitespace-pre-wrap text-green-300 font-mono text-sm leading-relaxed">
                    {generatedLyrics}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Your rap lyrics will appear here</p>
                      <p className="text-sm mt-2">Enter some text and click generate to get started!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Controls */}
              {generatedLyrics && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={playTTS}
                        disabled={isPlaying}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded-lg transition-colors"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isPlaying ? 'Playing...' : 'Play with TTS'}</span>
                      </button>

                      <audio 
                        ref={audioRef} 
                        src={audioUrl} 
                        onEnded={() => setIsPlaying(false)}
                        hidden
                      />

                      <div className="ml-4">
                        <BeatVisualizer isActive={isPlaying} />
                      </div>
                    </div>

                    <div className="mt-2">
                      <select
                        value={selectedBeat}
                        onChange={(e) => setSelectedBeat(e.target.value)}
                        className="bg-gray-800 text-white text-sm rounded p-2"
                      >
                        {beats.map(beat => (
                          <option key={beat.id} value={beat.id}>
                            {beat.name} ({beat.bpm} BPM)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Configuration</label>
                <input
                  type="text"
                  placeholder="Hugging Face API Key"
                  className="w-full bg-gray-700 rounded-lg p-2 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Audio Quality</label>
                <select className="w-full bg-gray-700 rounded-lg p-2 text-sm">
                  <option>Low (faster)</option>
                  <option>Medium</option>
                  <option>High (slower)</option>
                </select>
              </div>
              
              <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;