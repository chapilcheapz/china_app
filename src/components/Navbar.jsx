import React from 'react';
import { 
  BookOpen, 
  Gamepad2, 
  Keyboard, 
  Search, 
  Award, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun,
  Layers
} from 'lucide-react';
import { sfx, stopAllAudio } from '../utils/audio';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  selectedLevel, 
  setSelectedLevel, 
  darkMode, 
  setDarkMode,
  soundEnabled,
  setSoundEnabled,
  summary
}) {
  const tabs = [
    { id: 'flashcard', name: 'Flashcard', icon: Layers },
    { id: 'quiz', name: 'Trắc nghiệm', icon: Gamepad2 },
    { id: 'typing', name: 'Luyện gõ', icon: Keyboard },
    { id: 'dictionary', name: 'Từ điển', icon: Search },
    { id: 'progress', name: 'Góc học tập', icon: Award },
  ];

  const levels = ['ALL', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'];

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sfx.soundEnabled = next;
    if (!next) {
      stopAllAudio();
    } else {
      sfx.playSuccess();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setCurrentTab('flashcard')}>
            <img 
              src="/logo.png" 
              alt="ChinaApp Logo" 
              className="w-10 h-10 rounded-xl object-cover shadow-sm hover:scale-105 transition-transform" 
            />
            <div>
              <div className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">
                ChinaApp
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-1 tracking-wider uppercase">
                Chinh phục HSK 1-6
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setCurrentTab(tab.id);
                    sfx.playFlip();
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* HSK Level Pill Selector (Quick selector for Flashcard & Quiz) */}
            {(currentTab === 'flashcard' || currentTab === 'quiz' || currentTab === 'typing') && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 text-xs font-bold">
                {['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSelectedLevel(lvl);
                      sfx.playTone(350, 'sine', 0.05);
                    }}
                    className={`px-2 py-1 rounded-md transition-all ${
                      selectedLevel === lvl
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lvl.replace('HSK', 'H')}
                  </button>
                ))}
              </div>
            )}

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  sfx.playFlip();
                }}
                className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
