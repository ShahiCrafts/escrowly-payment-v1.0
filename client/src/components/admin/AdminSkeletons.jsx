import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton = ({ className }) => (
    <div className={cn("skeleton-shimmer rounded bg-slate-200", className)} />
);

export const TableSkeleton = ({ rows = 5, cols = 6 }) => (
    <div className="w-full">
        <div className="border-b border-slate-100">
            <div className="flex px-5 py-4 gap-4">
                {[...Array(cols)].map((_, i) => (
                    <Skeleton key={i} className="h-3 flex-1 rounded-full" />
                ))}
            </div>
        </div>
        <div className="divide-y divide-slate-50">
            {[...Array(rows)].map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className="flex items-center px-5 py-4 gap-4"
                    style={{ animationDelay: `${rowIndex * 50}ms` }}
                >
                    {[...Array(cols)].map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            className={cn(
                                "h-4 flex-1 rounded-full",
                                colIndex === 0 && "max-w-[200px]"
                            )}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export const StatCardSkeleton = ({ index = 0, highlight = false }) => (
    <div
        className={cn(
            "rounded-2xl p-5",
            highlight
                ? "bg-gradient-to-br from-blue-400 to-blue-500"
                : "bg-white border border-slate-100"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
    >
        <div className="flex items-center justify-between mb-2">
            <Skeleton className={cn(
                "w-10 h-10 rounded-xl",
                highlight && "bg-white/20"
            )} />
        </div>
        <Skeleton className={cn(
            "h-3 w-20 rounded mb-2",
            highlight && "bg-white/20"
        )} />
        <Skeleton className={cn(
            "h-6 w-28 rounded mb-2",
            highlight && "bg-white/30"
        )} />
        <Skeleton className={cn(
            "h-2 w-24 rounded",
            highlight && "bg-white/20"
        )} />
    </div>
);

export const ChartCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <Skeleton className="h-4 w-32 rounded mb-4" />
        <div className="flex items-center gap-6">
            <Skeleton className="w-[120px] h-[120px] rounded-full" />
            <div className="flex-1 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="w-2 h-2 rounded-full" />
                            <Skeleton className="h-3 w-16 rounded" />
                        </div>
                        <Skeleton className="h-3 w-8 rounded" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const RevenueCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-36 rounded mb-2" />
        <Skeleton className="h-3 w-40 rounded mb-4" />
        <Skeleton className="h-16 w-full rounded-xl" />
    </div>
);

export const MetricsCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <Skeleton className="h-4 w-28 rounded mb-4" />
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-20 rounded" />
                            <Skeleton className="h-4 w-16 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

export const TransactionsTableSkeleton = () => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
        </div>
        <TableSkeleton rows={5} cols={6} />
    </div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-5 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-6 w-32 rounded" />
                <Skeleton className="h-4 w-64 rounded" />
            </div>
            <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
        </div>

        {/* Primary Stats - 5 columns */}
        <div className="grid grid-cols-5 gap-4">
            <StatCardSkeleton index={0} />
            <StatCardSkeleton index={1} highlight />
            <StatCardSkeleton index={2} />
            <StatCardSkeleton index={3} />
            <StatCardSkeleton index={4} />
        </div>

        {/* Secondary Row - 3 columns */}
        <div className="grid grid-cols-3 gap-4">
            <ChartCardSkeleton />
            <RevenueCardSkeleton />
            <MetricsCardSkeleton />
        </div>

        {/* Recent Transactions - Full Width */}
        <TransactionsTableSkeleton />
    </div>
);

export const UsersPageSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-6 w-40 rounded" />
                <Skeleton className="h-4 w-64 rounded" />
            </div>
            <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 flex-1 rounded-xl max-w-md" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>
            <TableSkeleton rows={8} cols={6} />
        </div>
    </div>
);

export const SettingsPageSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-6 w-24 rounded" />
                <Skeleton className="h-4 w-56 rounded" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 h-fit">
                <div className="space-y-1">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-xl" />
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="px-5 py-4 border-b border-slate-100">
                    <Skeleton className="h-5 w-36 rounded mb-1" />
                    <Skeleton className="h-3 w-48 rounded" />
                </div>
                <div className="px-5 py-4 space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-28 rounded" />
                            <Skeleton className="h-3 w-48 rounded" />
                            <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

// Deprecated - keeping for backwards compatibility
export const CardSkeleton = StatCardSkeleton;
export const SmallCardSkeleton = StatCardSkeleton;
export const RightSidebarSkeleton = () => null; // No longer used
