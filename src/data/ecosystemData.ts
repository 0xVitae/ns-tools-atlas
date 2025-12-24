import { Category, EcosystemProject, CategoryType } from '@/types/ecosystem';

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  'networks': '#3B82F6',
  'coworking': '#A855F7',
  'media-events': '#EC4899',
  'education': '#10B981',
  'local-vcs': '#F59E0B',
  'global-vcs': '#F97316',
  'accelerators': '#0EA5E9',
  'corporate': '#8B5CF6',
  'public-entities': '#22C55E',
};

export const CATEGORIES: Category[] = [
  { id: 'networks', name: 'Networks', color: CATEGORY_COLORS['networks'], x: 20, y: 20, width: 200, height: 180 },
  { id: 'coworking', name: 'Coworking', color: CATEGORY_COLORS['coworking'], x: 20, y: 210, width: 200, height: 160 },
  { id: 'media-events', name: 'Media & Events', color: CATEGORY_COLORS['media-events'], x: 20, y: 380, width: 200, height: 200 },
  { id: 'education', name: 'Education', color: CATEGORY_COLORS['education'], x: 20, y: 590, width: 200, height: 180 },
  { id: 'local-vcs', name: 'Local VCs', color: CATEGORY_COLORS['local-vcs'], x: 240, y: 20, width: 260, height: 340 },
  { id: 'corporate', name: 'Corporate', color: CATEGORY_COLORS['corporate'], x: 240, y: 370, width: 260, height: 160 },
  { id: 'public-entities', name: 'Public Entities', color: CATEGORY_COLORS['public-entities'], x: 240, y: 540, width: 260, height: 110 },
  { id: 'global-vcs', name: 'Global VCs', color: CATEGORY_COLORS['global-vcs'], x: 520, y: 20, width: 220, height: 280 },
  { id: 'accelerators', name: 'Accelerators', color: CATEGORY_COLORS['accelerators'], x: 520, y: 310, width: 220, height: 340 },
];

export const INITIAL_PROJECTS: EcosystemProject[] = [
  // Networks
  { id: 'n1', name: 'NS Tech Alliance', category: 'networks', description: 'Provincial tech network' },
  { id: 'n2', name: 'Startup Canada', category: 'networks', description: 'National startup community' },
  { id: 'n3', name: 'Digital Nova Scotia', category: 'networks', description: 'Digital industry association' },
  { id: 'n4', name: 'TechNS', category: 'networks', description: 'Tech professionals network' },
  
  // Coworking
  { id: 'c1', name: 'Volta', category: 'coworking', description: 'Innovation hub in Halifax' },
  { id: 'c2', name: 'The Hub Halifax', category: 'coworking', description: 'Coworking space' },
  { id: 'c3', name: 'Ignite Labs', category: 'coworking', description: 'Tech-focused workspace' },
  { id: 'c4', name: 'The Forge', category: 'coworking', description: 'Maker space & offices' },
  
  // Media & Events
  { id: 'm1', name: 'Entrevestor', category: 'media-events', description: 'Atlantic startup news' },
  { id: 'm2', name: 'Mashup Lab', category: 'media-events', description: 'Events & community' },
  { id: 'm3', name: 'Atlantic Tech Summit', category: 'media-events', description: 'Annual conference' },
  { id: 'm4', name: 'Startup Halifax', category: 'media-events', description: 'Local meetups' },
  { id: 'm5', name: 'Demo Camp', category: 'media-events', description: 'Pitch events' },
  
  // Education
  { id: 'e1', name: 'Dalhousie University', category: 'education', description: 'University programs' },
  { id: 'e2', name: 'NSCC', category: 'education', description: 'Applied programs' },
  { id: 'e3', name: 'Creative Destruction Lab', category: 'education', description: 'Science ventures' },
  { id: 'e4', name: 'Propel ICT', category: 'education', description: 'ICT accelerator' },
  
  // Local VCs
  { id: 'lv1', name: 'Build Ventures', category: 'local-vcs', description: 'Atlantic Canada fund' },
  { id: 'lv2', name: 'Innovacorp', category: 'local-vcs', description: 'Provincial venture capital' },
  { id: 'lv3', name: 'Killick Capital', category: 'local-vcs', description: 'Angel investors' },
  { id: 'lv4', name: 'Cape Breton Capital', category: 'local-vcs', description: 'Regional investment' },
  { id: 'lv5', name: 'Sandpiper Ventures', category: 'local-vcs', description: 'Women-focused fund' },
  { id: 'lv6', name: 'Concrete Ventures', category: 'local-vcs', description: 'Tech fund' },
  { id: 'lv7', name: 'East Valley Ventures', category: 'local-vcs', description: 'Early stage fund' },
  
  // Global VCs
  { id: 'gv1', name: 'Brightspark', category: 'global-vcs', description: 'Canadian VC' },
  { id: 'gv2', name: 'Real Ventures', category: 'global-vcs', description: 'Montreal-based VC' },
  { id: 'gv3', name: 'OMERS Ventures', category: 'global-vcs', description: 'Multi-stage investor' },
  { id: 'gv4', name: 'Relay Ventures', category: 'global-vcs', description: 'Mobile-first VC' },
  { id: 'gv5', name: 'BDC Capital', category: 'global-vcs', description: 'Federal investment arm' },
  
  // Accelerators
  { id: 'a1', name: 'Volta Cohort', category: 'accelerators', description: 'Flagship accelerator' },
  { id: 'a2', name: 'Ocean Supercluster', category: 'accelerators', description: 'Ocean tech focus' },
  { id: 'a3', name: 'Singularity U Halifax', category: 'accelerators', description: 'Exponential tech' },
  { id: 'a4', name: 'BoostNS', category: 'accelerators', description: 'Provincial program' },
  { id: 'a5', name: 'Futurpreneur', category: 'accelerators', description: 'Youth entrepreneurs' },
  { id: 'a6', name: 'L-Spark', category: 'accelerators', description: 'SaaS accelerator' },
  
  // Corporate
  { id: 'cp1', name: 'Irving Shipbuilding', category: 'corporate', description: 'Defense innovation' },
  { id: 'cp2', name: 'Emera', category: 'corporate', description: 'Energy partnerships' },
  { id: 'cp3', name: 'RBC Innovation', category: 'corporate', description: 'Fintech programs' },
  { id: 'cp4', name: 'Bell Business', category: 'corporate', description: 'Telecom partnerships' },
  
  // Public Entities
  { id: 'p1', name: 'NSBI', category: 'public-entities', description: 'NS Business Inc.' },
  { id: 'p2', name: 'ACOA', category: 'public-entities', description: 'Atlantic development' },
  { id: 'p3', name: 'NRC-IRAP', category: 'public-entities', description: 'Federal R&D support' },
];
