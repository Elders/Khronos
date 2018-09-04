import { JiraProject } from './../projects/jira-project.model';

export class BindedProject {
    public jiraProject: JiraProject;
    public togglProjectName: string;

    constructor(jiraProject: JiraProject, togglProjectName: string) {
        this.jiraProject = jiraProject;
        this.togglProjectName = togglProjectName;
    }
}