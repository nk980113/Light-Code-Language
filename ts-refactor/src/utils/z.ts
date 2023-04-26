import { z } from 'zod';

export default z;

export function wrapZodError<T extends z.infer<U>, const U extends z.ZodType<any, any, any>>(validator: U, target: T, baseName: string) {
    const result = validator.safeParse(target);
    if (result.success === true) return result as {
        success: true;
        data: Required<T>;
    };

    return {
        success: false,
        errors: (result.error as z.ZodError).issues.map((issue) => `${[baseName, ...issue.path].join('.')}：${issue.message}`),
    } as const;
}
