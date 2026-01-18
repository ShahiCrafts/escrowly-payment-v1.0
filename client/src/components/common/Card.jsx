import { cn } from '../../utils/cn';

const Card = ({ className, children, ...props }) => {
    return (
        <div
            className={cn(
                'bg-white rounded-2xl border border-slate-200/60',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const CardHeader = ({ className, children, ...props }) => {
    return (
        <div
            className={cn('px-5 py-4 border-b border-slate-100', className)}
            {...props}
        >
            {children}
        </div>
    );
};

const CardTitle = ({ className, children, ...props }) => {
    return (
        <h3
            className={cn('text-sm font-semibold text-slate-900', className)}
            {...props}
        >
            {children}
        </h3>
    );
};

const CardDescription = ({ className, children, ...props }) => {
    return (
        <p
            className={cn('text-sm text-slate-500 mt-1', className)}
            {...props}
        >
            {children}
        </p>
    );
};

const CardContent = ({ className, children, ...props }) => {
    return (
        <div className={cn('px-5 py-4', className)} {...props}>
            {children}
        </div>
    );
};

const CardFooter = ({ className, children, ...props }) => {
    return (
        <div
            className={cn(
                'px-5 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
export default Card;
