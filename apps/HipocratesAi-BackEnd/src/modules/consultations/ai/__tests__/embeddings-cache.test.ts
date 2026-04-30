import { EmbeddingsCache } from '../embeddings-cache';

describe('EmbeddingsCache', () => {
  it('get returns undefined for missing keys and roundtrips set values', () => {
    const cache = new EmbeddingsCache(10);
    expect(cache.get('hello')).toBeUndefined();
    cache.set('hello', [0.1, 0.2, 0.3]);
    expect(cache.get('hello')).toEqual([0.1, 0.2, 0.3]);
    // Normalization: trim + lowercase
    expect(cache.get('  HELLO  ')).toEqual([0.1, 0.2, 0.3]);
    expect(cache.size()).toBe(1);
  });

  it('evicts least-recently-used entries past max size', () => {
    const cache = new EmbeddingsCache(3);
    cache.set('a', [1]);
    cache.set('b', [2]);
    cache.set('c', [3]);
    // Access 'a' so it becomes most recent; 'b' is now LRU
    cache.get('a');
    cache.set('d', [4]);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toEqual([1]);
    expect(cache.get('c')).toEqual([3]);
    expect(cache.get('d')).toEqual([4]);
  });

  it('respects size limit on overflow', () => {
    const cache = new EmbeddingsCache(2);
    cache.set('a', [1]);
    cache.set('b', [2]);
    cache.set('c', [3]);
    expect(cache.size()).toBe(2);
  });

  it('clear empties the cache', () => {
    const cache = new EmbeddingsCache(5);
    cache.set('a', [1]);
    cache.set('b', [2]);
    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get('a')).toBeUndefined();
  });
});
