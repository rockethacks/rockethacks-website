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

  // Required MLH fields (should always be filled due to NOT NULL constraints)
  if (!application.first_name || application.first_name.trim() === '') {
    missingFields.push({ field: 'first_name', label: 'First Name', category: 'personal' })
  }
  if (!application.last_name || application.last_name.trim() === '') {
    missingFields.push({ field: 'last_name', label: 'Last Name', category: 'personal' })
  }
  if (!application.age) {
    missingFields.push({ field: 'age', label: 'Age', category: 'personal' })
  }
  if (!application.phone_number || application.phone_number.trim() === '') {
    missingFields.push({ field: 'phone_number', label: 'Phone Number', category: 'personal' })
  }
  if (!application.email || application.email.trim() === '') {
    missingFields.push({ field: 'email', label: 'Email', category: 'personal' })
  }
  if (!application.school || application.school.trim() === '') {
    missingFields.push({ field: 'school', label: 'School', category: 'education' })
  }
  if (!application.level_of_study || application.level_of_study.trim() === '') {
    missingFields.push({ field: 'level_of_study', label: 'Level of Study', category: 'education' })
  }
  if (!application.country_of_residence || application.country_of_residence.trim() === '') {
    missingFields.push({ field: 'country_of_residence', label: 'Country of Residence', category: 'personal' })
  }
  if (!application.mlh_code_of_conduct) {
    missingFields.push({ field: 'mlh_code_of_conduct', label: 'MLH Code of Conduct Agreement', category: 'event' })
  }
  if (!application.mlh_privacy_policy) {
    missingFields.push({ field: 'mlh_privacy_policy', label: 'MLH Privacy Policy Agreement', category: 'event' })
  }

  // Optional but expected fields for complete application
  if (!application.linkedin_url || application.linkedin_url.trim() === '') {
    missingFields.push({ field: 'linkedin_url', label: 'LinkedIn URL', category: 'professional' })
  }
  if (!application.github_url || application.github_url.trim() === '') {
    missingFields.push({ field: 'github_url', label: 'GitHub URL', category: 'professional' })
  }
  if (!application.portfolio_url || application.portfolio_url.trim() === '') {
    missingFields.push({ field: 'portfolio_url', label: 'Portfolio URL', category: 'professional' })
  }
  if (!application.resume_url || application.resume_url.trim() === '') {
    missingFields.push({ field: 'resume_url', label: 'Resume', category: 'professional' })
  }
  if (!application.dietary_restrictions || (Array.isArray(application.dietary_restrictions) && application.dietary_restrictions.length === 0)) {
    missingFields.push({ field: 'dietary_restrictions', label: 'Dietary Restrictions', category: 'event' })
  }
  if (!application.gender || application.gender.trim() === '') {
    missingFields.push({ field: 'gender', label: 'Gender', category: 'personal' })
  }
  if (!application.pronouns || application.pronouns.trim() === '') {
    missingFields.push({ field: 'pronouns', label: 'Pronouns', category: 'personal' })
  }
  if (!application.race_ethnicity || (Array.isArray(application.race_ethnicity) && application.race_ethnicity.length === 0)) {
    missingFields.push({ field: 'race_ethnicity', label: 'Race/Ethnicity', category: 'personal' })
  }
  if (!application.education_level || application.education_level.trim() === '') {
    missingFields.push({ field: 'education_level', label: 'Education Level', category: 'education' })
  }
  if (!application.tshirt_size || application.tshirt_size.trim() === '') {
    missingFields.push({ field: 'tshirt_size', label: 'T-Shirt Size', category: 'event' })
  }
  if (!application.major || application.major.trim() === '') {
    missingFields.push({ field: 'major', label: 'Major/Field of Study', category: 'education' })
  }
  if (application.first_hackathon === null || application.first_hackathon === undefined) {
    missingFields.push({ field: 'first_hackathon', label: 'First Hackathon Status', category: 'event' })
  }

  // Shipping address fields
  if (!application.address_line1 || application.address_line1.trim() === '') {
    missingFields.push({ field: 'address_line1', label: 'Address Line 1', category: 'address' })
  }
  if (!application.city || application.city.trim() === '') {
    missingFields.push({ field: 'city', label: 'City', category: 'address' })
  }
  if (!application.state || application.state.trim() === '') {
    missingFields.push({ field: 'state', label: 'State/Province', category: 'address' })
  }
  if (!application.shipping_country || application.shipping_country.trim() === '') {
    missingFields.push({ field: 'shipping_country', label: 'Country', category: 'address' })
  }
  if (!application.postal_code || application.postal_code.trim() === '') {
    missingFields.push({ field: 'postal_code', label: 'Postal Code', category: 'address' })
  }

  const totalFields = 27 // Total number of fields checked
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
