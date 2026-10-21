import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Keyboard, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Flame, 
  HelpCircle,
  ArrowRight,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speakChinese, sfx } from '../utils/audio';
import { storage } from '../utils/storage';

export default function TypingPracticeView({
  words,
  selectedLevel,
  onStatsUpdate
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const inputRef = useRef(null);

  const currentWord = words && words.length > 0 ? words[currentIndex] : null;

  // Auto focus input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex]);

  // Read word on new question
  useEffect(() => {
    if (currentWord) {
      speakChinese(currentWord.word);
    }
  }, [currentIndex]);

  // Virtual keyboard buttons (characters from target word + random distractors)
  const virtualKeys = React.useMemo(() => {
    if (!currentWord) return [];
    const targetChars = currentWord.word.split('');
    // Gather some other characters from nearby words as distractors
    const otherChars = [];
    for (let i = 0; i < 6; i++) {
      const randWord = words[Math.floor(Math.random() * words.length)];
      if (randWord && randWord.word) {
        otherChars.push(...randWord.word.split(''));
      }
    }
    const pool = Array.from(new Set([...targetChars, ...otherChars])).slice(0, 8);
    return pool.sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserInput(val);
    checkMatch(val);
  };

  const handleVirtualKeyClick = (char) => {
    const nextVal = userInput + char;
    setUserInput(nextVal);
    checkMatch(nextVal);
    if (inputRef.current) inputRef.current.focus();
  };

  const checkMatch = (val) => {
    if (!currentWord) return;
    const cleanTarget = currentWord.word.trim();
    const cleanVal = val.trim();

    if (cleanVal === cleanTarget) {
      // Completed correctly!
      sfx.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setCompletedCount(c => c + 1);

      if (newStreak % 5 === 0) {
        sfx.playStreak();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }

      // Update local storage
      storage.updateStats(prev => ({
        ...prev,
        typingWordsCount: (prev.typingWordsCount || 0) + 1,
      }));
      if (onStatsUpdate) onStatsUpdate();

      // Advance to next word
      setTimeout(() => {
        handleNextWord();
      }, 500);
    } else {
      // Check if partially wrong
      let isMismatch = false;
      for (let i = 0; i < cleanVal.length; i++) {
        if (cleanVal[i] !== cleanTarget[i]) {
          isMismatch = true;
          break;
        }
      }
      if (isMismatch) {
        sfx.playTone(200, 'sawtooth', 0.1, 0.08);
        setMistakes(m => m + 1);
      }
    }
  };

  const handleNextWord = useCallback(() => {
    setUserInput('');
    setShowHint(false);
    if (currentIndex + 1 < words.length) {
      setCurrentIndex(i => i + 1);
    } else {
      setIsFinished(true);
      sfx.playStreak();
      confetti({ particleCount: 100, spread: 80 });
    }
  }, [currentIndex, words]);

  const handleSkip = () => {
    setStreak(0);
    sfx.playFlip();
    handleNextWord();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setUserInput('');
    setStreak(0);
    setCompletedCount(0);
    setMistakes(0);
    setIsFinished(false);
  };

  if (!words || words.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        Đang tải từ vựng {selectedLevel}...
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
            Hoàn Thành Bài Luyện Gõ!
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Bạn đã gõ xong tất cả từ vựng trong bộ {selectedLevel}.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-bold uppercase">Số từ đã gõ</div>
              <div className="text-3xl font-extrabold text-emerald-600 mt-1">{completedCount}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-bold uppercase">Chuỗi đúng dài nhất</div>
              <div className="text-3xl font-extrabold text-amber-500 mt-1">{maxStreak}</div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Luyện Lại Từ Đầu
          </button>
        </div>
      </div>
    );
  }

  const targetChars = currentWord.word.split('');
  const userChars = userInput.split('');

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 sm:px-4 sm:py-6">
      {/* HUD Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
            Luyện gõ Hán tự {selectedLevel}
          </span>
          <div className="text-[11px] sm:text-xs text-slate-400">
            Từ {currentIndex + 1} / {words.length} • Đã gõ: {completedCount}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/15 text-amber-500 font-black text-xs animate-bounce">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500" />
              <span>x{streak}</span>
            </div>
          )}

          <button
            onClick={() => speakChinese(currentWord.word)}
            className="p-1.5 sm:p-2 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
            title="Nghe phát âm"
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Target Word Prompt Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-8 text-center shadow-md mb-4 sm:mb-6">
        <div className="text-sm font-semibold text-red-600 dark:text-red-400 tracking-wider mb-1">
          {currentWord.pinyin}
        </div>

        <div className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          {currentWord.meaning}
        </div>

        {currentWord.hanviet && (
          <span className="inline-block text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 mb-4">
            Hán-Việt: {currentWord.hanviet}
          </span>
        )}

        {/* Character Slots Visualizer */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-4 sm:my-6">
          {targetChars.map((targetChar, idx) => {
            const userChar = userChars[idx];
            let borderCol = 'border-slate-300 dark:border-slate-700 text-slate-400';
            let bgCol = 'bg-slate-50 dark:bg-slate-800/50';

            if (userChar) {
              if (userChar === targetChar) {
                borderCol = 'border-emerald-500 text-emerald-600 dark:text-emerald-400 scale-105';
                bgCol = 'bg-emerald-50 dark:bg-emerald-950/40';
              } else {
                borderCol = 'border-rose-500 text-rose-600 dark:text-rose-400 animate-shake';
                bgCol = 'bg-rose-50 dark:bg-rose-950/40';
              }
            }

            return (
              <div
                key={idx}
                className={`w-14 h-18 sm:w-20 sm:h-24 rounded-xl sm:rounded-2xl border-2 ${borderCol} ${bgCol} flex flex-col items-center justify-center font-chinese text-3xl sm:text-5xl font-bold transition-all shadow-xs`}
              >
                {userChar ? (
                  <span>{userChar}</span>
                ) : showHint ? (
                  <span className="opacity-30">{targetChar}</span>
                ) : (
                  <span className="opacity-15 font-sans text-xl">_</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Example hint */}
        {currentWord.example && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 text-left">
            <span className="font-chinese font-semibold text-slate-700 dark:text-slate-300 text-sm block">
              {currentWord.example}
            </span>
            {currentWord.example_trans && (
              <span className="italic mt-0.5 block">{currentWord.example_trans}</span>
            )}
          </div>
        )}
      </div>

      {/* Typing Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Gõ chữ Hán vào đây (hoặc nhấn phím gợi ý bên dưới)..."
            className="w-full py-4 px-5 pr-14 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 focus:border-red-600 dark:focus:border-red-500 rounded-2xl font-chinese text-2xl font-bold shadow-sm outline-none transition-colors"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Keyboard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Virtual Character Picker Buttons (helpful if user does not have Chinese IME) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs mb-6">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Gợi ý ký tự nhanh:</span>
          <button
            onClick={() => setShowHint(!showHint)}
            className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {showHint ? 'Ẩn đáp án' : 'Xem gợi ý'}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
          {virtualKeys.map((char, idx) => (
            <button
              key={idx}
              onClick={() => handleVirtualKeyClick(char)}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/60 hover:text-red-600 dark:hover:text-red-400 font-chinese font-bold text-xl sm:text-2xl border border-slate-200 dark:border-slate-700 shadow-xs active:scale-95 transition-all"
            >
              {char}
            </button>
          ))}
          <button
            onClick={() => setUserInput(userInput.slice(0, -1))}
            className="px-2.5 sm:px-3 h-10 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 active:scale-95 transition-all"
          >
            ⌫ Xóa
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setUserInput('')}
          className="py-3 px-4 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Xóa để gõ lại
        </button>

        <button
          onClick={handleSkip}
          className="py-3 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
        >
          <span>Bỏ qua từ này</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
