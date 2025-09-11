const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const OpenAI = require('openai');

const db = getFirestore();

/**
 * ------------------------------
 * Helpers: content checks
 * ------------------------------
 */
function hasContent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.keys(value).some((key) => hasContent(value[key]));
  }
  return true;
}

/**
 * ------------------------------
 * Safer partial JSON parsing from stream buffer
 * - Count braces/brackets outside of strings
 * - Avoids closing quotes/brackets in the middle of a string
 * ------------------------------
 */
function tryParseJson(s) {
  try { return JSON.parse(s); } catch (_error) { return null; }
}

function stripTrailingCommas(s) {
  return s.replace(/,\s*(\]|\})/g, '$1');
}

function balanceState(s) {
  let inStr = false, esc = false, curly = 0, square = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (ch === '{') curly++;
      else if (ch === '}') curly--;
      else if (ch === '[') square++;
      else if (ch === ']') square--;
    }
  }
  return { inStr, curly, square };
}

function attemptPartialParse(jsonString) {
  let parsed = tryParseJson(jsonString);
  if (parsed) return parsed;

  const bal = balanceState(jsonString);

  // If mid-string, wait for more tokens
  if (bal.inStr) return null;

  // If balanced, try again after stripping trailing commas
  if (bal.curly === 0 && bal.square === 0) {
    const cleaned = stripTrailingCommas(jsonString);
    return tryParseJson(cleaned);
  }

  // If only missing closers (not negative), attempt cautious close
  if (bal.curly >= 0 && bal.square >= 0) {
    let tentative = stripTrailingCommas(jsonString);
    tentative += ']'.repeat(bal.square) + '}'.repeat(bal.curly);
    return tryParseJson(tentative) || null;
  }

  // Negative counts indicate corruption
  return null;
}

/**
 * ------------------------------
 * Streaming granular update extractor
 * ------------------------------
 */
function extractGranularUpdates(currentJson, previousState) {
  const updates = [];

  // Track array-based sections
  const arraySections = [
    'experience', 'education', 'projects', 'publications', 'presentations',
    'patents', 'teaching', 'service_volunteering', 'creative_portfolio',
    'awards_honors', 'affiliations_memberships', 'grants_funding', 'open_source'
  ];
  
  arraySections.forEach((field) => {
    if (currentJson[field] && Array.isArray(currentJson[field])) {
      const prevLength = (previousState[field]?.length) || 0;
      const currLength = currentJson[field].length;
      for (let i = prevLength; i < currLength; i++) {
        const item = currentJson[field][i];
        if (hasContent(item)) {
          updates.push({
            type: 'array_item_completed',
            field,
            index: i,
            value: item,
            itemCount: currLength,
          });
        }
      }
    }
  });

  // Track skills updates
  if (currentJson.skills && typeof currentJson.skills === 'object') {
    const skillCategories = [
      'soft_skills',
      'technical',
      'tools',
      'frameworks',
      'platforms',
      'databases',
      'cloud',
      'methodologies',
      'domains'
    ];

    skillCategories.forEach((category) => {
      if (currentJson.skills[category] && Array.isArray(currentJson.skills[category])) {
        const prevSkills = previousState.skills?.[category] || [];
        const currSkills = currentJson.skills[category];
        currSkills.forEach((skill) => {
          if (typeof skill === 'string' && !prevSkills.includes(skill) && skill.trim()) {
            updates.push({
              type: 'skill_added',
              category,
              skill,
              totalInCategory: currSkills.length,
            });
          }
        });
      }
    });
    
    // Track programming languages
    if (currentJson.skills.programming_languages && Array.isArray(currentJson.skills.programming_languages)) {
      const prevLangs = previousState.skills?.programming_languages || [];
      const currLangs = currentJson.skills.programming_languages;
      currLangs.forEach((lang) => {
        if (typeof lang === 'string' && !prevLangs.includes(lang) && lang.trim()) {
          updates.push({
            type: 'programming_language_added',
            language: lang,
            totalInCategory: currLangs.length,
          });
        }
      });
    }
    
    // Track spoken languages
    if (currentJson.skills.spoken_languages && Array.isArray(currentJson.skills.spoken_languages)) {
      const prevLangs = previousState.skills?.spoken_languages || [];
      const currLangs = currentJson.skills.spoken_languages;
      currLangs.forEach((lang) => {
        if (typeof lang === 'string' && !prevLangs.includes(lang) && lang.trim()) {
          updates.push({
            type: 'spoken_language_added',
            language: lang,
            totalInCategory: currLangs.length,
          });
        }
      });
    }
  }
  
  // Track credentials updates
  if (currentJson.credentials && typeof currentJson.credentials === 'object') {
    // Certifications
    if (Array.isArray(currentJson.credentials.certifications)) {
      const prevCerts = previousState.credentials?.certifications || [];
      const currCerts = currentJson.credentials.certifications;
      for (let i = prevCerts.length; i < currCerts.length; i++) {
        const cert = currCerts[i];
        if (cert && cert.name) {
          updates.push({
            type: 'certification_added',
            certification: cert.name,
            issuer: cert.issuer,
            index: i
          });
        }
      }
    }
    
    // Licenses
    if (Array.isArray(currentJson.credentials.licenses)) {
      const prevLics = previousState.credentials?.licenses || [];
      const currLics = currentJson.credentials.licenses;
      for (let i = prevLics.length; i < currLics.length; i++) {
        const lic = currLics[i];
        if (lic && lic.name) {
          updates.push({
            type: 'license_added',
            license: lic.name,
            authority: lic.authority,
            index: i
          });
        }
      }
    }
  }

  return updates;
}

