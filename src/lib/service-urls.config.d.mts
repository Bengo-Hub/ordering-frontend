export type ServiceName = "ordering" | "sso" | "logistics" | "treasury" | "notifications" | "subscriptions" | "pos";

export declare const SERVICE_URLS: Record<ServiceName, string>;
export declare const SERVICE_PROXY_PREFIX: string;
export declare function serviceRewrites(): { source: string; destination: string }[];
