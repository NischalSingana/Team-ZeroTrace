export type ParserStatus = "Draft" | "Testing" | "Validated" | "Active" | "Deprecated";

export interface VersionHistory {
  version: string;
  author: string;
  date: string;
  changes: string;
  status: ParserStatus;
}

export interface Parser {
  id: string;
  name: string;
  sourceTarget: string;
  format: string;
  currentVersion: string;
  status: ParserStatus;
  eventsProcessed: string;
  successRate: number;
  lastUpdated: string;
  description: string;
  usedBySources: number;
  avgLatency: string;
  history: VersionHistory[];
}

export const MOCK_PARSERS: Parser[] = [
  {
    id: "p-101",
    name: "Cisco ASA Firewall Default",
    sourceTarget: "Cisco ASA",
    format: "CEF",
    currentVersion: "v2.1.0",
    status: "Active",
    eventsProcessed: "1.2B",
    successRate: 99.8,
    lastUpdated: "2023-10-25T08:30:00Z",
    description: "Standard parsing rules for Cisco ASA 5500 Series firewalls outputting CEF formatted syslog.",
    usedBySources: 14,
    avgLatency: "1.2ms",
    history: [
      { version: "v2.1.0", author: "admin", date: "2023-10-25T08:30:00Z", changes: "Added IPv6 support to src and dst mapping.", status: "Active" },
      { version: "v2.0.0", author: "secops_eng", date: "2023-09-12T14:20:00Z", changes: "Major refactor to support CEF 2.0 specs.", status: "Deprecated" },
      { version: "v1.5.2", author: "admin", date: "2023-05-04T09:15:00Z", changes: "Hotfix for severity parsing.", status: "Deprecated" }
    ]
  },
  {
    id: "p-102",
    name: "Windows Security Events v3",
    sourceTarget: "Windows Server 2022",
    format: "XML / WEF",
    currentVersion: "v3.0.0-rc2",
    status: "Testing",
    eventsProcessed: "450M",
    successRate: 94.2,
    lastUpdated: "2023-10-27T11:45:00Z",
    description: "New parser for Windows Event Forwarding. Currently in staging testing phase against live stream.",
    usedBySources: 0,
    avgLatency: "2.4ms",
    history: [
      { version: "v3.0.0-rc2", author: "jdoe", date: "2023-10-27T11:45:00Z", changes: "Fixed EventID 4624 logon type extraction.", status: "Testing" },
      { version: "v3.0.0-rc1", author: "jdoe", date: "2023-10-26T16:00:00Z", changes: "Initial draft for WEF schema.", status: "Draft" }
    ]
  },
  {
    id: "p-103",
    name: "Okta System Logs",
    sourceTarget: "Okta API",
    format: "JSON",
    currentVersion: "v1.0.4",
    status: "Validated",
    eventsProcessed: "0",
    successRate: 100.0,
    lastUpdated: "2023-10-28T09:00:00Z",
    description: "Parses Okta event hooks. Validation passed 100% against schema.",
    usedBySources: 0,
    avgLatency: "1.8ms",
    history: [
      { version: "v1.0.4", author: "admin", date: "2023-10-28T09:00:00Z", changes: "Added geo-location mapping rules.", status: "Validated" },
      { version: "v1.0.3", author: "admin", date: "2023-10-27T10:00:00Z", changes: "Initial testing phase.", status: "Testing" }
    ]
  },
  {
    id: "p-104",
    name: "Legacy Apache Access",
    sourceTarget: "Apache HTTPD",
    format: "Grok",
    currentVersion: "v1.2.0",
    status: "Deprecated",
    eventsProcessed: "8.4B",
    successRate: 98.1,
    lastUpdated: "2022-11-15T08:00:00Z",
    description: "Old grok pattern for Apache. Replaced by JSON structured logging.",
    usedBySources: 2,
    avgLatency: "8.5ms",
    history: [
      { version: "v1.2.0", author: "system", date: "2022-11-15T08:00:00Z", changes: "Auto-deprecated due to inactivity.", status: "Deprecated" },
      { version: "v1.1.0", author: "admin", date: "2021-04-10T10:00:00Z", changes: "Added response size parsing.", status: "Active" }
    ]
  },
  {
    id: "p-105",
    name: "AWS CloudTrail Master",
    sourceTarget: "AWS CloudTrail",
    format: "JSON",
    currentVersion: "v4.1.0",
    status: "Active",
    eventsProcessed: "2.1B",
    successRate: 99.9,
    lastUpdated: "2023-08-10T14:30:00Z",
    description: "Standard parsing for AWS CloudTrail events from S3 bucket.",
    usedBySources: 8,
    avgLatency: "3.1ms",
    history: [
      { version: "v4.1.0", author: "secops_eng", date: "2023-08-10T14:30:00Z", changes: "Added assumed role ARN mapping.", status: "Active" }
    ]
  },
  {
    id: "p-106",
    name: "Custom Nginx (v2)",
    sourceTarget: "Nginx Ingress",
    format: "Regex",
    currentVersion: "v0.9.0",
    status: "Draft",
    eventsProcessed: "0",
    successRate: 0,
    lastUpdated: "2023-10-28T12:00:00Z",
    description: "Drafting new custom regex for Kubernetes ingress logs.",
    usedBySources: 0,
    avgLatency: "-",
    history: [
      { version: "v0.9.0", author: "jdoe", date: "2023-10-28T12:00:00Z", changes: "Initial creation.", status: "Draft" }
    ]
  }
];
