export class JiraProject {
    public name: string;
    public key: string;

    constructor(name: string, key: string) {
        this.name = name;
        this.key = key;
    }
}