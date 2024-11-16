export const arrayEquals = (a, b) => {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
  };
  
export const secondsToTime = (e) => {
  const m = Math.floor(e % 3600 / 60).toString().padStart(2, '0');
  const s = Math.floor(e % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};