// Pinyin and accent normalization for smart search

export function normalizePinyin(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove tone marks
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function normalizeVietnamese(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function matchesWord(wordItem, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // Direct Hanzi match
  if (wordItem.word.includes(q)) return true;

  // Pinyin exact or normalized match
  if (wordItem.pinyin.toLowerCase().includes(q)) return true;
  const normPinyin = normalizePinyin(wordItem.pinyin);
  const normQ = normalizePinyin(q);
  if (normPinyin && normQ && normPinyin.includes(normQ)) return true;

  // Meaning match (Vietnamese normalized)
  if (wordItem.meaning.toLowerCase().includes(q)) return true;
  const normMeaning = normalizeVietnamese(wordItem.meaning);
  const normVietQ = normalizeVietnamese(q);
  if (normMeaning && normVietQ && normMeaning.includes(normVietQ)) return true;

  // Han-Viet match
  if (wordItem.hanviet && wordItem.hanviet.toLowerCase().includes(q)) return true;

  // Example match
  if (wordItem.example && wordItem.example.includes(q)) return true;

  return false;
}
