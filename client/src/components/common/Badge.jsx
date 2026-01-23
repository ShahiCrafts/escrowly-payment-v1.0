import { cn } from '../../utils/cn';

const badgeVariants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-blue-100 text-blue-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700'
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
                    variant === 'success' && 'bg-green-500',
                    variant === 'warning' && 'bg-amber-500',
                    variant === 'danger' && 'bg-red-500',
                    variant === 'info' && 'bg-blue-500',
                    variant === 'primary' && 'bg-blue-500',
                    variant === 'purple' && 'bg-purple-500',
                    variant === 'orange' && 'bg-orange-500',
                    variant === 'default' && 'bg-slate-500'
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
        released: { variant: 'success', label: 'Released' },
        approved: { variant: 'success', label: 'Approved' },
        rejected: { variant: 'danger', label: 'Rejected' },
    };

    const config = statusConfig[status] || { variant: 'default', label: status };

    return (
        <Badge variant={config.variant}>
            {config.label}
        </Badge>
    );
};

export { Badge, StatusBadge };
export default Badge;
