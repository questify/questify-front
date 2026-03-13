import { getApiConfig } from "../types/api";

/**
 * Get the full URL for an avatar
 * Handles emojis, relative URLs, and absolute URLs
 * Also handles "emoji|color" format
 */
export function getAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) return '👤';

    // Handle "emoji|color" format — return just the emoji part
    if (avatarUrl.includes('|') && !avatarUrl.startsWith('http')) {
        return avatarUrl.split('|')[0];
    }

    // If it's already an absolute URL
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
    }

    // If it's a relative URL, prepend the API base URL
    if (avatarUrl.startsWith('/')) {
        const baseUrl = getApiConfig().baseUrl.replace(/\/$/, "");
        return `${baseUrl}${avatarUrl}`;
    }

    // Emoji or other string
    return avatarUrl;
}

/**
 * Extract the background color from an "emoji|color" avatar_url.
 * Returns undefined if no color is set.
 */
export function getAvatarBg(avatarUrl: string | undefined): string | undefined {
    if (!avatarUrl || avatarUrl.startsWith('http') || avatarUrl.startsWith('/')) return undefined;
    if (avatarUrl.includes('|')) return avatarUrl.split('|')[1];
    return undefined;
}

/**
 * Check if an avatar is an image URL (not an emoji)
 */
export function isAvatarImage(avatarUrl: string | undefined): boolean {
    if (!avatarUrl) return false;
    return avatarUrl.startsWith('/') || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
}
