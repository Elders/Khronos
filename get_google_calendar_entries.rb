#!/usr/bin/ruby

require 'google/apis/calendar_v3'
require 'googleauth'
require 'googleauth/stores/file_token_store'
require 'fileutils'
require 'json'

OOB_URI = 'urn:ietf:wg:oauth:2.0:oob'.freeze
APPLICATION_NAME = 'Google Calendar API Ruby Quickstart'.freeze
CLIENT_SECRETS_PATH = 'GOOGLE_CALENDAR_AUTH.json'.freeze
CREDENTIALS_PATH = 'token.yaml'.freeze
SCOPE = Google::Apis::CalendarV3::AUTH_CALENDAR_READONLY
DATE = ARGV[0]
CALENDAR_ID = ARGV[1]
USER_EMAIL = ARGV[2]
##
# Ensure valid credentials, either by restoring from the saved credentials
# files or intitiating an OAuth2 authorization. If authorization is required,
# the user's default browser will be launched to approve the request.
#
# @return [Google::Auth::UserRefreshCredentials] OAuth2 credentials
def authorize
  client_id = Google::Auth::ClientId.from_file(CLIENT_SECRETS_PATH)
  token_store = Google::Auth::Stores::FileTokenStore.new(file: CREDENTIALS_PATH)
  authorizer = Google::Auth::UserAuthorizer.new(client_id, SCOPE, token_store)
  user_id = 'default'
  credentials = authorizer.get_credentials(user_id)
  if credentials.nil?
    url = authorizer.get_authorization_url(base_url: OOB_URI)
    puts 'Open the following URL in the browser and enter the ' \
         'resulting code after authorization:\n' + url
    code = $stdin.gets
    credentials = authorizer.get_and_store_credentials_from_code(
      user_id: user_id, code: code, base_url: OOB_URI
    )
  end
  credentials
end

# Initialize the API
service = Google::Apis::CalendarV3::CalendarService.new
service.client_options.application_name = APPLICATION_NAME
service.authorization = authorize


# Fetch the next 10 events for the user
MIN_TIME="#{DATE}T00:00:00+00:00"
MAX_TIME="#{DATE}T23:59:59+00:00"
events = service.list_events(CALENDAR_ID, single_events: true, order_by: 'startTime', time_min: MIN_TIME, time_max: MAX_TIME)
calendar = service.get_calendar_list(CALENDAR_ID)


result = []
events.items.each do | event |

  element = {}
  element["allDay"] = event.start.date != nil
  element["title"] = event.summary
  element["start"] = event.start.date || event.start.date_time
  element["end"] = event.end.date || event.end.date_time
  element["description"] = event.description

  if event.attendees != nil
      user = event.attendees.select { |a| a.email == USER_EMAIL }
      user = user.first
      if user != nil
          element["responseStatus"] = user.response_status
      end
  end

  result.push(element)
end

puts result.to_json

