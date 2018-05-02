#!/usr/bin/swift

import Foundation
import Dispatch

let usage = "Loads entries from JIRA and Google Calendar and uploads them to Toggl."

extension String: Error {}

@discardableResult
func shell(_ args: String...) -> (Int32, String?) {
    let task = Process()
    task.launchPath = "/usr/bin/env"
    task.arguments = args
    
    let pipe = Pipe()
    task.standardOutput = pipe
    
    task.launch()
    task.waitUntilExit()
    
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    let string = String(data: data, encoding: .utf8)
    
    return (task.terminationStatus, string)
}

struct Configuration: Codable {
    
    struct Khronos: Codable {
        
        let from: Date
        let to: Date
        let skip: [Date]
        let workingDuration: TimeInterval
        let startTimeString: String
    }
    
    struct Jira: Codable {
        
        let username: String
        let password: String
        let assignee: String
        let allowedProjects: [String]
    }
    
    struct Google: Codable {
        
        let calendarIDs: [String]
        let username: String
    }
    
    struct Toggl: Codable {
        
        let jiraClientMap: [String: String]
        let email: String
        let name: String
    }
    
    static let dateFormatter: DateFormatter = {
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.calendar = .fixed
        dateFormatter.locale = .fixed
        dateFormatter.timeZone = .fixed
        
        return dateFormatter
    }()
    
    let khronos: Khronos
    let jira: Jira
    let google: Google
    let toggl: Toggl
    
    init() throws {
        
        let configurationFileURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true).appendingPathComponent("CONFIGURATION", isDirectory: false).appendingPathExtension("json")
        let data = try Data(contentsOf: configurationFileURL)
        let dateFormatter = Configuration.dateFormatter
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .formatted(dateFormatter)
        self = try decoder.decode(Configuration.self, from: data)
    }
    
    var workingDates: [Date] {
        
        let calendar = Calendar.fixed
        let workingWeekdayIndexes = [1, 2, 3, 4, 5] // monday to friday
        
        var date = self.khronos.from
        var workingDates: [Date] = [date]
        
        while date <= self.khronos.to {
            
            date = calendar.date(byAdding: .day, value: 1, to: date)!
            
            if !self.khronos.skip.contains(date) && workingWeekdayIndexes.contains(date.weekdayIndex(in: .fixed)) {

                workingDates.append(date)
            }
        }
        
        return workingDates
    }
}

class TogglEntry {
    
    var user = ""
    var email = ""
    var client = ""
    var project = ""
    var task = ""
    var description = ""
    var billable = ""
    var startDate = ""
    var startTime = ""
    var endDate = ""
    var endTime = ""
    var duration = ""
    var tags = ""
    var amount = ""
    
    static var csvHeader: String {
        
        return "User,Email,Client,Project,Task,Description,Billable,Start date,Start time,End date,End time,Duration,Tags,Amount ()"
    }
    
    var csvRow: String {
        
        return [user, email, client, project, task, description, billable, startDate, startTime, endDate, endTime, duration, tags, amount].joined(separator: ",")
    }
    
    static let timeFormatter: DateFormatter = {
        
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm:ss"
        timeFormatter.calendar = .fixed
        timeFormatter.locale = .fixed
        timeFormatter.timeZone = .fixed
        
        return timeFormatter
    }()
    
    static let dateFormatter: DateFormatter = {
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.calendar = .fixed
        dateFormatter.locale = .fixed
        dateFormatter.timeZone = .fixed
        
        return dateFormatter
    }()
    
    var durationTimeInterval: TimeInterval {
        
        guard let durationDate = type(of: self).timeFormatter.date(from: self.duration) else {
            
            return 0
        }
        
        let hours = TimeInterval(Calendar.fixed.component(.hour, from: durationDate))
        let minutes = TimeInterval(Calendar.fixed.component(.minute, from: durationDate))
        let duration = (hours * 60 * 60) + (minutes * 60)
        
        return duration
    }
    
    func durationString(from timeInterval: TimeInterval) -> String {
        
        let timeFormatter = TogglEntry.timeFormatter
        
        let zeroTime = timeFormatter.date(from: "00:00:00")!
        let durationTime = zeroTime.addingTimeInterval(timeInterval)
        return timeFormatter.string(from: durationTime)
    }
    
