export type TelemetryEventName = "scaffold_created" | "server_start" | "framework_request";

export interface TelemetryClientOptions {
    enabled: boolean;
    endpoint?: string;
    source: string;
    appId?: string;
    environment?: string;
    runtime?: string;
    apiKey?: string;
}

export interface TelemetryEventPayload {
    name: TelemetryEventName;
    timestamp: string;
    source: string;
    appId: string;
    environment: string;
    runtime: string;
    properties: Record<string, unknown>;
}

const parseBoolean = (value: string | undefined): boolean => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
};

export class TelemetryClient {
    private readonly enabled: boolean;
    private readonly endpoint?: string;
    private readonly source: string;
    private readonly appId: string;
    private readonly environment: string;
    private readonly runtime: string;
    private readonly apiKey?: string;

    constructor(options: TelemetryClientOptions) {
        this.enabled = options.enabled;
        this.endpoint = options.endpoint;
        this.source = options.source;
        this.appId = options.appId ?? "unknown-app";
        this.environment = options.environment ?? process.env.NODE_ENV ?? "development";
        this.runtime = options.runtime ?? "bun";
        this.apiKey = options.apiKey;
    }

    track(name: TelemetryEventName, properties: Record<string, unknown> = {}): void {
        if (!this.enabled || !this.endpoint) {
            return;
        }

        const payload: TelemetryEventPayload = {
            name,
            timestamp: new Date().toISOString(),
            source: this.source,
            appId: this.appId,
            environment: this.environment,
            runtime: this.runtime,
            properties,
        };

        const headers: Record<string, string> = {
            "content-type": "application/json",
        };

        if (this.apiKey) {
            headers["x-colonel-telemetry-key"] = this.apiKey;
        }

        fetch(this.endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        }).catch(() => {
            // Telemetry failures should never affect app behavior.
        });
    }
}

export const createTelemetryClientFromEnv = (options: {
    source: string;
    appId?: string;
    endpointEnvKey?: string;
    enabledEnvKey?: string;
    apiKeyEnvKey?: string;
}): TelemetryClient => {
    const endpointKey = options.endpointEnvKey ?? "COLONEL_TELEMETRY_ENDPOINT";
    const enabledKey = options.enabledEnvKey ?? "COLONEL_TELEMETRY_ENABLED";
    const apiKeyKey = options.apiKeyEnvKey ?? "COLONEL_TELEMETRY_KEY";

    return new TelemetryClient({
        enabled: parseBoolean(process.env[enabledKey]),
        endpoint: process.env[endpointKey],
        source: options.source,
        appId: options.appId,
        apiKey: process.env[apiKeyKey],
    });
};
