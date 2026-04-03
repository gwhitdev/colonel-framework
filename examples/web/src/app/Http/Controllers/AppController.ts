import type { HttpRequest } from "@coloneldev/framework";
import Controller from './Controller';
import { AppInfoService } from '../../Services/AppInfoService';

export class AppController extends Controller {
    static inject = [AppInfoService];

    constructor(private appInfoService: AppInfoService) {
        super();
    }

    index(req: HttpRequest): Record<string, any> {
        const previousVisits = this.sessionGet<number>(req, "visits") ?? 0;
        const visits = previousVisits + 1;
        this.sessionPut(req, "visits", visits);

        return [
            'base/index',
            {
                "titleData": this.appInfoService.welcomeTitle(),
                "docsUrl": this.appInfoService.documentationUrl(),
                "footerData": `Session visits: ${visits}`,
            },
        ]
    }
}
