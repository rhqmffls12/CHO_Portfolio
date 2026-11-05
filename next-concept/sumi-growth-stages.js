export const COLLECTION_GOAL = 20;

export const GROWTH_LABELS = [
  '성장 전', '작은 잎 하나', '작은 잎 두 개', '큰 잎과 작은 잎', '두 잎 새싹',
  '세 잎 새싹', '네 잎 새싹', '작은 봉오리', '큰 봉오리', '피어나는 꽃',
  '활짝 핀 꽃', '풍성한 잎', '곁가지 봉오리', '꽃 두 송이', '꽃 세 송이',
  '작은 관목', '어린 묘목', '작은 나무', '풍성한 나무', '꽃나무', '활짝 자란 꽃나무',
];

export function growthProgress(total) {
  const seeds = Math.max(0, Math.floor(Number(total) || 0));
  const stage = seeds ? (seeds - 1) % COLLECTION_GOAL + 1 : 0;
  return { total: seeds, stage, cycle: seeds ? Math.floor((seeds - 1) / COLLECTION_GOAL) + 1 : 1,
    tier: Math.min(2, Math.floor(seeds / 10)), label: GROWTH_LABELS[stage] };
}
