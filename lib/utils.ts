// 만난 날로부터 며칠이 지났는지(만난 날 1일 기준) 계산
export function getDdayCount(anniversaryDate: string): number {
  if (!anniversaryDate) return 0;
  const start = new Date(anniversaryDate);
  const now = new Date();
  
  // 시/분/초 제거하여 날짜만 비교
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // 만난 당일을 1일로 치기 때문에 + 1
  return diffDays >= 0 ? diffDays + 1 : diffDays;
}
