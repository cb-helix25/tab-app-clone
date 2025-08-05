import { getProxyBaseUrl } from "../getProxyBaseUrl";

const DEFAULT_PROXY_BASE_URL = "https://helix-keys-proxy.azurewebsites.net/api";

describe("getProxyBaseUrl", () => {
    const originalEnv = process.env.REACT_APP_PROXY_BASE_URL;

    afterEach(() => {
        process.env.REACT_APP_PROXY_BASE_URL = originalEnv;
        delete (global as any).window;
    });

    const setWindow = (hostname: string, origin: string) => {
        (global as any).window = { location: { hostname, origin } } as any;
    };

    it("uses env url in local development", () => {
        process.env.REACT_APP_PROXY_BASE_URL = "http://localhost:8080";
        setWindow("localhost", "http://localhost");
        expect(getProxyBaseUrl()).toBe("http://localhost:8080");
    });

    it("falls back to default api url when env url is localhost in production", () => {
        process.env.REACT_APP_PROXY_BASE_URL = "http://localhost:8080";
        setWindow("example.com", "https://example.com");
        expect(getProxyBaseUrl()).toBe(DEFAULT_PROXY_BASE_URL);
    });

    it("uses env url when non-local in production", () => {
        process.env.REACT_APP_PROXY_BASE_URL = "https://api.example.com";
        setWindow("example.com", "https://example.com");
        expect(getProxyBaseUrl()).toBe("https://api.example.com");
    });
});
