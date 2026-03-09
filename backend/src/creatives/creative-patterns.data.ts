/**
 * Viral Creative Pattern Library
 * Based on proven high-performing video ad frameworks
 */

export interface PatternTemplate {
  pattern: string;
  name: string;
  description: string;
  structure: {
    hookFormula: string;
    storyboardTemplate: string[];
    ctaGuidelines: string;
  };
  bestFor: string[];
  avgViralScore: number;
  examples: string[];
}

export const VIRAL_PATTERNS: Record<string, PatternTemplate> = {
  PROBLEM_AGITATION_SOLUTION: {
    pattern: 'PROBLEM_AGITATION_SOLUTION',
    name: 'Problem-Agitate-Solution (PAS)',
    description: 'Present problem, amplify pain, deliver solution',
    structure: {
      hookFormula: 'State the problem dramatically in first 3 seconds',
      storyboardTemplate: [
        'Shot 1: Dramatic problem visualization (0-3s)',
        'Shot 2: Agitate - show consequences/pain (3-8s)',
        'Shot 3: Introduce solution (product) (8-12s)',
        'Shot 4: Demonstrate transformation (12-18s)',
        'Shot 5: Social proof / results (18-23s)',
        'Shot 6: Strong CTA with urgency (23-30s)',
      ],
      ctaGuidelines: 'Create urgency with limited time offers or scarcity',
    },
    bestFor: [
      'Pain-point products',
      'Problem-solving services',
      'Health & wellness',
      'Productivity tools',
    ],
    avgViralScore: 78,
    examples: [
      'Tired of wasting 3 hours on meetings? → Show chaos → Introduce tool',
      'Struggling with back pain? → Show daily struggles → Present solution',
    ],
  },

  BEFORE_AFTER: {
    pattern: 'BEFORE_AFTER',
    name: 'Before & After Transformation',
    description: 'Show dramatic transformation using product',
    structure: {
      hookFormula: 'Show shocking "before" state in first 2 seconds',
      storyboardTemplate: [
        'Shot 1: Dramatic "before" state (0-3s)',
        'Shot 2: Build tension - why change needed (3-6s)',
        'Shot 3: Introduce the solution (6-9s)',
        'Shot 4: Show transformation process (9-15s)',
        'Shot 5: Reveal amazing "after" (15-22s)',
        'Shot 6: CTA with offer (22-30s)',
      ],
      ctaGuidelines: 'Emphasize transformation is achievable for viewer',
    },
    bestFor: [
      'Weight loss',
      'Skincare',
      'Home improvement',
      'Business growth',
      'Skill development',
    ],
    avgViralScore: 82,
    examples: [
      'From $0 to $10k/month in 90 days',
      'My skin before vs after 30 days',
    ],
  },

  TESTIMONIAL: {
    pattern: 'TESTIMONIAL',
    name: 'Customer Testimonial Story',
    description: 'Real customer shares authentic transformation story',
    structure: {
      hookFormula: 'Bold claim or relatable struggle from real person',
      storyboardTemplate: [
        'Shot 1: Customer makes bold claim (0-3s)',
        'Shot 2: Their struggle/problem (3-8s)',
        'Shot 3: Discovery moment (finding product) (8-12s)',
        'Shot 4: Using product / taking action (12-18s)',
        'Shot 5: Results & emotional reaction (18-25s)',
        'Shot 6: Strong recommendation + CTA (25-30s)',
      ],
      ctaGuidelines: 'Leverage customer authenticity for trust',
    },
    bestFor: [
      'High-ticket items',
      'Services',
      'Courses',
      'Subscription products',
    ],
    avgViralScore: 75,
    examples: [
      'This app saved my marriage (no really)',
      'I was skeptical but...',
    ],
  },

  UGC_STYLE: {
    pattern: 'UGC_STYLE',
    name: 'User-Generated Content Style',
    description: 'Authentic, raw, relatable content that feels native',
    structure: {
      hookFormula: 'Casual, conversational opener like talking to friend',
      storyboardTemplate: [
        'Shot 1: Casual selfie-style intro (0-3s)',
        'Shot 2: Personal story/context (3-7s)',
        'Shot 3: Natural product mention (7-11s)',
        'Shot 4: Show product in use (11-17s)',
        'Shot 5: Genuine reaction/results (17-23s)',
        'Shot 6: Soft CTA + personal recommendation (23-30s)',
      ],
      ctaGuidelines: 'Keep CTA natural and conversational',
    },
    bestFor: [
      'E-commerce',
      'Consumer products',
      'Beauty',
      'Fashion',
      'Tech gadgets',
    ],
    avgViralScore: 85,
    examples: [
      'Okay so I just tried this thing from TikTok...',
      'Why didn\'t anyone tell me about this?',
    ],
  },

  TREND_HIJACK: {
    pattern: 'TREND_HIJACK',
    name: 'Trend Hijacking',
    description: 'Leverage current viral trends with product integration',
    structure: {
      hookFormula: 'Reference trending audio/meme/challenge immediately',
      storyboardTemplate: [
        'Shot 1: Trending hook/audio (0-2s)',
        'Shot 2: Adapt trend to niche (2-6s)',
        'Shot 3: Unexpected product twist (6-10s)',
        'Shot 4: Creative product showcase (10-16s)',
        'Shot 5: Trend completion with product (16-24s)',
        'Shot 6: CTA with trend reference (24-30s)',
      ],
      ctaGuidelines: 'Tie CTA to trending conversation',
    },
    bestFor: [
      'Broad audience products',
      'Impulse purchases',
      'Trending categories',
    ],
    avgViralScore: 88,
    examples: [
      'Using [trending sound] to show product benefit',
      'POV: You discover [product] during [trending situation]',
    ],
  },

  EMOTIONAL_STORY: {
    pattern: 'EMOTIONAL_STORY',
    name: 'Emotional Storytelling',
    description: 'Build emotional connection through narrative',
    structure: {
      hookFormula: 'Open with emotionally charged moment or question',
      storyboardTemplate: [
        'Shot 1: Emotional hook (0-3s)',
        'Shot 2: Establish emotional context (3-8s)',
        'Shot 3: Build tension/conflict (8-13s)',
        'Shot 4: Turning point with product (13-18s)',
        'Shot 5: Emotional resolution (18-24s)',
        'Shot 6: Inspiring CTA (24-30s)',
      ],
      ctaGuidelines: 'Connect CTA to emotional payoff',
    },
    bestFor: [
      'Cause-driven brands',
      'Premium products',
      'Family/children products',
      'Gift items',
    ],
    avgViralScore: 73,
    examples: [
      'The moment I realized I needed to change...',
      'My kid said something that changed everything...',
    ],
  },

  TUTORIAL: {
    pattern: 'TUTORIAL',
    name: 'Quick Tutorial/How-To',
    description: 'Fast-paced educational content with product',
    structure: {
      hookFormula: 'Promise quick solution to specific problem',
      storyboardTemplate: [
        'Shot 1: Hook with problem + promise (0-3s)',
        'Shot 2: Step 1 shown clearly (3-8s)',
        'Shot 3: Step 2 with product feature (8-13s)',
        'Shot 4: Step 3 / result preview (13-18s)',
        'Shot 5: Final result reveal (18-24s)',
        'Shot 6: CTA to learn more/buy (24-30s)',
      ],
      ctaGuidelines: 'Offer deeper tutorial or free resource',
    },
    bestFor: [
      'Educational products',
      'DIY tools',
      'Software',
      'Kitchen gadgets',
    ],
    avgViralScore: 80,
    examples: [
      'How to [solve problem] in under 60 seconds',
      '3 steps to [desirable outcome]',
    ],
  },

  DIRECT_RESPONSE: {
    pattern: 'DIRECT_RESPONSE',
    name: 'Direct Response Ad',
    description: 'Clear offer, benefits, and strong CTA',
    structure: {
      hookFormula: 'State benefit or offer immediately',
      storyboardTemplate: [
        'Shot 1: Clear benefit statement (0-3s)',
        'Shot 2: Product showcase (3-7s)',
        'Shot 3: Feature 1 + benefit (7-11s)',
        'Shot 4: Feature 2 + benefit (11-15s)',
        'Shot 5: Social proof / guarantee (15-22s)',
        'Shot 6: Strong CTA with offer (22-30s)',
      ],
      ctaGuidelines: 'Make offer crystal clear with urgency',
    },
    bestFor: [
      'E-commerce',
      'Limited offers',
      'New product launches',
      'Seasonal sales',
    ],
    avgViralScore: 70,
    examples: [
      '50% off for next 24 hours only',
      'Get [benefit] without [pain point]',
    ],
  },

  LISTICLE: {
    pattern: 'LISTICLE',
    name: 'Listicle Format',
    description: 'Numbered list of tips/reasons/features',
    structure: {
      hookFormula: 'State number of items and value proposition',
      storyboardTemplate: [
        'Shot 1: Hook with number (0-3s)',
        'Shot 2: Reason/Tip #1 (3-7s)',
        'Shot 3: Reason/Tip #2 (7-11s)',
        'Shot 4: Reason/Tip #3 (11-15s)',
        'Shot 5: Bonus tip or summary (15-22s)',
        'Shot 6: CTA (22-30s)',
      ],
      ctaGuidelines: 'Tease additional tips/reasons available',
    },
    bestFor: [
      'Informational content',
      'Multi-benefit products',
      'Comparison content',
    ],
    avgViralScore: 76,
    examples: [
      '5 reasons why [product] changed my life',
      '3 things I wish I knew before buying [product]',
    ],
  },

  CHALLENGE: {
    pattern: 'CHALLENGE',
    name: 'Challenge/Test Format',
    description: 'Test product in challenging scenario',
    structure: {
      hookFormula: 'Present the challenge dramatically',
      storyboardTemplate: [
        'Shot 1: Challenge introduction (0-3s)',
        'Shot 2: Set up test conditions (3-7s)',
        'Shot 3: Product in action (7-13s)',
        'Shot 4: Build suspense (13-18s)',
        'Shot 5: Reveal results (18-24s)',
        'Shot 6: CTA with confidence (24-30s)',
      ],
      ctaGuidelines: 'Leverage proven performance in CTA',
    },
    bestFor: [
      'Durability products',
      'Performance gear',
      'Testing claims',
      'Competitive products',
    ],
    avgViralScore: 81,
    examples: [
      'Testing if [product] really works...',
      'Can [product] survive [extreme test]?',
    ],
  },
};
