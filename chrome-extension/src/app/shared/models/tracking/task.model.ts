export class Task {
    key: string;
    name: string;
    projectName: string;
    date: Date;

    constructor(key: string, name: string, projectName: string, date: Date) {
        this.key = key;
        this.name = name;
        this.projectName = projectName;
        this.date = date;
    }
}