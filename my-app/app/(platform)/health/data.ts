export type ServiceStatus = "Healthy" | "Warning" | "Degraded" | "Offline";

export interface SystemComponent {
  id: string;
  name: string;
  category: "Ingest" | "Compute" | "Storage" | "Cache";
  status: ServiceStatus;
  cpu: number;
  memory: string;
  throughput: string;
  latency: string;
  errors: number;
  lastHeartbeat: string;
}

export const COMPONENTS: SystemComponent[] = [
  {
    id: "kafka-01",
    name: "Kafka Cluster",
    category: "Ingest",
    status: "Healthy",
    cpu: 45,
    memory: "12.4GB",
    throughput: "14,200 msg/s",
    latency: "4ms",
    errors: 0,
    lastHeartbeat: "Just now"
  },
  {
    id: "worker-pool",
    name: "Parser Workers",
    category: "Compute",
    status: "Healthy",
    cpu: 82,
    memory: "8.1GB",
    throughput: "14,150 evt/s",
    latency: "1.2ms",
    errors: 12,
    lastHeartbeat: "Just now"
  },
  {
    id: "fastapi",
    name: "FastAPI Core",
    category: "Compute",
    status: "Healthy",
    cpu: 24,
    memory: "1.2GB",
    throughput: "850 req/s",
    latency: "45ms",
    errors: 2,
    lastHeartbeat: "2s ago"
  },
  {
    id: "ai-svc",
    name: "AI Copilot Service",
    category: "Compute",
    status: "Degraded",
    cpu: 98,
    memory: "14.2GB",
    throughput: "5 req/s",
    latency: "4500ms",
    errors: 145,
    lastHeartbeat: "14s ago"
  },
  {
    id: "opensearch",
    name: "OpenSearch",
    category: "Storage",
    status: "Healthy",
    cpu: 64,
    memory: "32.0GB",
    throughput: "14,100 doc/s",
    latency: "8ms",
    errors: 0,
    lastHeartbeat: "Just now"
  },
  {
    id: "minio",
    name: "MinIO (Raw Archive)",
    category: "Storage",
    status: "Warning",
    cpu: 85,
    memory: "4.5GB",
    throughput: "450 MB/s",
    latency: "120ms",
    errors: 4,
    lastHeartbeat: "5s ago"
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    category: "Storage",
    status: "Healthy",
    cpu: 15,
    memory: "2.4GB",
    throughput: "45 tx/s",
    latency: "2ms",
    errors: 0,
    lastHeartbeat: "Just now"
  },
  {
    id: "redis",
    name: "Redis Cache",
    category: "Cache",
    status: "Healthy",
    cpu: 8,
    memory: "4.1GB",
    throughput: "12,000 cmd/s",
    latency: "0.5ms",
    errors: 0,
    lastHeartbeat: "Just now"
  }
];

export const PIPELINE_CHART_DATA = [
  { time: "10:00", ingress: 12000, egress: 11950 },
  { time: "10:05", ingress: 14500, egress: 14400 },
  { time: "10:10", ingress: 13200, egress: 13100 },
  { time: "10:15", ingress: 18000, egress: 17800 },
  { time: "10:20", ingress: 22000, egress: 15000 }, // Spike where queue builds up
  { time: "10:25", ingress: 19000, egress: 18500 },
  { time: "10:30", ingress: 14200, egress: 16000 }, // Draining queue
  { time: "10:35", ingress: 12500, egress: 12450 }
];

export const LATENCY_CHART_DATA = [
  { time: "10:00", parser: 1.2, storage: 8.5 },
  { time: "10:05", parser: 1.3, storage: 8.2 },
  { time: "10:10", parser: 1.2, storage: 9.1 },
  { time: "10:15", parser: 1.5, storage: 12.4 },
  { time: "10:20", parser: 4.2, storage: 24.5 }, // Congestion
  { time: "10:25", parser: 2.1, storage: 15.2 },
  { time: "10:30", parser: 1.4, storage: 9.5 },
  { time: "10:35", parser: 1.2, storage: 8.4 }
];

export const QUEUE_DATA = [
  { time: "10:00", depth: 450 },
  { time: "10:05", depth: 820 },
  { time: "10:10", depth: 600 },
  { time: "10:15", depth: 1200 },
  { time: "10:20", depth: 8500 }, // Massive spike
  { time: "10:25", depth: 6200 },
  { time: "10:30", depth: 2400 },
  { time: "10:35", depth: 500 }
];
