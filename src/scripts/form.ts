import { validateClientForm } from '@/lib/form-validation';

declare global {
  interface Window {
    __HSD_TURNSTILE_SITE_KEY__?: string;
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const root = document.querySelector<HTMLElement>('[data-review-root]');
if (root) {
  const form = root.querySelector<HTMLFormElement>('[data-review-form]');
  const status = root.querySelector<HTMLElement>('[data-form-status]');
  const errorSummary = root.querySelector<HTMLElement>('[data-form-error-summary]');
  const success = root.querySelector<HTMLElement>('[data-form-success]');
  const turnstileMount = root.querySelector<HTMLElement>('[data-turnstile-widget]');
  const submitButton = root.querySelector<HTMLButtonElement>('[data-form-submit]');

  let turnstileToken = '';
  let widgetId: string | undefined;

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

  const loadTurnstile = () =>
    new Promise<void>((resolve, reject) => {
      if (window.turnstile) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Turnstile unavailable'));
      document.head.append(script);
    });

  const renderTurnstile = async () => {
    if (!turnstileMount) return;
    await loadTurnstile();
    const sitekey = window.__HSD_TURNSTILE_SITE_KEY__ ?? '1x00000000000000000000AA';
    widgetId = window.turnstile?.render(turnstileMount, {
      sitekey,
      theme: 'dark',
      callback: (token: string) => {
        turnstileToken = token;
        setStatus('Verification ready.');
      },
      'expired-callback': () => {
        turnstileToken = '';
        setStatus('Verification expired. Please verify again.', 'error');
      },
    });
  };

  void renderTurnstile();

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
    payload.turnstile_token = turnstileToken;

    const validated = validateClientForm(payload);
    if (!validated.ok) {
      applyFieldErrors(validated.fieldErrors);
      setStatus('Check the highlighted fields and try again.', 'error');
      const firstInvalid = form.querySelector<HTMLElement>('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    if (!turnstileToken) {
      setStatus('Complete human verification before submitting.', 'error');
      turnstileMount?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        setStatus('Submission received. Hoopsnake reviews fit before scheduling a call.', 'success');
        return;
      }

      if (result.code === 'verification') {
        setStatus('Verification failed. Please try again.', 'error');
        turnstileToken = '';
        if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
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
