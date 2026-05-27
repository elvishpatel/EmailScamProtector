/**
 * Creates a debounced version of a function that delays execution until
 * after `ms` milliseconds have elapsed since the last invocation.
 * Useful for rate-limiting expensive operations like email analysis
 * triggered by rapid DOM mutations.
 *
 * @typeParam T - The function type to debounce
 * @param fn - The function to debounce
 * @param ms - The debounce delay in milliseconds
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number,
): T {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = undefined;
      fn(...args);
    }, ms);
  };

  return debounced as unknown as T;
}