    func update(withEventDescription description: String?) -> Bool {
        
        guard let description = description else {
            
            return false
        }
        
        do {
            
            //match the toggle client and project and set them
            let regex = try NSRegularExpression(pattern: "toggl:(?<client>\\w*):(?<project>\\w*[\\s\\-]?\\w*)")
            let matches = regex.matches(in: description, options: [])
            
            guard matches.count == 3 else {
                
                return false
            }
            
            self.client = matches[1]
            self.project = matches[2]
            
            return true
        }
        catch {
        
            return false
        }
    }
}

struct GoogleCalendarEvent: Codable {
    
    enum ResponseStatus: String, Codable {
        
        case needsAction = "needsAction"
        case declined = "declined"
        case tentative = "tentative"
        case accepted = "accepted"
    }
    
    let allDay: Bool
    let title: String
    let start: String
    let end: String
    let description: String?
    let responseStatus: ResponseStatus?
    
    static let timeFormatter: DateFormatter = {
        
        let timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm:ss"
        timeFormatter.calendar = .fixed
        timeFormatter.locale = .fixed
        timeFormatter.timeZone = .fixed
        
        return timeFormatter
    }()
    
    static let partialDayDateFormatter: ISO8601DateFormatter = {
        
        let dateFormatter = ISO8601DateFormatter()
        return dateFormatter
    }()
    
    var durationString: String? {
        
        if self.allDay {
            
            return nil
        }
        
        let dateFormatter = GoogleCalendarEvent.partialDayDateFormatter
        let timeFormatter = GoogleCalendarEvent.timeFormatter
        
        guard let startDate = dateFormatter.date(from: self.start), let endDate = dateFormatter.date(from: self.end), let durationDate = Calendar.fixed.date(from: Calendar.fixed.dateComponents([.hour, .minute], from: startDate, to: endDate)) else {
            
            return nil
        }
        
        let durationString = timeFormatter.string(from: durationDate)
        return durationString
    }
}

//MARK: - URLRequest extensions

extension URLRequest {
    
    static func makeJIRAIssuesRequest(username: String, password: String, asignee: String, date: Date) -> URLRequest {
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy/MM/dd"
        let dateString = dateFormatter.string(from: date)
        
        guard let url = URL(string: "https://marketvision.atlassian.net/rest/api/2/search?jql=(assignee%20was%20\(asignee)%20on%20(%22\(dateString)%22))%20and%20(status%20was%20in%20(%22In%20Progress%22)%20on%20(%22\(dateString)%22))%20OR%20(assignee%20%3D%20\(asignee)%20AND%20status%20was%20in%20(%22In%20Progress%22)%20on%20(%22\(dateString)%22))") else {
            
            fatalError("\(#function) - Unable to generate URL")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.authorizeWith(username: username, password: password)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        return request
    }
    
    mutating func authorizeWith(username: String, password: String) {
        
        guard let credentials = "\(username):\(password)".data(using: .utf8)?.base64EncodedString() else {
            
            fatalError("\(#function) - Unable to generate Authorization header for username=\(username), password=\(password)")
        }
        
        let value = "Basic " + credentials
        self.setValue(value, forHTTPHeaderField: "Authorization")
    }
}

//MARK: - Date extensions

extension Date {
    
    func range(of smaller: Calendar.Component, in larger: Calendar.Component, in calendar: Calendar) -> Range<Int>? {
        
        return calendar.range(of: smaller, in: larger, for: self)
    }
    
    func daysInMonth(in calendar: Calendar) -> Int? {
        
        return self.range(of: .day, in: .month, in: calendar)?.count
    }
    
    public func weekdayIndex(in calendar: Calendar) -> Int {
        
        return self.component(.weekday, in: calendar) - 1
    }
    
    public func component(_ component: Calendar.Component, in calendar: Calendar) -> Int {
        
        return calendar.component(component, from: self)
    }
}

extension Locale {
    
    //this is computed property in order to avoid mutation
    public static var fixed: Locale {
        
        return Locale(identifier: "en_US_POSIX")
    }
}

extension TimeZone {
    
    //this is computed property in order to avoid mutation
    public static var fixed: TimeZone {
        
        guard let timeZone = TimeZone(identifier: "UTC") else {
            
            fatalError("Unable to load UTC fixed timeZone")
        }
        
        return timeZone
    }
}

extension Calendar {
    
