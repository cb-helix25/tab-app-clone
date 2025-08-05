const DEFAULT_PROXY_BASE_URL =
    "https://helix-keys-proxy.azurewebsites.net/api";

export function getProxyBaseUrl(): string {
    const envUrl = process.env.REACT_APP_PROXY_BASE_URL;
    const nodeEnv = process.env.NODE_ENV;

    // In development allow explicit overrides, otherwise fall back to the
    // remote API to avoid failed calls when the local server isn't running.
    if (nodeEnv === "development") {
        return envUrl || DEFAULT_PROXY_BASE_URL;
    }

    // In production only honor env values that aren't pointing at localhost.
    if (envUrl && !/localhost|127\.0\.0\.1/.test(envUrl)) {
        return envUrl;
    }

    // Fallback to the default production URL
    return DEFAULT_PROXY_BASE_URL;
}

export default getProxyBaseUrl;