import { init } from 'i18next';
import { options, translate as commonTranslate, changeLanguage as commonChangeLanguage } from "~common/utils/language";

options.lng = navigator.language;
init(options);

export function translate(...args: Parameters<typeof commonTranslate>) {
    return commonTranslate(...args);
}

export function changeLanguage(...args: Parameters<typeof commonChangeLanguage>) {
    return commonChangeLanguage(...args);
}
