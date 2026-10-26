import { useMemo } from 'react';
import { View } from 'react-native';

const N = 21;

/** A decorative check-in code: real finder squares, deterministic filler. Not scannable in the demo. */
export function QrCode({ seed = 7, cell = 4, color = '#15171A' }: { seed?: number; cell?: number; color?: string }) {
  const cells = useMemo(() => {
    const out: boolean[] = [];
    const finder = (r: number, c: number) => {
      for (const [r0, c0] of [
        [0, 0],
        [0, N - 7],
        [N - 7, 0],
      ]) {
        if (r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7) {
          const rr = r - r0;
          const cc = c - c0;
          return rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) ? 1 : 0;
        }
      }
      return -1;
    };
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const f = finder(r, c);
        if (f !== -1) out.push(f === 1);
        else if ((r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8)) out.push(false);
        else if (r === 6 || c === 6) out.push((r + c) % 2 === 0);
        else out.push((r * 7 + c * 13 + r * c * seed) % 5 < 2);
      }
    }
    return out;
  }, [seed]);

  return (
    <View style={{ width: N * cell, height: N * cell, flexDirection: 'row', flexWrap: 'wrap', direction: 'ltr' }}>
      {cells.map((on, i) => (
        <View key={i} style={{ width: cell, height: cell, backgroundColor: on ? color : 'transparent' }} />
      ))}
    </View>
  );
}
