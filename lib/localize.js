export function localizedField(record, field, language = 'th') {
  if (!record) return '';
  const suffix = language === 'en' ? 'EN' : 'TH';
  const localized = record[`${field}_${suffix}`];
  if (localized !== undefined && String(localized).trim() !== '') return localized;
  return record[field] ?? '';
}

export function pick(language, th, en) {
  return language === 'en' ? en : th;
}
