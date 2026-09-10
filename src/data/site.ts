export type PortfolioItem = {
  id: string;
  title: string;
  relationship: string;
  description: string;
  href: string;
  accent: string;
  label: string;
};

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'auto-detailing-guide',
    title: 'Auto Detailing Guide',
    relationship: 'Owned PIM project',
    description:
      'Scalable directory, search, and data publishing architecture for a long-running automotive resource brand.',
    href: 'https://autodetailguide.com/',
    accent: '#c8d4dc',
    label: 'DIR / SEARCH / DATA',
  },
  {
    id: 'can-i-borrow-this',
    title: 'Can I Borrow This?',
    relationship: 'Owned PIM project',
    description:
      'Guided consumer UX with location and source routing, privacy-minded product design, and clear decision paths.',
    href: 'https://caniborrowthis.com/',
    accent: '#d9cfc4',
    label: 'GUIDED UX / ROUTING',
  },
  {
    id: 'ozarkskey',
    title: 'OzarksKey',
    relationship: 'Owned PIM project',
    description:
      'Regional discovery with map, filter, and search UX, analytics discipline, and editorial/commercial separation.',
    href: 'https://ozarkskey.com/',
    accent: '#b8c9b0',
    label: 'MAP / FILTER / DISCOVERY',
  },
  {
    id: 'snorkleprawn',
    title: 'SnorklePrawn',
    relationship: 'Owned PIM project',
    description:
      'Character-led interactive web design with lightweight state, analytics, and commerce handoff.',
    href: 'https://snorkleprawn.com/',
    accent: '#f0c9a8',
    label: 'INTERACTIVE / CHARACTER',
  },
  {
    id: 'junkfeathers',
    title: 'Junkfeathers',
    relationship: 'Jonathan / Junkfeathers property',
    description:
      'Art direction, music and technology presentation, machine-interface design, responsive static architecture, and interactive multimedia experimentation.',
    href: 'https://junkfeathers.com/',
    accent: '#e8e8e8',
    label: 'ART DIRECTION / MACHINE UI',
  },
  {
    id: 'orpheus-deck',
    title: 'Orpheus Deck',
    relationship: 'Junkfeathers Tech Android product by Jonathan',
    description:
      'Native audio, mobile interaction, and product release work for a private four-track recorder app.',
    href: 'https://junkfeathers.com/orpheus-deck/',
    accent: '#c4b8d9',
    label: 'NATIVE AUDIO / ANDROID',
  },
];

export const projectTypes = [
  'Website / small site',
  'Web app',
  'Interactive / game experience',
  'Custom tool / integration',
  'Other / not sure yet',
] as const;

export const primaryGoals = [
  'Generate qualified leads',
  'Replace or launch a site/product',
  'Improve conversion or clarity',
  'Add a bounded integration',
  'Other focused outcome',
] as const;

export const budgetBands = [
  'Below $3,500',
  '$3,500 – $7,500',
  '$7,500 – $15,000',
  '$15,000+',
  'Not sure yet',
] as const;

export const timingOptions = [
  'Within 4 weeks',
  '1–2 months',
  '3+ months',
  'Flexible / exploring',
] as const;

export const supportOptions = [
  'One-time launch only',
  'Light post-launch support',
  'Ongoing support (separate scope)',
  'Not sure yet',
] as const;

export type ProjectFitAnswers = {
  projectType: (typeof projectTypes)[number];
  primaryGoal: (typeof primaryGoals)[number];
  budgetBand: (typeof budgetBands)[number];
  timing: (typeof timingOptions)[number];
};

export type ProjectFitResult = {
  summary: string;
  fitNote: string;
  prefill: Partial<{
    project_type: string;
    problem: string;
    budget_band: string;
    timing: string;
  }>;
};
