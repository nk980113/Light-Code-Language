import i18next from 'i18next';
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';
import translation from 'zod-i18n-map/locales/zh-TW/zod.json';

i18next.init({
    lng: 'zh-TW',
    resources: {
        'zh-TW': { zod: translation },
    },
});

z.setErrorMap(zodI18nMap);

export default z;

export function wrapZodError<T extends z.infer<U>, const U extends z.ZodType<any, any, any>>(validator: U, target: T, baseName: string) {
    const result = validator.safeParse(target);
    if (result.success) return result as {
        success: true;
        data: Required<T>;
    };

    return {
        success: false,
        // @ts-ignore
        errors: (result.error as z.ZodError).issues.map((issue) => `${[baseName, ...issue.path].join('.')}：${issue.message}`),
    } as const;
}
