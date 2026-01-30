// Utility functions for checking application completeness

interface MissingField {
  field: string
  label: string
  category: 'personal' | 'education' | 'professional' | 'event' | 'address'
}

export interface CompletenessResult {
  isComplete: boolean
  percentage: number
  totalFields: number
  filledFields: number
  missingFields: MissingField[]
}

/**
 * Check if application is complete and return missing fields
 * This mirrors the database function logic
 */
export function checkApplicationCompleteness(application: any): CompletenessResult {
  const missingFields: MissingField[] = []

  // Debug log to see what we're checking
  console.log('Checking completeness for application:', {
    portfolio_url: application.portfolio_url,
    resume_url: application.resume_url,
    level_of_study: application.level_of_study,
    linkedin_url: application.linkedin_url,
    github_url: application.github_url,
  })

  // Helper function to safely check if a string field is empty
  const isStringEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    return false
  }

  // Helper function to safely check if a boolean field is set
  const isBooleanSet = (value: any): boolean => {
    return typeof value === 'boolean' && value === true
  }

  // Required MLH fields (should always be filled due to NOT NULL constraints)
  if (isStringEmpty(application.first_name)) {
    missingFields.push({ field: 'first_name', label: 'First Name', category: 'personal' })
  }
  if (isStringEmpty(application.last_name)) {
    missingFields.push({ field: 'last_name', label: 'Last Name', category: 'personal' })
  }
  if (!application.age) {
    missingFields.push({ field: 'age', label: 'Age', category: 'personal' })
  }
  if (isStringEmpty(application.phone_number)) {
    missingFields.push({ field: 'phone_number', label: 'Phone Number', category: 'personal' })
  }
  if (isStringEmpty(application.email)) {
    missingFields.push({ field: 'email', label: 'Email', category: 'personal' })
  }
  if (isStringEmpty(application.school)) {
    missingFields.push({ field: 'school', label: 'School', category: 'education' })
  }
  if (isStringEmpty(application.level_of_study)) {
    missingFields.push({ field: 'level_of_study', label: 'Level of Study', category: 'education' })
  }
  if (isStringEmpty(application.country_of_residence)) {
    missingFields.push({ field: 'country_of_residence', label: 'Country of Residence', category: 'personal' })
  }
  if (!isBooleanSet(application.mlh_code_of_conduct)) {
    missingFields.push({ field: 'mlh_code_of_conduct', label: 'MLH Code of Conduct Agreement', category: 'event' })
  }
  if (!isBooleanSet(application.mlh_privacy_policy)) {
    missingFields.push({ field: 'mlh_privacy_policy', label: 'MLH Privacy Policy Agreement', category: 'event' })
  }

  // Optional but expected fields for complete application
  if (isStringEmpty(application.linkedin_url)) {
    missingFields.push({ field: 'linkedin_url', label: 'LinkedIn URL', category: 'professional' })
  }
  if (isStringEmpty(application.github_url)) {
    missingFields.push({ field: 'github_url', label: 'GitHub URL', category: 'professional' })
  }
  if (!application.dietary_restrictions || (Array.isArray(application.dietary_restrictions) && application.dietary_restrictions.length === 0)) {
    missingFields.push({ field: 'dietary_restrictions', label: 'Dietary Restrictions', category: 'event' })
  }
  if (isStringEmpty(application.gender)) {
    missingFields.push({ field: 'gender', label: 'Gender', category: 'personal' })
  }
  if (isStringEmpty(application.pronouns)) {
    missingFields.push({ field: 'pronouns', label: 'Pronouns', category: 'personal' })
  }
  if (!application.race_ethnicity || (Array.isArray(application.race_ethnicity) && application.race_ethnicity.length === 0)) {
    missingFields.push({ field: 'race_ethnicity', label: 'Race/Ethnicity', category: 'personal' })
  }
  if (isStringEmpty(application.tshirt_size)) {
    missingFields.push({ field: 'tshirt_size', label: 'T-Shirt Size', category: 'event' })
  }
  if (isStringEmpty(application.major)) {
    missingFields.push({ field: 'major', label: 'Major/Field of Study', category: 'education' })
  }
  if (application.first_hackathon !== true && application.first_hackathon !== false) {
    missingFields.push({ field: 'first_hackathon', label: 'First Hackathon Status', category: 'event' })
  }

  // Shipping address fields
  if (isStringEmpty(application.address_line1)) {
    missingFields.push({ field: 'address_line1', label: 'Address Line 1', category: 'address' })
  }
  if (isStringEmpty(application.city)) {
    missingFields.push({ field: 'city', label: 'City', category: 'address' })
  }
  if (isStringEmpty(application.state)) {
    missingFields.push({ field: 'state', label: 'State/Province', category: 'address' })
  }
  if (isStringEmpty(application.shipping_country)) {
    missingFields.push({ field: 'shipping_country', label: 'Country', category: 'address' })
  }
  if (isStringEmpty(application.postal_code)) {
    missingFields.push({ field: 'postal_code', label: 'Postal Code', category: 'address' })
  }

  const totalFields = 26 // Total number of fields checked
  const filledFields = totalFields - missingFields.length
  const percentage = Math.round((filledFields / totalFields) * 100)
  const isComplete = missingFields.length === 0

  return {
    isComplete,
    percentage,
    totalFields,
    filledFields,
    missingFields
  }
}

/**
 * Group missing fields by category
 */
export function groupMissingFieldsByCategory(missingFields: MissingField[]): Record<string, MissingField[]> {
  return missingFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, MissingField[]>)
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    personal: 'Personal Information',
    education: 'Education',
    professional: 'Professional Links',
    event: 'Event Details',
    address: 'Shipping Address'
  }
  return names[category] || category
}