/**
 * ------------------------------
 * Prompt + JSON Schema for Structured Outputs
 * ------------------------------
 */
function getSystemPrompt() {
  return `You are a precise resume-to-JSON parser.

Follow exactly the JSON Schema named "ResumeSchema" provided via response_format.
Return ONE valid JSON object and nothing else (no markdown, no comments).

RULES:
1) Do not invent facts. If a value is unknown, use null (for scalars) or [] (for lists).
2) Never output "N/A", "none", or "unknown" — use null instead.
3) Keep arrays concise and deduplicated; remove trailing punctuation.
4) Classify carefully by profession:
   - For non-tech resumes, leave skills.programming_languages empty.
   - For trades, include physical tools in skills.tools.
   - For academics, emphasize publications/research in achievements.
5) Put any ambiguous or extra information into "other" (include headings if present). Do not discard info.`;
}

// Omni Resume/CV JSON Schema (draft-style compatible with OpenAI Structured Outputs)
const RESUME_JSON_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://example.com/schemas/omni-resume.schema.json",
  title: "Omni Resume/CV Schema",
  type: "object",
  additionalProperties: false,
  required: [
    "personal_information",
    "summary",
    "skills",
    "credentials",
    "experience",
    "education",
    "projects",
    "publications",
    "awards_honors",
    "service_volunteering",
    "open_source",
    "presentations",
    "patents",
    "teaching",
    "creative_portfolio",
    "affiliations_memberships",
    "grants_funding",
    "references",
    "interests",
    "other"
  ],
  properties: {
    personal_information: {
      type: "object",
      additionalProperties: false,
      required: ["name", "email", "phone", "profiles"],
      properties: {
        name: { type: ["string", "null"] },
        email: { type: ["string", "null"], description: "Raw email as shown; do not invent." },
        phone: { type: ["string", "null"], description: "Raw phone string as shown; do not invent." },
        profiles: {
          type: "object",
          additionalProperties: false,
          description: "Professional links and public profiles. Use null if not present.",
          required: ["linkedin", "github", "website", "portfolio", "scholar", "orcid", "other"],
          properties: {
            linkedin:  { type: ["string", "null"] },
            github:    { type: ["string", "null"] },
            website:   { type: ["string", "null"] },
            portfolio: { type: ["string", "null"] },
            scholar:   { type: ["string", "null"], description: "Google Scholar profile, if any." },
            orcid:     { type: ["string", "null"] },
            other:     { type: "array", items: { $ref: "#/$defs/link" } }
          }
        }
      }
    },

    summary: {
      type: ["string", "null"],
      description: "Professional summary or objective as written (or null)."
    },

    skills: {
      type: "object",
      additionalProperties: false,
      description: "Categorized skills; deduplicate; do not invent.",
      required: [
        "soft_skills",
        "technical",
        "tools",
        "domains",
        "programming_languages",
        "spoken_languages"
      ],
      properties: {
        soft_skills:         { type: "array", items: { type: "string" } },
        technical:           { type: "array", items: { type: "string" }, description: "Catch-all technical skills including frameworks, platforms, databases, cloud, and methodologies." },
        tools:               { type: "array", items: { type: "string" } },
        domains:             { type: "array", items: { type: "string" }, description: "Industry/domain knowledge (e.g., Automotive, Healthcare)." },

        programming_languages: {
          type: "array",
          description: "Programming/scripting languages only.",
          items: { type: "string" }
        },

        spoken_languages: {
          type: "array",
          description: "Human languages only.",
          items: { type: "string" }
        }
      }
    },

    credentials: {
      type: "object",
      additionalProperties: false,
      required: ["certifications", "licenses", "security_clearances", "work_authorization"],
      properties: {
        certifications: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "issuer", "issue_date", "expiry_date", "credential_id"],
            properties: {
              name:         { type: "string" },
              issuer:       { type: ["string", "null"] },
              issue_date:   { type: ["string", "null"] },
              expiry_date:  { type: ["string", "null"] },
              credential_id:{ type: ["string", "null"] }
            }
          }
        },
        licenses: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "authority", "region", "issue_date", "expiry_date", "license_id"],
            properties: {
              name:        { type: "string" },
              authority:   { type: ["string", "null"] },
              region:      { type: ["string", "null"] },
              issue_date:  { type: ["string", "null"] },
              expiry_date: { type: ["string", "null"] },
              license_id:  { type: ["string", "null"] }
            }
          }
        },
        security_clearances: { type: "array", items: { type: "string" } },
        work_authorization: { 
          type: "array", 
          items: { type: "string" },
          description: "Work authorization status (e.g., US Citizen, Green Card, H1B, etc.)"
        }
      }
    },

    experience: {
      type: "array",
      description: "Employment/experience entries in reverse chronological order when possible.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["organization", "role", "department", "employment_type", "dates", "responsibilities", "achievements", "technologies"],
        properties: {
          organization:    { type: ["string", "null"] },
          role:            { type: ["string", "null"] },
          department:      { type: ["string", "null"] },
          employment_type: { type: ["string", "null"], enum: [null, "full-time", "part-time", "contract", "freelance", "internship", "volunteer", "temporary"] },
          dates:           { $ref: "#/$defs/date_range" },
          responsibilities:{ type: "array", items: { type: "string" }, description: "Bullets describing duties/scope." },
          achievements:    { type: "array", items: { type: "string" }, description: "Impact/quantifiable outcomes." },
          technologies:    { type: "array", items: { type: "string" }, description: "Tech/tools explicitly mentioned." }
        }
      }
    },

    education: {
      type: "array",
      description: "Education history, most recent first if possible.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["degree", "field_of_study", "institution", "dates", "gpa", "honors_awards", "coursework", "thesis_title", "advisor"],
        properties: {
          degree:         { type: ["string", "null"] },
          field_of_study: { type: ["string", "null"] },
          institution:    { type: ["string", "null"] },
          dates:          { $ref: "#/$defs/date_range" },
          gpa:            { type: ["string", "null"] },
          honors_awards:  { type: "array", items: { type: "string" } },
          coursework:     { type: "array", items: { type: "string" } },
          thesis_title:   { type: ["string", "null"] },
          advisor:        { type: ["string", "null"] }
        }
      }
    },

    projects: {
      type: "array",
      description: "Selected projects (work, academic, personal).",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "role", "organization", "description", "dates", "links", "technologies", "impact"],
        properties: {
          name:         { type: "string" },
          role:         { type: ["string", "null"] },
          organization: { type: ["string", "null"] },
          description:  { type: ["string", "null"] },
          dates:        { $ref: "#/$defs/date_range" },
          links:        { type: "array", items: { $ref: "#/$defs/link" } },
          technologies: { type: "array", items: { type: "string" } },
          impact:       { type: "array", items: { type: "string" } }
        }
      }
    },

    publications: {
      type: "array",
      description: "Journal articles, conference papers, preprints, books, chapters.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "venue", "date", "authors", "doi", "url", "notes"],
        properties: {
          title:   { type: "string" },
          venue:   { type: ["string", "null"] },
          date:    { type: ["string", "null"] },
          authors: { type: "array", items: { type: "string" } },
          doi:     { type: ["string", "null"] },
          url:     { type: ["string", "null"] },
          notes:   { type: ["string", "null"] }
        }
      }
    },

    awards_honors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "issuer", "date", "description"],
        properties: {
          name:        { type: "string" },
          issuer:      { type: ["string", "null"] },
          date:        { type: ["string", "null"] },
          description: { type: ["string", "null"] }
        }
      }
    },

    service_volunteering: {
      type: "array",
      description: "Volunteering, community work, committees, non-profit roles.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["organization", "role", "dates", "description"],
        properties: {
          organization: { type: "string" },
          role:         { type: ["string", "null"] },
          dates:        { $ref: "#/$defs/date_range" },
          description:  { type: ["string", "null"] }
        }
      }
    },

    open_source: {
      type: "array",
      description: "Open-source contributions.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["project", "role", "repo_url", "contributions"],
        properties: {
          project:       { type: "string" },
          role:          { type: ["string", "null"] },
          repo_url:      { type: ["string", "null"] },
          contributions: { type: "array", items: { type: "string" } }
        }
      }
    },

    presentations: {
      type: "array",
      description: "Talks, posters, tutorials, keynotes.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "event", "type", "date", "url"],
        properties: {
          title:    { type: "string" },
          event:    { type: ["string", "null"] },
          type:     { type: ["string", "null"], enum: [null, "talk", "poster", "tutorial", "keynote", "panel"] },
          date:     { type: ["string", "null"] },
          url:      { type: ["string", "null"] }
        }
      }
    },

    patents: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "number", "date", "assignee", "url"],
        properties: {
          title:     { type: "string" },
          number:    { type: ["string", "null"] },
          date:      { type: ["string", "null"] },
          assignee:  { type: ["string", "null"] },
          url:       { type: ["string", "null"] }
        }
      }
    },

    teaching: {
      type: "array",
      description: "Academic teaching/TA roles.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["role", "course", "institution", "term", "responsibilities"],
        properties: {
          role:            { type: "string" },
          course:          { type: ["string", "null"] },
          institution:     { type: ["string", "null"] },
          term:            { type: ["string", "null"] },
          responsibilities:{ type: "array", items: { type: "string" } }
        }
      }
    },

    creative_portfolio: {
      type: "array",
      description: "Exhibitions, performances, film/game credits, installations.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "medium", "role", "venue", "date", "url"],
        properties: {
          title:  { type: "string" },
          medium: { type: ["string", "null"] },
          role:   { type: ["string", "null"] },
          venue:  { type: ["string", "null"] },
          date:   { type: ["string", "null"] },
          url:    { type: ["string", "null"] }
        }
      }
    },

    affiliations_memberships: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["organization", "role", "dates"],
        properties: {
          organization: { type: "string" },
          role:         { type: ["string", "null"] },
          dates:        { $ref: "#/$defs/date_range" }
        }
      }
    },

    grants_funding: {
      type: "array",
      description: "Grants, fellowships, funding awards.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "sponsor", "amount", "date", "role"],
        properties: {
          name:    { type: "string" },
          sponsor: { type: ["string", "null"] },
          amount:  { type: ["string", "null"] },
          date:    { type: ["string", "null"] },
          role:    { type: ["string", "null"] }
        }
      }
    },

    references: {
      type: "array",
      description: "Only include if explicitly present in the resume.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "relationship", "contact"],
        properties: {
          name:         { type: "string" },
          relationship: { type: ["string", "null"] },
          contact:      { type: ["string", "null"] }
        }
      }
    },

    interests: {
      type: "array",
      description: "Optional interests or extracurriculars as listed.",
      items: { type: "string" }
    },

    other: {
      type: "string",
      description: "Freeform bucket for relevant info not captured elsewhere (include headings if present)."
    }
  },

  $defs: {
    date_range: {
      type: "object",
      additionalProperties: false,
      description: "Dates as written and (if possible) structured.",
      required: ["start", "end"],
      properties: {
        start:      { type: ["string", "null"], description: "Prefer ISO 'YYYY-MM' or 'YYYY', else raw token." },
        end:        { type: ["string", "null"], description: "Prefer ISO 'YYYY-MM' or 'YYYY', else raw token. Use null or 'Present' for current positions." }
      }
    },
    link: {
      type: "object",
      additionalProperties: false,
      required: ["label", "url"],
      properties: {
        label: { type: ["string", "null"] },
        url:   { type: ["string", "null"] }
      }
    }
  }
};


