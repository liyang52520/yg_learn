export function calculateSM2(
  currentEase: number,
  currentInterval: number,
  currentRepetitions: number,
  score: number
): { ease: number; interval: number; repetitions: number; nextReviewDate: Date } {
  let ease = currentEase;
  let interval: number;
  let repetitions = currentRepetitions;

  if (score <= 2) {
    repetitions = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (score === 3) {
    repetitions += 1;
    interval = calculateInterval(repetitions, currentInterval, ease);
    ease = Math.max(1.3, ease - 0.15);
  } else if (score === 4) {
    repetitions += 1;
    interval = calculateInterval(repetitions, currentInterval, ease);
  } else {
    repetitions += 1;
    interval = calculateInterval(repetitions, currentInterval, ease);
    ease = ease + 0.1;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return { ease, interval, repetitions, nextReviewDate };
}

function calculateInterval(repetitions: number, _currentInterval: number, ease: number): number {
  if (repetitions === 1) return 1;
  if (repetitions === 2) return 6;
  return Math.round((_currentInterval || 1) * ease);
}
