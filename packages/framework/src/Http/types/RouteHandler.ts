import type { HttpRequest } from '../HttpRequest';

export type RouteHandler = | string | ((request: HttpRequest) => unknown | Promise<unknown>);
