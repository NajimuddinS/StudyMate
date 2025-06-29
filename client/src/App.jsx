import { useState, useEffect } from 'react';
import Header from './components/Header';
import TextInput from './components/TextInput';
import RapOutput from './components/RapOutput';
import RhymeSuggestions from './components/RhymeSuggestions';
import AudioPlayer from './components/AudioPlayer';
import apiService from './services/api';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function App() {
  const [rapData, setRapData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedWord, setSelectedWord] = useState('');

  useEffect(() => {
    // Check API health on component mount
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      await apiService.healthCheck();
      showNotification('Connected to RhymeFlow API', 'success');
    } catch (error) {
      showNotification('Unable to connect to API. Please try again later.', 'error');
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleGenerateRap = async (text, style) => {
    setIsLoading(true);
    setRapData(null);
    setAudioUrl(null);
    
    try {
      // First, summarize the text
      const summaryResponse = await apiService.summarizeText(text);
      
      // Then generate rap from the summary
      const rapResponse = await apiService.generateRap(summaryResponse.summary || text, style);
      
      setRapData({
        ...rapResponse,
        summary: summaryResponse.summary,
        originalText: text
      });
      
      showNotification('Rap generated successfully! 🎤', 'success');
    } catch (error) {
      console.error('Error generating rap:', error);
      showNotification('Failed to generate rap. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextToSpeech = async (text) => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    try {
      setIsPlaying(true);
      const response = await apiService.textToSpeech(text);
      
      if (response.audio_url) {
        setAudioUrl(response.audio_url);
      } else {
        throw new Error('No audio URL received');
      }
    } catch (error) {
      console.error('Error with text-to-speech:', error);
      showNotification('Text-to-speech failed. Please try again.', 'error');
      setIsPlaying(false);
    }
  };

  const handleRhymeSelect = (rhyme) => {
    // Copy the rhyme to clipboard
    navigator.clipboard.writeText(rhyme).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = rhyme;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
    
    showNotification(`"${rhyme}" copied to clipboard!`, 'success');
  };

  const NotificationBanner = () => {
    if (!notification) return null;

    const icons = {
      success: CheckCircle2,
      error: AlertCircle,
      info: Loader2
    };

    const colors = {
      success: 'bg-green-500/20 border-green-500/50 text-green-300',
      error: 'bg-red-500/20 border-red-500/50 text-red-300',
      info: 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    };

    const Icon = icons[notification.type];

    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border backdrop-blur-md ${colors[notification.type]} animate-fade-in`}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span>{notification.message}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white">
      <NotificationBanner />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <TextInput 
              onGenerate={handleGenerateRap}
              onTextToSpeech={handleTextToSpeech}
              isLoading={isLoading}
            />
            
            {rapData && (
              <RapOutput 
                rapData={rapData}
                onTextToSpeech={handleTextToSpeech}
                isPlaying={isPlaying}
              />
            )}
            
            {audioUrl && (
              <AudioPlayer
                audioUrl={audioUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                isPlaying={isPlaying}
              />
            )}
          </div>
          
          <div className="space-y-8">
            <RhymeSuggestions 
              word={selectedWord}
              onRhymeSelect={handleRhymeSelect}
            />
            
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Quick Tips</h3>
              <div className="space-y-3 text-white/80">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">Longer texts create more detailed raps</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">Try different styles for varied vibes</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">Use the rhyme finder for inspiration</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">Educational content works best</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-16 py-8 text-center text-white/60 border-t border-white/10">
        <p>© 2025 RhymeFlow - Turn Knowledge into Rhymes</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">API Connected</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;