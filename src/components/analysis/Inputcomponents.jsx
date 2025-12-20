import { useState, useEffect, useRef } from 'react';

/**
 * CurrencyInput - Input for dollar values
 * Uses text input with decimal inputMode for proper mobile keyboard
 * No stepper buttons - allows direct value entry
 */
export function CurrencyInput({ 
  value, 
  onChange, 
  label, 
  placeholder = '0',
  className = '',
  disabled = false,
  min = 0,
  max = Infinity,
  allowNegative = false,
  helperText = ''
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Format number with commas for display
  const formatWithCommas = (num) => {
    if (num === null || num === undefined || num === '') return '';
    const number = parseFloat(num);
    if (isNaN(number)) return '';
    return number.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  // Update display value when prop changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatWithCommas(value) : '');
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number on focus for easier editing
    setDisplayValue(value ? value.toString() : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Clean up and format
    const cleanValue = displayValue.replace(/[^0-9.-]/g, '');
    let numValue = parseFloat(cleanValue) || 0;
    
    // Apply constraints
    if (!allowNegative && numValue < 0) numValue = 0;
    if (numValue < min) numValue = min;
    if (numValue > max) numValue = max;
    
    onChange(numValue);
    setDisplayValue(formatWithCommas(numValue));
  };

  const handleChange = (e) => {
    let inputValue = e.target.value;
    
    // Allow only numbers, decimal, and minus (if allowed)
    const regex = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
    inputValue = inputValue.replace(regex, '');
    
    // Prevent multiple decimals
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setDisplayValue(inputValue);
    
    // Update parent with numeric value
    const numValue = parseFloat(inputValue) || 0;
    onChange(numValue);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          $
        </span>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-7 pr-3 py-2 
            border border-gray-300 rounded-md
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            text-right
          `}
        />
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * PercentInput - Input for percentage values
 */
export function PercentInput({ 
  value, 
  onChange, 
  label, 
  placeholder = '0',
  className = '',
  disabled = false,
  min = 0,
  max = 100,
  allowNegative = false,
  decimals = 2,
  helperText = ''
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value !== null && value !== undefined ? value.toString() : '');
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const cleanValue = displayValue.replace(/[^0-9.-]/g, '');
    let numValue = parseFloat(cleanValue) || 0;
    
    if (!allowNegative && numValue < 0) numValue = 0;
    if (numValue < min) numValue = min;
    if (numValue > max) numValue = max;
    
    // Round to specified decimals
    numValue = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
    
    onChange(numValue);
    setDisplayValue(numValue.toString());
  };

  const handleChange = (e) => {
    let inputValue = e.target.value;
    const regex = allowNegative ? /[^0-9.-]/g : /[^0-9.]/g;
    inputValue = inputValue.replace(regex, '');
    
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setDisplayValue(inputValue);
    const numValue = parseFloat(inputValue) || 0;
    onChange(numValue);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pr-8 pl-3 py-2 
            border border-gray-300 rounded-md
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            text-right
          `}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
          %
        </span>
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * NumberInput - Generic number input without prefix/suffix
 */
export function NumberInput({ 
  value, 
  onChange, 
  label, 
  placeholder = '0',
  className = '',
  disabled = false,
  min,
  max,
  allowNegative = true,
  allowDecimal = true,
  decimals = 2,
  suffix = '',
  helperText = ''
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value !== null && value !== undefined ? value.toString() : '');
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    let cleanValue = displayValue;
    
    if (allowDecimal) {
      cleanValue = cleanValue.replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, '');
    } else {
      cleanValue = cleanValue.replace(allowNegative ? /[^0-9-]/g : /[^0-9]/g, '');
    }
    
    let numValue = parseFloat(cleanValue) || 0;
    
    if (!allowNegative && numValue < 0) numValue = 0;
    if (min !== undefined && numValue < min) numValue = min;
    if (max !== undefined && numValue > max) numValue = max;
    
    if (allowDecimal) {
      numValue = Math.round(numValue * Math.pow(10, decimals)) / Math.pow(10, decimals);
    } else {
      numValue = Math.round(numValue);
    }
    
    onChange(numValue);
    setDisplayValue(numValue.toString());
  };

  const handleChange = (e) => {
    let inputValue = e.target.value;
    
    if (allowDecimal) {
      inputValue = inputValue.replace(allowNegative ? /[^0-9.-]/g : /[^0-9.]/g, '');
      const parts = inputValue.split('.');
      if (parts.length > 2) {
        inputValue = parts[0] + '.' + parts.slice(1).join('');
      }
    } else {
      inputValue = inputValue.replace(allowNegative ? /[^0-9-]/g : /[^0-9]/g, '');
    }
    
    setDisplayValue(inputValue);
    const numValue = parseFloat(inputValue) || 0;
    onChange(numValue);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 
            border border-gray-300 rounded-md
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${suffix ? 'pr-12' : ''}
            text-right
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {helperText && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

/**
 * InlineInput - Compact inline input for use in data rows
 */
export function InlineInput({ 
  value, 
  onChange, 
  prefix = '',
  suffix = '',
  type = 'currency', // 'currency', 'percent', 'number'
  className = '',
  disabled = false
}) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const formatValue = (val) => {
    if (type === 'currency') {
      return val ? val.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '';
    }
    return val?.toString() || '';
  };

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatValue(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value ? value.toString() : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    const cleanValue = displayValue.replace(/[^0-9.-]/g, '');
    const numValue = parseFloat(cleanValue) || 0;
    onChange(numValue);
    setDisplayValue(formatValue(numValue));
  };

  const handleChange = (e) => {
    let inputValue = e.target.value.replace(/[^0-9.-]/g, '');
    setDisplayValue(inputValue);
    onChange(parseFloat(inputValue) || 0);
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      {prefix && <span className="text-gray-500 mr-1">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`
          w-24 px-2 py-1 
          border border-gray-300 rounded
          focus:ring-1 focus:ring-blue-500 focus:border-transparent
          disabled:bg-gray-100
          text-right text-sm
        `}
      />
      {suffix && <span className="text-gray-500 ml-1">{suffix}</span>}
    </div>
  );
}

export default {
  CurrencyInput,
  PercentInput,
  NumberInput,
  InlineInput
};