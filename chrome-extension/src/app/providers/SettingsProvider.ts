import { JiraSettings } from './JiraSettings';

export class SettingsProvider {
    jira: JiraSettings;
    email: string;
    rating: number;
  
    constructor() {
    }
  
    public saveJira(name:string,password:string) {
        this.jira = new JiraSettings(name,password);
    }
}