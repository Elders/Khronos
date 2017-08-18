#!/bin/bash

#requires - toggl-bulk-entry from npm
TOGGL_API_TOKEN=$(cat ./TOGGL_API_TOKEN) toggl-bulk-entry ./toggl_entries.csv
