function JiraProvider(){
    var self = this;

    chrome.storage.sync.get(['jira_username','jira_password'], function(result){
        self.username = result['jira_username'];
        self.password = result['jira_password'];
    });
}

JiraProvider.prototype = {
    constructor:JiraProvider,
    getTasksForDays:function(days, cb){
        var baseSearchUrl = "https://marketvision.atlassian.net/rest/api/2/search?jql=";
        
        var result = [];
        var index = 0;

        for(var a = 0; a < days.length;a++){
            var currentDate = days[a];
            var dateString = currentDate.format('YYYY/MM/DD');
            var jql = "(assignee%20was%20" + this.username + "%20on%20(%22" + dateString + "%22))" +
                        "%20and%20" +
                        "(status%20was%20in%20(%22In%20Progress%22)%20on%20(%22" + dateString + "%22))" +
                        "%20OR%20" +
                        "((NOT%20assignee%20changed)%20AND%20assignee%20%3D%20" + this.username +
                        "%20AND%20status%20was%20in%20(%22In%20Progress%22)%20on%20(%22" + dateString + "%22))";

            var tokenBase64Encoded = btoa(this.username + ':' + this.password);
    
            $.ajax({
                url: baseSearchUrl + jql ,
                dataType: 'json',
                type: 'get',
                contentType: 'application/json',
                headers: {
                    "Authorization": "Basic " + tokenBase64Encoded,
                    "date":dateString
                },
                success: function( data, textStatus, jQxhr ){
                    for(var issue = 0; issue < data.issues.length; issue++){
                        var currentIssue = data.issues[issue];

                        var newTask = new Task();
                        
                        newTask.key = currentIssue.key;
                        newTask.name = currentIssue.fields.summary;
                        newTask.projectName = currentIssue.fields.project.name; 
                        newTask.date = this.headers["date"]; 

                        result.push(newTask);
                    }
                    index++;

                    if(index ===  days.length){
                        cb(result);
                    }
                },
                error: function( jqXhr, textStatus, errorThrown ){
                    console.log( errorThrown );
                }
            });

        }
    }
}