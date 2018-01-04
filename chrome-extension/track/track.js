$.fn.extend({
    animateCss: function (animationName, callback) {
        var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
        this.addClass('animated ' + animationName).one(animationEnd, function() {
            $(this).removeClass('animated ' + animationName);
            if (callback) {
              callback();
            }
        });
        return this;
    }
});

$(document).ready(function(){
    var vm = new ViewModel();
    vm.init();
})


function ViewModel(){
    var self = this;

    this.calendar = {};
    this.dataProvider = new DataProvider();
    this.selectedEvent = {};
    this.projectBindings = [];
    this.timeTrackingPlatformProjects = [];
    this.projectBindModal = new ProjectBindModal();
    this.entryDetailsComponent = new EntryDetailsComponent(this.calendar);
    window.$scope = self;

    this._loadAvailableManagementPlatforms = function _loadAvailableManagementPlatforms(){
        //in the future you can load from some storage the informatio
        var result = [];
        
        result.push({
            'name' : 'Jira',
            'img' : 'https://dt-cdn.net/assets/images/gfx/icons/tech/jira-249fcf393c.svg'
        });

        return result;
    }

    this._loadAvailableTimeTrackingPlatforms = function _loadAvailableTimeTrackingPlatforms(){
        //in the future you can load from some storage the information

        var result = [];

        result.push({
            'name' : 'Toggl',
            'img' : 'https://marketplace-cdn.atlassian.com/files/images/e3e48a5a-c9c6-4220-9113-d9cc60f6fbe0.png'
        });

        return result;
    }

    this._loadDataProviders = function _loadDataProviders(){

        var togglProvider = new TogglProvider();
        var jiraProvider = new JiraProvider();

        self.dataProvider.addPlatformProvider('Toggl',togglProvider);
        self.dataProvider.addPlatformProvider('Jira',jiraProvider);
    }

    this._updateProjectBindings = function _updateProjectBindings(projectBindings){
        var $bindingsContainer = $("#container-project-bindings");
        $bindingsContainer.html("");

        for(key in projectBindings){
            var timeTrackingProjectName =  projectBindings[key].timeTrackingProject == undefined ? "None" : projectBindings[key].timeTrackingProject.name;

            var bindingElementHtml = '<div class="row text-center binding-element" style="background-color:'+projectBindings[key].managementProject.backgroundColor +'">' +
                '<div class="col-md-6">' +
                    '<p><em class="binding-element-name">'+projectBindings[key].managementProject.name+'</em></p>' +
                '</div>' +
                '<div class="col-md-6">' + 
                    '<em class="binding-element-binding">' + timeTrackingProjectName + '</em>' +
                '</div>' +
            '</div>';
            
            $bindingsContainer.append(bindingElementHtml);
        }
    }

    this._initPlatformsChoiceComponent = function _initPlatformsChoiceComponent(){
        $('#container-platform-choice').animateCss('slideInUp');

        var $availableManagementPlatformsList =  $('#dropDownAvailableManagementPlatforms').parent().children('ul').first();
        var availableManagementPlatforms = self._loadAvailableManagementPlatforms();
        for(var i = 0; i < availableManagementPlatforms.length; i++){
            $availableManagementPlatformsList.append('<li><a href="#" class="text-center">'+
            '<img src="'+ availableManagementPlatforms[i].img +'" style="height: 1.5em;margin-right: 20px;">' + 
            availableManagementPlatforms[i].name + 
            '</a></li>');
        }

        var $availableTimeTrackingPlatforms =  $('#dropDownAvailableTimeTrackingPlatforms').parent().children('ul').first();
        var availableTimeTrackingPlatforms =  self._loadAvailableTimeTrackingPlatforms();
        for(var i = 0; i < availableTimeTrackingPlatforms.length; i++){
            $availableTimeTrackingPlatforms.append('<li><a href="#" class="text-center">'+
            '<img src="'+ availableTimeTrackingPlatforms[i].img +'" style="height: 1.5em;margin-right: 20px;">' + 
            availableTimeTrackingPlatforms[i].name + 
            '</a></li>');
        }

        $availableManagementPlatformsList.click(function(){
            var selectedValue = $(this).text();
            self.dataProvider.setManagementPlatformName(selectedValue.trim());

            $('#dropDownAvailableManagementPlatforms').text(self.dataProvider.managementPlatform + ' ');
            $('#dropDownAvailableManagementPlatforms').append(' <span class="caret"></span>');

            //enable continue btn if all set
            if(self.dataProvider.timeTrackingPlatform)
                $('#btn-platforms-chosen').removeClass('disabled');
        });

        $availableTimeTrackingPlatforms.click(function(){
            var selectedValue = $(this).text();
            self.dataProvider.setTimeTrackingPlatformName(selectedValue.trim());

            $('#dropDownAvailableTimeTrackingPlatforms').text(self.dataProvider.timeTrackingPlatform + ' ');
            $('#dropDownAvailableTimeTrackingPlatforms').append(' <span class="caret"></span>');

            //enable continue btn if all set
            if(self.dataProvider.managementPlatform)
                $('#btn-platforms-chosen').removeClass('disabled');
        });
        
        $('#btn-platforms-chosen').click(function(){
            if($(this).hasClass('disabled'))
                return;

            debugger;

            $('#container-platform-choice').animateCss('slideOutDown', function () {
                $('#container-platform-choice').addClass('hidden');

                self.loadCalendarScreen();
            });
                
            
        })
    }

    this.loadCalendarScreen = function loadCalendarScreen(){
        this.timeTrackingPlatformProjects = self.dataProvider.getProjects();
        
        $('#container-trackboard').removeClass('hidden');
        $('#calendar').fullCalendar('next');
        $('#calendar').fullCalendar('prev');
        $('#container-trackboard').animateCss('slideInUp');
    }

    this.loadCalendarElement = function loadCalendarElement(){
        self.calendar = {
            projects : [],
            datesToTrack : [],
            renderedEvents: {
                indexes: [],
                objects: []
            }
        };

        //calendar init
        $('#calendar').fullCalendar({
            // put your options and callbacks here
            dayClick: function(date){
                var removed = false;
                
                for(var a = 0; a < self.calendar.datesToTrack.length;a++){
                    var currentDate = self.calendar.datesToTrack[a];
                    
                    if(currentDate.isSame(date)){
                        $(this).css('background-color','white');
                        self.calendar.datesToTrack.splice(a, 1);
                        removed = true;
                        break;
                    }
                }

                if(removed == false){
                    self.calendar.datesToTrack.push(date);
                    $(this).css('background-color','green');
                }
                
                

            },
            eventClick: eventClick,
            // events: function( start, end, callback ) {
            //     for(var i = 0; i < self.calendar.renderedEvents.objects.length;i++){
            //         $('#calendar').fullCalendar( 'renderEvent', self.calendar.renderedEvents.objects[i]);
            //     }
            // }
            // eventRightclick: function(event, jsEvent, view) {
            //     alert('an event has been rightclicked!');
            //     // Prevent browser context menu:
            //     return false;
            // }

        })

        //on click prev month, render again all events
        $('body').on('click', 'button.fc-prev-button', function() {
            for(var i = 0; i < self.calendar.renderedEvents.objects.length;i++){
                $('#calendar').fullCalendar( 'renderEvent', self.calendar.renderedEvents.objects[i]);
            }
        });
        
        //on click next month, render again all events
        $('body').on('click', 'button.fc-next-button', function() {
            for(var i = 0; i < self.calendar.renderedEvents.objects.length;i++){
                $('#calendar').fullCalendar( 'renderEvent', self.calendar.renderedEvents.objects[i]);
            }
        });

        //on event click load information about the event
        function eventClick(calEvent, jsEvent, view){
            self.entryDetailsComponent.load(calEvent.id,calEvent.entry.name,calEvent.entry.projectName,calEvent.entry.key,calEvent.entry.date);
            self.entryDetailsComponent.render();
        }

        //calculate entries for selected dates
        $('#btn-calendar-calculate').click(function(){
            self.dataProvider.getTasksForDays(self.calendar.datesToTrack, 
                function(tasks){
                    debugger;
                    for(var i = 0; i < tasks.length;i++){
                        //Set bg color for the events base on the project
                        if(self.calendar.projects[ tasks[i].projectName] == undefined){
                            self.calendar.projects[ tasks[i].projectName] = new Project( tasks[i].projectName);
                            self.calendar.projects[ tasks[i].projectName].backgroundColor = '#'+(0x1000000+(Math.random())*0xffffff).toString(16).substr(1,6);
                            
                            var projectBinding = new ProjectBinding();
                            projectBinding.managementProject = self.calendar.projects[ tasks[i].projectName];
                            
                            self.projectBindings.push(projectBinding)
                        }

                       
        
                        var eventToRender =  {
                            title  : "[" + tasks[i].key + "] " +  tasks[i].name,
                            start  : tasks[i].date,
                            allDay : true,
                            editable : true,
                            urlToPlatform : "https://marketvision.atlassian.net/browse/" + tasks[i].key,
                            backgroundColor : self.calendar.projects[ tasks[i].projectName].backgroundColor,
                            entry:tasks[i]
                        }
                        
                        eventToRender.id = eventToRender.title + "@@" + eventToRender.start;

                        if( self.calendar.renderedEvents.indexes.indexOf(eventToRender.title + "@@" + eventToRender.start) == -1){
                            $('#calendar').fullCalendar( 'renderEvent', eventToRender);
                            self.calendar.renderedEvents.indexes.push(eventToRender.title + "@@" + eventToRender.start);
                            self.calendar.renderedEvents.objects.push(eventToRender);
                        }
                    }
        
                    self._updateProjectBindings(self.projectBindings);
                });
        })

        
        //track selected entries to the time tracking platform 
        $('#btn-track-issues').click(function(){
            var entriesToTrack = [];
            var entriesByDate = [];

            var allEvents = $('#calendar').fullCalendar( 'clientEvents')

            for(var i = 0; i < allEvents.length; i++){
                var currentEvent = allEvents[i];
                var currentDate = currentEvent.entry.date;

                if(entriesByDate[currentDate] === undefined)
                    entriesByDate[currentDate] = [];

                    entriesByDate[currentDate].push(currentEvent);
            }

            for(var date in entriesByDate){
                var entriesCountForCurrentDate = entriesByDate[date].length;
                var hoursPerTask = 9 / entriesCountForCurrentDate;

                for(var entry in entriesByDate[date]){
                    var currentEntry = entriesByDate[date][entry].entry;

                    var entryToAdd = new ToggleEntry();

                    entryToAdd.description = '[' + currentEntry.key + '] ' + currentEntry.name;
                    var projectName = _.find($scope.projectBindings, function(o){return o.managementProject.name == currentEntry.projectName}).timeTrackingProject.name;

                    if(!projectName) return; 

                    entryToAdd.pid =  _.find(self.timeTrackingPlatformProjects, function(o) { return o.name === projectName; }).id; //currentEntry.projectName
                    
                    entryToAdd.start = moment(date, 'YYYY/MM/DD');
                    entryToAdd.start.set('hour', 9 + (Math.floor(hoursPerTask) * entry ))
                    entryToAdd.start.set('minute', (hoursPerTask -  Math.floor(hoursPerTask)) * entry );
                    entryToAdd.start =  entryToAdd.start.toISOString();

   
                    entryToAdd.created_with = "Khronos.Chrome";

                    entryToAdd.duration = hoursPerTask * 60 * 60;

                    entriesToTrack.push(entryToAdd);
                }
            }


            self.dataProvider.trackEntities(entriesToTrack, function(entryAdded){   
                $.notify({
                    icon: "pe-7s-gift",
                    message: "Entry ["+entryAdded.data.description+"] onb " + entryAdded.data.start+" has been added!"
                    
                },{
                    type: 'success',
                    timer: 20000
                });
            });
        })
    }

    this.loadProjectBindings = function loadProjectBindings(){
        //Bind Project Modal Events
        $(document).on("click",".binding-element",function(ev){
            var projectName = $(this).find('.binding-element-name').text();
            var projectBindedProjectName = $(this).find('.binding-element-binding').text();

            self.projectBindModal.load(self.timeTrackingPlatformProjects, projectName,projectBindedProjectName);
            $('#bind-project-modal').modal('show');
        })
        $(document).on("click","#btn-project-bind-save",function(ev){
            if($(this).hasClass('disabled'))
                return;
            
            var currentProject = _.find(self.projectBindings, function(o) { return o.managementProject.name ===  self.projectBindModal.projectToWhichToBind; });
            currentProject.timeTrackingProject = new Project(self.projectBindModal.projectToBind);

            

            self._updateProjectBindings(self.projectBindings);
        })
        $(document).on('hiden.bs.modal','#bind-project-modal', function () { 
            self.projectBindModal.clear();
        });  
    }

    this.init = function init(){
        self._loadDataProviders();
        self._initPlatformsChoiceComponent();
        self.loadCalendarElement();
        self.loadProjectBindings();
    }

    
}





