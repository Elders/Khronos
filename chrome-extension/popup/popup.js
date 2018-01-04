$(document).ready(function(){
    $('#btn-dashboard').click(function(){
        chrome.tabs.create({url: "../track/track.html"});
    })

    $('#btn-settings').click(function(){
        chrome.tabs.create({url: "../settings/settings.html"});
    })
})