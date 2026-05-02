export type Id<T extends string> = string & { readonly __brand: T };

export function createId<T extends string>(value: string): Id<T> {
  return value as Id<T>;
}

export function isSameId<T extends string>(a: Id<T>, b: Id<T>): boolean {
  return a === b;
}
