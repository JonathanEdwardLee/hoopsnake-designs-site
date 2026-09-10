import { describe, expect, it } from 'vitest';
import { isHoneypotTriggered, validateClientForm } from '@/lib/form-validation';

const validPayload = {
  name: 'Ada Lovelace',
  business_name: 'Analytical Engines LLC',
  email: 'ada@example.com',
  project_type: 'Website / small site',
  problem: 'Need a qualified lead system with premium presentation.',
  budget_band: '$3,500 – $7,500',
  timing: '1–2 months',
  must_have: 'Project review form and one integration',
  decision_path: 'Founder approves scope directly',
  ongoing_support: 'One-time launch only',
};

describe('form validation', () => {
  it('accepts a valid payload', () => {
    const result = validateClientForm(validPayload);
    expect(result.ok).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = validateClientForm({ ...validPayload, email: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid email addresses', () => {
    const result = validateClientForm({ ...validPayload, email: 'not-an-email' });
    expect(result.ok).toBe(false);
  });
});

describe('honeypot', () => {
  it('flags filled honeypot values', () => {
    expect(isHoneypotTriggered('https://spam.example')).toBe(true);
  });

  it('allows empty honeypot values', () => {
    expect(isHoneypotTriggered('')).toBe(false);
    expect(isHoneypotTriggered(undefined)).toBe(false);
  });

  it('blocks honeypot submissions in client validation', () => {
    const result = validateClientForm({ ...validPayload, website: 'bot' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.website).toBeDefined();
    }
  });

  it('rejects malformed optional URLs before submit', () => {
    const result = validateClientForm({ ...validPayload, current_url: 'not-a-url' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.current_url).toContain('valid http(s) URL');
    }
  });

  it('returns per-field errors for missing required values', () => {
    const result = validateClientForm({ ...validPayload, email: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors.email).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
