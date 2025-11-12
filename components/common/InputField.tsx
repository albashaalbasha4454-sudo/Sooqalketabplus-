import React from 'react';

interface InputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: string;
}

const InputField: React.FC<InputFieldProps> = ({id, label, value, onChange, error, type = "text"}) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-slate-700 text-sm font-bold mb-2">{label}</label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        dir="auto"
        className={`appearance-none border rounded-lg w-full py-2 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400 transition-shadow ${error ? 'border-red-500' : 'border-slate-300'}`}
      />
      {error && <p className="text-red-500 text-xs italic mt-1">{error}</p>}
    </div>
);

export default InputField;