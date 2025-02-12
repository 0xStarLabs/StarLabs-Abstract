import axios, {
    AxiosInstance,
    AxiosResponse,
    AxiosHeaderValue,
    HeadersDefaults,
    RawAxiosRequestHeaders,
} from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { generateCsrfToken } from "./random.js";
import logger from "./logger.js";
import type { URL } from "url";

const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

const DEFAULT_HEADERS = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US",
    "Cache-Control": "max-age=0",
    Connection: "keep-alive",
    "user-agent": USER_AGENT,
};

interface RequestOptions {
    headers?: Record<string, string>;
    json?: any;
}

interface Response {
    ok: boolean;
    text(): Promise<string>;
    json(): Promise<any>;
    url?: string;
}

export class Client {
    private readonly proxy?: string;
    private agent: HttpsProxyAgent<string> | SocksProxyAgent | undefined;
    private axiosInstance: AxiosInstance;
    public generatedCsrfToken: string | undefined;

    constructor(proxy?: string) {
        this.proxy = proxy;
        this.axiosInstance = axios.create({
            headers: DEFAULT_HEADERS,
            timeout: 120000,
            maxRedirects: 5,
        });
    }

    async init(): Promise<void> {
        if (this.proxy) {
            this.agent = new HttpsProxyAgent(`http://${this.proxy}`);
            this.axiosInstance.defaults.httpsAgent = this.agent;
            this.axiosInstance.defaults.proxy = false; // Disable axios proxy handling
        }
    }

    async createClient(proxyType: "http" | "socks" = "http"): Promise<void> {
        if (this.proxy) {
            switch (proxyType) {
                case "http":
                    this.agent = new HttpsProxyAgent(`http://${this.proxy}`);
                    break;
                case "socks":
                    this.agent = new SocksProxyAgent(`socks://${this.proxy}`);
                    break;
            }
            this.axiosInstance.defaults.httpsAgent = this.agent;
            this.axiosInstance.defaults.proxy = false;
        }
    }

    private convertAxiosResponse(response: AxiosResponse): Response {
        return {
            ok: response.status >= 200 && response.status < 300,
            text: async () =>
                typeof response.data === "string"
                    ? response.data
                    : JSON.stringify(response.data),
            json: async () => response.data,
            url: response.request?.res?.responseUrl,
        };
    }

    private async retryRequest<T>(
        requestFn: () => Promise<T>,
        maxRetries: number = 3
    ): Promise<T> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error: any) {
                if (attempt === maxRetries) {
                    throw error;
                }
                logger.error(
                    `Request failed, attempt ${attempt}/${maxRetries}: ${error.message}`
                );
                // Wait before retry (exponential backoff)
                await new Promise((resolve) =>
                    setTimeout(resolve, 1000 * attempt)
                );
            }
        }
        throw new Error("All retry attempts failed");
    }

    async get(url: string, options?: RequestOptions): Promise<Response> {
        return this.retryRequest(async () => {
            try {
                const response = await this.axiosInstance.get(url, {
                    headers: options?.headers,
                    httpsAgent: this.agent,
                });
                return this.convertAxiosResponse(response);
            } catch (error: any) {
                if (error.response) {
                    return this.convertAxiosResponse(error.response);
                }
                throw new Error(`GET request failed: ${error}`);
            }
        });
    }

    async post(url: string, options?: RequestOptions): Promise<Response> {
        return this.retryRequest(async () => {
            try {
                const config: any = {
                    headers: options?.headers,
                    httpsAgent: this.agent,
                };

                let data = options?.json;
                if (
                    options?.headers?.["content-type"]?.includes(
                        "application/x-www-form-urlencoded"
                    )
                ) {
                    const params = new URLSearchParams();
                    for (const [key, value] of Object.entries(
                        options.json || {}
                    )) {
                        params.append(key, String(value));
                    }
                    data = params;
                }

                const response = await this.axiosInstance.post(
                    url,
                    data,
                    config
                );
                return this.convertAxiosResponse(response);
            } catch (error: any) {
                if (error.response) {
                    return this.convertAxiosResponse(error.response);
                }
                throw new Error(`POST request failed: ${error}`);
            }
        });
    }

    private getTwitterHeaders(
        cookies: Record<string, string>
    ): Record<string, string> {
        return {
            authorization:
                "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
            referer: "https://x.com/",
            "user-agent": USER_AGENT,
            "x-csrf-token": cookies.ct0 || "",
            "x-twitter-auth-type": cookies.auth_token ? "OAuth2Session" : "",
            "x-twitter-active-user": "yes",
            "x-twitter-client-language": "en",
        };
    }

    /**
     * Creates a Twitter-specific client with authentication
     */
    async createTwitterClient(authToken: string): Promise<void> {
        this.generatedCsrfToken = generateCsrfToken();

        await this.createClient();

        const headers = this.getTwitterHeaders({
            ct0: this.generatedCsrfToken,
            auth_token: authToken,
        });

        const newHeaders: RawAxiosRequestHeaders = {
            ...headers,
            cookie: `lang=en; auth_token=${authToken}; ct0=${this.generatedCsrfToken};`,
        };

        this.axiosInstance.defaults.headers.common = newHeaders;
    }
}
