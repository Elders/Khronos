$(document).ready(function(){
    var currentJiraUsername = chrome.storage.sync.get(['jira_username','toggl_api'], function(result){
        $("#jira-username").val(result['jira_username']);
        $("#jira-password").val('........');
        $("#toggl-api-token").val(result['toggl_api']);
    });
    
    $("#btn-save-settings").click(function(){
        var jiraUsername = $("#jira-username").val(),
            jiraPassword = $("#jira-password").val(),
            togglApiToken = $("#toggl-api-token").val();
        
        if(jiraPassword && jiraPassword.startsWith('........') == false) {
            chrome.storage.sync.set(
                {
                    'jira_username':jiraUsername,
                    'jira_password':jiraPassword,
                    'toggl_api':togglApiToken
                }
            );

            $.notify({
                icon: 'pe-7s-check',
                message: "Jira Settings were save successfuly"
  
              },{
                  type: 'success',
                  timer: 3000
              });
        }

        if(togglApiToken){
            chrome.storage.sync.set(
                {
                    'toggl_api':togglApiToken
                }
            );

            $.notify({
                icon: 'pe-7s-check',
                message: "Toggl Settings were save successfuly"
  
              },{
                  type: 'success',
                  timer: 3000
              });
        }
    })
})