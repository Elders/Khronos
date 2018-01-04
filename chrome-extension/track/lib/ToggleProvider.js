function TogglProvider(){
    var self = this;

    chrome.storage.sync.get(['toggl_api'], function(result){
        self.apiToken = result['toggl_api'];
    });
}

TogglProvider.prototype = {
    constructor:TogglProvider,
    getProjects:function(){
        var tokenBase64Encoded = btoa(this.apiToken + ':api_token');
        var result = [];

        $.ajax({
            url: 'https://www.toggl.com/api/v8/workspaces',
            dataType: 'json',
            type: 'get',
            contentType: 'application/json',
            async:false,
            headers: {
                "Authorization": "Basic " + tokenBase64Encoded
            },
            success: function( data, textStatus, jQxhr ){
                for(var i = 0; i < data.length;i++){
                    $.ajax({
                        url: 'https://www.toggl.com/api/v8/workspaces/'+data[i].id+'/projects',
                        dataType: 'json',
                        type: 'get',
                        async:false,
                        contentType: 'application/json',
                        headers: {
                            "Authorization": "Basic " + tokenBase64Encoded
                        },
                        success: function( data, textStatus, jQxhr ){
                            for(var p = 0; p < data.length;p++){
                                var project = new Project(data[p].name);
                                project.id = data[p].id;
                                result.push(project);
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

        return result;
    },
    trackEntries:function(entries,onEntryAdded){
        var tokenBase64Encoded = btoa(this.apiToken + ':api_token');
        var result = [];

        for(var i = 0; i < entries.length;i++){
            var currentEntry = entries[i];

            $.ajax({
                url: 'https://www.toggl.com/api/v8/time_entries',
                dataType: 'json',
                type: 'post',
                data: JSON.stringify({"time_entry" : currentEntry }),
                contentType: 'application/json',
                async:false,
                headers: {
                    "Authorization": "Basic " + tokenBase64Encoded
                },
                success: function( data, textStatus, jQxhr ){
                    onEntryAdded(data)
                },
                error: function( jqXhr, textStatus, errorThrown ){
                    console.log( errorThrown );
                }
            });
        }
    }
}