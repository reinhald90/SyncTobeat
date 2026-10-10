/**
 * FFT radix-2 iteratif (Cooley–Tukey).
 * Input: re[] dan im[] dengan panjang n yang merupakan pangkat 2.
 * Output ditulis kembali ke array re/im (in-place).
 */
export function fft(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  if (n <= 1) return;

  // Bit reversal permutation
  let j = 0;
  for (let i = 0; i < n; i++) {
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }

  // Butterflies
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cwr = 1;
      let cwi = 0;
      for (let k = 0; k < half; k++) {
        const ar = re[i + k];
        const ai = im[i + k];
        const br = re[i + k + half];
        const bi = im[i + k + half];
        const vr = br * cwr - bi * cwi;
        const vi = br * cwi + bi * cwr;
        re[i + k] = ar + vr;
        im[i + k] = ai + vi;
        re[i + k + half] = ar - vr;
        im[i + k + half] = ai - vi;
        const nwr = cwr * wr - cwi * wi;
        const nwi = cwr * wi + cwi * wr;
        cwr = nwr;
        cwi = nwi;
      }
    }
  }
}
