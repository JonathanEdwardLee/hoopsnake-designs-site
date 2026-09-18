export type PortfolioLayout = 'cassette' | 'map' | 'mono' | 'playful' | 'directory' | 'utility';

export type PortfolioItem = {
  id: string;
  title: string;
  relationship: string;
  description: string;
  href: string;
  accent: string;
  label: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  layout: PortfolioLayout;
};

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'orpheus-deck',
    title: 'Orpheus Deck',
    relationship: 'Junkfeathers Tech Android product by Jonathan',
    description:
      'A public Android four-track recorder with a cassette-like interface, native audio, and a Google Play release.',
    href: 'https://play.google.com/store/apps/details?id=com.junkfeathers.orpheusdeck',
    accent: '#c9b8a4',
    label: 'ANDROID / AUDIO',
    image: '/images/portfolio/orpheus-deck.webp',
    imageAlt: 'Orpheus Deck product page with cassette-style four-track recorder interface',
    featured: true,
    layout: 'cassette',
  },
  {
    id: 'ozarkskey',
    title: 'OzarksKey',
    relationship: 'Owned PIM project',
    description:
      'Regional discovery with map, search, and source routing so people can find trusted local event calendars.',
    href: 'https://ozarkskey.com/',
    accent: '#c5cbb8',
    label: 'MAP / SEARCH',
    image: '/images/portfolio/ozarkskey.webp',
    imageAlt: 'OzarksKey source map with regional discovery and search interface',
    featured: true,
    layout: 'map',
  },
  {
    id: 'junkfeathers',
    title: 'Junkfeathers',
    relationship: 'Jonathan / Junkfeathers property',
    description:
      'Music and technology presentation with a restrained machine-interface, static architecture, and interactive experiments.',
    href: 'https://junkfeathers.com/',
    accent: '#d8d4cc',
    label: 'MACHINE UI',
    image: '/images/portfolio/junkfeathers.webp',
    imageAlt: 'Junkfeathers monochrome machine-interface homepage',
    featured: true,
    layout: 'mono',
  },
  {
    id: 'auto-detailing-guide',
    title: 'Auto Detailing Guide',
    relationship: 'Owned PIM project',
    description:
      'A directory people can actually search: find detailers by location, service, and business name.',
    href: 'https://autodetailingguide.com/',
    accent: '#d3c7b4',
    label: 'DIRECTORY / SEARCH',
    image: '/images/portfolio/auto-detailing-guide.webp',
    imageAlt: 'Auto Detailing Guide search interface for finding a detailer',
    featured: false,
    layout: 'directory',
  },
  {
    id: 'can-i-borrow-this',
    title: 'Can I Borrow This?',
    relationship: 'Owned PIM project',
    description:
      'Guided routing that helps people check libraries and borrowing programs instead of buying first.',
    href: 'https://caniborrowthis.com/',
    accent: '#c9d2c4',
    label: 'GUIDED UX',
    image: '/images/portfolio/can-i-borrow-this.webp',
    imageAlt: 'Can I Borrow This search form for item type and ZIP code',
    featured: false,
    layout: 'utility',
  },
  {
    id: 'snorkleprawn',
    title: 'SnorklePrawn',
    relationship: 'Owned PIM project',
    description:
      'A character-led interactive page with lightweight state and a simple commerce handoff.',
    href: 'https://snorkleprawn.com/',
    accent: '#e4d3b4',
    label: 'INTERACTIVE',
    image: '/images/portfolio/snorkleprawn.webp',
    imageAlt: 'SnorklePrawn character-led interactive web presentation',
    featured: false,
    layout: 'playful',
  },
];

export const featuredPortfolio = portfolioItems.filter((item) => item.featured);

export const capabilities = [
  {
    title: 'Websites',
    copy: 'Custom one-page and small-site work with clear structure, mobile-first layout, and room for the project’s actual voice.',
  },
  {
    title: 'Web apps',
    copy: 'Focused product interfaces when the job, audience, and ownership are clear enough to build against.',
  },
  {
    title: 'Mobile apps',
    copy: 'Native and mobile-product work when a phone is the right place for the tool, not just a shrunk website.',
  },
  {
    title: 'Interactive experiences',
    copy: 'Character-led, game-like, or otherwise unusual pages that still have to load, read, and work.',
  },
  {
    title: 'Custom tools / integrations',
    copy: 'Bounded workflow tools, publishing systems, and one well-chosen integration instead of a pile of extras.',
  },
] as const;

export const processStages = [
  {
    number: '01',
    title: 'Review',
    copy: 'Send the project form when you are ready. Jonathan reads it asynchronously and checks fit before any scheduling.',
  },
  {
    number: '02',
    title: 'Conversation',
    copy: 'If the work looks aligned, a focused conversation clarifies goals, constraints, and who decides.',
  },
  {
    number: '03',
    title: 'Proposal',
    copy: 'Scope, timeline, deliverables, and investment are written down before build begins. Acceptance is not assumed.',
  },
  {
    number: '04',
    title: 'Build + Launch',
    copy: 'Implementation, review rounds, handoff, and launch. Larger apps and ongoing support stay on a separate scope.',
  },
] as const;

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
