import type { HttpMethod } from '../types/HttpMethod';
import type { RouteHandler } from '../types/RouteHandler';



export interface RouteDefinitionInterface {
    method: HttpMethod;
    path: string;
    handler: RouteHandler;
}