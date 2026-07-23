import { overwriteGetLocale, getLocale, setLocale as paraglideSetLocale } from "$lib/paraglide/runtime.js";

type Locale = "en" | "fr" | "zh-CN";

/**
 * Reactive bridge between paraglide's plain-JS locale and Svelte 5 runes.
 *
 * Overrides paraglide's `getLocale()` so that every `m.*()` call across
 * the entire component tree reads from a Svelte `$state` — making it
 * automatically reactive.
 *
 * Usage:
 *   import { setReactiveLocale } from "$lib/hooks/locale.svelte";
 *   setReactiveLocale("fr");  // updates locale + triggers re-render everywhere
 */

let _locale: Locale = $state(getLocale());

// Replace paraglide's getLocale with our reactive version so every
// m.someMessage() call in every component becomes a reactive dependency.
overwriteGetLocale(() => _locale);

/** Returns the current locale as a Svelte-reactive value. */
export function getReactiveLocale(): Locale {
    return _locale;
}

/**
 * Update the locale via paraglide AND bump the Svelte reactive signal,
 * so all components re-render with the new translations.
 */
export function setReactiveLocale(newLang: Locale): void {
    if (newLang === _locale) return;
    paraglideSetLocale(newLang, { reload: false });
    _locale = newLang;
}
