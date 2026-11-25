// A small seeded random generator (mulberry32), so a ?seed=N run of the game
// always deals the same orders and the screenshots are reproducible.
export function createRandom(seed) {
  let state = seed >>> 0;
  return {
    next() {
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range(min, max) {
      return min + this.next() * (max - min);
    },
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    },
    /** Weighted pick from a list of {weight} entries. */
    weighted(list) {
      let total = 0;
      for (const item of list) total += item.weight;
      let roll = this.next() * total;
      for (const item of list) {
        roll -= item.weight;
        if (roll <= 0) return item;
      }
      return list[list.length - 1];
    },
  };
}
