import React, { useState, useRef } from 'react';
import { 
  Award, 
  Star, 
  CheckCircle2, 
  Flame, 
  Gamepad2, 
  Keyboard, 
  Download, 
  Upload, 
  Trash2, 
  Volume2, 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { storage } from '../utils/storage';
import { speakChinese, sfx } from '../utils/audio';

export default function ProgressView({
  summary,
  allWords,
  starredIds,
  onToggleStar,
  learnedIds,
  onToggleLearned,
  onStartFlashcard,
  onDataReset
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'starred'
  const fileInputRef = useRef(null);
  const stats = storage.getStats();

  // Calculate statistics per level
  const levelStats = React.useMemo(() => {
    if (!allWords || !summary || !summary.levels) return [];
    return Object.keys(summary.levels).map(lvlKey => {
      const lvlInfo = summary.levels[lvlKey];
      const levelWords = allWords.filter(w => w.level === lvlKey);
      const learnedInLevel = levelWords.filter(w => learnedIds.has(w.id)).length;
      const totalInLevel = lvlInfo.count;
      const percent = totalInLevel > 0 ? Math.round((learnedInLevel / totalInLevel) * 100) : 0;

      return {
        key: lvlKey,
        name: lvlKey,
        total: totalInLevel,
        learned: learnedInLevel,
        percent,
      };
    });
  }, [allWords, summary, learnedIds]);

  const starredWordsList = React.useMemo(() => {
    if (!allWords) return [];
    return allWords.filter(w => starredIds.has(w.id));
  }, [allWords, starredIds]);

  // Handle Export
  const handleExport = () => {
    const backupJson = storage.exportBackup();
    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `china_app_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sfx.playSuccess();
  };

  // Handle Import
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const ok = storage.importBackup(content);
        if (ok) {
          sfx.playSuccess();
          alert('Đã cập nhật lại kết quả học tập của bạn thành công!');
          window.location.reload();
        } else {
          sfx.playError();
          alert('Tệp bạn chọn không đúng định dạng rồi!');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa hết kết quả đã học để bắt đầu lại từ đầu không?')) {
      storage.clearAll();
      sfx.playTone(200, 'sawtooth', 0.2);
      if (onDataReset) onDataReset();
      window.location.reload();
    }
  };

  const totalWordsCount = allWords?.length || 5002;
  const totalLearnedCount = learnedIds.size;
  const overallPercent = Math.round((totalLearnedCount / totalWordsCount) * 100);

  return (
    <div className="max-w-5xl mx-auto px-3 py-3 sm:px-4 sm:py-6">
      {/* View Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Kết quả học
          </button>
          <button
            onClick={() => setActiveTab('starred')}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'starred'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
            <span>Sổ tay ({starredWordsList.length})</span>
          </button>
        </div>

        {/* Data buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            title="Tải kết quả học tập về máy để lưu giữ"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Lưu về máy</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Mở lại file kết quả học đã lưu"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Mở lại</span>
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Top Big Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Từ đã thuộc</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {totalLearnedCount}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 mt-1">
                {overallPercent}% trên 5.002 từ HSK
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Từ đã lưu ⭐</span>
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {starredIds.size}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 mt-1">
                Lưu vào sổ tay cá nhân
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Lượt trắc nghiệm</span>
                <Gamepad2 className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.quizTotalPlayed || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Kỷ lục: {Math.max(...Object.values(stats.quizHighScores || { a: 0 }))} điểm
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Từ đã gõ đúng</span>
                <Keyboard className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.typingWordsCount || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Luyện phản xạ gõ phím
              </div>
            </div>
          </div>

          {/* Level Progress Cards */}
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-red-600" /> Tiến độ theo từng cấp độ HSK 1 - 6
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {levelStats.map((item) => (
              <div
                key={item.key}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                      {item.total} từ vựng
                    </span>
                  </div>

                  <span className="text-sm font-black text-red-600 dark:text-red-400">
                    {item.percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Đã thuộc: <strong className="text-slate-700 dark:text-slate-200">{item.learned}</strong> / {item.total}</span>
                  <button
                    onClick={() => onStartFlashcard(item.key)}
                    className="text-red-600 dark:text-red-400 font-bold hover:underline flex items-center gap-1"
                  >
                    Luyện thẻ {item.name} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div className="p-4 rounded-2xl border border-red-200 dark:border-red-950/60 bg-red-50/50 dark:bg-red-950/20 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-red-800 dark:text-red-400">
                Làm mới lại tiến độ học tập
              </div>
              <div className="text-[11px] text-red-600/80 dark:text-red-400/70">
                Xóa các từ đã thuộc và điểm số để bắt đầu học lại từ đầu.
              </div>
            </div>
            <button
              onClick={handleClearAll}
              className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Học lại từ đầu
            </button>
          </div>
        </>
      ) : (
        /* Starred Words List */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              Sổ tay từ vựng yêu thích ({starredWordsList.length})
            </h3>
          </div>

          {starredWordsList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Bạn chưa gắn sao từ nào. Hãy bấm biểu tượng ngôi sao ★ ở Flashcard hoặc Từ điển để thêm từ vào sổ tay!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {starredWordsList.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-chinese font-bold text-slate-900 dark:text-white">
                      {item.word}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400">{item.pinyin}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">{item.level}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">{item.meaning}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakChinese(item.word)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onToggleStar(item.id);
                        sfx.playTone(300, 'sine', 0.05);
                      }}
                      className="p-2 rounded-lg text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Bỏ gắn sao"
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
