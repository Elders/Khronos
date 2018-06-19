import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'settings-cmp',
    moduleId: module.id,
    templateUrl: 'settings.component.html'
})

export class SettingsComponent implements OnInit{
    public jiraSettingsUsername:string;

    ngOnInit(){
        debugger;
        chrome.storage.sync.set({"test_key": "test_value"}, function() {

            chrome.storage.sync.get(['test_key'], function(result) {
                console.log('Value currently is ' + result.key);
                });
          });
        
        
        
    }
}
