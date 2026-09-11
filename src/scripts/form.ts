import { validateClientForm } from '@/lib/form-validation';

const root = document.querySelector<HTMLElement>('[data-review-root]');
if (root) {
  const form = root.querySelector<HTMLFormElement>('[data-review-form]');
  const status = root.querySelector<HTMLElement>('[data-form-status]');
  const errorSummary = root.querySelector<HTMLElement>('[data-form-error-summary]');
  const success = root.querySelector<HTMLElement>('[data-form-success]');
  const submitButton = root.querySelector<HTMLButtonElement>('[data-form-submit]');

  const setStatus = (message: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
    if (!status) return;
    status.textContent = message;
    status.dataset.tone = tone === 'neutral' ? '' : tone;
  };

  const clearFieldErrors = () => {
    form?.querySelectorAll('[data-field-error]').forEach((node) => {
      node.textContent = '';
    });
    form?.querySelectorAll('[name]').forEach((node) => {
      if (node instanceof HTMLElement) {
        node.removeAttribute('aria-invalid');
        node.removeAttribute('aria-describedby');
      }
    });
    if (errorSummary) {
      errorSummary.hidden = true;
      errorSummary.textContent = '';
    }
  };

  const applyFieldErrors = (fieldErrors: Record<string, string>) => {
    clearFieldErrors();
    const summaryItems: string[] = [];

    for (const [field, message] of Object.entries(fieldErrors)) {
      if (field === 'website') continue;

      const control = form?.querySelector<HTMLElement>(`[name="${field}"]`);
      const errorNode = form?.querySelector<HTMLElement>(`[data-field-error="${field}"]`);
      if (control) {
        control.setAttribute('aria-invalid', 'true');
        if (errorNode) {
          control.setAttribute('aria-describedby', errorNode.id);
        }
      }
      if (errorNode) {
        errorNode.textContent = message;
      }
      summaryItems.push(message);
    }

    if (errorSummary && summaryItems.length > 0) {
      errorSummary.hidden = false;
      errorSummary.textContent = summaryItems.join(' ');
    }
  };

  form?.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.getAttribute('name')) return;
    target.removeAttribute('aria-invalid');
    const field = target.getAttribute('name');
    const errorNode = field ? form.querySelector<HTMLElement>(`[data-field-error="${field}"]`) : null;
    if (errorNode) errorNode.textContent = '';
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submitButton) return;

    clearFieldErrors();

    const payload = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const validated = validateClientForm(payload);
    if (!validated.ok) {
      applyFieldErrors(validated.fieldErrors);
      setStatus('Check the highlighted fields and try again.', 'error');
      const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    submitButton.disabled = true;
    setStatus('Submitting project review…');

    try {
      const response = await fetch('/api/project-review.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(validated.data),
      });

      const result = (await response.json()) as { ok?: boolean; code?: string };

      if (result.ok && result.code === 'received') {
        form.hidden = true;
        if (success) success.hidden = false;
        setStatus('Submission received. Jonathan reviews fit before scheduling a call.', 'success');
        return;
      }

      if (result.code === 'rate_limited') {
        setStatus('Too many submissions right now. Please try again later.', 'error');
        return;
      }

      setStatus('Submission could not be completed right now. Please try again later.', 'error');
    } catch {
      setStatus('Submission could not be completed right now. Please try again later.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
}
