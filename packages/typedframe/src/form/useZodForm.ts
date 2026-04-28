import { useForm } from '@mantine/form';
import type { UseFormReturnType } from '@mantine/form';
import type { ZodSchema } from 'zod';

/**
 * Thin bridge between @mantine/form and a Zod schema.
 * Zod is the single source of truth for validation rules.
 */
export function useZodForm<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  initialValues: T,
): UseFormReturnType<T> {
  return useForm<T>({
    initialValues,
    validate: (values) => {
      const result = schema.safeParse(values);
      if (result.success) return {};

      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (key) errors[key] = issue.message;
      }
      return errors;
    },
  });
}
