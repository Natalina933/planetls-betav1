export type PromptStatus =
  | "draft"
  | "active"
  | "needs-review"
  | "deprecated"
  | "archived";

export type PromptRiskLevel = "low" | "medium" | "high" | "critical";

export type PromptDifficulty = "beginner" | "intermediate" | "advanced";

export type PromptVariableDefinition = {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  placeholder?: string;
};

export type PromptMetadata = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: PromptStatus;
  version: string;
  author: string;
  target: "codex";
  difficulty?: PromptDifficulty;
  riskLevel?: PromptRiskLevel;
  estimatedDuration?: string;
  contexts: string[];
  tags: string[];
  source?: string[];
  createdAt: string;
  updatedAt: string;
};

export type PromptVersionEntry = {
  version: string;
  date: string;
  changes: string[];
};

export type PromptRunSummary = {
  id: string;
  promptId: string;
  promptVersion: string;
  objective: string;
  summary?: string;
  createdAt: string;
  modifiedFiles: string[];
  tests: string[];
  decisions: string[];
  limitations: string[];
  nextActions: string[];
  folder: string;
};

export type PromptDocument = {
  metadata: PromptMetadata;
  path: string;
  objective: string;
  useWhen: string[];
  avoidWhen: string[];
  variables: PromptVariableDefinition[];
  promptContent: string;
  expectedDeliverables: string[];
  successCriteria: string[];
  versionHistory: PromptVersionEntry[];
  provenance: string[];
  recentRuns: PromptRunSummary[];
};

export type PromptLibraryDiagnostic = {
  existingPromptSources: string[];
  existingAuditDocs: string[];
  reusableComponents: string[];
  storageApproach: string;
  migrationRisks: string[];
  duplicatesDetected: string[];
  proposedTree: string[];
};

export type PromptLibraryPayload = {
  prompts: PromptDocument[];
  stats: {
    total: number;
    active: number;
    needsReview: number;
    favoritesSupported: boolean;
    runs: number;
    categories: number;
  };
  filters: {
    categories: string[];
    statuses: PromptStatus[];
    riskLevels: PromptRiskLevel[];
    difficulties: PromptDifficulty[];
  };
  diagnostic: PromptLibraryDiagnostic;
  updatedAt: string;
};
