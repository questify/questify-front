import { getApiConfig } from "../types/api";

const SVG_AVATAR_IDS = ['fox','star','cat','rabbit','panda','bear','owl','smiley','robot','heart','leaf','cactus'] as const;

/**
 * Get the display URL / value for an avatar.
 * Handles:
 *  - "svg:fox"       → "/avatars/fox.svg"  (Questify SVG kit)
 *  - "emoji|color"   → emoji string
 *  - "/uploads/..."  → full API URL
 *  - "http..."       → unchanged
 *  - emoji string    → unchanged
 */
export function getAvatarUrl(avatarUrl: string | undefined): string {
    if (!avatarUrl) return '👤';

    // Handle "svg:fox" format — SVG kit avatar
    if (avatarUrl.startsWith('svg:')) {
        const id = avatarUrl.slice(4);
        return `/avatars/${id}.svg`;
    }

    // Handle legacy path format "/avatars/fox.svg" — serve directly from Vite public/
    if (/^\/avatars\/[a-z]+\.svg$/.test(avatarUrl)) {
        return avatarUrl;
    }

    // Handle "emoji|color" format — return just the emoji part
    if (avatarUrl.includes('|') && !avatarUrl.startsWith('http')) {
        return avatarUrl.split('|')[0];
    }

    // If it's already an absolute URL
    if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
        return avatarUrl;
    }

    // If it's a relative URL (/uploads/...), prepend the API base URL
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
    if (!avatarUrl || avatarUrl.startsWith('http') || avatarUrl.startsWith('/') || avatarUrl.startsWith('svg:')) return undefined;
    if (avatarUrl.includes('|')) return avatarUrl.split('|')[1];
    return undefined;
}

/**
 * Check if an avatar value is a served image (upload URL).
 * Returns false for SVG kit avatars — those are handled separately via <img>.
 */
export function isAvatarImage(avatarUrl: string | undefined): boolean {
    if (!avatarUrl) return false;
    if (avatarUrl.startsWith('svg:')) return false; // SVG kit — use <img src="/avatars/id.svg">
    if (/^\/avatars\/[a-z]+\.svg$/.test(avatarUrl)) return false; // legacy path — also SVG kit
    return avatarUrl.startsWith('/uploads') || avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://');
}

/**
 * Check if an avatar is from the Questify SVG kit.
 * Handles: "svg:fox" (canonical), "/avatars/fox.svg" (legacy path), bare "fox" id.
 */
export function isSvgKitAvatar(avatarUrl: string | undefined): boolean {
    if (!avatarUrl) return false;
    if (avatarUrl.startsWith('svg:')) return true;
    // Legacy path format "/avatars/fox.svg"
    const pathMatch = avatarUrl.match(/^\/avatars\/([a-z]+)\.svg$/);
    if (pathMatch) return (SVG_AVATAR_IDS as readonly string[]).includes(pathMatch[1]);
    // Bare id "fox"
    return (SVG_AVATAR_IDS as readonly string[]).includes(avatarUrl);
}