    //this is computed property in order to avoid mutation
    public static var fixed: Calendar {
        
        var calendar = Calendar(identifier: .gregorian)
        calendar.locale = .fixed
        calendar.timeZone = .fixed
        
        return calendar
    }
}

//MARK: - NSRegularExpression extensions

extension NSRegularExpression {
    
    public func matches(in string: String, options: NSRegularExpression.MatchingOptions) -> [String] {
        
        let range = NSRange(location: 0, length: string.count)
        return self.matches(in: string, options: options, range: range).flatMap({ (result) -> [String] in
            
            var matches: [String] = []
            
            for i in 0..<result.numberOfRanges {
                
                let range = result.range(at: i)
                
                let startIndex = string.index(string.startIndex, offsetBy: range.location)
                let endIndex = string.index(startIndex, offsetBy: range.length - 1)
                let match = string[startIndex...endIndex]
                
                matches.append(String(match))
            }
            
            return matches
        })
    }
}


//MARK: - JIRA

func loadJIRAEntries(forUsername username: String, password: String, asignee: String, at date: Date) -> [TogglEntry] {
    
    var issuesJSON: [String: Any] = [:]
    
    let semaphore = DispatchSemaphore(value: 0)
    let issuesReuqest = URLRequest.makeJIRAIssuesRequest(username: username, password: password, asignee: asignee, date: date)
    URLSession(configuration: .default).dataTask(with: issuesReuqest, completionHandler: { (data, response, error) in
        
        guard let data = data else { fatalError("\(#function) - no data") }
        
        do {
            
            guard let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
                
                fatalError("\(#function) - unable to load JSON for URL=\(issuesReuqest.url!)")
            }
            
            issuesJSON = json
            semaphore.signal()
        }
        catch {
            
            fatalError("\(error)")
        }
        
    }).resume()
    semaphore.wait()
    
    guard let issues = issuesJSON["issues"] as? [[String: Any]] else { fatalError("\(#function) - unable to cast issues") }
    let result = issues.map { (issueJSON) -> TogglEntry in
        
        guard
        let fields = issueJSON["fields"] as? [String: Any],
        let project = fields["project"] as? [String: Any],
        let projectName = project["name"] as? String,
        let key = issueJSON["key"] as? String,
        let summary = fields["summary"] as? String
        else {
            
            fatalError("\(#function) - unable to map issue\n\(issueJSON)")
        }
        
        let entry = TogglEntry()
        entry.project = projectName
        entry.description = "\(key) \(summary)"
        return entry
    }
    
    return result
}

//MARK: - Google Calendar

func loadGoogleCalendarEntries(at date: Date, for configuration: Configuration) -> [TogglEntry] {
    
    let dateFormatter = Configuration.dateFormatter
    let dateString = dateFormatter.string(from: date)
    let email = configuration.google.username
    var entries: [TogglEntry] = []
    
    for calendarID in configuration.google.calendarIDs {

        print("\(dateString)    \(calendarID)")
        let output = shell("./get_google_calendar_entries.rb", dateString, calendarID, email)
        
        if let eventsJSONData = output.1?.data(using: .utf8) {
            
            let events = try! JSONDecoder().decode([GoogleCalendarEvent].self, from: eventsJSONData)
            
            
            for event in events {
                
                if event.responseStatus != .accepted {
                    
                    continue
                }
                
                if event.allDay {
                    
                    let entry = TogglEntry()

                    entry.description = event.title
                    entry.duration = entry.durationString(from: configuration.khronos.workingDuration)
                    
                    if entry.update(withEventDescription: event.description) {
                        
                        entries.append(entry)
                    }
                    
                    continue
                }
                
                if let duration = event.durationString {
                    
                    let entry = TogglEntry()

                    entry.description = event.title
                    entry.duration = duration
                    
                    if entry.update(withEventDescription: event.description) {
                        
                        entries.append(entry)
                    }
                }
            }
        }
    }
    
    return entries
}

//MARK: - General purpose operation

