export interface RouteMatchInterface {
    handler: string;
    params: Record<string, string>;
}