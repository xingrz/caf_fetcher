module.exports = function schedule(callback, delay) {
  process.nextTick(callback);
  setInterval(callback, delay);
}
