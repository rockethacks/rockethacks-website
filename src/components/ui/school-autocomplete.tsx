'use client'

import { useState, useEffect, useRef } from 'react'

interface SchoolAutocompleteProps {
  value: string
  onChange: (value: string) => void
  schools: string[]
  required?: boolean
  error?: string
}

export function SchoolAutocomplete({ 
  value, 
  onChange, 
  schools, 
  required = false,
  error 
}: SchoolAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSchools, setFilteredSchools] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isValidSchool, setIsValidSchool] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSearchTerm(value)
    // Validate that the current value is in the schools list
    if (value) {
      setIsValidSchool(schools.includes(value))
    }
  }, [value, schools])

  useEffect(() => {
    if (searchTerm) {
      const filtered = schools
        .filter(school => 
          school.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .slice(0, 50) // Limit to 50 results for performance
      setFilteredSchools(filtered)
    } else {
      setFilteredSchools([])
    }
  }, [searchTerm, schools])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(true)
    setSelectedIndex(-1)
    
    // Check if the typed value exactly matches a school
    const exactMatch = schools.find(school => 
      school.toLowerCase() === newValue.toLowerCase()
    )
    
    if (exactMatch) {
      onChange(exactMatch)
      setIsValidSchool(true)
    } else {
      onChange(newValue)
      setIsValidSchool(false)
    }
  }

  const handleSelect = (school: string) => {
    setSearchTerm(school)
    onChange(school)
    setIsValidSchool(true)
    setIsOpen(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < filteredSchools.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && filteredSchools[selectedIndex]) {
          handleSelect(filteredSchools[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      setIsOpen(false)
      setSelectedIndex(-1)
      
      // If the value doesn't match any school, clear it
      if (searchTerm && !schools.includes(searchTerm)) {
        const exactMatch = schools.find(school => 
          school.toLowerCase() === searchTerm.toLowerCase()
        )
        if (exactMatch) {
          handleSelect(exactMatch)
        }
      }
    }, 200)
  }

  const handleFocus = () => {
    if (searchTerm) {
      setIsOpen(true)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        required={required}
        className={`w-full px-4 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error || (!isValidSchool && searchTerm) 
            ? 'border-red-500' 
            : 'border-white/10'
        }`}
        placeholder="Start typing your school name..."
        autoComplete="off"
      />
      
      {!isValidSchool && searchTerm && !isOpen && (
        <div className="absolute left-0 right-0 mt-1 text-xs text-red-400">
          Please select a valid school from the dropdown list
        </div>
      )}

      {error && (
        <div className="absolute left-0 right-0 mt-1 text-xs text-red-400">
          {error}
        </div>
      )}

      {isOpen && filteredSchools.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-[#0a1628] border border-white/10 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
        >
          {filteredSchools.map((school, index) => (
            <div
              key={school}
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(school)
              }}
              className={`px-4 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-200 hover:bg-white/10'
              }`}
            >
              {school}
            </div>
          ))}
        </div>
      )}

      {isOpen && searchTerm && filteredSchools.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#0a1628] border border-white/10 rounded-lg shadow-2xl p-4 text-gray-400 text-sm">
          No schools found matching "{searchTerm}". Please check your spelling or try a different name.
        </div>
      )}
    </div>
  )
}
