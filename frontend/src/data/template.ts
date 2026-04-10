export const requirementFields = [
  { key: 'goal', label: 'Goal', description: 'What is the desired outcome?' },
  { key: 'business_context', label: 'Business Context', description: 'Why is this change needed and what is the business driver?' },
  { key: 'users', label: 'Users', description: 'Who are the target users or actors involved?' },
  { key: 'functional_requirements', label: 'Functional Requirements', description: 'What must the system do?' },
  { key: 'non_functional_requirements', label: 'Non-Functional Requirements', description: 'Quality attributes such as performance, security, compliance.' },
  { key: 'risks_and_dependencies', label: 'Risks and Dependencies', description: 'Known risks, blockers, or external dependencies.' },
] as const;

export type RequirementFieldKey = (typeof requirementFields)[number]['key'];

export type RequirementsContext = Record<RequirementFieldKey, string | null>;

export function createEmptyRequirementsContext(): RequirementsContext {
  return Object.fromEntries(
    requirementFields.map((f) => [f.key, null])
  ) as RequirementsContext;
}

export function allFieldsFilled(ctx: RequirementsContext): boolean {
  return requirementFields.every(
    (f) => ctx[f.key] !== null && ctx[f.key]!.trim() !== ''
  );
}

export const requirementsTemplate = {
  id: 'business-requirements-v1',
  content: `# Requirement Brief

## Goal

## Business Context

## Users

## Functional Requirements

## Non-Functional Requirements

## Risks and Dependencies

## Open Questions
`,
  fields: requirementFields.map((f) => ({
    key: f.key,
    label: f.label,
    description: f.description,
  })),
};

