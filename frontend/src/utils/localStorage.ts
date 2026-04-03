export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.error('localStorage quota exceeded');
      return false;
    }
    return false;
  }
}

export function getLocalStorageSizeKB(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length || 0) + key.length;
    }
  }
  return Math.round(total / 1024);
}
