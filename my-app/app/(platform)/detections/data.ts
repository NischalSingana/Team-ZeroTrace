export type AnomalySignal = {
  id: string;
  timestamp: string;
  description: string;
  type: "auth_fail" | "ip_burst" | "rule_trigger" | "ml_outlier";
  meta: string;
};

export const ANOMALY_SIGNALS: AnomalySignal[] = [
  {
    id: "sig-1",
    timestamp: "2023-10-27T14:32:01Z",
    description: "Initial authentication failure for user 'admin' from 192.168.1.105",
    type: "auth_fail",
    meta: "event.outcome: failure"
  },
  {
    id: "sig-2",
    timestamp: "2023-10-27T14:32:05Z",
    description: "Burst of 45 auth failures across 3 privileged accounts",
    type: "ip_burst",
    meta: "Rate limit threshold exceeded (10/sec)"
  },
  {
    id: "sig-3",
    timestamp: "2023-10-27T14:32:15Z",
    description: "Distributed source detected (12 unique IPs targeting same accounts)",
    type: "ml_outlier",
    meta: "Spatial IP clustering anomaly"
  },
  {
    id: "sig-4",
    timestamp: "2023-10-27T14:32:32Z",
    description: "Rule Trigger: Potential Distributed Brute Force (Mitre ATT&CK T1110.003)",
    type: "rule_trigger",
    meta: "Severity: CRITICAL"
  }
];
