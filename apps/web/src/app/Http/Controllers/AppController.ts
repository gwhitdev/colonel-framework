import Controller from './Controller';

export class AppController extends Controller {
    constructor() {
        super();
    }

    index(): Record<string, any> {
        return [
            'base/index',
            {
                "titleData": "Welcome",
                
            },
        ]
    }
}