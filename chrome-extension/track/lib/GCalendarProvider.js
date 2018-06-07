function GCalendarProvider(){
    var self = this;

    //Get Settings
    chrome.storage.sync.get(['jira_username','jira_password'], function(result){
        self.username = result['jira_username'];
        self.password = result['jira_password'];
    });
}

GCalendarProvider.prototype = {
    constructor:JiraProvider,
    getEventsForDays:function(days, cb){
        var baseSearchUrl = "https://marketvision.atlassian.net/rest/api/2/search?jql=";
        
        var result = [];
        var index = 0;
        debugger;
        for(var a = 0; a < days.length;a++){
            var currentDate = days[a];
            var dateString = currentDate.format('YYYY/MM/DD');

            debugger;
            //TEST GOOGLE
            chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
                // Get All Calendars
                $.ajax({
                    url: "https://www.googleapis.com/calendar/v3/users/me/calendarList?access_token=" +  token,
                    dataType: 'json',
                    type: 'get',
                    contentType: 'application/json',
                    headers: {
                        "date":dateString
                    },
                    success: function( data, textStatus, jQxhr ){
                        //Get Events for date
                        for(var i = 0; i < data.items.length;i++){
                            $.ajax({
                                url: "https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(data.items[i].id) + "/events?access_token=" +  token + "&timeMin=2018-02-25T10:00:00-07:00&timeMax=2018-02-27T10:00:00-07:00",
                                dataType: 'json',
                                type: 'get',
                                contentType: 'application/json',
                                headers: {
                                    "date":dateString
                                },
                                success: function( events, textStatus, jQxhr ){
                                    //Get Events for date
                                    for(var ev = 0; ev < events.items.length;ev++){
                                        var currentEvent = events.items[ev];

                                        var newTask = new Task();
                                        
                                        newTask.key = currentEvent.id;
                                        newTask.name = currentEvent.summary;
                                        newTask.projectName = "Meetings"; 
                                        newTask.date = this.headers["date"]; 

                                        result.push(newTask);
                                    }
                                    index++;

                                    if(index ===  data.items.length){
                                        cb(result);
                                    }
                                },
                                error: function( jqXhr, textStatus, errorThrown ){
                                    console.log( errorThrown );
                                }
                            });
                        }
                    },
                    error: function( jqXhr, textStatus, errorThrown ){
                        console.log( errorThrown );
                    }
                });



            });

            // var jql = "(assignee%20was%20" + this.username + "%20on%20(%22" + dateString + "%22))" +
            //             "%20and%20" +
            //             "(status%20was%20in%20(%22In%20Progress%22)%20on%20(%22" + dateString + "%22))" +
            //             "%20OR%20" +
            //             "((NOT%20assignee%20changed)%20AND%20assignee%20%3D%20" + this.username +
            //             "%20AND%20status%20was%20in%20(%22In%20Progress%22)%20on%20(%22" + dateString + "%22))";

            // var tokenBase64Encoded = btoa(this.username + ':' + this.password);
    
            // $.ajax({
            //     url: baseSearchUrl + jql ,
            //     dataType: 'json',
            //     type: 'get',
            //     contentType: 'application/json',
            //     headers: {
            //         "Authorization": "Basic " + tokenBase64Encoded,
            //         "date":dateString
            //     },
            //     success: function( data, textStatus, jQxhr ){
            //         for(var issue = 0; issue < data.issues.length; issue++){
            //             var currentIssue = data.issues[issue];

            //             var newTask = new Task();
                        
            //             newTask.key = currentIssue.key;
            //             newTask.name = currentIssue.fields.summary;
            //             newTask.projectName = currentIssue.fields.project.name; 
            //             newTask.date = this.headers["date"]; 

            //             result.push(newTask);
            //         }
            //         index++;

            //         if(index ===  days.length){
            //             cb(result);
            //         }
            //     },
            //     error: function( jqXhr, textStatus, errorThrown ){
            //         console.log( errorThrown );
            //     }
            // });

        }
    }
}