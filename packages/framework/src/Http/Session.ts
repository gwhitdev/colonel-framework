type SessionPayload = Record<string, unknown>;

export interface SessionStore {
    get(sessionId: string): SessionPayload | null | Promise<SessionPayload | null>;
    set(sessionId: string, payload: SessionPayload, ttlSeconds: number): void | Promise<void>;
    delete(sessionId: string): void | Promise<void>;
}

type InMemoryValue = {
    payload: SessionPayload;
    expiresAt: number;
};

export class InMemorySessionStore implements SessionStore {
    private readonly sessions = new Map<string, InMemoryValue>();

    get(sessionId: string): SessionPayload | null {
        const found = this.sessions.get(sessionId);
        if (!found) {
            return null;
        }

        if (Date.now() > found.expiresAt) {
            this.sessions.delete(sessionId);
            return null;
        }

        return { ...found.payload };
    }

    set(sessionId: string, payload: SessionPayload, ttlSeconds: number): void {
        this.sessions.set(sessionId, {
            payload: { ...payload },
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    delete(sessionId: string): void {
        this.sessions.delete(sessionId);
    }
}

export class Session {
    private readonly payload: SessionPayload;
    private dirty = false;
    private destroyed = false;

    constructor(
        public readonly id: string,
        initialPayload: SessionPayload,
        private readonly store: SessionStore,
        private readonly ttlSeconds: number,
        private readonly isNew = false,
    ) {
        this.payload = { ...initialPayload };
    }

    all(): SessionPayload {
        return { ...this.payload };
    }

    get<T = unknown>(key: string): T | undefined {
        return this.payload[key] as T | undefined;
    }

    has(key: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.payload, key);
    }

    set(key: string, value: unknown): this {
        this.payload[key] = value;
        this.dirty = true;
        return this;
    }

    forget(key: string): this {
        if (this.has(key)) {
            delete this.payload[key];
            this.dirty = true;
        }
        return this;
    }

    flush(): this {
        for (const key of Object.keys(this.payload)) {
            delete this.payload[key];
        }

        this.dirty = true;
        return this;
    }

    invalidate(): this {
        this.destroyed = true;
        this.dirty = true;
        return this;
    }

    shouldCommit(): boolean {
        return this.dirty || this.isNew;
    }

    isInvalidated(): boolean {
        return this.destroyed;
    }

    async persist(): Promise<void> {
        if (this.destroyed) {
            await this.store.delete(this.id);
            return;
        }

        if (!this.shouldCommit()) {
            return;
        }

        await this.store.set(this.id, this.payload, this.ttlSeconds);
    }
}
