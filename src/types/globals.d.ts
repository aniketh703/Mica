declare namespace JSX {
  type Element = import('react').ReactElement;
}

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect<T = unknown>(
  actual: T,
): {
  toBe(expected: T): void;
  toEqual(expected: unknown): void;
  toHaveLength(expected: number): void;
};
