export interface DeploymentComponent {
  id: string;
  name: string;
  category: "Core" | "Storage" | "AI" | "Data";
  deploymentTarget: "Containerized" | "Embedded" | "Local Binary";
  isolationBoundary: "Local" | "Local GPU";
  version: string;
  state: "Running" | "Active" | "Ready";
  hash?: string;
}

export const DEPLOYMENT_COMPONENTS: DeploymentComponent[] = [
  {
    id: "comp-1",
    name: "ULPF Core API",
    category: "Core",
    deploymentTarget: "Containerized",
    isolationBoundary: "Local",
    version: "ulpf/api:v3.2.1",
    state: "Running",
    hash: "sha256:8f43c2a1"
  },
  {
    id: "comp-2",
    name: "Parser Registry",
    category: "Core",
    deploymentTarget: "Containerized",
    isolationBoundary: "Local",
    version: "ulpf/registry:v2.4.1",
    state: "Running",
    hash: "sha256:4b9a1d8e"
  },
  {
    id: "comp-3",
    name: "Universal Schema",
    category: "Data",
    deploymentTarget: "Embedded",
    isolationBoundary: "Local",
    version: "ulpf-schema:v1.0.4",
    state: "Active"
  },
  {
    id: "comp-4",
    name: "Semantic Inference Engine",
    category: "AI",
    deploymentTarget: "Containerized",
    isolationBoundary: "Local GPU",
    version: "ulpf/ai-engine:v1.1.0",
    state: "Running",
    hash: "sha256:9c3d4f5a"
  },
  {
    id: "comp-5",
    name: "LLM Weights (Mapping)",
    category: "AI",
    deploymentTarget: "Local Binary",
    isolationBoundary: "Local GPU",
    version: "llama3-ulpf-instruct:8b-q4_K_M",
    state: "Ready",
    hash: "sha256:e1a2b3c4"
  },
  {
    id: "comp-6",
    name: "Kafka Broker",
    category: "Data",
    deploymentTarget: "Containerized",
    isolationBoundary: "Local",
    version: "confluentinc/cp-kafka:7.4.0",
    state: "Running"
  },
  {
    id: "comp-7",
    name: "OpenSearch Node",
    category: "Storage",
    deploymentTarget: "Containerized",
    isolationBoundary: "Local",
    version: "opensearchproject/opensearch:2.11.0",
    state: "Running"
  }
];
