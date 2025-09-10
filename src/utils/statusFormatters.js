/**
 * Format field names from backend to user-friendly display names
 */
export function formatFieldName(fieldName) {
  const fieldMappings = {
    'personal_information': 'Personal Information',
    'detected_profession': 'Professional Title',
    'education': 'Education History',
    'experience': 'Work Experience',
    'skills': 'Skills & Expertise',
    'achievements': 'Achievements',
    'credentials': 'Certifications & Licenses',
    'summary': 'Professional Summary',
    'technical': 'Technical Skills',
    'soft': 'Soft Skills',
    'languages': 'Languages',
    'tools': 'Tools & Software'
  };

  return fieldMappings[fieldName] || 
    fieldName.replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Format dimension names from backend to user-friendly display names
 */
export function formatDimensionName(dimensionName) {
  const dimensionMappings = {
    'tasks': 'Job Tasks',
    'skills': 'Core Skills',
    'technologySkills': 'Technology Skills',
    'education': 'Education',
    'tools': 'Tools & Software',
    'workActivities': 'Work Activities',
    'abilities': 'Abilities',
    'knowledge': 'Knowledge Areas'
  };

  return dimensionMappings[dimensionName] || 
    dimensionName.replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
}

/**
 * Get all expected parsing fields in order
 */
export function getExpectedParsingFields() {
  return [
    'detected_profession',
    'personal_information',
    'summary',
    'experience',
    'education',
    'skills',
    'achievements',
    'credentials'
  ];
}

/**
 * Get all expected analysis dimensions in order
 */
export function getExpectedAnalysisDimensions() {
  return [
    'tasks',
    'skills',
    'technologySkills',
    'education',
    'workActivities',
    'abilities',
    'knowledge',
    'tools'
  ];
}

/**
 * Format progress percentage for display
 */
export function formatProgress(progress) {
  return Math.min(100, Math.max(0, Math.round(progress)));
}