/**
 * ------------------------------
 * Post-parse normalization utilities
 * ------------------------------
 */
function normalizeUrl(u) {
  if (!u || typeof u !== 'string') return null;
  const s = u.trim();
  if (!s) return null;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function normalizeEmail(e) {
  if (!e || typeof e !== 'string') return null;
  const s = e.trim();
  return /\S+@\S+\.\S+/.test(s) ? s : null;
}

function pruneNA(x) {
  if (x == null) return null;
  if (typeof x === 'string' && /^(n\/?a|none|unknown)$/i.test(x.trim())) return null;
  return x;
}

function dedupeTrimmed(arr, limit = 50) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (typeof v !== 'string') continue;
    const t = v.trim().replace(/\s+/g, ' ');
    if (!t) continue;
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(t);
      if (out.length >= limit) break;
    }
  }
  return out;
}

function normalizeParsed(data) {
  // Normalize personal information
  const pi = data.personal_information || {};
  pi.name = pruneNA(pi.name);
  pi.email = normalizeEmail(pruneNA(pi.email));
  pi.phone = pruneNA(pi.phone);
  
  // Normalize profiles
  const profiles = pi.profiles || {};
  ['linkedin', 'github', 'website', 'portfolio', 'scholar', 'orcid'].forEach((k) => {
    profiles[k] = profiles[k] ? normalizeUrl(profiles[k]) : null;
  });
  profiles.other = (profiles.other || []).map(link => ({
    label: pruneNA(link?.label),
    url: link?.url ? normalizeUrl(link.url) : null
  })).filter(link => link.url);
  pi.profiles = profiles;
  data.personal_information = pi;

  data.summary = pruneNA(data.summary);

  // Normalize education with new structure
  data.education = Array.isArray(data.education)
    ? data.education.map((ed) => ({
        degree: pruneNA(ed.degree),
        field_of_study: pruneNA(ed.field_of_study),
        institution: pruneNA(ed.institution),
        dates: ed.dates || { start: null, end: null },
        gpa: pruneNA(ed.gpa),
        honors_awards: dedupeTrimmed(ed.honors_awards || [], 10),
        coursework: dedupeTrimmed(ed.coursework || [], 20),
        thesis_title: pruneNA(ed.thesis_title),
        advisor: pruneNA(ed.advisor)
      }))
    : [];

  // Normalize experience with new structure
  data.experience = Array.isArray(data.experience)
    ? data.experience.map((ex) => ({
        organization: pruneNA(ex.organization),
        role: pruneNA(ex.role),
        department: pruneNA(ex.department),
        employment_type: pruneNA(ex.employment_type),
        dates: ex.dates || { start: null, end: null },
        responsibilities: dedupeTrimmed(ex.responsibilities || [], 12),
        achievements: dedupeTrimmed(ex.achievements || [], 12),
        technologies: dedupeTrimmed(ex.technologies || [], 20)
      }))
    : [];

  // Normalize skills - consolidate all technical categories into 'technical'
  const sk = data.skills || {};
  sk.soft_skills = dedupeTrimmed(sk.soft_skills || [], 30);
  
  // Combine all technical skills into one array
  const allTechnical = [
    ...(sk.technical || []),
    ...(sk.frameworks || []),
    ...(sk.platforms || []),
    ...(sk.databases || []),
    ...(sk.cloud || []),
    ...(sk.methodologies || [])
  ];
  sk.technical = dedupeTrimmed(allTechnical, 100);
  
  sk.tools = dedupeTrimmed(sk.tools || [], 50);
  sk.domains = dedupeTrimmed(sk.domains || [], 20);
  
  // Remove the now-consolidated fields
  delete sk.frameworks;
  delete sk.platforms;
  delete sk.databases;
  delete sk.cloud;
  delete sk.methodologies;
  
  // Handle language arrays - now simple string arrays
  sk.programming_languages = dedupeTrimmed(sk.programming_languages || [], 30);
  sk.spoken_languages = dedupeTrimmed(sk.spoken_languages || [], 20);
  
  data.skills = sk;

  // Normalize projects
  data.projects = Array.isArray(data.projects) ? data.projects : [];
  
  // Normalize publications  
  data.publications = Array.isArray(data.publications) ? data.publications : [];
  
  // Normalize presentations
  data.presentations = Array.isArray(data.presentations) ? data.presentations : [];
  
  // Normalize patents
  data.patents = Array.isArray(data.patents) ? data.patents : [];
  
  // Normalize teaching
  data.teaching = Array.isArray(data.teaching) ? data.teaching : [];
  
  // Normalize service/volunteering
  data.service_volunteering = Array.isArray(data.service_volunteering) ? data.service_volunteering : [];
  
  // Normalize creative portfolio
  data.creative_portfolio = Array.isArray(data.creative_portfolio) ? data.creative_portfolio : [];
  
  // Normalize awards/honors
  data.awards_honors = Array.isArray(data.awards_honors) ? data.awards_honors : [];
  
  // Normalize affiliations/memberships
  data.affiliations_memberships = Array.isArray(data.affiliations_memberships) ? data.affiliations_memberships : [];
  
  // Normalize grants/funding
  data.grants_funding = Array.isArray(data.grants_funding) ? data.grants_funding : [];
  
  // Normalize open source
  data.open_source = Array.isArray(data.open_source) ? data.open_source : [];
  
  // Normalize credentials with new structure
  const cred = data.credentials || {};
  cred.certifications = Array.isArray(cred.certifications) ? cred.certifications : [];
  cred.licenses = Array.isArray(cred.licenses) ? cred.licenses : [];
  cred.security_clearances = dedupeTrimmed(cred.security_clearances || [], 10);
  cred.work_authorization = dedupeTrimmed(cred.work_authorization || [], 10);
  data.credentials = cred;
  
  // Normalize interests
  data.interests = dedupeTrimmed(data.interests || [], 20);
  
  // Normalize references
  data.references = Array.isArray(data.references) ? data.references : [];

  data.other = typeof data.other === 'string' ? data.other.trim() : '';
}

