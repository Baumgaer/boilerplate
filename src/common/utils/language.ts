import { t, changeLanguage as chLang } from "i18next";
import { merge } from "~common/utils/utils";
import type { context } from "~common/@types/Language";

const env = require.context('~env/locales', true, /[A-Za-z0-9-_,\s]+\.yml$/i);
const common = require.context('~common/locales', true, /[A-Za-z0-9-_,\s]+\.yml$/i);
const resources = {} as Record<string, Record<string, string>>;
[common, env].forEach((environment) => {
    environment.keys().forEach(key => {
        const matched = key.match(/\.\/([A-Za-z0-9-_]+)/i);
        if (matched && matched.length > 1) resources[matched[1]] = merge({ dict: environment(key).default }, resources[matched[1]] ?? {});
    });
});

export const options = {
    fallbackLng: "en-us",
    ns: "dict",
    defaultNS: "dict",
    lowerCaseLng: true,
    cleanCode: true,
    preload: Object.keys(resources),
    resources
};

export function translate(key: string, context: context): string {
    return t(key, { context: context });
}

export function changeLanguage(lng: string) {
    return chLang(lng);
}
