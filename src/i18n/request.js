import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const LOCALES = ["en", "bn"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * next-intl without locale routing: URLs stay the same and the language comes
 * from a cookie the switcher sets. Only UI text is translated — doctor bios,
 * hospital names and other user-entered data stay as entered.
 */
export default getRequestConfig(async () => {
    const store = await cookies();
    const requested = store.get(LOCALE_COOKIE)?.value;
    const locale = LOCALES.includes(requested) ? requested : DEFAULT_LOCALE;
    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
        timeZone: "Asia/Dhaka",
    };
});
