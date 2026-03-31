import type { HttpMethod } from '../types/HttpMethod';

export interface RouteDefinitionInterface {
    method: HttpMethod;
    path: string;
    handler: string;
}