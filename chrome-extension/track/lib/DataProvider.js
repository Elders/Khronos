function DataProvider(managementPlatform,timeTrackingPlatform){    
    this.managementPlatform,
    this.timeTrackingPlatform;

    this.platformProviders = {};
}

DataProvider.prototype = {
    constructor: DataProvider,
    getProjects:function(){
        var currentTimeTrackingPlatformProvider = this.platformProviders[this.timeTrackingPlatform];
        if(!currentTimeTrackingPlatformProvider) return undefined;
        
        return currentTimeTrackingPlatformProvider.getProjects();
    },
    getTasksForDays:function(days, cb){ 
        var currentManagementPlatformProvider = this.platformProviders[this.managementPlatform];
        if(!currentManagementPlatformProvider) cb(undefined);
        
        currentManagementPlatformProvider.getTasksForDays(days, 
            function(tasks){
                cb(tasks)
            }
        );
    },
    addPlatformProvider:function(name,provider){
        this.platformProviders[name] = provider;
    },
    setManagementPlatformName:function(platformName){
        this.managementPlatform = platformName;
    },
    setTimeTrackingPlatformName:function(platformName){
        this.timeTrackingPlatform = platformName;
    },
    trackEntities:function(entities,onEntryAdded){
        var currentTimeTrackingPlatformProvider = this.platformProviders[this.timeTrackingPlatform];
        if(!currentTimeTrackingPlatformProvider) return undefined;
        
        return currentTimeTrackingPlatformProvider.trackEntries(entities,onEntryAdded);
    }
}