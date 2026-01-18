import { cn } from '../../utils/cn';

const badgeVariants = {
    default: 'bg-neutral-100 text-neutral-800',
    primary: 'bg-indigo-100 text-indigo-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800'
};

const Badge = ({
    children,
    variant = 'default',
    className,
    dot = false,
    ...props
}) => {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                badgeVariants[variant],
                className
            )}
            {...props}
        >
            {dot && (
                <span className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    variant === 'success' && 'bg-emerald-500',
                    variant === 'warning' && 'bg-yellow-500',
                    variant === 'danger' && 'bg-red-500',
                    variant === 'info' && 'bg-blue-500',
                    variant === 'primary' && 'bg-indigo-500',
                    variant === 'purple' && 'bg-purple-500',
                    variant === 'orange' && 'bg-orange-500',
                    variant === 'default' && 'bg-neutral-500'
                )} />
            )}
            {children}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { variant: 'warning', label: 'Pending Acceptance' },
        accepted: { variant: 'info', label: 'Awaiting Payment' },
        funded: { variant: 'primary', label: 'Funded' },
        delivered: { variant: 'purple', label: 'Under Inspection' },
        completed: { variant: 'success', label: 'Completed' },
        disputed: { variant: 'danger', label: 'Disputed' },
        cancelled: { variant: 'default', label: 'Cancelled' },
        refunded: { variant: 'orange', label: 'Refunded' },
        open: { variant: 'warning', label: 'Open' },
        under_review: { variant: 'info', label: 'Under Review' },
        resolved: { variant: 'success', label: 'Resolved' },
        draft: { variant: 'default', label: 'Draft' },
        awaiting_payment: { variant: 'warning', label: 'Awaiting Payment' },
        released: { variant: 'success', label: 'Released' }
    };

    const config = statusConfig[status] || { variant: 'default', label: status };

    return (
        <Badge variant={config.variant} dot>
            {config.label}
        </Badge>
    );
};

export { Badge, StatusBadge };
export default Badge;
