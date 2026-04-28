import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { Id } from '../core/types/id';
import { api } from './api';

/**
 * Generic hook factory — fetch a list from `endpoint`.
 * In your app, wrap this to bind it to a specific resource:
 *
 *   export const useTasks = () => useItems<Task>('/tasks');
 */
export function useItems<T>(endpoint: string): UseQueryResult<T[]> {
  return useQuery<T[]>({
    queryKey: [endpoint],
    queryFn: () => api.get<T[]>(endpoint).then((r) => r.data),
  });
}

/**
 * Generic hook factory — fetch a single item by id from `endpoint/:id`.
 */
export function useItem<T>(endpoint: string, id: Id<string>): UseQueryResult<T> {
  return useQuery<T>({
    queryKey: [endpoint, id],
    queryFn: () => api.get<T>(`${endpoint}/${id}`).then((r) => r.data),
    enabled: Boolean(id),
  });
}

/**
 * Generic mutation hook factory — PUT/PATCH an item and invalidate the list cache.
 */
export function useUpdateItem<TInput, TOutput = TInput>(
  endpoint: string,
  getId: (input: TInput) => string,
): UseMutationResult<TOutput, Error, TInput> {
  const queryClient = useQueryClient();

  return useMutation<TOutput, Error, TInput>({
    mutationFn: (input) =>
      api.put<TOutput>(`${endpoint}/${getId(input)}`, input).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });
}
