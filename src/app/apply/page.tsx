'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { parseResume, extractResumeData } from '@/lib/resumeParser'
import { loadSchoolsList } from '@/lib/mlhSchools'
import { SchoolAutocomplete } from '@/components/ui/school-autocomplete'
import {
  LEVEL_OF_STUDY_OPTIONS,
  DIETARY_RESTRICTIONS_OPTIONS,
  GENDER_OPTIONS,
  PRONOUNS_OPTIONS,
  RACE_ETHNICITY_OPTIONS,
  TSHIRT_SIZES,
  MAJOR_OPTIONS,
  UNDERREPRESENTED_GROUP_OPTIONS,
  COUNTRIES,
  AGE_OPTIONS,
} from '@/lib/mlhConstants'

export default function ApplyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [schools, setSchools] = useState<string[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    phone_number: '',
    email: '',
    school: '',
    level_of_study: '',
    country_of_residence: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    resume_url: '',
    resume_markdown: null as string | null,
    mlh_code_of_conduct: false,
    mlh_privacy_policy: false,
    mlh_marketing_emails: false,
    dietary_restrictions: [] as string[],
    underrepresented_group: '',
    gender: '',
    pronouns: '',
    race_ethnicity: [] as string[],
    tshirt_size: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    shipping_country: '',
    postal_code: '',
    major: '',
    first_hackathon: false,
    team_name: '',
    special_accommodations: '',
  })

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    // Ensure we have a valid session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      const { error: refreshError } = await supabase.auth.refreshSession()
      if (refreshError) {
        router.push('/login?redirect=/apply')
        return
      }
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login?redirect=/apply')
      return
    }
    setUser(user)

    const schoolsList = await loadSchoolsList()
    setSchools(schoolsList)

    // Load existing application (if any)
    const { data: existingApp, error: loadError } = await supabase
      .from('applicants')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (loadError) {
      console.error('Error loading application:', loadError)
      // Don't show error to user - they might not have an application yet
    }

    if (existingApp) {
      // Check if school value is corrupted (contains unusual characters)
      let schoolValue = existingApp.school || ''
      if (schoolValue && !/^[\w\s\-\(\),'\.&]+$/.test(schoolValue)) {
        console.warn('Corrupted school value detected, clearing')
        schoolValue = '' // Clear corrupted value
      }
      
      setFormData({
        ...existingApp,
        school: schoolValue,
        age: existingApp.age?.toString() || '',
        dietary_restrictions: existingApp.dietary_restrictions || [],
        race_ethnicity: existingApp.race_ethnicity || [],
      })
    } else {
      setFormData(prev => ({ ...prev, email: user.email || '' }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleMultiSelectChange = (field: 'dietary_restrictions' | 'race_ethnicity', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value]
      return { ...prev, [field]: newArray }
    })
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      // RLS policy requires: resumes/{user-id}/{filename}
      const filePath = `resumes/${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('applicant-files')
        .upload(filePath, file, {
          upsert: true // Allow replacing existing resume
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('applicant-files')
        .getPublicUrl(filePath)

      // Try to parse resume, but don't fail if parsing doesn't work
      let markdown: string | null = null
      let extractedData: { github?: string; linkedin?: string; phone?: string; email?: string } = {}
      
      try {
        markdown = await parseResume(file)
        extractedData = extractResumeData(markdown)
      } catch (parseError: any) {
        console.warn('Resume parsing failed, but file was uploaded:', parseError)
        // Continue without parsed data - user can still submit with just the file URL
      }

      setFormData(prev => ({
        ...prev,
        resume_url: publicUrl,
        resume_markdown: markdown || null,
        github_url: prev.github_url || extractedData.github || '',
        linkedin_url: prev.linkedin_url || extractedData.linkedin || '',
        phone_number: prev.phone_number || extractedData.phone || '',
      }))
    } catch (err: any) {
      console.error('Error uploading resume:', err)
      setError(`Resume upload failed: ${err.message || 'Unknown error'}. Please try again or submit without a resume.`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!formData.mlh_code_of_conduct || !formData.mlh_privacy_policy) {
      setError('You must agree to the MLH Code of Conduct and Privacy Policy')
      setLoading(false)
      return
    }

    // Validate school is from the approved list
    if (!schools.includes(formData.school)) {
      setError('Please select a valid school from the MLH-verified list')
      setLoading(false)
      return
    }

    try {
      const applicationData = {
        user_id: user.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        age: parseInt(formData.age),
        phone_number: formData.phone_number,
        email: formData.email,
        school: formData.school,
        level_of_study: formData.level_of_study,
        country_of_residence: formData.country_of_residence,
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        portfolio_url: formData.portfolio_url || null,
        resume_url: formData.resume_url || null,
        resume_markdown: formData.resume_markdown || null,
        mlh_code_of_conduct: formData.mlh_code_of_conduct,
        mlh_privacy_policy: formData.mlh_privacy_policy,
        mlh_marketing_emails: formData.mlh_marketing_emails,
        dietary_restrictions: formData.dietary_restrictions.length > 0 ? formData.dietary_restrictions : null,
        underrepresented_group: formData.underrepresented_group || null,
        gender: formData.gender || null,
        pronouns: formData.pronouns || null,
        race_ethnicity: formData.race_ethnicity.length > 0 ? formData.race_ethnicity : null,
        tshirt_size: formData.tshirt_size || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        shipping_country: formData.shipping_country || null,
        postal_code: formData.postal_code || null,
        major: formData.major || null,
        first_hackathon: formData.first_hackathon,
        team_name: formData.team_name || null,
        special_accommodations: formData.special_accommodations || null,
      }

      // Check if user has password setup completed metadata from signup
      // If user signed up with password, this will be true
      // If user used magic link originally, this will be false/undefined
      const hasPasswordMetadata = user.user_metadata?.password_setup_completed === true
      
      // Add password_setup_completed to application data
      const finalApplicationData = {
        ...applicationData,
        password_setup_completed: hasPasswordMetadata
      }

      // Use upsert to handle both insert and update in one operation
      // This avoids issues with checking for existing records
      const { error: upsertError } = await supabase
        .from('applicants')
        .upsert(finalApplicationData, {
          onConflict: 'user_id', // Handle conflict on user_id (unique constraint)
          ignoreDuplicates: false, // Update existing record if conflict
        })

      if (upsertError) {
        console.error('Upsert error:', upsertError)
        throw upsertError
      }

      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error submitting application:', err)
      setError(err.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b]">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030c1b] via-[#0a1628] to-[#030c1b] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          <h1 className="text-4xl font-bold text-white mb-2">Apply to RocketHacks 2026</h1>
          <p className="text-gray-400 mb-8">Complete your MLH-compliant application</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Required Information */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Required Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Age <span className="text-red-400">*</span>
                  </label>
                  <select name="age" required value={formData.age} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Select age</option>
                    {AGE_OPTIONS.map(age => <option key={age} value={age}>{age}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input type="tel" name="phone_number" required value={formData.phone_number} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    School/University <span className="text-red-400">*</span>
                  </label>
                  <SchoolAutocomplete
                    value={formData.school}
                    onChange={(value) => setFormData(prev => ({ ...prev, school: value }))}
                    schools={schools}
                    required
                    error={error && !formData.school ? 'School is required' : undefined}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Only MLH-verified schools are accepted. If your school isn't listed, contact us.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Level of Study <span className="text-red-400">*</span>
                  </label>
                  <select name="level_of_study" required value={formData.level_of_study} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Select level</option>
                    {LEVEL_OF_STUDY_OPTIONS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Country <span className="text-red-400">*</span>
                  </label>
                  <select name="country_of_residence" required value={formData.country_of_residence} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Select country</option>
                    {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Professional Links */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Professional Links</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">LinkedIn URL</label>
                  <input type="url" name="linkedin_url" value={formData.linkedin_url} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://linkedin.com/in/yourusername" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">GitHub URL</label>
                  <input type="url" name="github_url" value={formData.github_url} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://github.com/yourusername" />
                </div>
              </div>
            </section>

            {/* Resume Upload */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Resume</h2>
              <input type="file" accept=".pdf,.docx" onChange={handleResumeUpload} disabled={uploading} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
              {uploading && <p className="text-sm text-gray-400 mt-2">Uploading...</p>}
              {formData.resume_url && <p className="text-sm text-green-400 mt-2"> Resume uploaded</p>}
            </section>

            {/* MLH Partnership */}
            <section className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">MLH Partnership</h2>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" name="mlh_code_of_conduct" required checked={formData.mlh_code_of_conduct} onChange={handleInputChange} className="w-5 h-5 mt-0.5 rounded" />
                  <span className="text-gray-300 text-sm">
                    <span className="text-red-400">*</span> I agree to the <a href="https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md" target="_blank" className="text-blue-400 underline">MLH Code of Conduct</a>
                  </span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" name="mlh_privacy_policy" required checked={formData.mlh_privacy_policy} onChange={handleInputChange} className="w-5 h-5 mt-0.5 rounded" />
                  <span className="text-gray-300 text-sm">
                    <span className="text-red-400">*</span> I authorize sharing my information with MLH per their <a href="https://github.com/MLH/mlh-policies/blob/main/privacy-policy.md" target="_blank" className="text-blue-400 underline">Privacy Policy</a>
                  </span>
                </label>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input type="checkbox" name="mlh_marketing_emails" checked={formData.mlh_marketing_emails} onChange={handleInputChange} className="w-5 h-5 mt-0.5 rounded" />
                  <span className="text-gray-300 text-sm">I authorize MLH to send me occasional emails</span>
                </label>
              </div>
            </section>

            {/* Shipping Address */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Address</h2>
              <p className="text-gray-400 text-sm mb-4">For sending you swag and prizes if accepted!</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address Line 1</label>
                  <input type="text" name="address_line1" value={formData.address_line1 || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main St" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address Line 2</label>
                  <input type="text" name="address_line2" value={formData.address_line2 || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Apt 4B" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input type="text" name="city" value={formData.city || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State/Province</label>
                  <input type="text" name="state" value={formData.state || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Postal Code</label>
                  <input type="text" name="postal_code" value={formData.postal_code || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Shipping Country</label>
                  <select name="shipping_country" value={formData.shipping_country || ''} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Select country</option>
                    {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Major</label>
                  <select name="major" value={formData.major} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Select major</option>
                    {MAJOR_OPTIONS.map(major => <option key={major} value={major}>{major}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">T-Shirt Size</label>
                  <select name="tshirt_size" value={formData.tshirt_size} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Select size</option>
                    {TSHIRT_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Prefer not to answer</option>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Pronouns</label>
                  <select name="pronouns" value={formData.pronouns} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white [&>option]:bg-[#0a1628] [&>option]:text-white">
                    <option value="">Prefer not to answer</option>
                    {PRONOUNS_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Dietary Restrictions</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {DIETARY_RESTRICTIONS_OPTIONS.map(r => (
                      <label key={r} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={formData.dietary_restrictions.includes(r)} onChange={() => handleMultiSelectChange('dietary_restrictions', r)} className="w-4 h-4 rounded" />
                        <span className="text-gray-300 text-sm">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Race/Ethnicity</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {RACE_ETHNICITY_OPTIONS.map(r => (
                      <label key={r} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={formData.race_ethnicity.includes(r)} onChange={() => handleMultiSelectChange('race_ethnicity', r)} className="w-4 h-4 rounded" />
                        <span className="text-gray-300 text-sm">{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" name="first_hackathon" checked={formData.first_hackathon} onChange={handleInputChange} className="w-4 h-4 rounded" />
                    <span className="text-gray-300">This is my first hackathon</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Team Name</label>
                  <input type="text" name="team_name" value={formData.team_name} onChange={handleInputChange} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Special Accommodations</label>
                  <textarea name="special_accommodations" value={formData.special_accommodations} onChange={handleInputChange} rows={3} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button type="submit" disabled={loading || uploading} className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <button type="button" onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
