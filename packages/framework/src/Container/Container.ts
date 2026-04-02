export type Newable<T> = new (...args: any[]) => T;
export type Token<T = unknown> = string | symbol | Newable<T>;

type InjectableNewable<T> = Newable<T> & {
	inject?: Token[];
};

type Factory<T> = (container: Container) => T;



interface Binding<T = unknown> {
	factory: Factory<T>;
	singleton: boolean;
}

const isNewable = <T>(value: Token<T>): value is Newable<T> => {
	return typeof value === "function";
};

export class Container {
	private bindings = new Map<Token, Binding>();
	private instances = new Map<Token, unknown>();

	bind<T>(token: Token<T>, factory: Factory<T>): this {
		this.bindings.set(token, { factory, singleton: false });
		this.instances.delete(token);
		return this;
	}

	singleton<T>(token: Token<T>, factory: Factory<T>): this {
		this.bindings.set(token, { factory, singleton: true });
		return this;
	}

	instance<T>(token: Token<T>, value: T): this {
		this.instances.set(token, value);
		return this;
	}

	has<T>(token: Token<T>): boolean {
		return this.instances.has(token) || this.bindings.has(token);
	}

	make<T>(token: Token<T>): T {
		if (this.instances.has(token)) {
			return this.instances.get(token) as T;
		}

		const binding = this.bindings.get(token);
		if (binding) {
			const value = binding.factory(this) as T;

			if (binding.singleton) {
				this.instances.set(token, value);
			}

			return value;
		}

		if (isNewable(token)) {
			const injectableToken = token as InjectableNewable<T>;
			const dependencies = (injectableToken.inject ?? []).map((dependencyToken) =>
				this.make(dependencyToken)
			);

			return new injectableToken(...dependencies);
		}

		throw new Error(`Container binding not found for token: ${String(token)}`);
	}

	forget<T>(token: Token<T>): this {
		this.bindings.delete(token);
		this.instances.delete(token);
		return this;
	}

	flush(): this {
		this.bindings.clear();
		this.instances.clear();
		return this;
	}
}
