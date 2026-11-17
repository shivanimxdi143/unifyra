export const DEMO_ROLES = {
  BRAND_MANAGER: 'Brand Manager',
  EMPLOYEE: 'Employee',
  REVIEWER: 'Reviewer'
};

export const VALID_ROLES = [
  DEMO_ROLES.BRAND_MANAGER,
  DEMO_ROLES.EMPLOYEE,
  DEMO_ROLES.REVIEWER
];

export const ROLE_CONFIGS = {
  'Brand Manager': {
    id: 'manager',
    name: 'Brand Manager',
    tagline: 'Brand Governance & Standards',
    description: 'Manage brand guidelines, configure rules, and monitor enterprise compliance.',
    badge: 'Governance Lead',
    personaName: 'Shivani',
    personaRole: 'Brand Manager',
    personaInitials: 'SH',
    personaSubtitle: 'Brand Governance Lead',
    capabilities: [
      'Manage brand guidelines',
      'Create and update brand rules',
      'Monitor brand compliance'
    ],
    navKeys: ['/', '/guidelines', '/history']
  },
  'Employee': {
    id: 'employee',
    name: 'Employee',
    tagline: 'Marketing & Content Creation',
    description: 'Submit marketing content for AI pre-audit and apply suggested corrections.',
    badge: 'Content Creator',
    personaName: 'Alex Chen',
    personaRole: 'Employee',
    personaInitials: 'AC',
    personaSubtitle: 'Marketing Creator',
    capabilities: [
      'Submit content for AI analysis',
      'View personal submission history',
      'Apply suggested corrections'
    ],
    navKeys: ['/submit', '/history']
  },
  'Reviewer': {
    id: 'reviewer',
    name: 'Reviewer',
    tagline: 'Human Review & Verification',
    description: 'Review AI findings, evaluate flagged violations, and make editorial decisions.',
    badge: 'Compliance Officer',
    personaName: 'Marcus Vance',
    personaRole: 'Reviewer',
    personaInitials: 'MV',
    personaSubtitle: 'Senior Compliance Reviewer',
    capabilities: [
      'Review AI findings',
      'Approve, reject, or request changes',
      'View review history'
    ],
    navKeys: ['/', '/review', '/history']
  }
};

const SESSION_ROLE_KEY = 'unifyra_demo_role';

export function getStoredRole() {
  try {
    const role = sessionStorage.getItem(SESSION_ROLE_KEY);
    if (role && VALID_ROLES.includes(role)) {
      return role;
    }
  } catch {
    // Graceful fallback for sandboxed environments
  }
  return null;
}

export function setStoredRole(role) {
  try {
    if (role && VALID_ROLES.includes(role)) {
      sessionStorage.setItem(SESSION_ROLE_KEY, role);
    }
  } catch {
    // Graceful fallback
  }
}

export function clearStoredRole() {
  try {
    sessionStorage.removeItem(SESSION_ROLE_KEY);
  } catch {
    // Graceful fallback
  }
}
