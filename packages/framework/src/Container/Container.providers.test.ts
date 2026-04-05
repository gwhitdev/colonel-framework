import { describe, expect, it } from "bun:test";
import { Container } from "./Container";

const CONFIG_TOKEN = "config.baseUrl";
const LOGGER_TOKEN = Symbol("logger");

class ApiService {
	static inject = [LOGGER_TOKEN];

	constructor(public logger: { name: string }) {}
}

class UsesMixedTokens {
	static inject = [CONFIG_TOKEN, LOGGER_TOKEN, ApiService];

	constructor(
		public baseUrl: string,
		public logger: { name: string },
		public apiService: ApiService
	) {}
}

describe("Container provider registration", () => {
	it("supports useValue/useFactory/useClass with mixed token types", () => {
		const container = new Container();

		container.register({
			provide: CONFIG_TOKEN,
			useValue: "https://example.test/api",
		});
		container.register({
			provide: LOGGER_TOKEN,
			useFactory: () => ({ name: "logger" }),
			singleton: true,
		});
		container.register({
			provide: ApiService,
			useClass: ApiService,
		});

		const resolved = container.make(UsesMixedTokens);
		const sharedLogger = container.make<{ name: string }>(LOGGER_TOKEN);

		expect(resolved.baseUrl).toBe("https://example.test/api");
		expect(resolved.logger).toBe(sharedLogger);
		expect(resolved.apiService.logger).toBe(sharedLogger);
	});

	it("keeps class-token singleton behavior unchanged", () => {
		class CounterService {
			count = 0;
		}

		const container = new Container();
		container.singleton(CounterService, () => new CounterService());

		const first = container.make(CounterService);
		const second = container.make(CounterService);

		expect(first).toBe(second);
	});

	it("throws a stable error when a non-class token is missing", () => {
		const container = new Container();

		expect(() => container.make("missing.token")).toThrow(
			"Container binding not found for token: missing.token"
		);
	});

	it("supports test-time overrides via instance replacement", () => {
		class Clock {
			now(): number {
				return Date.now();
			}
		}

		class UsesClock {
			static inject = [Clock];

			constructor(private clock: Clock) {}

			value(): number {
				return this.clock.now();
			}
		}

		const container = new Container();
		container.singleton(Clock, () => new Clock());
		container.instance(Clock, { now: () => 123 } as Clock);

		const service = container.make(UsesClock);
		expect(service.value()).toBe(123);
	});
});