/**
 * ------------------------------
 * Validation (backstop in case schema is bypassed)
 * ------------------------------
 */
function validateStructure(data) {
  const required = [
    'personal_information',
    'summary',
    'skills',
    'credentials',
    'experience',
    'education',
    'projects',
    'publications',
    'awards_honors',
    'service_volunteering',
    'open_source',
    'presentations',
    'patents',
    'teaching',
    'creative_portfolio',
    'affiliations_memberships',
    'grants_funding',
    'references',
    'interests',
    'other'
  ];
  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate skills structure
  if (!data.skills || typeof data.skills !== 'object') {
    throw new Error('Skills must be an object');
  }
  const skillCategories = [
    'soft_skills',
    'technical',
    'tools',
    'domains'
  ];
  for (const category of skillCategories) {
    if (!Array.isArray(data.skills[category])) {
      data.skills[category] = [];
    }
  }
  
  // Validate language arrays
  if (!Array.isArray(data.skills.programming_languages)) {
    data.skills.programming_languages = [];
  }
  if (!Array.isArray(data.skills.spoken_languages)) {
    data.skills.spoken_languages = [];
  }

  // Ensure all array fields are arrays
  const arrayFields = [
    'education', 'experience', 'projects', 'publications', 'presentations',
    'patents', 'teaching', 'service_volunteering', 'creative_portfolio',
    'awards_honors', 'affiliations_memberships', 'grants_funding', 'open_source',
    'keywords', 'interests', 'references'
  ];
  arrayFields.forEach((f) => {
    if (!Array.isArray(data[f])) data[f] = [];
  });

  // Validate credentials structure
  if (!data.credentials || typeof data.credentials !== 'object') {
    data.credentials = {
      certifications: [],
      licenses: [],
      security_clearances: [],
      work_authorization: []
    };
  } else {
    if (!Array.isArray(data.credentials.certifications)) {
      data.credentials.certifications = [];
    }
    if (!Array.isArray(data.credentials.licenses)) {
      data.credentials.licenses = [];
    }
    if (!Array.isArray(data.credentials.security_clearances)) {
      data.credentials.security_clearances = [];
    }
    if (!Array.isArray(data.credentials.work_authorization)) {
      data.credentials.work_authorization = [];
    }
  }

  if (!data.other || typeof data.other !== 'string') {
    data.other = '';
  }

  return true;
}

