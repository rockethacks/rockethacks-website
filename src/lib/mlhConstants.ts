// MLH Form Constants
// Based on MLH Organizer Guide requirements

export const LEVEL_OF_STUDY_OPTIONS = [
  'Less than Secondary / High School',
  'Secondary / High School',
  'Undergraduate University (2 year - community college or similar)',
  'Undergraduate University (3+ year)',
  'Graduate University (Masters, Professional, Doctoral, etc)',
  'Code School / Bootcamp',
  'Other Vocational / Trade Program or Apprenticeship',
  'Post Doctorate',
  'Other',
  'I\'m not currently a student',
  'Prefer not to answer',
];

export const DIETARY_RESTRICTIONS_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Celiac Disease',
  'Allergies',
  'Kosher',
  'Halal',
  'Other',
];

export const GENDER_OPTIONS = [
  'Man',
  'Woman',
  'Non-Binary',
  'Prefer to self-describe',
  'Prefer Not to Answer',
];

export const PRONOUNS_OPTIONS = [
  'She/Her',
  'He/Him',
  'They/Them',
  'She/They',
  'He/They',
  'Prefer Not to Answer',
  'Other',
];

export const RACE_ETHNICITY_OPTIONS = [
  'Asian Indian',
  'Black or African',
  'Chinese',
  'Filipino',
  'Guamanian or Chamorro',
  'Hispanic / Latino / Spanish Origin',
  'Japanese',
  'Korean',
  'Middle Eastern',
  'Native American or Alaskan Native',
  'Native Hawaiian',
  'Samoan',
  'Vietnamese',
  'White',
  'Other Asian (Thai, Cambodian, etc)',
  'Other Pacific Islander',
  'Other (Please Specify)',
  'Prefer Not to Answer',
];

export const SEXUAL_ORIENTATION_OPTIONS = [
  'Heterosexual or straight',
  'Gay or lesbian',
  'Bisexual',
  'Different identity',
  'Prefer Not to Answer',
];

export const EDUCATION_LEVEL_OPTIONS = [
  'Less than Secondary / High School',
  'Secondary / High School',
  'Undergraduate University (2 year - community college or similar)',
  'Undergraduate University (3+ year)',
  'Graduate University (Masters, Professional, Doctoral, etc)',
  'Code School / Bootcamp',
  'Other Vocational / Trade Program or Apprenticeship',
  'Other (please specify)',
  'I\'m not currently a student',
  'Prefer not to answer',
];

export const TSHIRT_SIZES = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
];

export const MAJOR_OPTIONS = [
  'Computer science, computer engineering, or software engineering',
  'Another engineering discipline (such as civil, electrical, mechanical, etc.)',
  'Information systems, information technology, or system administration',
  'A natural science (such as biology, chemistry, physics, etc.)',
  'Mathematics or statistics',
  'Web development or web design',
  'Business discipline (such as accounting, finance, marketing, etc.)',
  'Humanities discipline (such as literature, history, philosophy, etc.)',
  'Social science (such as anthropology, psychology, political science, etc.)',
  'Fine arts or performing arts (such as graphic design, music, studio art, etc.)',
  'Health science (such as nursing, pharmacy, radiology, etc.)',
  'Other (please specify)',
  'Undecided / No Declared Major',
  'My school does not offer majors / primary areas of study',
  'Prefer not to answer',
];

export const UNDERREPRESENTED_GROUP_OPTIONS = [
  'Yes',
  'No',
  'Unsure',
];

// ISO 3166 Country Codes - Commonly used countries
export const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'India',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'Singapore',
  'Brazil',
  'Mexico',
  'Spain',
  'Italy',
  'Japan',
  'China',
  'South Korea',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Poland',
  'Portugal',
  'Belgium',
  'Austria',
  'Switzerland',
  'Ireland',
  'New Zealand',
  'South Africa',
  'Argentina',
  'Chile',
  'Colombia',
  'Peru',
  'Venezuela',
  'Turkey',
  'Israel',
  'United Arab Emirates',
  'Saudi Arabia',
  'Egypt',
  'Nigeria',
  'Kenya',
  'Ghana',
  'Morocco',
  'Pakistan',
  'Bangladesh',
  'Philippines',
  'Indonesia',
  'Malaysia',
  'Thailand',
  'Vietnam',
  'Other',
];

// Ages dropdown (18+ for most hackathons, but starting from 13 for younger events)
export const AGE_OPTIONS = Array.from({ length: 88 }, (_, i) => i + 13); // 13 to 100

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
];
