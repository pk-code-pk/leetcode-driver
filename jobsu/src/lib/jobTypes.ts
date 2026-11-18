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
  /** What most residents pay for this kind of job, in whole dollars per hour. */
  pay?: [number, number];
};

export const JOB_TYPES: JobType[] = [
  {
    slug: "babysitting",
    pay: [20, 28],
    label: "Babysitting",
    emoji: "🧸",
    questions: [
      { key: "kids", label: "How many kids, and how old are they?", kind: "text", placeholder: "Two kids, ages 4 and 7" },
      { key: "pets", label: "Any pets at home?", kind: "text", placeholder: "One friendly dog" },
    ],
  },
  {
    slug: "tutoring",
    pay: [25, 40],
    label: "Tutoring",
    emoji: "📚",
    questions: [
      { key: "subject", label: "What subject?", kind: "text", placeholder: "Algebra, SAT reading…" },
      { key: "grade", label: "What grade is the student in?", kind: "text", placeholder: "8th grade" },
    ],
  },
  {
    slug: "moving",
    pay: [22, 30],
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
    pay: [20, 28],
    label: "Yard Work",
    emoji: "🍂",
    questions: [
      { key: "size", label: "Roughly how big is the yard?", kind: "select", options: ["Small", "Medium", "Large"] },
      { key: "tools", label: "Do you have the tools (rakes, shovels, bags)?", kind: "select", options: ["Yes", "Some", "No"] },
    ],
  },
  {
    slug: "pet-care",
    pay: [20, 30],
    label: "Pet Care & Dog Walking",
    emoji: "🐕",
    questions: [{ key: "pet", label: "Tell us about your pet", kind: "text", placeholder: "Golden retriever, 3 years old" }],
  },
  {
    slug: "lessons",
    pay: [25, 45],
    label: "Music or Sports Lessons",
    emoji: "🎵",
    questions: [
      { key: "activity", label: "Which instrument or sport?", kind: "text", placeholder: "Piano, tennis…" },
      { key: "level", label: "Current level?", kind: "select", options: ["Beginner", "Intermediate", "Advanced"] },
    ],
  },
  {
    slug: "tech-setup",
    pay: [25, 40],
    label: "Tech Setup",
    emoji: "💻",
    questions: [{ key: "device", label: "What needs setting up?", kind: "text", placeholder: "New printer and Wi-Fi" }],
  },
  {
    slug: "errands",
    pay: [20, 26],
    label: "Errands & Grocery Runs",
    emoji: "🛒",
    questions: [],
  },
  {
    slug: "organizing",
    pay: [20, 28],
    label: "Home Organization & Event Setup",
    emoji: "🏠",
    questions: [],
  },
  {
    slug: "party-help",
    pay: [20, 30],
    label: "Party & Event Help",
    emoji: "🎉",
    questions: [{ key: "event", label: "What kind of event?", kind: "text", placeholder: "Graduation party, about 40 guests" }],
  },
  {
    slug: "house-sitting",
    pay: [20, 28],
    label: "House Sitting",
    emoji: "🔑",
    questions: [{ key: "duties", label: "What should they look after?", kind: "text", placeholder: "Plants, mail and the cat" }],
  },
  {
    slug: "cleaning",
    pay: [20, 28],
    label: "Cleaning",
    emoji: "🧽",
    questions: [{ key: "supplies", label: "Do you have the supplies?", kind: "select", options: ["Yes", "Some", "No"] }],
  },
  {
    slug: "lifeguarding",
    pay: [22, 32],
    label: "Lifeguarding",
    emoji: "🏊",
    questions: [{ key: "pool", label: "Where is the pool, and how many swimmers?", kind: "text", placeholder: "Backyard pool, three kids" }],
  },
  {
    slug: "social-media",
    pay: [20, 30],
    label: "Social Media & Marketing",
    emoji: "📣",
    questions: [{ key: "channel", label: "Which platforms or materials?", kind: "text", placeholder: "Instagram posts, flyers" }],
  },
  {
    slug: "office-help",
    pay: [20, 30],
    label: "Office & Admin Help",
    emoji: "🗂️",
    questions: [{ key: "remote", label: "In person or remote?", kind: "select", options: ["In person", "Remote", "Either"] }],
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

/** Usual pay for a job type, or a general range if the type doesn't set one. */
export function payGuide(slug: string): [number, number] {
  return jobType(slug).pay ?? [20, 30];
}

/** How the student gets to the job. Shown on the post form and to students. */
export const TRANSPORT = [
  { slug: "walkable", label: "Walkable or on the T", needsCar: false },
  { slug: "own-car", label: "Student uses their own car", needsCar: true },
  { slug: "own-car-paid", label: "Student's own car, we cover gas", needsCar: true },
  { slug: "we-provide", label: "We provide a car", needsCar: false },
  { slug: "ride-covered", label: "We'll cover an Uber or ride here", needsCar: false },
] as const;

export function transportOption(slug: string) {
  return TRANSPORT.find((t) => t.slug === slug);
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
