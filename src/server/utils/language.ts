import i18next, { use } from "i18next";
import { LanguageDetector, handle } from "i18next-http-middleware";
import { options, translate as commonTranslate, changeLanguage as commonChangeLanguage } from "~common/utils/language";

use(LanguageDetector).init(options);

export const middleware = handle(i18next);

export function translate(...args: Parameters<typeof commonTranslate>) {
    return commonTranslate(...args);
}

export function changeLanguage(...args: Parameters<typeof commonChangeLanguage>) {
    return commonChangeLanguage(...args);
}
