import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const buttonVariants = {
    variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
        danger: 'bg-rose-500 text-white hover:bg-rose-600',
        success: 'bg-emerald-500 text-white hover:bg-emerald-600',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        link: 'bg-transparent text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline'
    },
    size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
        xl: 'px-6 py-3 text-lg'
    }
};

const Button = forwardRef(({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    children,
    ...props
}, ref) => {
    return (
        <button
            ref={ref}
            disabled={disabled || isLoading}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200',
                'focus:outline-none',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                buttonVariants.variant[variant],
                buttonVariants.size[size],
                className
            )}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
