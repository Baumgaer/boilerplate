import { use } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { options, translate as commonTranslate, changeLanguage as commonChangeLanguage } from "~common/utils/language";

use(LanguageDetector).init(options);

export function translate(...args: Parameters<typeof commonTranslate>) {
    return commonTranslate(...args);
}

export function changeLanguage(...args: Parameters<typeof commonChangeLanguage>) {
    return commonChangeLanguage(...args);
}
