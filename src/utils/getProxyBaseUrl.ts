const DEFAULT_PROXY_BASE_URL = "https://helix-keys-proxy.azurewebsites.net/api";
export function getProxyBaseUrl(): string {
    const envUrl = process.env.REACT_APP_PROXY_BASE_URL;
    const isLocal =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1");

    if (isLocal) {
        return envUrl || "http://localhost:8080";
    }

    if (envUrl && !/localhost|127\.0\.0\.1/.test(envUrl)) {
        return envUrl;
    }

    return DEFAULT_PROXY_BASE_URL;
}

export default getProxyBaseUrl;