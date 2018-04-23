#!/usr/bin/swift

import Foundation
import Dispatch

let usage = "Loads entries from JIRA and Google Calendar and uploads them to Toggl."

extension String: Error {}

class Configuration {
    
    let from: Date
    let to: Date
    let skip: [Date]
    
    let clientMap: [String: String]
    let allowedProjects: [String]
    let workingDuration: TimeInterval
    let startTimeString: String
    
    let jiraUsername: String
    let jiraPassword: String
    let jiraAssignee: String
    
    static let dateFormatter: DateFormatter = {
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        dateFormatter.calendar = .fixed
        dateFormatter.locale = .fixed
        dateFormatter.timeZone = .fixed
        
        return dateFormatter
    }()
    
    init() throws {
        
        let configurationFileURL = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true).appendingPathComponent("CONFIGURATION", isDirectory: false).appendingPathExtension("json")
        let data = try Data(contentsOf: configurationFileURL)
        let dateFormatter = Configuration.dateFormatter
        
        guard let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
            
            throw "Unable to load configuration"
        }
        
        guard let fromString = json["from"] as? String, let fromDate = dateFormatter.date(from: fromString)  else {
            
            throw "Unable to load `from` date from configuration"
        }
        
        guard let toString = json["to"] as? String, let toDate = dateFormatter.date(from: toString) else {
            
            throw "Unable to load `to` date from configuration"
        }
        
        guard let clientMap = json["clientMap"] as? [String: String] else {
            
            throw "Unable to load clientMap from configuration"
        }
        
        guard let allowedProjects = json["allowedProjects"] as? [String] else {
            
            throw "Unable to load allowedProjects from configuration"
        }
        
        guard let workingDuration = json["workingDuration"] as? TimeInterval else {
            
            throw "Unable to load workingDuration from configuration"
        }
        
        guard let startTimeString = json["startTimeString"] as? String else {
            
            throw "Unable to load startTimeString from configuration"
        }
        
        guard let jiraUsername = json["jiraUsername"] as? String else {
            
            throw "Unable to load jiraUsername from configuration"
        }
        
        guard let jiraPassword = json["jiraPassword"] as? String else {
            
            throw "Unable to load jiraPassword from configuration"
        }
        
        guard let jiraAssignee = json["jiraAssignee"] as? String else {
            
            throw "Unable to load jiraAssignee from configuration"
        }
        
        self.from = fromDate
        self.to = toDate
        
        self.skip = (json["skip"] as? [String] ?? []).reduce([]) { (result, string) -> [Date] in
            
            var result = result
            
            if let date = dateFormatter.date(from: string) {
                
                result.append(date)
            }
            
            return result
        }
        
        self.clientMap = clientMap
        self.allowedProjects = allowedProjects
        self.workingDuration = workingDuration
        self.startTimeString = startTimeString
        self.jiraUsername = jiraUsername
        self.jiraPassword = jiraPassword
        self.jiraAssignee = jiraAssignee
    }
    
    lazy var workingDates: [Date] = { [unowned self] in
        
        let calendar = Calendar.fixed
        let workingWeekdayIndexes = [1, 2, 3, 4, 5] // monday to friday
        
        var date = self.from
        var workingDates: [Date] = [date]
        
        while date <= self.to {
            
            date = calendar.date(byAdding: .day, value: 1, to: date)!
            
            if !self.skip.contains(date) && workingWeekdayIndexes.contains(date.weekdayIndex(in: .fixed)) {

                workingDates.append(date)
            }
        }
        
        return workingDates
    }()
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
        
        return timeFormatter
    }()
    
    static let dateFormatter: DateFormatter = {
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        
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
}

//MARK: - URLRequest extensions

extension URLRequest {
    
    static func makeJIRAAssigneeRequest(username: String, password: String, asignee: String) -> URLRequest {
        
        guard let url = URL(string: "https://marketvision.atlassian.net/rest/api/2/user?username=\(asignee)") else {
            
            fatalError("\(#function) - Unable to generate URL")
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.authorizeWith(username: username, password: password)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        return request
    }
    
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

//MARK: - JIRA

func loadJIRAEntries(forUsername username: String, password: String, asignee: String, at date: Date) -> [TogglEntry] {
    
    var assigneeJSON: [String: Any] = [:]
    var issuesJSON: [String: Any] = [:]
    
    let semaphore = DispatchSemaphore(value: 0)
    let assigneeReuqest = URLRequest.makeJIRAAssigneeRequest(username: username, password: password, asignee: asignee)
    URLSession(configuration: .default).dataTask(with: assigneeReuqest, completionHandler: { (data, response, error) in
        
        guard let data = data else { fatalError("\(#function) - no data") }
        
        do {
            
            guard let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] else {
                
                fatalError("\(#function) - unable to load JSON for URL=\(assigneeReuqest.url!)")
            }
            
            assigneeJSON = json
            semaphore.signal()
        }
        catch {
            
            fatalError("\(error)")
        }
        
    }).resume()
    semaphore.wait()
    
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
        let user = assigneeJSON["displayName"] as? String,
        let email = assigneeJSON["emailAddress"] as? String,
        let fields = issueJSON["fields"] as? [String: Any],
        let project = fields["project"] as? [String: Any],
        let projectName = project["name"] as? String,
        let key = issueJSON["key"] as? String,
        let summary = fields["summary"] as? String
        else {
            
            fatalError("\(#function) - unable to map issue\n\(issueJSON)")
        }
        
        let entry = TogglEntry()
        entry.user = user
        entry.email = email
        entry.project = projectName
        entry.description = "\(key) \(summary)"
        return entry
    }
    
    return result
}

//MARK: - Google Calendar

func loadGoogleCalendarEntries() -> [TogglEntry] {
    
    return []
}

//MARK: - General purpose operation

func loadEntries(at date: Date, for configuration: Configuration) -> [TogglEntry] {
    
    let clientMap = configuration.clientMap
    let workingDuration = configuration.workingDuration
    let startTimeString = configuration.startTimeString
    
    let jiraUsername = configuration.jiraUsername
    let jiraPassword = configuration.jiraPassword
    let jiraAssignee = configuration.jiraAssignee
    
    var entries = loadJIRAEntries(forUsername: jiraUsername, password: jiraPassword, asignee: jiraAssignee, at: date) + loadGoogleCalendarEntries()
    entries = entries.filter({ configuration.allowedProjects.isEmpty == true || configuration.allowedProjects.contains($0.project) })
    
    let dateFormatter = TogglEntry.dateFormatter
    let timeFormatter = TogglEntry.timeFormatter
    
    guard let zeroTime = timeFormatter.date(from: "00:00:00") else { fatalError("\(#function) - Unable to load zeroTime") }
    guard var startTime = timeFormatter.date(from: startTimeString) else { fatalError("\(#function) - Unable to load startTime from string=\(startTimeString)") }
    
    //fill fixed data
    entries.forEach { (entry) in
        
        entry.client = clientMap[entry.project] ?? entry.project
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




