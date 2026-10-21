import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trophy, 
  Flame, 
  Volume2, 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Timer, 
  Zap, 
  Headphones, 
  Languages, 
  Award,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { speakChinese, sfx } from '../utils/audio';
import { storage } from '../utils/storage';

const QUIZ_MODES = [
  { id: 'hanzi_to_meaning', name: 'Chữ Hán → Nghĩa', icon: Languages, desc: 'Nhìn chữ Hán chọn nghĩa tiếng Việt' },
  { id: 'meaning_to_hanzi', name: 'Nghĩa → Chữ Hán', icon: Zap, desc: 'Nhìn nghĩa tiếng Việt chọn chữ Hán đúng' },
  { id: 'pinyin_match', name: 'Luyện Pinyin', icon: Sparkles, desc: 'Nhìn chữ Hán chọn phiên âm chuẩn' },
  { id: 'listening', name: 'Luyện Nghe phản xạ', icon: Headphones, desc: 'Nghe phát âm chọn chữ Hán' },
];

export default function QuizView({
  words,
  selectedLevel,
  onToggleStar,
  starredIds,
  onStatsUpdate
}) {
  const [mode, setMode] = useState('hanzi_to_meaning');
  const [questionCount, setQuestionCount] = useState(10);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  // Score & Streak
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState([]);

  // Timer
  const [timeLeft, setTimeLeft] = useState(12);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const timerRef = useRef(null);

  // Generate Questions for the quiz session
  const generateQuestions = useCallback(() => {
    if (!words || words.length < 4) return [];

    // Shuffle pool of words
    const shuffledPool = [...words].sort(() => Math.random() - 0.5);
    const targetWords = shuffledPool.slice(0, Math.min(questionCount, words.length));

    return targetWords.map((correctWord) => {
      // Pick 3 distractors from same level words
      const otherWords = words.filter(w => w.id !== correctWord.id);
      const distractors = [...otherWords].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctWord, ...distractors].sort(() => Math.random() - 0.5);

      return {
        word: correctWord,
        options,
      };
    });
  }, [words, questionCount]);

  const startQuiz = () => {
    const qList = generateQuestions();
    setQuestions(qList);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setWrongAnswers([]);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setIsFinished(false);
    setIsStarted(true);
    setTimeLeft(12);
    sfx.playSuccess();
  };

  const currentQ = questions[currentQuestionIndex];

  // Auto-play audio in listening mode
  useEffect(() => {
    if (isStarted && !isFinished && currentQ && mode === 'listening') {
      const timer = setTimeout(() => {
        speakChinese(currentQ.word.word);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isStarted, isFinished, mode, currentQuestionIndex]);

  // Timer effect
  useEffect(() => {
    if (!isStarted || isFinished || isAnswerChecked || !timerEnabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(12);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, isFinished, currentQuestionIndex, isAnswerChecked, timerEnabled]);

  const handleTimeOut = () => {
    setIsAnswerChecked(true);
    setSelectedAnswer('__TIMEOUT__');
    sfx.playError();
    setStreak(0);
    setWrongAnswers(prev => [...prev, {
      question: currentQ.word,
      userChoice: null,
      correctChoice: currentQ.word
    }]);
  };

  const handleSelectAnswer = (option) => {
    if (isAnswerChecked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedAnswer(option);
    setIsAnswerChecked(true);

    const isCorrect = option.id === currentQ.word.id;
    if (isCorrect) {
      sfx.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Streak multiplier bonus
      const bonus = newStreak >= 5 ? 20 : newStreak >= 3 ? 15 : 10;
      setScore(s => s + bonus);

      // Confetti burst on streak milestones
      if (newStreak === 5 || newStreak === 10) {
        sfx.playStreak();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      sfx.playError();
      setStreak(0);
      setWrongAnswers(prev => [...prev, {
        question: currentQ.word,
        userChoice: option,
        correctChoice: currentQ.word
      }]);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(i => i + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setTimeLeft(12);
    } else {
      // Finished
      setIsFinished(true);
      sfx.playStreak();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

      // Save stats
      storage.updateStats(prev => ({
        ...prev,
        quizTotalPlayed: (prev.quizTotalPlayed || 0) + 1,
        quizHighScores: {
          ...prev.quizHighScores,
          [mode]: Math.max(prev.quizHighScores?.[mode] || 0, score)
        }
      }));
      if (onStatsUpdate) onStatsUpdate();
    }
  };

  if (!isStarted || isFinished) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {!isFinished ? (
          /* Start Screen */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-3">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Đấu Trường Trắc Nghiệm HSK
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Luyện phản xạ, ghi nhớ mặt chữ, ngữ âm và nghĩa với {words.length} từ vựng {selectedLevel}
              </p>
            </div>

            {/* Mode selection cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {QUIZ_MODES.map((item) => {
                const Icon = item.icon;
                const isSelected = mode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMode(item.id);
                      sfx.playTone(400, 'sine', 0.05);
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-red-600 bg-red-50/50 dark:bg-red-950/30 ring-2 ring-red-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Config & Settings */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-6 text-sm">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Số lượng câu:</span>
                {[10, 20, 30].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => setQuestionCount(cnt)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      questionCount === cnt
                        ? 'bg-red-600 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cnt} câu
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span>Đếm ngược thời gian (12s)</span>
              </label>
            </div>

            {/* Start Button */}
            <button
              onClick={startQuiz}
              disabled={words.length < 4}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-red-500/25 active:scale-98 transition-all disabled:opacity-50"
            >
              Bắt Đầu Luyện Tập Ngay 🚀
            </button>
          </div>
        ) : (
          /* Result Screen */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center mb-3">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Hoàn Thành Bài Luyện Tập!
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Kết quả cấp độ <span className="font-bold text-red-600">{selectedLevel}</span>
              </p>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div className="text-xs text-slate-400 font-bold uppercase">Điểm số</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                  {score}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div className="text-xs text-slate-400 font-bold uppercase">Chính xác</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {Math.round(((questions.length - wrongAnswers.length) / questions.length) * 100)}%
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div className="text-xs text-slate-400 font-bold uppercase">Chuỗi đúng dài nhất</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-1 flex items-center justify-center gap-1">
                  <Flame className="w-6 h-6 fill-amber-500" />
                  <span>{maxStreak}</span>
                </div>
              </div>
            </div>

            {/* Wrong Answers Review */}
            {wrongAnswers.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-500" /> Các từ cần xem lại ({wrongAnswers.length} từ):
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {wrongAnswers.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-chinese font-bold text-slate-900 dark:text-white">
                          {item.question.word}
                        </span>
                        <div>
                          <div className="text-xs text-red-600 dark:text-red-400 font-medium">{item.question.pinyin}</div>
                          <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{item.question.meaning}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => speakChinese(item.question.word)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            onToggleStar(item.question.id);
                            sfx.playSuccess();
                          }}
                          className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 ${
                            starredIds.has(item.question.id) ? 'text-amber-500' : 'text-slate-400'
                          }`}
                          title="Lưu vào yêu thích"
                        >
                          ★
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={startQuiz}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md shadow-red-500/20"
              >
                <RotateCcw className="w-4 h-4" /> Chơi Lại Vòng Này
              </button>

              <button
                onClick={() => setIsStarted(false)}
                className="py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Chọn Chế Độ Khác
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* Gameplay Screen */
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* HUD Header */}
      <div className="flex items-center justify-between gap-4 mb-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Question Counter */}
        <div className="font-extrabold text-sm text-slate-600 dark:text-slate-300">
          Câu {currentQuestionIndex + 1} / {questions.length}
        </div>

        {/* Streak & Score */}
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 font-extrabold text-xs animate-bounce">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>Chuỗi đúng x{streak}</span>
            </div>
          )}

          <div className="text-sm font-extrabold text-red-600 dark:text-red-400">
            {score} điểm
          </div>
        </div>

        {/* Timer Bar */}
        {timerEnabled && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Timer className={`w-4 h-4 ${timeLeft <= 3 ? 'text-red-500 animate-spin' : ''}`} />
            <span className={timeLeft <= 3 ? 'text-red-500 font-black' : ''}>{timeLeft}s</span>
          </div>
        )}
      </div>

      {/* Timer Line Indicator */}
      {timerEnabled && (
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 3 ? 'bg-red-500' : 'bg-red-600'
            }`}
            style={{ width: `${(timeLeft / 12) * 100}%` }}
          />
        </div>
      )}

      {/* Question Prompt Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center shadow-md mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
          {mode === 'hanzi_to_meaning' && 'Chọn nghĩa tiếng Việt chính xác:'}
          {mode === 'meaning_to_hanzi' && 'Chọn chữ Hán tương ứng:'}
          {mode === 'pinyin_match' && 'Chọn phiên âm Pinyin đúng:'}
          {mode === 'listening' && 'Nghe phát âm và chọn chữ Hán:'}
        </span>

        {/* Question Display */}
        {mode === 'hanzi_to_meaning' && (
          <div className="my-3">
            <div className="text-6xl sm:text-7xl font-bold font-chinese text-slate-900 dark:text-white">
              {currentQ.word.word}
            </div>
            {currentQ.word.pinyin && (
              <div className="text-sm font-semibold text-red-600 dark:text-red-400 mt-2">
                {currentQ.word.pinyin}
              </div>
            )}
          </div>
        )}

        {mode === 'meaning_to_hanzi' && (
          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              "{currentQ.word.meaning}"
            </div>
          </div>
        )}

        {mode === 'pinyin_match' && (
          <div className="my-3">
            <div className="text-6xl sm:text-7xl font-bold font-chinese text-slate-900 dark:text-white">
              {currentQ.word.word}
            </div>
            <div className="text-sm text-slate-400 mt-2">
              (Nghĩa: {currentQ.word.meaning})
            </div>
          </div>
        )}

        {mode === 'listening' && (
          <div className="my-4 flex flex-col items-center">
            <button
              onClick={() => speakChinese(currentQ.word.word)}
              className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-all mb-2"
              title="Phát lại âm thanh"
            >
              <Volume2 className="w-10 h-10" />
            </button>
            <span className="text-xs font-bold text-slate-500">Chạm để nghe lại âm thanh</span>
          </div>
        )}
      </div>

      {/* Options Grid (4 Choices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {currentQ.options.map((option, idx) => {
          const isCorrect = option.id === currentQ.word.id;
          const isSelected = selectedAnswer && selectedAnswer.id === option.id;

          let btnClass = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700';

          if (isAnswerChecked) {
            if (isCorrect) {
              btnClass = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30';
            } else if (isSelected) {
              btnClass = 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30';
            } else {
              btnClass = 'opacity-40 border-slate-200 dark:border-slate-800';
            }
          }

          let labelContent = '';
          if (mode === 'hanzi_to_meaning') {
            labelContent = option.meaning;
          } else if (mode === 'meaning_to_hanzi' || mode === 'listening') {
            labelContent = option.word;
          } else if (mode === 'pinyin_match') {
            labelContent = option.pinyin || option.word;
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectAnswer(option)}
              disabled={isAnswerChecked}
              className={`p-4 rounded-2xl border-2 font-bold text-left transition-all active:scale-98 flex items-center justify-between ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className={`text-base ${(mode === 'meaning_to_hanzi' || mode === 'listening') ? 'font-chinese text-2xl' : ''}`}>
                  {labelContent}
                </span>
              </div>

              {isAnswerChecked && isCorrect && (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              {isAnswerChecked && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Feedback & Next Button */}
      {isAnswerChecked && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={handleNextQuestion}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-2xl shadow-md shadow-red-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {currentQuestionIndex + 1 < questions.length ? 'Câu Tiếp Theo →' : 'Xem Kết Quả Của Bạn 🏆'}
          </button>
        </div>
      )}
    </div>
  );
}
