import { Injectable } from '@angular/core';  
import { debug } from 'util';
  
@Injectable()  
export class ChromeStorageService {
    public save(key:string,value:any): Promise<any> {
        return new Promise(
            (resolve)=>{ 
                var keyValue = new Object();
                keyValue[key] = value;

                chrome.storage.sync.set(keyValue, function() {
                    resolve(value);
                });
            }
        );
    }

    public get(key: string): Promise<any> {
        return new Promise(
            (resolve)=>{ 
                chrome.storage.sync.get([key], function(result) {
                    resolve(result[key]);
                });
            });
    }
}