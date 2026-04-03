import Controller from './Controller';
import { AppInfoService } from '../../Services/AppInfoService';

export class AppController extends Controller {
    static inject = [AppInfoService];

    constructor(private appInfoService: AppInfoService) {
        super();
    }

    index(): Record<string, any> {
        return [
            'base/index',
            {
                "titleData": this.appInfoService.welcomeTitle(),
                
            },
        ]
    }
}
