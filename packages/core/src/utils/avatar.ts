import { getApiConfig } from "../types/api";

/**
 * Get the full URL for an avatar
 * Handles emojis, relative URLs, and absolute URLs
 */
export function getAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) return '👤';

    // If it's an emoji (single character or common emoji patterns)
    if (avatarUrl.length <= 2 || /^[\u{1F300}-\u{1F9FF}]$/u.test(avatarUrl)) {
        return avatarUrl;
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

    // Default: return as-is
    return avatarUrl;
}

/**
 * Check if an avatar is an image URL (not an emoji)
 */
export function isAvatarImage(avatarUrl: string | undefined): boolean {
    if (!avatarUrl) return false;
    return avatarUrl.startsWith('/') || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
}