function Task(){
    this.key,
    this.name,
    this.projectName,
    this.date;
}


function ProjectBinding(){
    this.managementProject = {},
    this.timeTrackingProject = undefined
}


function Project(project){
    this.name = project;
    this.id;
    this.backgroundColor = "";
}


function ProjectBindModal(){
    this.projectToWhichToBind;
    this.projectToBind;
}

ProjectBindModal.prototype = {
    constructor:ProjectBindModal,
    clear:function(){
        //clear projects dropdown placeholder
        $('#dropDownTimeTrackingProjectsToBind').text('Projects');
        $('#dropDownTimeTrackingProjectsToBind').append(' <span class="caret"></span>');

        //clear current project
        this.projectToBind = undefined;
        this.projectToWhichToBind = undefined;
        $('#btn-project-bind-save').addClass('disabled');
    },
    setChosenProject(projectName){
        this.projectToBind = projectName;
    },
    setProjectToWhichToBind(projectName){
        this.projectToWhichToBind = projectName;
    },
    load:function(projectsAvailableForBinding,projectToWhichToBind, projectToBind){
        this.clear();
        this.loadDropDownProjects(projectsAvailableForBinding);
        this.setProjectToWhichToBind(projectToWhichToBind);

        if(projectToBind){
            this.setDropDownChosenText(projectToBind);
        }
    },
    loadDropDownProjects: function(projectsAvailableForBinding){
        var self = this;
        var $availableTimeTrackingPlatforms = $('#dropDownTimeTrackingProjectsToBind').parent().children('ul').first();
        $availableTimeTrackingPlatforms.html("");

        for(var i = 0; i < projectsAvailableForBinding.length; i++){
            $availableTimeTrackingPlatforms.append('<li><a href="#" class="text-center">' + projectsAvailableForBinding[i].name + '</a></li>');
        }
        
        $("#dropDownTimeTrackingProjectsToBind").parent().on("click", "li", function(event){
            var selectedValue = $(this).text().trim();
            self.setChosenProject(selectedValue);
            self.setDropDownChosenText(selectedValue);
            $('#btn-project-bind-save').removeClass('disabled')
        })
    },
    setDropDownChosenText: function(text){
        $('#dropDownTimeTrackingProjectsToBind').text(text + ' ');
        $('#dropDownTimeTrackingProjectsToBind').append(' <span class="caret"></span>');
    }
}

