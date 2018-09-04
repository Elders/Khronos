import { debug } from 'util';
import { JiraSettings } from './../shared/models/settings/jira.model';
import { GeneralSettings } from './../shared/models/settings/general.model';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import * as moment from 'moment';

import { ChromeStorageService } from '../shared/services/chrome-storage.services';
import { JiraService } from '../shared/services/jira-tasks.services';

import { Task } from '../shared/models/tracking/task.model';

@Component({
    selector: 'tracking-cmp',
    moduleId: module.id,
    templateUrl: 'tracking.component.html'
})

export class TrackingComponent implements OnInit {
    public viewDate: Date = new Date();
    public events: any[];
    public selectedDates: Date[];
    public selectedTask: Task;

    public jiraTasksService: JiraService

    constructor(public chromeStorage: ChromeStorageService, http: HttpClient) {
        this.selectedDates = new Array();


        this.chromeStorage.get("settings_jira").then(
            (val) => {
                var settings = val as JiraSettings;
                this.jiraTasksService = new JiraService(settings.username, settings.password, http);
            }
        )

    }

    ngOnInit() {
        this.events = new Array();
    }

    handleDayClick(e) {
        var date = e.date.toDate();

        this.switchDayCellColor(date);
        this.addRemoveToSelectedDates(date);
    }

    handleEventClick(e) {
        this.selectedTask = e.calEvent;
    }

    switchDayCellColor(date: Date) {
        const COLOR_SELECTED = "#e06561";
        const COLOR_NOT_SELECTED = "white";

        var moment = date;
        var MyDateString = moment.getFullYear() + '-'
            + ('0' + (moment.getMonth() + 1)).slice(-2)
            + "-" + ('0' + moment.getDate()).slice(-2);

        var dateCell = document.querySelector('[data-date="' + MyDateString + '"]') as any;

        if (dateCell.bgColor == COLOR_SELECTED)
            dateCell.bgColor = COLOR_NOT_SELECTED;
        else
            dateCell.bgColor = COLOR_SELECTED;
    }

    addRemoveToSelectedDates(date: Date) {
        if (this.selectedDates.find((x) => x.toUTCString() == date.toUTCString())) {
            var index = this.selectedDates.findIndex((date) => date.toUTCString() == date.toUTCString());
            if (index > -1) {
                this.selectedDates.splice(index, 1);
            }
        } else {
            this.selectedDates.push(date);
        }
    }

    fetchTasks() {
        var self = this;
        var promises: Promise<Task[]>[] = new Array();
        self.events = new Array();

        this.selectedDates.forEach(date => {
            promises.push(this.jiraTasksService.getTasks(date))
        });

        Promise.all(promises)
            .then(function (values) {
                debugger;

                var allTasks: Task[] = new Array();

                values.forEach(arr => {
                    allTasks = allTasks.concat(arr);
                });

                self.setCalendarEvents(allTasks);
            });
    }

    setCalendarEvents(allTasks: Task[]) {
        allTasks.forEach(element => {
            var countOfTasksThisDay = allTasks.filter((x) => moment(x.date).format('YYYY-MM-DD') == moment(element.date).format('YYYY-MM-DD')).length;

            this.calculateWorkingHoursForThisTask(countOfTasksThisDay)
                .then(
                    (workingHours) => {
                        this.events.push({
                            "title": `[${element.key}] - ${element.name}`,
                            "start": moment(element.date).format('YYYY-MM-DD'),
                            "allDay": true,
                            "editable": true,
                            "urlToPlatform": `https://marketvision.atlassian.net/browse/${element.key}`,
                            "entry": element,
                            "workingHours": Math.floor(workingHours / 60),
                            "workingMinutes": ((workingHours % 60) < 10) ? ("0" + (workingHours % 60)) : (workingHours % 60)
                            //"backgroundColor": `#${(0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)}`
                        })
                    }
                )
        });
    }

    calculateWorkingHoursForThisTask(count: number): Promise<number> {
        return new Promise(
            (resolve) => {
                this.chromeStorage.get("settings_general").then(
                    (val) => {
                        var settings = val as GeneralSettings;

                        var minutesForThisTask = settings.working_hours * 60 / count;

                        resolve(minutesForThisTask);
                    }
                )
            }
        );
    }

    log() {

    }
}

