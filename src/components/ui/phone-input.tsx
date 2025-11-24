'use client'

import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useState } from 'react'

interface PhoneNumberInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
}

export function PhoneNumberInput({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = '+1 (555) 123-4567',
}: PhoneNumberInputProps) {
  const [error, setError] = useState<string>('')

  const handleChange = (newValue: string | undefined) => {
    setError('')
    onChange(newValue || '')
  }

  const handleBlur = () => {
    if (required && !value) {
      setError('Phone number is required')
    } else if (value && value.length < 4) {
      setError('Please enter a valid phone number')
    }
  }

  return (
    <div className="w-full">
      <div className="phone-input-wrapper">
        <PhoneInput
          international
          defaultCountry="US"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full"
          numberInputProps={{
            className: 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
          }}
        />
      </div>
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
      <style jsx global>{`
        .phone-input-wrapper .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .phone-input-wrapper .PhoneInputCountry {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .phone-input-wrapper .PhoneInputCountry:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .phone-input-wrapper .PhoneInputCountry:focus-within {
          outline: none;
          ring: 2px;
          ring-color: rgb(59, 130, 246);
          border-color: transparent;
        }

        .phone-input-wrapper .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.5rem;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .phone-input-wrapper .PhoneInputCountrySelect {
          position: absolute;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .phone-input-wrapper .PhoneInputCountrySelectArrow {
          opacity: 0.6;
          color: white;
          width: 0.75rem;
          height: 0.75rem;
        }

        .phone-input-wrapper .PhoneInputInput {
          flex: 1;
          min-width: 0;
        }

        .phone-input-wrapper input[type="tel"] {
          width: 100%;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
          color: white;
          outline: none;
          transition: all 0.2s;
        }

        .phone-input-wrapper input[type="tel"]::placeholder {
          color: rgb(107, 114, 128);
        }

        .phone-input-wrapper input[type="tel"]:focus {
          ring: 2px;
          ring-color: rgb(59, 130, 246);
          border-color: transparent;
        }

        .phone-input-wrapper input[type="tel"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
