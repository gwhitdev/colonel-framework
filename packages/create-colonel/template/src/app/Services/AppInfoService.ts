export class AppInfoService {
    constructor(
        private appName: string,
        private docsUrl: string = "https://gwhitdev.github.io/colonel-framework/"
    ) {}

    welcomeTitle(): string {
        return `Welcome to ${this.appName}`;
    }

    documentationUrl(): string {
        return this.docsUrl;
    }
}
