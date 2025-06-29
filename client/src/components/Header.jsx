import { Music, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center py-12 px-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-r from-primary-600 to-accent-600 rounded-full animate-pulse-glow">
          <Music className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent neon-text">
          RhymeFlow
        </h1>
        <Sparkles className="w-8 h-8 text-primary-400 animate-bounce-slow" />
      </div>
      <p className="text-xl text-white/80 max-w-2xl mx-auto">
        Transform your knowledge into <span className="text-primary-400 font-semibold">fire rhymes</span> and 
        <span className="text-accent-400 font-semibold"> melodic lyrics</span>
      </p>
      <div className="flex items-center justify-center gap-2 mt-6">
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
    </header>
  );
}