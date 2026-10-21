// Local storage management for learned words, bookmarks and stats

const STORAGE_KEY_STARRED = 'china_app_starred';
const STORAGE_KEY_LEARNED = 'china_app_learned';
const STORAGE_KEY_REVIEW = 'china_app_review';
const STORAGE_KEY_STATS = 'china_app_stats';

export const storage = {
  getStarred() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STARRED);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  },

  setStarred(starredSet) {
    try {
      localStorage.setItem(STORAGE_KEY_STARRED, JSON.stringify(Array.from(starredSet)));
    } catch (e) {
      console.error(e);
    }
  },

  toggleStarred(id) {
    const set = this.getStarred();
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.setStarred(set);
    return set.has(id);
  },

  getLearned() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEARNED);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  },

  setLearned(learnedSet) {
    try {
      localStorage.setItem(STORAGE_KEY_LEARNED, JSON.stringify(Array.from(learnedSet)));
    } catch (e) {
      console.error(e);
    }
  },

  toggleLearned(id) {
    const set = this.getLearned();
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    this.setLearned(set);
    return set.has(id);
  },

  getReviewList() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REVIEW);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  },

  toggleReview(id) {
    const set = this.getReviewList();
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    try {
      localStorage.setItem(STORAGE_KEY_REVIEW, JSON.stringify(Array.from(set)));
    } catch (e) {}
    return set.has(id);
  },

  getStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      return data
        ? JSON.parse(data)
        : {
            quizHighScores: { meaning: 0, pinyin: 0, listening: 0 },
            quizTotalPlayed: 0,
            typingWordsCount: 0,
            typingAccuracyAvg: 100,
            cardsReviewed: 0,
          };
    } catch {
      return {
        quizHighScores: { meaning: 0, pinyin: 0, listening: 0 },
        quizTotalPlayed: 0,
        typingWordsCount: 0,
        typingAccuracyAvg: 100,
        cardsReviewed: 0,
      };
    }
  },

  updateStats(updater) {
    try {
      const current = this.getStats();
      const updated = updater(current);
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error(e);
    }
  },

  exportBackup() {
    return JSON.stringify({
      version: 1,
      date: new Date().toISOString(),
      starred: Array.from(this.getStarred()),
      learned: Array.from(this.getLearned()),
      review: Array.from(this.getReviewList()),
      stats: this.getStats(),
    }, null, 2);
  },

  importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.starred) this.setStarred(new Set(data.starred));
      if (data.learned) this.setLearned(new Set(data.learned));
      if (data.review) localStorage.setItem(STORAGE_KEY_REVIEW, JSON.stringify(data.review));
      if (data.stats) localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(data.stats));
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  clearAll() {
    localStorage.removeItem(STORAGE_KEY_STARRED);
    localStorage.removeItem(STORAGE_KEY_LEARNED);
    localStorage.removeItem(STORAGE_KEY_REVIEW);
    localStorage.removeItem(STORAGE_KEY_STATS);
  }
};
