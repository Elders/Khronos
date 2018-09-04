import { debug } from 'util';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from "rxjs/Rx";
import 'rxjs/add/operator/toPromise';

import { Task } from '../models/tracking/task.model';
import { JiraProject } from '../models/projects/jira-project.model';

import * as moment from 'moment';

@Injectable()
export class JiraService {
    _username: string;
    _password: string;
    _baseUrl: string;
    _searchUrlParam: string;

    constructor(username: string, password: string, private http: HttpClient) {
        this._username = username;
        this._password = password;

        this._baseUrl = "https://marketvision.atlassian.net/rest/api/2/";
        this._searchUrlParam = "search?jql=";
    }

    public getTasks(day: Date): Promise<Task[]> {
        let promise = new Promise<Task[]>((resolve, reject) => {
            var dateString = moment(day).format('YYYY/MM/DD');

            // var jql = `(assignee%20was%20${this._username}%20on%20(%22${dateString}%22))%20and%20` +
            //     `(status%20was%20in%20(%22In%20Progress%22)%20on%20(%22${dateString}%22))%20OR%20((NOT%20assignee%20changed)` +
            //     `%20AND%20assignee%20%3D%20${this._username}%20AND%20status%20was%20in%20(%22In%20Progress%22)%20on%20` +
            //     `(%22${dateString}%22))`;

            var jql = `(assignee%20was%20${this._username}%20on%20(%22${dateString}%22))%20and%20` +
                `(status%20was%20in%20(%22In%20Progress%22)%20on%20(%22${dateString}%22))%20OR%20(assignee%20%3D%20${this._username}%20` +
                `AND%20status%20was%20in%20(%22In%20Progress%22)%20on%20(%22${dateString}%22))`;

            var headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Basic ${this.getBase64EncodedToken()
                    } `
            });

            this.http.get(this._baseUrl + this._searchUrlParam + jql, {
                headers: headers,
            })
                .toPromise()
                .then(
                    res => {
                        var response = res as any;
                        var result: Task[] = new Array();
                        for (var issue = 0; issue < response.issues.length; issue++) {
                            var currentIssue = response.issues[issue];

                            var newTask = new Task(currentIssue.key, currentIssue.fields.summary, currentIssue.fields.project.name, new Date(dateString));
                            result.push(newTask);
                        }

                        console.log(result);
                        resolve(result);
                    },
                    reason => {
                        console.log(reason);
                        reject();
                    }
                );
        });
        return promise;
    };

    public getProjects(): Promise<JiraProject[]> {
        let promise = new Promise<JiraProject[]>((resolve, reject) => {

            var headers = new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Basic ${this.getBase64EncodedToken()}`
            });

            this.http.get(this._baseUrl + "project", {
                headers: headers,
            })
                .toPromise()
                .then(
                    res => {
                        var response = res as JiraProject[];
                        console.log(response);
                        resolve(response);
                    },
                    reason => {
                        console.log(reason);
                        reject();
                    }
                );
        });
        return promise;
    };

    private getBase64EncodedToken() {
        return btoa(this._username + ':' + this._password);
    }
}

