import { cn } from '../../utils/cn';

const Spinner = ({ size = 'md', className }) => {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    return (
        <svg
            className={cn('animate-spin text-indigo-600', sizeClasses[size], className)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    );
};

const LoadingOverlay = ({ message = 'Loading...' }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Spinner size="xl" />
                <p className="text-neutral-600 font-medium">{message}</p>
            </div>
        </div>
    );
};

const PageLoader = () => {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
        </div>
    );
};

const Skeleton = ({ className, ...props }) => {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-neutral-200',
                className
            )}
            {...props}
        />
    );
};

export { Spinner, LoadingOverlay, PageLoader, Skeleton };
export default Spinner;
