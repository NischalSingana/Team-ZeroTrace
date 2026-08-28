export type FieldType = "keyword" | "ip" | "long" | "date" | "boolean" | "float" | "object";

export type SchemaCategory = 
  "Event" | "Timestamp" | "Source" | "Destination" | "User" | 
  "Network" | "Device" | "Application" | "Cloud" | "Threat" | 
  "Processing" | "Lineage" | "Raw";

export interface SchemaField {
  id: string;
  category: SchemaCategory;
  name: string;
  type: FieldType;
  description: string;
  required: boolean;
  examples: string[];
  sourceMappings: string[];
  usageFrequency: number; // percentage 0-100
}

export const CATEGORIES: { name: SchemaCategory; count: number }[] = [
  { name: "Event", count: 12 },
  { name: "Timestamp", count: 4 },
  { name: "Source", count: 15 },
  { name: "Destination", count: 15 },
  { name: "User", count: 8 },
  { name: "Network", count: 10 },
  { name: "Device", count: 6 },
  { name: "Application", count: 5 },
  { name: "Cloud", count: 9 },
  { name: "Threat", count: 7 },
  { name: "Processing", count: 3 },
  { name: "Lineage", count: 2 },
  { name: "Raw", count: 1 },
];

export const MOCK_SCHEMA: SchemaField[] = [
  // Event
  {
    id: "event.action",
    category: "Event",
    name: "event.action",
    type: "keyword",
    description: "The action captured by the event. This describes the behavior or activity (e.g., login, network_flow, file_write).",
    required: true,
    examples: ["login", "network_connection", "malware_detected"],
    sourceMappings: ["action", "act", "event_name", "EventAction"],
    usageFrequency: 98
  },
  {
    id: "event.outcome",
    category: "Event",
    name: "event.outcome",
    type: "keyword",
    description: "The outcome of the event. Determines if the action was successful or failed.",
    required: true,
    examples: ["success", "failure", "unknown", "denied"],
    sourceMappings: ["result", "outcome", "status", "res"],
    usageFrequency: 96
  },
  {
    id: "event.severity",
    category: "Event",
    name: "event.severity",
    type: "long",
    description: "Numeric severity of the event, normalized to a 1-10 scale where 10 is most critical.",
    required: false,
    examples: ["1", "5", "8", "10"],
    sourceMappings: ["severity", "sev", "level", "priority"],
    usageFrequency: 85
  },
  
  // Source
  {
    id: "source.ip",
    category: "Source",
    name: "source.ip",
    type: "ip",
    description: "IP address of the source (client). Can be IPv4 or IPv6.",
    required: false,
    examples: ["192.168.1.50", "10.0.0.2", "fe80::1ff:fe23:4567:890a"],
    sourceMappings: ["src", "src_ip", "sourceAddress", "client_ip", "srcaddr"],
    usageFrequency: 92
  },
  {
    id: "source.port",
    category: "Source",
    name: "source.port",
    type: "long",
    description: "Port of the source.",
    required: false,
    examples: ["443", "53", "3389", "54321"],
    sourceMappings: ["spt", "src_port", "sourcePort"],
    usageFrequency: 88
  },
  {
    id: "source.mac",
    category: "Source",
    name: "source.mac",
    type: "keyword",
    description: "MAC address of the source device.",
    required: false,
    examples: ["00:1A:2B:3C:4D:5E"],
    sourceMappings: ["smac", "src_mac"],
    usageFrequency: 45
  },

  // Destination
  {
    id: "destination.ip",
    category: "Destination",
    name: "destination.ip",
    type: "ip",
    description: "IP address of the destination (server).",
    required: false,
    examples: ["8.8.8.8", "10.0.0.20"],
    sourceMappings: ["dst", "dst_ip", "destinationAddress", "target_ip", "dstaddr"],
    usageFrequency: 91
  },
  {
    id: "destination.port",
    category: "Destination",
    name: "destination.port",
    type: "long",
    description: "Port of the destination.",
    required: false,
    examples: ["80", "443", "22"],
    sourceMappings: ["dpt", "dst_port", "destinationPort"],
    usageFrequency: 89
  },

  // User
  {
    id: "user.name",
    category: "User",
    name: "user.name",
    type: "keyword",
    description: "Short name or login of the user.",
    required: false,
    examples: ["jdoe", "admin", "service_account"],
    sourceMappings: ["suser", "username", "user", "AccountName"],
    usageFrequency: 82
  },
  {
    id: "user.domain",
    category: "User",
    name: "user.domain",
    type: "keyword",
    description: "Name of the directory the user is a member of.",
    required: false,
    examples: ["CORP", "WORKGROUP", "azuread"],
    sourceMappings: ["domain", "SubjectDomainName"],
    usageFrequency: 60
  },

  // Timestamp
  {
    id: "timestamp",
    category: "Timestamp",
    name: "timestamp",
    type: "date",
    description: "The primary timestamp of the event in ISO-8601 format. Used for all indexing and sorting.",
    required: true,
    examples: ["2023-10-27T10:00:00.000Z"],
    sourceMappings: ["time", "date", "rt", "LogTime"],
    usageFrequency: 100
  },
  
  // Network
  {
    id: "network.protocol",
    category: "Network",
    name: "network.protocol",
    type: "keyword",
    description: "In the OSI Model this would be the Application Layer protocol. For example, http, dns, or ssh.",
    required: false,
    examples: ["http", "dns", "ssh", "tls"],
    sourceMappings: ["app", "protocol", "proto"],
    usageFrequency: 75
  },
  {
    id: "network.transport",
    category: "Network",
    name: "network.transport",
    type: "keyword",
    description: "Same as network.iana_number, but using the Keyword name of the transport layer (udp, tcp, icmp, etc.)",
    required: false,
    examples: ["tcp", "udp", "icmp"],
    sourceMappings: ["proto", "transport"],
    usageFrequency: 80
  }
];
