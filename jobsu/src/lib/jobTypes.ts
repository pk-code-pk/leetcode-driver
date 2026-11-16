// Job categories and the extra questions each one asks on the request form.

export type Question = {
  key: string;
  label: string;
  kind: "text" | "select";
  options?: string[];
  placeholder?: string;
};

export type JobType = {
  slug: string;
  label: string;
  emoji: string;
  questions: Question[];
};

export const JOB_TYPES: JobType[] = [
  {
    slug: "babysitting",
    label: "Babysitting",
    emoji: "🧸",
    questions: [
      { key: "kids", label: "How many kids, and how old are they?", kind: "text", placeholder: "Two kids, ages 4 and 7" },
      { key: "pets", label: "Any pets at home?", kind: "text", placeholder: "One friendly dog" },
    ],
  },
  {
    slug: "tutoring",
    label: "Tutoring",
    emoji: "📚",
    questions: [
      { key: "subject", label: "What subject?", kind: "text", placeholder: "Algebra, SAT reading…" },
      { key: "grade", label: "What grade is the student in?", kind: "text", placeholder: "8th grade" },
    ],
  },
  {
    slug: "moving",
    label: "Moving Help",
    emoji: "📦",
    questions: [
      { key: "stairs", label: "Stairs or elevator?", kind: "select", options: ["Ground floor", "Stairs", "Elevator"] },
      { key: "truck", label: "Do you have a truck or van arranged?", kind: "select", options: ["Yes", "No", "Not needed"] },
      { key: "heavy", label: "Anything especially heavy?", kind: "text", placeholder: "A sofa and a dresser" },
    ],
  },
  {
    slug: "yard-work",
    label: "Yard Work",
    emoji: "🍂",
    questions: [
      { key: "size", label: "Roughly how big is the yard?", kind: "select", options: ["Small", "Medium", "Large"] },
      { key: "tools", label: "Do you have the tools (rakes, shovels, bags)?", kind: "select", options: ["Yes", "Some", "No"] },
    ],
  },
  {
    slug: "pet-care",
    label: "Pet Care & Dog Walking",
    emoji: "🐕",
    questions: [{ key: "pet", label: "Tell us about your pet", kind: "text", placeholder: "Golden retriever, 3 years old" }],
  },
  {
    slug: "lessons",
    label: "Music or Sports Lessons",
    emoji: "🎵",
    questions: [
      { key: "activity", label: "Which instrument or sport?", kind: "text", placeholder: "Piano, tennis…" },
      { key: "level", label: "Current level?", kind: "select", options: ["Beginner", "Intermediate", "Advanced"] },
    ],
  },
  {
    slug: "tech-setup",
    label: "Tech Setup",
    emoji: "💻",
    questions: [{ key: "device", label: "What needs setting up?", kind: "text", placeholder: "New printer and Wi-Fi" }],
  },
  {
    slug: "errands",
    label: "Errands & Grocery Runs",
    emoji: "🛒",
    questions: [],
  },
  {
    slug: "organizing",
    label: "Home Organization & Event Setup",
    emoji: "🏠",
    questions: [],
  },
  {
    slug: "other",
    label: "Something else",
    emoji: "✨",
    questions: [],
  },
];

export const JOB_TYPE_SLUGS = JOB_TYPES.map((t) => t.slug);

export function jobType(slug: string): JobType {
  return JOB_TYPES.find((t) => t.slug === slug) ?? JOB_TYPES[JOB_TYPES.length - 1];
}

export const TIMINGS = [
  { slug: "one-time", label: "One time" },
  { slug: "occasional", label: "Occasional" },
  { slug: "recurring", label: "Recurring (weekly or so)" },
] as const;

export function timingLabel(slug: string): string {
  return TIMINGS.find((t) => t.slug === slug)?.label ?? slug;
}

// Work JobsU doesn't allow (Terms §5). A match sends the job to the review queue
// rather than rejecting it, since keywords alone can be wrong.
const PROHIBITED_PATTERNS: [RegExp, string][] = [
  [/\b(electrical|electrician|rewir\w*|wiring)\b/i, "electrical work"],
  [/\b(plumb\w*|hvac|furnace|gas line)\b/i, "licensed trade work"],
  [/\b(roof\w*|gutter\w*)\b/i, "roof work"],
  [/\b(tree (removal|trimming|cutting)|chainsaw)\b/i, "tree work"],
  [/\b(pest control|exterminat\w*)\b/i, "pest control"],
  [/\b(medical|medication|nursing|bathing|personal care)\b/i, "medical or personal care"],
  [/\b(driv\w* (my |the |our )?(kids?|children|son|daughter)|chauffeur|ride to|drive me)\b/i, "paid driving of people"],
  [/\b(demolition|jackhammer|heavy machinery|forklift)\b/i, "heavy machinery or demolition"],
  [/\b(piano|safe|refrigerator|washing machine)\b.*\b(mov\w*|carry|lift)\b|\b(mov\w*|carry|lift)\b.*\b(piano|safe)\b/i, "moving very heavy items"],
  [/\b(firearm|gun|weapon)s?\b/i, "firearms"],
];

export function prohibitedReasons(text: string): string[] {
  const hits = new Set<string>();
  for (const [re, reason] of PROHIBITED_PATTERNS) if (re.test(text)) hits.add(reason);
  return [...hits];
}
