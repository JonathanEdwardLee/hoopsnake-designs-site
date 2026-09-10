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

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form || !submitButton) return;

    const payload = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    payload.turnstile_token = turnstileToken;

    const validated = validateClientForm(payload);
    if (!validated.ok) {
      setStatus('Check the highlighted fields and try again.', 'error');
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

      if (result.code === 'rate_limited') {
        setStatus('Too many attempts. Please wait and try again.', 'error');
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
