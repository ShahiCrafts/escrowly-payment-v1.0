import { useState, forwardRef } from 'react';
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
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
                    type={inputType}
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
                        (rightIcon || isPassword) && 'pr-10',
                        className
                    )}
                    {...props}
                />
                {isPassword ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 focus:outline-none cursor-pointer"
                    >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {showPassword ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            ) : (
                                <>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </>
                            )}
                        </svg>
                    </button>
                ) : (
                    rightIcon && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400">
                            {rightIcon}
                        </div>
                    )
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
