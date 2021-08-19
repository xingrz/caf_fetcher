export default function schedule(callback: () => void, delay: number): void {
  process.nextTick(callback);
  setInterval(callback, delay);
}
