export default class Controller {
    constructor() {
        // Base constructor logic can be added here if needed
    }
    // Base controller logic can be added here, such as common response formatting, error handling, etc.
    health(): Record<string, string> {
        return { status: "ok" };
    }
}