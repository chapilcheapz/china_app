import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Volume2, 
  RotateCw, 
  RotateCcw,
  ChevronLeft, 
  ChevronRight, 
  Star, 
  CheckCircle2, 
  Shuffle, 
  Play, 
  Pause, 
  Eye, 
  EyeOff,
  Sparkles,
  BookMarked
} from 'lucide-react';
import { speakChinese, sfx } from '../utils/audio';

export default function FlashcardView({
  words,
  selectedLevel,
  starredIds,
  onToggleStar,
  learnedIds,
  onToggleLearned,
  onCardReviewed
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPinyinHint, setShowPinyinHint] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'unlearned' | 'learned' | 'starred'
  const [shuffledIndices, setShuffledIndices] = useState(null);
  const autoPlayTimerRef = useRef(null);

  // Compute filtered word list
  const filteredWords = React.useMemo(() => {
    if (!words || words.length === 0) return [];
    let list = words;
    if (filterMode === 'unlearned') {
      list = words.filter(w => !learnedIds.has(w.id));
    } else if (filterMode === 'learned') {
      list = words.filter(w => learnedIds.has(w.id));
    } else if (filterMode === 'starred') {
      list = words.filter(w => starredIds.has(w.id));
    }
    return list;
  }, [words, filterMode, learnedIds, starredIds]);

  // Display list (ordered or shuffled)
  const displayWords = React.useMemo(() => {
    if (!shuffledIndices) return filteredWords;
    if (shuffledIndices.length !== filteredWords.length) return filteredWords;
    return shuffledIndices.map(i => filteredWords[i]).filter(Boolean);
  }, [filteredWords, shuffledIndices]);

  const currentWord = displayWords[currentIndex] || null;

  // Reset index when level or filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShuffledIndices(null);
  }, [selectedLevel, filterMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 's' || e.key === 'S') {
        if (currentWord) speakChinese(currentWord.word);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayWords, currentIndex, isFlipped, currentWord]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => {
      sfx.playFlip();
      return !prev;
    });
  }, []);

  const handleNext = useCallback(() => {
    if (displayWords.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % displayWords.length);
    if (onCardReviewed) onCardReviewed();
  }, [displayWords.length, onCardReviewed]);

  const handlePrev = useCallback(() => {
    if (displayWords.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + displayWords.length) % displayWords.length);
  }, [displayWords.length]);

  const toggleShuffle = () => {
    if (shuffledIndices) {
      setShuffledIndices(null);
      setCurrentIndex(0);
    } else {
      const arr = filteredWords.map((_, i) => i);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledIndices(arr);
      setCurrentIndex(0);
    }
    sfx.playFlip();
  };

  // Auto-play feature
  useEffect(() => {
    if (!isAutoPlay || displayWords.length === 0) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      setIsFlipped(prev => {
        if (!prev) {
          // Flip to back and play sound
          sfx.playFlip();
          return true;
        } else {
          // Advance to next card
          setCurrentIndex(c => (c + 1) % displayWords.length);
          if (onCardReviewed) onCardReviewed();
          return false;
        }
      });
    }, 3200);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlay, displayWords.length, onCardReviewed]);

  // Read aloud automatically when new card appears if wanted
  useEffect(() => {
    if (currentWord && !isFlipped && isAutoPlay) {
      speakChinese(currentWord.word);
    }
  }, [currentIndex, isAutoPlay, currentWord, isFlipped]);

  if (!words || words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Sparkles className="w-12 h-12 text-slate-300 animate-spin mb-4" />
        <p className="text-lg">Đang chuẩn bị bộ thẻ {selectedLevel} cho bạn...</p>
      </div>
    );
  }

  if (displayWords.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <BookMarked className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Chưa có từ nào ở đây nè!</h3>
          <p className="text-slate-500 text-sm mb-6">
            Bạn chưa có từ nào trong mục "{filterMode === 'starred' ? 'Đã lưu ⭐' : filterMode === 'learned' ? 'Đã thuộc' : 'Chưa thuộc'}". Hãy học và đánh dấu từ vựng nhé!
          </p>
          <button
            onClick={() => setFilterMode('all')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Học tất cả từ {selectedLevel}
          </button>
        </div>
      </div>
    );
  }

  const isStarred = currentWord && starredIds.has(currentWord.id);
  const isLearned = currentWord && learnedIds.has(currentWord.id);

  // Progress stats
  const totalCount = words.length;
  const learnedCount = words.filter(w => learnedIds.has(w.id)).length;
  const progressPercent = Math.round((learnedCount / totalCount) * 100);

  return (
    <div className="max-w-3xl mx-auto px-3 py-3 sm:px-4 sm:py-6">
      {/* Level Progress Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-6 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Cấp độ {selectedLevel}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold">
              {words.length} từ
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Đã thuộc: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{learnedCount}</span> / {totalCount} ({progressPercent}%)
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'unlearned', label: 'Chưa thuộc' },
            { id: 'learned', label: 'Đã thuộc' },
            { id: 'starred', label: 'Đã lưu ⭐' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                filterMode === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3 sm:mb-6">
        <div 
          className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Card Counter & Controls Bar */}
      <div className="flex items-center justify-between text-xs sm:text-sm mb-3 sm:mb-4">
        <div className="font-bold text-slate-500 dark:text-slate-400">
          Thẻ {currentIndex + 1} / {displayWords.length}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Toggle Pinyin hint button */}
          <button
            onClick={() => setShowPinyinHint(!showPinyinHint)}
            title={showPinyinHint ? 'Ẩn phiên âm mặt trước' : 'Hiện phiên âm mặt trước'}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {showPinyinHint ? <Eye className="w-3.5 h-3.5 text-blue-500" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">Pinyin</span>
          </button>

          {/* Shuffle Button */}
          <button
            onClick={toggleShuffle}
            title={shuffledIndices ? 'Tắt chế độ trộn ngẫu nhiên' : 'Trộn thẻ ngẫu nhiên'}
            className={`p-1.5 sm:p-2 rounded-lg text-xs font-medium transition-colors ${
              shuffledIndices
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Auto-play Button */}
          <button
            onClick={() => {
              setIsAutoPlay(!isAutoPlay);
              sfx.playSuccess();
            }}
            title={isAutoPlay ? 'Tạm dừng lật thẻ' : 'Tự động lật thẻ'}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isAutoPlay
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Tự chạy</span>
          </button>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div 
        className="w-full h-72 sm:h-88 md:h-96 perspective-1000 cursor-pointer select-none"
        onClick={handleFlip}
      >
        <div 
          className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-4 sm:p-6 flex flex-col justify-between items-center backface-hidden shadow-xl hover:border-red-400 dark:hover:border-red-600 transition-colors">
            {/* Top Card Bar */}
            <div className="w-full flex items-center justify-between" onClick={e => e.stopPropagation()}>
              <span className="text-xs font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                {currentWord.level}
              </span>

              <div className="flex items-center gap-1">
                {/* Star Button */}
                <button
                  onClick={() => {
                    onToggleStar(currentWord.id);
                    sfx.playSuccess();
                  }}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
                >
                  <Star className={`w-5 h-5 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>

                {/* Speaker Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakChinese(currentWord.word);
                  }}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-600 transition-colors"
                  title="Phát âm tiếng Trung"
                >
                  <Volume2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            {/* Center Content */}
            <div className="flex flex-col items-center justify-center my-auto">
              <h2 className="text-5xl sm:text-7xl font-bold font-chinese tracking-wide text-slate-900 dark:text-white hover:scale-105 transition-transform duration-200">
                {currentWord.word}
              </h2>

              {showPinyinHint && currentWord.pinyin && (
                <div className="mt-2 sm:mt-3 text-lg sm:text-xl font-medium text-red-600 dark:text-red-400 tracking-wider">
                  {currentWord.pinyin}
                </div>
              )}

              {currentWord.hanviet && (
                <span className="mt-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                  Hán-Việt: {currentWord.hanviet}
                </span>
              )}
            </div>

            {/* Bottom Card Bar */}
            <div className="w-full flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Chạm hoặc phím Space để lật
              </span>
              {isLearned && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã thuộc
                </span>
              )}
            </div>
          </div>

          {/* BACK OF CARD */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-white to-red-50/30 dark:from-slate-900 dark:to-red-950/20 rounded-3xl border-2 border-red-200 dark:border-red-900/60 p-4 sm:p-6 flex flex-col justify-between backface-hidden rotate-y-180 shadow-xl overflow-y-auto">
            {/* Top Back Bar */}
            <div className="w-full flex items-center justify-between" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-bold font-chinese text-slate-900 dark:text-white">
                  {currentWord.word}
                </span>
                <span className="text-sm sm:text-base font-semibold text-red-600 dark:text-red-400">
                  {currentWord.pinyin}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakChinese(currentWord.word);
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-slate-800 text-red-600 dark:text-red-400"
                  title="Nghe từ vựng"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Center Meaning Content */}
            <div className="my-auto py-2">
              <div className="mb-3 sm:mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 sm:mb-1">
                  Ý nghĩa tiếng Việt
                </div>
                <div className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {currentWord.meaning}
                </div>
              </div>

              {/* Example sentence */}
              {currentWord.example && (
                <div 
                  className="bg-white/80 dark:bg-slate-800/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 mt-2"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm sm:text-lg font-chinese font-semibold text-slate-800 dark:text-slate-100">
                      {currentWord.example}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakChinese(currentWord.example);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                      title="Nghe cả câu ví dụ"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  {currentWord.example_trans && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 italic">
                      {currentWord.example_trans}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick action buttons on back */}
            <div className="w-full flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => {
                  onToggleLearned(currentWord.id);
                  sfx.playSuccess();
                  handleNext();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  isLearned
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLearned ? 'Đã thuộc (Bỏ)' : 'Đánh dấu đã thuộc'}
              </button>

              <button
                onClick={handleFlip}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 font-medium"
              >
                <RotateCw className="w-3.5 h-3.5" /> Lật lại
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Controls */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4 mt-4 sm:mt-6">
        <button
          onClick={handlePrev}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs active:scale-98 transition-all"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Trước</span>
        </button>

        <button
          onClick={handleFlip}
          className="flex-1 py-2.5 sm:py-3 px-2 sm:px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-red-500/20 active:scale-98 transition-all"
        >
          Lật thẻ
        </button>

        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs active:scale-98 transition-all"
        >
          <span>Sau</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Spaced Repetition Bar */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-3 sm:mt-4">
        <button
          onClick={() => {
            if (isLearned) onToggleLearned(currentWord.id);
            sfx.playTone(280, 'sine', 0.1);
            handleNext();
          }}
          className="py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-98"
        >
          <RotateCcw className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span>Cần ôn lại</span>
        </button>

        <button
          onClick={() => {
            if (!isLearned) onToggleLearned(currentWord.id);
            sfx.playSuccess();
            handleNext();
          }}
          className="py-2.5 sm:py-3.5 px-3 sm:px-5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Đã thuộc làu</span>
        </button>
      </div>
    </div>
  );
}
