export interface Scenario {
  id: string;
  title: string;
  objective: string;
  input: string[];
  processing: string;
  output: string;
  successCriteria: string;
  route: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "s-1",
    title: "1. Multi-Format Ingestion",
    objective: "Demonstrate ULPF's ability to concurrently ingest vastly different log formats.",
    input: [
      "Linux Syslog (Unstructured Text)",
      "Windows Event WEF (XML)",
      "Cisco ASA Firewall (CEF)",
      "Okta Application (JSON)",
      "Legacy Apache (Grok)"
    ],
    processing: "Kafka ingestion buffers concurrent streams. Format Detection engine identifies payload structure without explicit configuration.",
    output: "Live event stream populated with heterogeneous raw events.",
    successCriteria: "System successfully accepts and categorizes all 5 formats simultaneously without dropping packets.",
    route: "/pipeline"
  },
  {
    id: "s-2",
    title: "2. Automatic Format Detection",
    objective: "Showcase the deterministic format identification engine.",
    input: ["Raw un-typed byte streams from Kafka."],
    processing: "Signature matching and payload inspection algorithms determine format and encoding.",
    output: "Tags applied: JSON, CEF, XML, Grok, CSV.",
    successCriteria: "100% accurate format tagging before parsing begins.",
    route: "/pipeline"
  },
  {
    id: "s-3",
    title: "3. Universal Normalization",
    objective: "Prove ULPF translates disparate vendor taxonomies into a single unified schema.",
    input: ["5 distinct log formats with different field naming conventions (e.g., src, sourceAddress, client_ip)."],
    processing: "Parser Workers apply mapping rules to extract fields and map them to the ULPF Universal Schema.",
    output: "A standardized JSON object containing source.ip, user.name, and event.outcome.",
    successCriteria: "5 completely different inputs result in 1 predictable, standardized schema.",
    route: "/pipeline"
  },
  {
    id: "s-4",
    title: "4. Raw-to-Normalized Lineage",
    objective: "Demonstrate forensic traceability for security audits.",
    input: ["A fully normalized security event."],
    processing: "Query the lineage store to reconstruct the exact processing steps.",
    output: "A visual timeline showing original raw bytes, detected format, applied parser, and final schema.",
    successCriteria: "Auditor can trace 'source.ip' back to the exact substring in the original raw log.",
    route: "/explorer"
  },
  {
    id: "s-5",
    title: "5. Unknown Source Onboarding",
    objective: "Show how a security analyst can onboard a new log source without writing application code.",
    input: ["Sample log from a custom, previously unseen internal application."],
    processing: "Guided workflow to define transport, provide a sample, and validate extraction.",
    output: "A new Parser Configuration deployed to the registry.",
    successCriteria: "New source is actively parsing events within 2 minutes.",
    route: "/sources/new"
  },
  {
    id: "s-6",
    title: "6. AI-Assisted Mapping",
    objective: "Demonstrate AI accelerating the creation of parsers using deterministic evidence.",
    input: ["Unmapped custom JSON log."],
    processing: "Local LLM analyzes field semantics and suggests mappings to the Universal Schema (e.g., 'usr' -> 'user.name').",
    output: "A proposed mapping rule set with confidence scores.",
    successCriteria: "AI provides explainable, deterministic evidence for its suggestions, avoiding hallucinated mappings.",
    route: "/ai-mapping"
  },
  {
    id: "s-7",
    title: "7. Unified Search Execution",
    objective: "Show the power of querying normalized data.",
    input: ["Search query: 'source.ip:192.168.1.50 AND event.outcome:failure'"],
    processing: "OpenSearch executes query against the unified index.",
    output: "Search results containing Windows, Linux, and Cisco events intermixed.",
    successCriteria: "A single query retrieves relevant events across all vendors and formats.",
    route: "/explorer"
  },
  {
    id: "s-8",
    title: "8. Brute-Force Anomaly Detection",
    objective: "Demonstrate how normalization enables cross-platform threat detection.",
    input: ["Normalized event stream."],
    processing: "Detection engine identifies a high volume of auth failures from a cluster of IPs.",
    output: "A high-confidence security signal.",
    successCriteria: "Detection triggers across multiple platforms (e.g., failed Windows login + failed VPN login).",
    route: "/detections"
  },
  {
    id: "s-9",
    title: "9. System Load Test",
    objective: "Prove ULPF's architecture can handle enterprise-scale log volumes.",
    input: ["Simulated log spike of 22,000 events/sec."],
    processing: "Kafka queues absorb the spike; Parser Workers scale up to drain the queue.",
    output: "Telemetry charts showing ingress, queue depth, and egress.",
    successCriteria: "System degrades gracefully (queue builds) without dropping events or crashing.",
    route: "/health"
  },
  {
    id: "s-10",
    title: "10. Air-Gapped Verification",
    objective: "Prove the system operates completely independently of external dependencies.",
    input: ["Diagnostic network check."],
    processing: "Verify isolation boundaries and local model availability.",
    output: "Security perimeter status board.",
    successCriteria: "Explicit visual confirmation of disconnected status and local AI engine operation.",
    route: "/settings"
  }
];
