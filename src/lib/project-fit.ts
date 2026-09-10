import type { ProjectFitAnswers, ProjectFitResult } from '@/data/site';

const fitNotes: Record<string, string> = {
  'Below $3,500':
    'Launch System projects start at $3,500. Share your goals anyway — smaller scoped work may still be possible, or we can clarify boundaries early.',
  '$3,500 – $7,500':
    'This band aligns with the Hoopsnake Launch System and focused custom work.',
  '$7,500 – $15,000':
    'This range can support a richer Launch System build or a separately scoped app/tool engagement.',
  '$15,000+':
    'Larger builds, apps, and multi-phase work are scoped separately after review.',
  'Not sure yet':
    'Budget clarity helps, but you can still request a review and we will align scope in the proposal stage.',
};

export function buildProjectFitResult(answers: ProjectFitAnswers): ProjectFitResult {
  const summary = [
    answers.projectType,
    answers.primaryGoal,
    answers.budgetBand,
    answers.timing,
  ].join(' · ');

  const problem = `Primary goal: ${answers.primaryGoal}. Project type: ${answers.projectType}.`;

  return {
    summary,
    fitNote: fitNotes[answers.budgetBand] ?? fitNotes['Not sure yet'],
    prefill: {
      project_type: answers.projectType,
      problem,
      budget_band: answers.budgetBand,
      timing: answers.timing,
    },
  };
}

export function isCompleteProjectFit(answers: Partial<ProjectFitAnswers>): answers is ProjectFitAnswers {
  return Boolean(
    answers.projectType &&
      answers.primaryGoal &&
      answers.budgetBand &&
      answers.timing,
  );
}
