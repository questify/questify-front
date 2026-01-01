export interface TokenStorage {
    getToken(): Promise<string | null>;
    setToken(token: string): Promise<void>;
    clearToken(): Promise<void>;
}

let storage: TokenStorage | null = null;

export function setTokenStorage(s: TokenStorage) {
    storage = s;
}

export async function getToken() {
    if (!storage) return null;
    return storage.getToken();
}

export async function setToken(token: string) {
    if (!storage) throw new Error("Token storage not set");
    await storage.setToken(token);
}

export async function clearToken() {
    if (!storage) return;
    await storage.clearToken();
}