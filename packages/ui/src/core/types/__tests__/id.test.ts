import { describe, expect, it } from 'vitest';
import { createId, isSameId } from '../id';

describe('createId', () => {
  it('returns the same string value at runtime', () => {
    const id = createId<'User'>('usr_123');
    expect(id).toBe('usr_123');
  });

  it('returns a string type', () => {
    const id = createId<'Project'>('prj_456');
    expect(typeof id).toBe('string');
  });
});

describe('isSameId', () => {
  it('returns true for identical ids', () => {
    const a = createId<'Task'>('task_1');
    const b = createId<'Task'>('task_1');
    expect(isSameId(a, b)).toBe(true);
  });

  it('returns false for different ids of the same brand', () => {
    const a = createId<'Task'>('task_1');
    const b = createId<'Task'>('task_2');
    expect(isSameId(a, b)).toBe(false);
  });
});
