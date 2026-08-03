export type ValidationPhase = "problem" | "interest" | "willingness_to_pay";
export type HypothesisPriority = "critique" | "prioritaire" | "importante";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ValidationDecision = "go" | "test_more" | "pivot" | "no_go";

export type InitialDiagnosticItem = {
  id: string;
  title: string;
  summary: string;
};

export type PrioritizedHypothesis = {
  id: string;
  code: string;
  title: string;
  importance: string;
  uncertainty: string;
  urgency: string;
  wrongDecisionCost: string;
  priority: HypothesisPriority;
};

export type ValidationScheduleEntry = {
  id: string;
  window: string;
  phase: ValidationPhase;
  focus: string;
  actions: string[];
};

export type ValidationTest = {
  id: string;
  number: number;
  phase: ValidationPhase;
  title: string;
  objective: string;
  targetSegment: string;
  testedHypothesis: string;
  riskAssessed: string;
  protocol: string[];
  minimumParticipants: number;
  recruitmentMode: string;
  tools: string[];
  prepTime: string;
  executionTime: string;
  estimatedCost: string;
  collectedData: string[];
  primaryMetrics: string[];
  secondaryMetrics: string[];
  validationThreshold: string;
  uncertaintyThreshold: string;
  failureThreshold: string;
  biases: string[];
  followUpAction: string;
  deliverable: string;
};

export type InterviewScript = {
  id: string;
  audience: string;
  questions: string[];
};

export type SurveyQuestion = {
  id: string;
  question: string;
  answerFormat: string;
};

export type LandingVariant = {
  id: string;
  audience: string;
  headline: string;
  subheadline: string;
  sections: string[];
};

export type ValidationKpi = {
  id: string;
  name: string;
  definition: string;
  formula: string;
  source: string;
  currentValue: string;
  greenThreshold: string;
  orangeThreshold: string;
  redThreshold: string;
  updateFrequency: string;
  actionIfBad: string;
};

export type GoNoGoRule = {
  id: string;
  decision: ValidationDecision;
  title: string;
  signals: string[];
  nextMove: string;
};

export type IntegrationRecommendation = {
  id: string;
  title: string;
  items: string[];
};

export type ImmediateActionGroup = {
  id: string;
  title: string;
  items: string[];
};
