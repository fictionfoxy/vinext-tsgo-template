import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutosave } from '../useAutosave';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useAutosave', () => {
  it('calls onSave after the delay when dirty and valid', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderHook(() =>
      useAutosave({ values: { name: 'Alice' }, isDirty: true, isValid: true, onSave, delay: 300 }),
    );

    expect(onSave).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({ name: 'Alice' });
  });

  it('does not call onSave when form is not dirty', async () => {
    const onSave = vi.fn();
    renderHook(() =>
      useAutosave({ values: { name: 'Alice' }, isDirty: false, isValid: true, onSave }),
    );
    await vi.runAllTimersAsync();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('does not call onSave when form is not valid', async () => {
    const onSave = vi.fn();
    renderHook(() =>
      useAutosave({ values: { name: '' }, isDirty: true, isValid: false, onSave }),
    );
    await vi.runAllTimersAsync();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('debounces: cancels previous timer when values change', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender } = renderHook(
      ({ values }: { values: { name: string } }) =>
        useAutosave({ values, isDirty: true, isValid: true, onSave, delay: 500 }),
      { initialProps: { values: { name: 'A' } } },
    );

    await vi.advanceTimersByTimeAsync(200);
    rerender({ values: { name: 'AB' } });
    await vi.advanceTimersByTimeAsync(200);
    expect(onSave).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(400);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({ name: 'AB' });
  });
});
