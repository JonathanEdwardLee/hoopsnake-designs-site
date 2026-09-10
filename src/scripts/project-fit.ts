import {
  budgetBands,
  primaryGoals,
  projectTypes,
  timingOptions,
  type ProjectFitAnswers,
} from '@/data/site';
import { buildProjectFitResult, isCompleteProjectFit } from '@/lib/project-fit';

const fitRoot = document.querySelector<HTMLElement>('[data-project-fit]');
if (fitRoot) {
  const form = fitRoot.querySelector<HTMLFormElement>('[data-fit-form]');
  const result = fitRoot.querySelector<HTMLElement>('[data-fit-result]');
  const summary = fitRoot.querySelector<HTMLElement>('[data-fit-summary]');
  const note = fitRoot.querySelector<HTMLElement>('[data-fit-note]');
  const continueButton = fitRoot.querySelector<HTMLButtonElement>('[data-fit-continue]');

  const readAnswers = (): Partial<ProjectFitAnswers> => ({
    projectType: form?.querySelector<HTMLSelectElement>('[name="fit_project_type"]')?.value as ProjectFitAnswers['projectType'],
    primaryGoal: form?.querySelector<HTMLSelectElement>('[name="fit_primary_goal"]')?.value as ProjectFitAnswers['primaryGoal'],
    budgetBand: form?.querySelector<HTMLSelectElement>('[name="fit_budget_band"]')?.value as ProjectFitAnswers['budgetBand'],
    timing: form?.querySelector<HTMLSelectElement>('[name="fit_timing"]')?.value as ProjectFitAnswers['timing'],
  });

  form?.addEventListener('change', () => {
    const answers = readAnswers();
    if (!result || !summary || !note) return;

    if (!isCompleteProjectFit(answers)) {
      result.hidden = true;
      return;
    }

    const fit = buildProjectFitResult(answers);
    summary.textContent = fit.summary;
    note.textContent = fit.fitNote;
    result.hidden = false;
    fitRoot.dataset.prefill = JSON.stringify(fit.prefill);
  });

  continueButton?.addEventListener('click', () => {
    const raw = fitRoot.dataset.prefill;
    if (!raw) return;

    const prefill = JSON.parse(raw) as Record<string, string>;
    const reviewForm = document.querySelector<HTMLFormElement>('[data-review-form]');
    if (!reviewForm) return;

    for (const [field, value] of Object.entries(prefill)) {
      const input = reviewForm.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${field}"]`);
      if (input) input.value = value;
    }

    document.querySelector('#project-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    reviewForm.querySelector<HTMLElement>('[name="problem"]')?.focus();
  });

  void projectTypes;
  void primaryGoals;
  void budgetBands;
  void timingOptions;
}