/**
 * ------------------------------
 * Core parsing with Responses API streaming
 * ------------------------------
 * @param {string} resumeText
 * @param {string} userId
 * @param {string} [fileName]
 * @param {Object} [metadata]
 * @param {(update:object)=>void} [streamCallback]
 */
async function parseResumeWithStreaming(
  resumeText,
  userId,
  fileName = 'Direct Input',
  metadata = {},
  streamCallback = null
) {  
  // Create a unique parse ID for status tracking
  const parseRef = db.collection('resumes').doc();
  const resumeId = parseRef.id;

  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not configured');
    }
    if (!process.env.OPENAI_PARSING_MODEL) {
      throw new Error('OPENAI_PARSING_MODEL environment variable is not configured');
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const systemPrompt = getSystemPrompt();

    if (!metadata.source) {
      throw new Error('metadata.source is required');
    }

    if (streamCallback) streamCallback({ type: 'stream_started' });

    // Start streaming using Responses API
    const stream = await openai.responses.create({
      model: process.env.OPENAI_PARSING_MODEL,
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this resume:\n\n${resumeText}` },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'ResumeSchema',
          schema: RESUME_JSON_SCHEMA,
          strict: true
        }
      },
      stream: true
    });

    let buffer = '';
    let currentObject = {};
    let previousState = {};
    const completedFields = new Set();
    let totalUpdates = 0;

    // Consume SSE events
    for await (const event of stream) {
      // Append deltas from any output_text.delta-like events
      if (event?.type && typeof event.type === 'string' && event.type.includes('output_text.delta')) {
        const delta = event.delta ?? event?.data ?? '';
        if (typeof delta === 'string' && delta) {
          buffer += delta;

          // Attempt safe partial parse
          const tentativeJson = attemptPartialParse(buffer);
          if (tentativeJson) {
            // Newly completed top-level simple fields
            const complexFields = [
              'experience', 'education', 'skills', 'credentials',
              'projects', 'publications', 'presentations', 'patents',
              'teaching', 'service_volunteering', 'creative_portfolio',
              'awards_honors', 'affiliations_memberships', 'grants_funding',
              'open_source', 'personal_information'
            ];
            
            for (const [field, value] of Object.entries(tentativeJson)) {
              if (!complexFields.includes(field)) {
                if (!completedFields.has(field) && hasContent(value)) {
                  completedFields.add(field);
                  currentObject[field] = value;
                  if (streamCallback) {
                    streamCallback({
                      type: 'field_completed',
                      field,
                      value,
                      progress: Math.min(10 + totalUpdates * 2, 90),
                      completedFields: Array.from(completedFields),
                    });
                    totalUpdates++;
                  }
                }
              }
            }

            // Granular updates for arrays/nested
            const granularUpdates = extractGranularUpdates(tentativeJson, previousState);
            for (const update of granularUpdates) {
              if (streamCallback) {
                streamCallback({
                  ...update,
                  progress: Math.min(10 + totalUpdates * 2, 90),
                  completedFields: Array.from(completedFields),
                });
                totalUpdates++;
              }
            }

            // Mark complex fields when first fully present
            complexFields.forEach((field) => {
              if (tentativeJson[field] && !currentObject[field] && hasContent(tentativeJson[field])) {
                currentObject[field] = tentativeJson[field];
                completedFields.add(field);
              }
            });

            previousState = JSON.parse(JSON.stringify(tentativeJson));
          }
        }
      }

      if (event?.type === 'response.error') {
        const errMsg = event.error?.message || 'OpenAI streaming error';
        throw new Error(errMsg);
      }

      if (event?.type === 'response.completed') {
        break; // end of stream
      }
    }

    // Final parse & normalize
    const parsedData = JSON.parse(buffer);
    validateStructure(parsedData);
    normalizeParsed(parsedData);

    const resumeData = {
      userId,
      fileName,
      fileType: metadata.fileType || 'text/plain',
      fileSize: resumeText.length,
      structuredData: parsedData,
      processingStatus: 'completed',
      parsedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      aiModel: process.env.OPENAI_PARSING_MODEL,
      source: metadata.source,
      ...metadata,
    };
    delete resumeData.metadata; // prevent nested metadata

    await parseRef.set(resumeData);

    if (streamCallback) streamCallback({ type: 'completed', progress: 100 });

    return { resumeId, structuredData: parsedData, processingStatus: 'completed' };
  } catch (error) {
    // Friendly error mapping
    let enhancedError = error;
    if (error.message?.includes('OPENAI_API_KEY')) {
      enhancedError = new Error('Resume parsing service is temporarily unavailable. Please try again later.');
      enhancedError.code = 'PARSER_CONFIG_ERROR';
    } else if (error.message?.includes('OPENAI_PARSING_MODEL')) {
      enhancedError = new Error('Resume parser configuration error. Please contact support.');
      enhancedError.code = 'PARSER_CONFIG_ERROR';
    } else if (error.message?.includes('JSON')) {
      enhancedError = new Error('Failed to parse resume structure. The resume format may be incompatible. Please try a different file format.');
      enhancedError.code = 'PARSER_JSON_ERROR';
      enhancedError.details = { originalError: error.message };
    } else if (error.status === 429 || error.message?.includes('rate limit')) {
      enhancedError = new Error('Too many requests. Please wait a moment and try again.');
      enhancedError.code = 'PARSER_RATE_LIMIT';
    } else if (error.status === 504 || error.status === 408) {
      enhancedError = new Error('Resume processing is taking longer than expected. Please try again with a smaller file.');
      enhancedError.code = 'PARSER_TIMEOUT';
    } else if (error.status >= 500) {
      enhancedError = new Error('Resume parsing service encountered an error. Our team has been notified. Please try again later.');
      enhancedError.code = 'PARSER_SERVER_ERROR';
    } else {
      // For any other errors, ensure we have a code
      if (!enhancedError.code) {
        enhancedError.code = 'PARSER_UNKNOWN_ERROR';
      }
    }

    console.error('Parser error:', {
      message: error.message,
      status: error.status,
      code: error.code,
      fileName,
      userId,
      timestamp: new Date().toISOString(),
    });

    if (parseRef) {
      const updateData = {
        processingStatus: 'failed',
        errorMessage: enhancedError.message,
        errorCode: enhancedError.code || 'PARSER_UNKNOWN_ERROR',
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      // Only add errorDetails if in development mode
      if (process.env.NODE_ENV === 'development') {
        updateData.errorDetails = error.message;
      }
      
      await parseRef.update(updateData)
        .catch(() => {
          parseRef.set({
            userId,
            fileName,
            processingStatus: 'failed',
            errorMessage: enhancedError.message,
            errorCode: enhancedError.code || 'PARSER_UNKNOWN_ERROR',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
    }

    throw enhancedError;
  }
}

module.exports = {
  parseResumeWithStreaming,
  validateStructure,
  getSystemPrompt,
  RESUME_JSON_SCHEMA,
  normalizeParsed,
};
