
export function getMoodLabel(mood: number): string {
  if (mood <= 20) return 'B. niski'
  if (mood <= 40) return 'Niski'
  if (mood <= 60) return 'Neutralny'
  if (mood <= 80) return 'Wysoki'
  return 'B. wysoki'
}

export function getMoodEmoji(mood: number): string {
  if (mood <= 20) return '😔'
  if (mood <= 40) return '😐'
  if (mood <= 60) return '🙂'
  if (mood <= 80) return '😊'
  return '🤩'
}

export function getMoodDescription(mood: number): string {
  if (mood <= 20) return 'Potrzebujesz wsparcia i troski'
  if (mood <= 40) return 'Czas na łagodną opiekę nad sobą'
  if (mood <= 60) return 'Równowaga i spokój'
  if (mood <= 80) return 'Energia i radość'
  return 'Pełnia szczęścia i spełnienia'
}

export function getMoodColor(value: number): string {
  if (value <= 20) return 'rgba(75, 85, 99, 0.8)'
  if (value <= 40) return 'rgba(59, 130, 246, 0.9)'
  if (value <= 60) return 'rgba(100, 130, 220, 0.9)'
  if (value <= 80) return 'rgba(168, 85, 230, 0.9)'
  return 'rgba(156, 39, 176, 1)'
}