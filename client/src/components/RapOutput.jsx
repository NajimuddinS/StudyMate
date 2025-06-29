import { useState } from 'react';
import { Copy, Download, Volume2, Heart, Share2, Mic } from 'lucide-react';

export default function RapOutput({ rapData, onTextToSpeech, isPlaying }) {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!rapData) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rapData.lyrics || rapData.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadLyrics = () => {
    const element = document.createElement('a');
    const file = new Blob([rapData.lyrics || rapData.text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `rap-lyrics-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const shareRap = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my AI-generated rap!',
          text: rapData.lyrics || rapData.text,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Your Generated Rap</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiked(!liked)}
            className={`p-2 rounded-full transition-colors ${
              liked ? 'bg-red-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
          </button>
          
          <div className="flex items-center gap-1 bg-white/10 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-white/80">AI Generated</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-black/30 rounded-lg p-6 border border-white/20">
          <div className="text-white/90 leading-relaxed text-lg whitespace-pre-wrap font-mono">
            {rapData.lyrics || rapData.text}
          </div>
        </div>
        
        {rapData.summary && (
          <div className="mt-4 p-4 bg-primary-500/20 rounded-lg border border-primary-500/30">
            <h3 className="text-primary-300 font-semibold mb-2">Original Summary:</h3>
            <p className="text-white/80">{rapData.summary}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => onTextToSpeech(rapData.lyrics || rapData.text)}
          className={`btn-primary flex items-center gap-2 ${isPlaying ? 'beat-animation' : ''}`}
        >
          <Volume2 className="w-5 h-5" />
          {isPlaying ? 'Playing...' : 'Play Rap'}
        </button>
        
        <button
          onClick={copyToClipboard}
          className="btn-secondary flex items-center gap-2"
        >
          <Copy className="w-5 h-5" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
        
        <button
          onClick={downloadLyrics}
          className="btn-secondary flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download
        </button>
        
        <button
          onClick={shareRap}
          className="btn-secondary flex items-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          Share
        </button>
      </div>
    </div>
  );
}