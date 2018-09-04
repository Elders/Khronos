import { Component, OnInit } from '@angular/core';

import { JiraSettings } from '../shared/models/settings/jira.model';
import { TogglSettings } from '../shared/models/settings/toggl.model';
import { GeneralSettings } from '../shared/models/settings/general.model';

import { ChromeStorageService } from '../shared/services/chrome-storage.services';

@Component({
    selector: 'settings-cmp',
    moduleId: module.id,
    templateUrl: 'settings.component.html'
})

export class SettingsComponent implements OnInit {
    public settingsJira: JiraSettings;
    public settingsToggl: TogglSettings;
    public settingsGeneral: GeneralSettings = new GeneralSettings(0);

    constructor(public chromeStorage: ChromeStorageService) { }

    ngOnInit() {
        this.chromeStorage.get("settings_jira").then(
            (val) => {
                if (val) {
                    this.settingsJira = val;
                } else {
                    this.settingsJira = new JiraSettings("", "");
                }

            }
        )

        this.chromeStorage.get("settings_toggl").then(
            (val) => {
                if (val) {
                    this.settingsToggl = val;
                } else {
                    this.settingsToggl = new TogglSettings("");
                }
            }
        )

        this.chromeStorage.get("settings_general").then(
            (val) => {
                if (val) {
                    this.settingsGeneral = val;
                } else {
                    this.settingsGeneral = new GeneralSettings(9);
                }
            }
        )
    }

    public save() {
        this.chromeStorage.save("settings_jira", this.settingsJira).then(
            () => {
                console.log("settings_jira saved!");
            }
        )
        this.chromeStorage.save("settings_toggl", this.settingsToggl).then(
            () => {
                console.log("settings_toggl saved!");
            }
        )
        this.chromeStorage.save("settings_general", this.settingsGeneral).then(
            () => {
                console.log("settings_general saved!");
            }
        )
    }
}