func loadEntries(at date: Date, for configuration: Configuration) -> [TogglEntry] {
    
    let clientMap = configuration.toggl.jiraClientMap
    let workingDuration = configuration.khronos.workingDuration
    let startTimeString = configuration.khronos.startTimeString
    
    let jiraUsername = configuration.jira.username
    let jiraPassword = configuration.jira.password
    let jiraAssignee = configuration.jira.assignee
    
    let googleCalendarEntries =  loadGoogleCalendarEntries(at: date, for: configuration)
    let wholeDayCalendarEntries = googleCalendarEntries.filter({ $0.duration == $0.durationString(from: configuration.khronos.workingDuration) })
    let partialDayCalendarEntries = googleCalendarEntries.filter({ $0.duration != $0.durationString(from: configuration.khronos.workingDuration) })
    
    let jiraEntries = loadJIRAEntries(forUsername: jiraUsername, password: jiraPassword, asignee: jiraAssignee, at: date)
    jiraEntries.forEach { entry in
        
        entry.client = clientMap[entry.project] ?? entry.project
    }
    
    var entries = jiraEntries + partialDayCalendarEntries
    entries.forEach { entry in
        
        entry.user = configuration.toggl.name
        entry.email = configuration.toggl.email
    }
    
    entries = entries.filter({ configuration.jira.allowedProjects.isEmpty == true || configuration.jira.allowedProjects.contains($0.project) })
    
    //the there are whole day entries - take the appropriate one and use it instead of everything else
    if wholeDayCalendarEntries.isEmpty == false {
        
        entries = [wholeDayCalendarEntries.first!]
    }
    
    let dateFormatter = TogglEntry.dateFormatter
    let timeFormatter = TogglEntry.timeFormatter
    
    guard let zeroTime = timeFormatter.date(from: "00:00:00") else { fatalError("\(#function) - Unable to load zeroTime") }
    guard var startTime = timeFormatter.date(from: startTimeString) else { fatalError("\(#function) - Unable to load startTime from string=\(startTimeString)") }
    
    //fill fixed data
    entries.forEach { (entry) in
        
        entry.billable = "Yes"
        entry.startDate = dateFormatter.string(from: date)
        entry.endDate = entry.startDate
    }
    
    //perform calculation over entries duration and times and fill it
    let entriesWithKnownDuration = entries.filter({ $0.duration.isEmpty == false })
    let entriesWithUnknownDuration = entries.filter({ $0.duration.isEmpty == true })
    let knownDuration = entriesWithKnownDuration.reduce(0, { $0 + $1.durationTimeInterval })
    
    //the time duration left that needs to be split between entries with unknown duration
    let durationToSplit = workingDuration - knownDuration
    let durationPerEntry = TimeInterval(durationToSplit) / TimeInterval(entriesWithUnknownDuration.count)
    
    //fill start, stop time and duration for entries that does not have known duration
    entriesWithUnknownDuration.forEach { (entry) in
        
        let endTime = startTime.addingTimeInterval(durationPerEntry)
        let durationTime = zeroTime.addingTimeInterval(durationPerEntry)
        
        entry.startTime = timeFormatter.string(from: startTime)
        entry.endTime = timeFormatter.string(from: endTime)
        entry.duration = timeFormatter.string(from: durationTime)
        
        startTime = endTime
    }
    
    //fill start and stop time for entries that have known duration
    entriesWithKnownDuration.forEach { (entry) in
        
        let endTime = startTime.addingTimeInterval(entry.durationTimeInterval)
        
        entry.startTime = timeFormatter.string(from: startTime)
        entry.endTime = timeFormatter.string(from: endTime)
        
        startTime = endTime
    }
    
    return entries
}

func write(entries: [TogglEntry]) throws {
    
    let csv = TogglEntry.csvHeader + "\n" + entries.map({ $0.csvRow }).joined(separator: "\n")
    let csvFileURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true).appendingPathComponent("toggl_entries", isDirectory: false).appendingPathExtension("csv")
    try csv.write(to: csvFileURL, atomically: true, encoding: .utf8)
}

//MARK: - Script Execution

do {
    
    let configuration = try Configuration()
    var entries: [TogglEntry] = []
    let queue = OperationQueue()

    for day in configuration.workingDates {

        queue.addOperation {

            entries.append(contentsOf: loadEntries(at: day, for: configuration))
        }
    }

    queue.waitUntilAllOperationsAreFinished()

    entries.sort(by: { (e1, e2) in e1.startDate == e2.startDate ? e1.startTime < e2.startTime : e1.startDate < e2.startDate })
    try write(entries: entries)
}
catch {
    
    print(error)
}




