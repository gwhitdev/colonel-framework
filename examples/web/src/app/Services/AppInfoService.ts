export class AppInfoService {
    constructor(
        private appName: string,
        private docsUrl: string = "https://<your-user>.github.io/colonel/"
    ) {}

    welcomeTitle(): string {
        return `Welcome to ${this.appName}`;
    }

    documentationUrl(): string {
        return this.docsUrl;
    }
}
