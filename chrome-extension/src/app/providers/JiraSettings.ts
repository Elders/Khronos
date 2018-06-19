export class JiraSettings {
    name: string;
    password: string;

    constructor(name: string, pass: string) {
        this.name = name;
        this.password = pass;
    }
}