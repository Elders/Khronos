import { debug } from 'util';
import { JiraSettings } from '../shared/models/settings/jira.model';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as moment from 'moment';

import { JiraProject } from './../shared/models/projects/jira-project.model';
import { BindedProject } from './../shared/models/projects/binded-projects.model';

import { JiraService } from '../shared/services/jira-tasks.services';

import { ChromeStorageService } from '../shared/services/chrome-storage.services';
@Component({
    selector: 'projects-cmp',
    moduleId: module.id,
    templateUrl: 'projects.component.html'
})

export class ProjectsComponent implements OnInit {
    public jiraProjects: JiraProject[];
    public jiraTasksService: JiraService;
    public bindedProjects: BindedProject[];
    public allProjects: [JiraProject, BindedProject][];

    constructor(public chromeStorage: ChromeStorageService, http: HttpClient) {
        this.chromeStorage.get("settings_jira").then(
            (val) => {
                var settings = val as JiraSettings;
                this.jiraTasksService = new JiraService(settings.username, settings.password, http);
            }
        ).then(
            () => {
                this.jiraTasksService.getProjects()
                    .then(
                        (projects) => {
                            this.jiraProjects = projects;

                            this.chromeStorage.get("binded_projects").then(
                                (val) => {
                                    this.bindedProjects = val ? val : new Array();

                                    this.jiraProjects.forEach(element => {
                                        this.allProjects.push([element, this.bindedProjects ? this.bindedProjects.find((x) => x.jiraProject.name == element.name) : undefined])
                                    });


                                }
                            )
                        }
                    );
            }
        );
    }

    ngOnInit() {
        this.allProjects = new Array();
    }

    clickEditProject(project: JiraProject) {
        this.showProjectInput(project.key);
        this.showProjectButtons(project.key);
    }

    clickSaveProject(project: JiraProject) {
        debugger;
        var projectNameToBind = this.getProjectInput(project.key);
        this.clearProjectInput(project.key);
        this.hideProjectInput(project.key);
        this.hideProjectButtons(project.key)

        var projectBinding = new BindedProject(project, projectNameToBind);

        this.saveProjectBinding(projectBinding);
    }

    clickCancelProject(project: JiraProject) {
        this.clearProjectInput(project.key);
        this.hideProjectInput(project.key);
        this.hideProjectButtons(project.key);
    }

    getProjectInput(key: string) {
        let element = document.getElementById('input-' + key) as any;
        return element.value;
    }

    clearProjectInput(key: string) {
        let element = document.getElementById('input-' + key) as any;
        element.value = "";
    }

    hideProjectInput(key: string) {
        document.getElementById('proj-binded-name-' + key).style.cssText = "display:block";
        document.getElementById('proj-bind-input-' + key).style.cssText = "display:none";
    }

    hideProjectButtons(key: string) {
        document.getElementById('proj-edit-btn-' + key).style.cssText = "display: inline-block;";

        document.getElementById('proj-save-btn-' + key).style.cssText = "display: none;";
        document.getElementById('proj-cancel-btn-' + key).style.cssText = "display: none;";
    }

    saveProjectBinding(bindedProject: BindedProject) {
        if (this.bindedProjects.find((x) => x.jiraProject.key == bindedProject.jiraProject.key)) {
            var index = this.bindedProjects.findIndex((x) => x.jiraProject.key == bindedProject.jiraProject.key);
            if (index > -1) {
                this.bindedProjects.splice(index, 1);
            }
        }

        this.bindedProjects.push(bindedProject);

        this.chromeStorage.save("binded_projects", this.bindedProjects).then(
            () => {
                console.log("binded_projects saved!");
            }
        )
    }

    showProjectInput(key: string) {
        document.getElementById('proj-binded-name-' + key).style.cssText = "display:none";
        document.getElementById('proj-bind-input-' + key).style.cssText = "display:block";
    }

    showProjectButtons(key: string) {
        document.getElementById('proj-edit-btn-' + key).style.cssText = "display:none";

        document.getElementById('proj-save-btn-' + key).style.cssText = "display: inline-block;";
        document.getElementById('proj-cancel-btn-' + key).style.cssText = "display: inline-block;";
    }
}

