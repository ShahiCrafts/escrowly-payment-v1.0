import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({
    className,
    type = 'text',
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        {leftIcon}
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={cn(
                        'block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900',
                        'placeholder:text-slate-400',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        'transition-colors duration-200',
                        error
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/10',
                        'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
                        leftIcon && 'pl-10',
                        rightIcon && 'pr-10',
                        className
                    )}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
            {hint && !error && (
                <p className="mt-1.5 text-sm text-slate-500">{hint}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
