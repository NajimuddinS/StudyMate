import { useState, useEffect } from 'react';
import { Zap, RefreshCw } from 'lucide-react';

export default function RhymeSuggestions({ word, onRhymeSelect }) {
  const [rhymes, setRhymes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputWord, setInputWord] = useState('');

  const fetchRhymes = async (searchWord) => {
    if (!searchWord.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://studymate-ara8.onrender.com/api/rhymes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: searchWord.trim() }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setRhymes(data.rhymes || []);
      }
    } catch (error) {
      console.error('Error fetching rhymes:', error);
      setRhymes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (word) {
      setInputWord(word);
      fetchRhymes(word);
    }
  }, [word]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchRhymes(inputWord);
  };

  const handleRhymeClick = (rhyme) => {
    if (onRhymeSelect) {
      onRhymeSelect(rhyme);
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-6 h-6 text-accent-400" />
        <h2 className="text-2xl font-bold text-white">Rhyme Finder</h2>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            placeholder="Enter a word to find rhymes..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={loading || !inputWord.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {rhymes.length > 0 && (
        <div>
          <h3 className="text-white/90 font-semibold mb-3">
            Rhymes for "{inputWord}" ({rhymes.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {rhymes.map((rhyme, index) => (
              <button
                key={index}
                onClick={() => handleRhymeClick(rhyme)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/90 text-sm transition-all duration-200 hover:scale-105 border border-white/20 hover:border-accent-400"
              >
                {rhyme}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-2 text-white/70">Finding rhymes...</span>
        </div>
      )}

      {rhymes.length === 0 && !loading && inputWord && (
        <div className="text-center py-8 text-white/60">
          <p>No rhymes found for "{inputWord}"</p>
          <p className="text-sm mt-1">Try a different word or check spelling</p>
        </div>
      )}
    </div>
  );
}