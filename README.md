# Khronos

Automatically generate and upload Toggl entries from JIRA

## Features
- [x] automatically loads entries from JIRA
- [ ] automatically loads entries from Google Calendar
- [x] automatically calcualte average entry time
- [x] automatically uploads entries to Toggl
- [x] gives you more time to 
- code
- play games
- deploy shits
- talking to yourself in front of the mirror
- being a party animal

## Requirements
- swift 3
- npm
- toggl-bulk-entry

## Intall on macOS

- install Xcode from AppStore
- install [Homebrew](https://brew.sh)

		brew update
		brew install npm
		npm install -g toggl-bulk-entry

## Install on Linux (Ubuntu)

	wget -q https://repo.vapor.codes/apt/keyring.gpg -O- | sudo apt-key add -
	echo "deb https://repo.vapor.codes/apt $(lsb_release -sc) main" | sudo tee /etc/apt/sources.list.d/vapor.list
	sudo apt-get update
	sudo apt-get install swift
	sudo apt-get install npm
	npm install -g toggl-bulk-entry

## Intall on Windows

- implement the scrip on a sharp language by your choise
- make it part of this repository
- let us know how we could use it

## Configuration

Before you begin, you must configure the scripts to work for you. You can do this by open the files below and edit their configurations as described.

#### `CONFIGURATION.json`
- `month` - the month for which to generate entries
- `year` - the year for which to generate entries
- `daysToSkip` - specify custom days (e.g. `[1, 5, 22]`) for which to skip generating entries.
- `client` - the client that should be set to all entries - **unfortuanetely, at this point it cannot be resolved from JIRA and has to be hardcoded**
- `allowedProjects` - specify projects for which to generate entries. If empty all projects are allowed.
- `workingDuration` - the working time in seconds. Default to 9h (from 9:00:00 to 18:00:00)
- `startTimeString` - the begining hour of the working day. Default to "9:00:00"
- `jiraUsername` - the username for your JIRA account
- `jiraPassword` - the password for your JIRA account
- `jiraAssignee` - the assignee for which to generate entries - usually you JIRA nickname

#### `TOGGL_API_TOKEN`
Set the contents of this file to  your toggle API token.

## How to use

After you have configured the scripts, you can try them out.

- run `generate_toggl_entries.swift` in terminal - this should produce a file called `toggl_entries.csv` which will contains all entries that are going to be uploaded to Toggl
- take a look at the generated entries and if nececary you can manually edit the file
- run `upload_toggle_entries.sh`
- go to your toggl account and the entries from the csv file should be present.
