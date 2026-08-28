export const VOLUME_DATA = [
  { time: "00:00", critical: 12, high: 45, medium: 120, low: 450 },
  { time: "02:00", critical: 8, high: 38, medium: 140, low: 520 },
  { time: "04:00", critical: 15, high: 52, medium: 110, low: 410 },
  { time: "06:00", critical: 5, high: 22, medium: 95, low: 380 },
  { time: "08:00", critical: 42, high: 180, medium: 420, low: 1200 },
  { time: "10:00", critical: 85, high: 240, medium: 580, low: 1800 },
  { time: "12:00", critical: 64, high: 195, medium: 620, low: 1950 },
  { time: "14:00", critical: 112, high: 310, medium: 810, low: 2400 },
  { time: "16:00", critical: 95, high: 280, medium: 750, low: 2100 },
  { time: "18:00", critical: 48, high: 145, medium: 410, low: 1350 },
  { time: "20:00", critical: 22, high: 85, medium: 240, low: 850 },
  { time: "22:00", critical: 18, high: 62, medium: 180, low: 620 }
];

export const TOP_IPS = [
  { ip: "192.168.1.105", count: 14205, risk: "high" },
  { ip: "10.0.0.42", count: 8432, risk: "medium" },
  { ip: "172.16.0.21", count: 6102, risk: "medium" },
  { ip: "8.8.8.8", count: 5490, risk: "low" },
  { ip: "10.0.0.250", count: 3211, risk: "low" }
];

export const TOP_USERS = [
  { user: "admin", count: 8240, type: "privileged" },
  { user: "svc_backup", count: 6100, type: "service" },
  { user: "jdoe", count: 4820, type: "standard" },
  { user: "SYSTEM", count: 4100, type: "system" },
  { user: "asmith", count: 2850, type: "standard" }
];

export const PARSER_PERF = [
  { name: "Cisco ASA Firewall", events: "1.2M", latency: "1.2ms", status: "optimal" },
  { name: "Windows Security", events: "854K", latency: "2.4ms", status: "optimal" },
  { name: "Okta SSO", events: "412K", latency: "1.8ms", status: "optimal" },
  { name: "Custom Nginx (v2)", events: "280K", latency: "8.5ms", status: "degraded" },
  { name: "AWS CloudTrail", events: "195K", latency: "3.1ms", status: "optimal" }
];

export const CATEGORY_DISTRIBUTION = [
  { name: "Network Activity", value: 45, color: "#3b82f6" },
  { name: "Authentication", value: 30, color: "#a855f7" },
  { name: "File System", value: 15, color: "#22c55e" },
  { name: "Process Creation", value: 10, color: "#eab308" }
];
