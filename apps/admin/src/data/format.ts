/** The hour as a decimal, e.g. 14.5 for half past two; the views place things on the day with it. */
export function hourOf(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}
