export type FormFieldLimits = {
  name: number;
  business_name: number;
  email: number;
  project_type: number;
  current_url: number;
  problem: number;
  budget_band: number;
  timing: number;
  must_have: number;
  decision_path: number;
  ongoing_support: number;
  notes: number;
  website: number;
};

export const fieldLimits: FormFieldLimits = {
  name: 120,
  business_name: 160,
  email: 254,
  project_type: 80,
  current_url: 500,
  problem: 4000,
  budget_band: 40,
  timing: 40,
  must_have: 2000,
  decision_path: 1200,
  ongoing_support: 80,
  notes: 2000,
  website: 0,
};

export type ClientFormPayload = {
  name: string;
  business_name: string;
  email: string;
  project_type: string;
  current_url?: string;
  problem: string;
  budget_band: string;
  timing: string;
  must_have: string;
  decision_path: string;
  ongoing_support: string;
  notes?: string;
  website?: string;
  turnstile_token?: string;
};

export type ClientValidationResult =
  | { ok: true; data: ClientFormPayload }
  | { ok: false; errors: string[] };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function withinLimit(value: string, max: number): boolean {
  return Array.from(value).length <= max;
}

export function validateClientForm(input: Partial<ClientFormPayload>): ClientValidationResult {
  const errors: string[] = [];

  if (input.website && input.website.trim() !== '') {
    errors.push('Invalid submission.');
  }

  const requiredFields: Array<keyof ClientFormPayload> = [
    'name',
    'business_name',
    'email',
    'project_type',
    'problem',
    'budget_band',
    'timing',
    'must_have',
    'decision_path',
    'ongoing_support',
  ];

  for (const field of requiredFields) {
    const value = input[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof input.email === 'string') {
    const email = input.email.trim();
    if (!emailPattern.test(email) || !withinLimit(email, fieldLimits.email)) {
      errors.push('Invalid email address.');
    }
  }

  for (const [field, max] of Object.entries(fieldLimits) as Array<[keyof FormFieldLimits, number]>) {
    const value = input[field as keyof ClientFormPayload];
    if (typeof value === 'string' && max > 0 && !withinLimit(value, max)) {
      errors.push(`${field} exceeds maximum length.`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name: input.name!.trim(),
      business_name: input.business_name!.trim(),
      email: input.email!.trim(),
      project_type: input.project_type!.trim(),
      current_url: input.current_url?.trim() || undefined,
      problem: input.problem!.trim(),
      budget_band: input.budget_band!.trim(),
      timing: input.timing!.trim(),
      must_have: input.must_have!.trim(),
      decision_path: input.decision_path!.trim(),
      ongoing_support: input.ongoing_support!.trim(),
      notes: input.notes?.trim() || undefined,
      website: input.website?.trim() || undefined,
      turnstile_token: input.turnstile_token?.trim() || undefined,
    },
  };
}

export function isHoneypotTriggered(website?: string): boolean {
  return typeof website === 'string' && website.trim() !== '';
}
