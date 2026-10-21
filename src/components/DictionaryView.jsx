import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Volume2, 
  Star, 
  X, 
  Filter, 
  BookOpen, 
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { speakChinese, sfx } from '../utils/audio';
import { matchesWord } from '../utils/pinyinUtils';

const LEVEL_COLORS = {
  HSK1: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
  HSK2: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800',
  HSK3: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-300 dark:border-amber-800',
  HSK4: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-300 dark:border-purple-800',
  HSK5: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800',
  HSK6: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-300 dark:border-rose-800',
};

export default function DictionaryView({
  allWords,
  starredIds,
  onToggleStar,
  learnedIds,
  onToggleLearned
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [selectedWord, setSelectedWord] = useState(null);
  const [pageSize, setPageSize] = useState(40);

  // Filtered list
  const filteredWords = useMemo(() => {
    if (!allWords) return [];
    return allWords.filter(item => {
      if (levelFilter !== 'ALL' && item.level !== levelFilter) return false;
      if (searchQuery.trim() && !matchesWord(item, searchQuery)) return false;
      return true;
    });
  }, [allWords, searchQuery, levelFilter]);

  const displayedList = useMemo(() => {
    return filteredWords.slice(0, pageSize);
  }, [filteredWords, pageSize]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs mb-6">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
          Tra Cứu Từ Vựng HSK (5.000 từ)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-4">
          Tìm kiếm nhanh bằng chữ Hán, Pinyin (gõ có dấu hoặc không dấu như "nihao"), nghĩa tiếng Việt hoặc âm Hán-Việt.
        </p>

        {/* Search Input Bar */}
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPageSize(40);
            }}
            placeholder="Nhập chữ Hán (爱), pinyin (ai / ài), nghĩa (yêu)..."
            className="w-full py-3.5 pl-11 pr-10 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:border-red-600 focus:ring-2 focus:ring-red-500/20 text-slate-900 dark:text-white text-base outline-none transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Level Filter Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc cấp độ:
          </span>
          {['ALL', 'HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(lvl => (
            <button
              key={lvl}
              onClick={() => {
                setLevelFilter(lvl);
                setPageSize(40);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                levelFilter === lvl
                  ? 'bg-red-600 text-white border-red-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              {lvl === 'ALL' ? 'Tất cả' : lvl}
            </button>
          ))}
          <span className="text-xs text-slate-400 ml-auto font-medium">
            Tìm thấy {filteredWords.length} từ
          </span>
        </div>
      </div>

      {/* Words Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayedList.map(item => {
          const isStarred = starredIds.has(item.id);
          const isLearned = learnedIds.has(item.id);
          const lvlColor = LEVEL_COLORS[item.level] || 'bg-slate-100 text-slate-700';

          return (
            <div
              key={item.id}
              onClick={() => setSelectedWord(item)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-600 rounded-2xl p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-chinese font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">
                      {item.word}
                    </span>
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {item.pinyin}
                    </span>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${lvlColor}`}>
                    {item.level}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">
                  {item.meaning}
                </p>

                {item.hanviet && (
                  <span className="inline-block mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    [{item.hanviet}]
                  </span>
                )}
              </div>

              {/* Action row */}
              <div 
                className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => speakChinese(item.word)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Phát âm"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      onToggleStar(item.id);
                      sfx.playSuccess();
                    }}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      isStarred ? 'text-amber-400' : 'text-slate-400'
                    }`}
                    title="Lưu yêu thích"
                  >
                    <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      onToggleLearned(item.id);
                      sfx.playSuccess();
                    }}
                    className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                      isLearned ? 'text-emerald-500' : 'text-slate-400'
                    }`}
                    title="Đánh dấu đã thuộc"
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isLearned ? 'fill-emerald-500 text-white dark:text-slate-900' : ''}`} />
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  Xem ví dụ →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {displayedList.length < filteredWords.length && (
        <div className="text-center mt-6">
          <button
            onClick={() => setPageSize(prev => prev + 50)}
            className="py-3 px-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 shadow-xs transition-colors inline-flex items-center gap-2"
          >
            <span>Xem thêm ({filteredWords.length - displayedList.length} từ nữa)</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Word Detail Modal */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedWord(null)}
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${LEVEL_COLORS[selectedWord.level]}`}>
                {selectedWord.level}
              </span>
              {selectedWord.hanviet && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                  Hán-Việt: {selectedWord.hanviet}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-5xl font-chinese font-bold text-slate-900 dark:text-white">
                  {selectedWord.word}
                </h3>
                <div className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                  {selectedWord.pinyin}
                </div>
              </div>

              <button
                onClick={() => speakChinese(selectedWord.word)}
                className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                title="Nghe phát âm"
              >
                <Volume2 className="w-7 h-7" />
              </button>
            </div>

            <div className="mb-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ý nghĩa từ vựng
              </div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedWord.meaning}
              </div>
            </div>

            {/* Example sentence */}
            {selectedWord.example && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 mb-6">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Câu ví dụ thực tế
                  </span>
                  <button
                    onClick={() => speakChinese(selectedWord.example)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-200 transition-colors"
                    title="Nghe câu ví dụ"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-lg font-chinese font-semibold text-slate-900 dark:text-white">
                  {selectedWord.example}
                </div>
                {selectedWord.example_trans && (
                  <div className="text-sm text-slate-600 dark:text-slate-300 mt-1 italic">
                    {selectedWord.example_trans}
                  </div>
                )}
              </div>
            )}

            {/* Modal actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onToggleStar(selectedWord.id);
                  sfx.playSuccess();
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Star className={`w-4 h-4 ${starredIds.has(selectedWord.id) ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{starredIds.has(selectedWord.id) ? 'Đã lưu yêu thích' : 'Lưu vào sổ tay'}</span>
              </button>

              <button
                onClick={() => {
                  onToggleLearned(selectedWord.id);
                  sfx.playSuccess();
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                  learnedIds.has(selectedWord.id)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{learnedIds.has(selectedWord.id) ? 'Đã thuộc từ này' : 'Đánh dấu đã thuộc'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