function EntryDetailsComponent(calendar){
    this.self = this;
    this.task = {
        name:"",
        projectName:"",
        key: "",
        date:""
    }
    this.calendar = calendar;
}

EntryDetailsComponent.prototype = {
    constructor:EntryDetailsComponent,
    load: function(_id,name,projectName,key,date){
        this.self._id = _id;
        this.self.name = name;
        this.self.projectName = projectName;
        this.self.key = key;
        this.self.date = date;

        this.self.initDelete();
    },
    render: function(){
        $taskComponent = $("#task-component");
        
        $taskComponent.find(".title").text('[' + this.self.key + '] ' + this.self.name);
        $taskComponent.find(".date").text(this.self.date);
        $taskComponent.find(".project-name").text(this.self.projectName);
        $taskComponent.find(".issue-link").text(this.self.key);
        $taskComponent.find(".issue-link").attr('href','https://marketvision.atlassian.net/browse/' + this.self.key);
    },
    initDelete: function(){
        var self = this.self;
        $("#task-component").find(".btn-delete").click(function(){
            $("#calendar").fullCalendar('removeEvents', [self._id]);
            debugger;

            _

            $scope.calendar.renderedEvents.objects = _.without($scope.calendar.renderedEvents.objects, _.find($scope.calendar.renderedEvents.objects, function(o) { return o.id ===  self._id; }));
            $scope.calendar.renderedEvents.indexes = _.without($scope.calendar.renderedEvents.indexes, _.find($scope.calendar.renderedEvents.indexes, function(o) { return o ===  self._id; }));
            
            self.clear();
        });
    },
    clear: function(){
        this.self._id = '';
        this.self.name = '';
        this.self.projectName = '';
        this.self.key = '';
        this.self.date = '';

        this.self.render()
    }
}