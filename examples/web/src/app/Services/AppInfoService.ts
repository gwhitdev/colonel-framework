export class AppInfoService {
    constructor(private appName: string) {}

    welcomeTitle(): string {
        return `Welcome to ${this.appName}`;
    }
}
