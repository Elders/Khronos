# Khronos

Automatically generate and upload Toggl entries from JIRA

## Features
- [x] automatically loads entries from JIRA
	- [ ] customizable assignee status
- [x] automatically loads entries from Google Calendar
	- [ ] handle special events, like PTOs and national holidays
- [x] automatically calcualte average entry time
- [x] automatically uploads entries to Toggl
- [ ] separate service scripts
- [ ] common entries data models
- [ ] ability to use custom entries providers (alternatives of Jira and Google Calendar)
- [ ] ability to use custom entries consumers (alternatives of Toggl)
- [x] gives you more time to 
- code
- play games
- deploy shits
- talking to yourself in front of the mirror
- being a party animal

## Requirements
- swift 4
- npm
- toggl-bulk-entry
- [Google Calendar API setup](https://developers.google.com/calendar/quickstart/ruby)
- ruby (used for google calendar)

## Intall on macOS

- install Xcode from AppStore
- install [Homebrew](https://brew.sh)

		brew update
		brew install npm
		npm install -g https://github.com/Elders/node-toggl-bulk-entry.git
		gem install google-api-client --user-install

## Install on Linux (Ubuntu)

	wget -q https://repo.vapor.codes/apt/keyring.gpg -O- | sudo apt-key add -
	echo "deb https://repo.vapor.codes/apt $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/vapor.list
	sudo apt-get update
	sudo apt-get install swift
	sudo apt-get install npm
	sudo apt-get install ruby
	gem install google-api-client
	git clone git@github.com:Elders/node-toggl-bulk-entry.git
	npm install -g https://github.com/Elders/node-toggl-bulk-entry.git

## Intall on Windows

- implement the scrip on a sharp language by your choise
- make it part of this repository
- let us know how we could use it

Or take a look on how to install [Swift on Windows](https://github.com/apple/swift/blob/master/docs/Windows.md)

## Configuration

Before you begin, you must configure the scripts to work for you. You can do this by open the files below and edit their configurations as described.

#### `CONFIGURATION.json`
- `khronos` - this is the general configuration of Khronos
	- `from` - the starting date from which to generate entries, using format `yyyy-MM-dd`
	- `to` - the end date to which to generate entries, using format `yyyy-MM-dd`
	- `skip` - specify custom dates, uisng format `yyyy-MM-dd` (e.g. `["2018-03-29", 2018-02-05]`), for which to skip generating entries.
	- `workingDuration` - the working time in seconds. Default to 9h (from 9:00:00 to 18:00:00)
	- `startTimeString` - the begining hour of the working day. Default to "9:00:00"
- `jira` - configuration related to Jira
	- `username` - the username for your JIRA account
	- `password` - the password for your JIRA account or [API token](#how-to-generate-jira-api-token) 
	- `assignee` - the assignee for which to generate entries - usually you JIRA nickname
	- `allowedProjects` - specify projects for which to generate entries. If empty all projects are allowed.
- `google` - configuration related to Google Calendar
	- `calendarIDs` - list of google caliendar ids, for which to track events
	- `holidayCalendarIDs` - list of google calendar ids, for which to track holidays. You have to specify the holiday calendar id in both `calendarIDs` and `holidayCalendarIDs`.
	- `username` - the google username of the user for which to track events
- `toggl` - configuration related to Toggl
	- `email` - the email of the toggl user
	- `name` - the dispaly name of the toggl user
	- `jiraClientMap` - the client that should be set to all jira entries, based on the project name from JIRA - **since, at this point it cannot be resolved from JIRA - it has to be hardcoded**
	- `holidayClient` - the default client for holidays, used if not found in the event description.
	- `holidayProject` - the default project for holidays, used if not found in the event description.


#### `TOGGL_API_TOKEN`
Set the contents of this file to  your toggle [API token](#How-to-generate-Toggl-API-Token).

#### `GOOGLE_CALENDAR_AUTH`
This file is generated when you enable the [Google Calendar API in Step 1](https://developers.google.com/calendar/quickstart/ruby).
When you download the file - rename it to `GOOGLE_CALENDAR_AUTH.json`.

## How to use

After you have configured the scripts, you can try them out.

- (first time only) run the `get_google_calendar_entries.rb` in order to authenticate for google calendar access
- run `generate_toggl_entries.swift` in terminal - this should produce a file called `toggl_entries.csv` which will contains all entries that are going to be uploaded to Toggl
- take a look at the generated entries and if nececary you can manually edit the file
- run `upload_toggle_entries.sh`
- go to your toggl account and the entries from the csv file should be present.

## Jira integration

Khronos loads all Jira tickets that were assigned to the given assignee (specified in the `CONFIGURATION.json`) and were with `In Progress` status.

## Google Calendar integration

The google calendar integration works by loading calendar events, associated to a given set of calendars (specified in the `CONFIGURATION.json`).

Since there is no easy way to derive the client and project, needed by Toggl, the integration work by looking up the event's description for a string with the following convention:

**toggl:`client`:`project`**

where `client` and `project` are the respective client and project for which the event should be logged.

If the client and project cannot be found, the event is ignored.

There is some code written to support this + setup options, however ingeneral, there is a lot of missing information (user, project, client) on the events and calendars, so we would have to think of some convention or alternative how to manage it.

The scrip that loads the calendar events is `get_google_calendar_entries.rb` and takes the following arguments:

- date in format `yyyy-MM-dd`
- calendar id - eg. `primary` - you can get your calendar id from the settings of the calendar at calendar.google.com
- email - the email of the user for which to log the events

## How to generate JIRA API Token

Its always better and more secure to use API tokens rarther than your real password. 
- go to **API Tokens** on your [Atlassian Account page](https://id.atlassian.com/manage/api-tokens)
- click on **Create API token** and follow the instructions
- you can now use your newly created API token instead of your password in the [Configuration](#configuration)

**Keep in mid that once you generate an API Token and close the window - you will not be able to see its value any more. So store it at safe place.**

## How to generate `GOOGLE_CALENDAR_AUTH `

Follow the instructions in the [Google Calendar API in Step 1](https://developers.google.com/calendar/quickstart/ruby).

## How to generate Toggl API Token

- go to your [Toggl profile page](https://toggl.com/app/profile)
- scroll to bottom and generate a new API token