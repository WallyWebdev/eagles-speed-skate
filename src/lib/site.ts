export const SITE = {
  name: 'Eagles Speed Skate',
  club: 'Eagles Roller Sports Club',
  branch: 'Inline Speed Skate',
  tagline: 'Inline speed skating for athletes ready to build confidence, develop technique and race with the Eagles.',
  description:
    'Eagles Roller Sports Club — Inline Speed Skate branch. Learn, train and race with the Eagles.',
  // Exact, approved external links only. Other operational details are pending club approval.
  mainClubUrl: 'https://eaglesrollersports.com.au',
  skateAustraliaTrialUrl: 'https://www.skateaustralia.org.au/three-weekfreetrial',
} as const;

export const NAV = [
  { href: '#about', label: 'About' },
  { href: '#programs', label: 'Programs' },
  { href: '#gallery', label: 'Club life' },
  { href: '#try', label: 'Come & try' },
] as const;
