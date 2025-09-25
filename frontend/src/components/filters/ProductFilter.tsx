import React from 'react';

interface ProductFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductFilter({ value, onChange }: ProductFilterProps) {
  const options = [
    { value: 'all', label: 'All Products' },
    { value: 'rhel', label: 'RHEL' },
    { value: 'openshift', label: 'OpenShift' },
    { value: 'ansible', label: 'Ansible' }
  ];

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-hat-50 focus:border-transparent transition-colors"
        style={{
          backgroundImage: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none'
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}