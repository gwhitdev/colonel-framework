import type { HttpRequest } from '../HttpRequest';

export type RouteHandler = | string | ((request: HttpRequest) => Response | Promise<Response>);
