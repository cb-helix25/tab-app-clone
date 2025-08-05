import { getProxyBaseUrl } from "../getProxyBaseUrl";

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

    it("falls back to origin when env url is localhost in production", () => {
        process.env.REACT_APP_PROXY_BASE_URL = "http://localhost:8080";
        setWindow("example.com", "https://example.com");
        expect(getProxyBaseUrl()).toBe("https://example.com");
    });

    it("uses env url when non-local in production", () => {
        process.env.REACT_APP_PROXY_BASE_URL = "https://api.example.com";
        setWindow("example.com", "https://example.com");
        expect(getProxyBaseUrl()).toBe("https://api.example.com");
    });
});
