import React, { useState } from 'react';
import { Image as ImageIcon, AlertCircle, Check } from 'lucide-react';

interface ImageInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function ImageInput({ label, value, onChange, required = false }: ImageInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const validateImageUrl = async (url: string) => {
    if (!url) {
      setIsValid(false);
      return;
    }

    setIsValidating(true);
    try {
      const img = new Image();
      img.onload = () => {
        setIsValid(true);
        setIsValidating(false);
      };
      img.onerror = () => {
        setIsValid(false);
        setIsValidating(false);
      };
      img.src = url;
    } catch {
      setIsValid(false);
      setIsValidating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    validateImageUrl(newValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <ImageIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="url"
          value={value}
          onChange={handleChange}
          className={`block w-full pl-10 pr-10 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            !isValid && !isValidating ? 'border-red-300' : ''
          }`}
          placeholder="https://example.com/image.jpg"
          required={required}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isValidating ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          ) : isValid && value ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : !isValid && value ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : null}
        </div>
      </div>
      {!isValid && value && !isValidating && (
        <p className="mt-2 text-sm text-red-600">
          Please enter a valid image URL
        </p>
      )}
    </div>
  );
}