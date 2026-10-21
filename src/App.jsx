import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import FlashcardView from './components/FlashcardView';
import QuizView from './components/QuizView';
import TypingPracticeView from './components/TypingPracticeView';
import DictionaryView from './components/DictionaryView';
import ProgressView from './components/ProgressView';
import { storage } from './utils/storage';
import { sfx } from './utils/audio';

export default function App() {
  const [currentTab, setCurrentTab] = useState('flashcard');
  const [selectedLevel, setSelectedLevel] = useState('HSK1');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('china_app_dark') === 'true';
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Data states
  const [summary, setSummary] = useState(null);
  const [currentLevelWords, setCurrentLevelWords] = useState([]);
  const [allWords, setAllWords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // User state
  const [starredIds, setStarredIds] = useState(() => storage.getStarred());
  const [learnedIds, setLearnedIds] = useState(() => storage.getLearned());

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('china_app_dark', String(darkMode));
  }, [darkMode]);

  // Load summary and all words
  useEffect(() => {
    async function loadData() {
      try {
        const sumRes = await fetch('/data/summary.json');
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setSummary(sumData);
        }

        const allRes = await fetch('/data/all_words.json');
        if (allRes.ok) {
          const allData = await allRes.json();
          setAllWords(allData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Update current level words when selectedLevel or allWords changes
  useEffect(() => {
    if (allWords && allWords.length > 0) {
      const filtered = allWords.filter(w => w.level === selectedLevel);
      setCurrentLevelWords(filtered);
    } else {
      // Fallback: fetch directly
      fetch(`/data/${selectedLevel.toLowerCase()}.json`)
        .then(r => r.json())
        .then(data => setCurrentLevelWords(data))
        .catch(console.error);
    }
  }, [selectedLevel, allWords]);

  // Star & Learned Toggles
  const handleToggleStar = useCallback((id) => {
    storage.toggleStarred(id);
    setStarredIds(storage.getStarred());
  }, []);

  const handleToggleLearned = useCallback((id) => {
    storage.toggleLearned(id);
    setLearnedIds(storage.getLearned());
  }, []);

  const handleCardReviewed = useCallback(() => {
    storage.updateStats(prev => ({
      ...prev,
      cardsReviewed: (prev.cardsReviewed || 0) + 1,
    }));
  }, []);

  const handleStartFlashcard = (level) => {
    setSelectedLevel(level);
    setCurrentTab('flashcard');
    sfx.playSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Header Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        summary={summary}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        {isLoading && allWords.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <div className="font-bold text-slate-600 dark:text-slate-400 text-sm">
              Đang chuẩn bị bài học HSK 1 - 6 cho bạn...
            </div>
          </div>
        ) : (
          <>
            {currentTab === 'flashcard' && (
              <FlashcardView
                words={currentLevelWords}
                selectedLevel={selectedLevel}
                starredIds={starredIds}
                onToggleStar={handleToggleStar}
                learnedIds={learnedIds}
                onToggleLearned={handleToggleLearned}
                onCardReviewed={handleCardReviewed}
              />
            )}

            {currentTab === 'quiz' && (
              <QuizView
                words={currentLevelWords}
                selectedLevel={selectedLevel}
                onToggleStar={handleToggleStar}
                starredIds={starredIds}
                onStatsUpdate={() => {}}
              />
            )}

            {currentTab === 'typing' && (
              <TypingPracticeView
                words={currentLevelWords}
                selectedLevel={selectedLevel}
                onStatsUpdate={() => {}}
              />
            )}

            {currentTab === 'dictionary' && (
              <DictionaryView
                allWords={allWords}
                starredIds={starredIds}
                onToggleStar={handleToggleStar}
                learnedIds={learnedIds}
                onToggleLearned={handleToggleLearned}
              />
            )}

            {currentTab === 'progress' && (
              <ProgressView
                summary={summary}
                allWords={allWords}
                starredIds={starredIds}
                onToggleStar={handleToggleStar}
                learnedIds={learnedIds}
                onToggleLearned={handleToggleLearned}
                onStartFlashcard={handleStartFlashcard}
                onDataReset={() => {
                  setStarredIds(new Set());
                  setLearnedIds(new Set());
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>ChinaApp • Đồng hành cùng bạn chinh phục tiếng Trung mỗi ngày • 5.002 từ vựng chuẩn HSK</p>
      </footer>
    </div>
  );
}
