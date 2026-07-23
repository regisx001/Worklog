import { getReactiveLocale } from "$lib/hooks/locale.svelte";

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions): string {
    return date.toLocaleDateString(getReactiveLocale(), options);
}

export function formatDateTime(date: Date, options?: Intl.DateTimeFormatOptions): string {
    return date.toLocaleString(getReactiveLocale(), options);
}

