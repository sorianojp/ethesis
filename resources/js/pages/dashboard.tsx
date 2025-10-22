import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard as dashboardRoute } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

type ThesisStatus = 'pending' | 'approved' | 'rejected';
type MilestoneType = 'proposal' | 'final';

interface StudentActiveThesis {
    id: number;
    title: string;
    adviser: { id: number; name: string } | null;
    members: Array<{ id: number; name: string }>;
    statusCounts: Record<ThesisStatus, number>;
    totalChapters: number;
    programLevel: 'Postgrad' | 'Undergrad' | null;
    milestones: Array<{
        type: MilestoneType;
        label: string;
        date: string;
    }>;
    links: {
        view: string;
        approvalForm: {
            label: string;
            url: string;
            key: 'undergrad' | 'postgrad';
        } | null;
    };
}

interface StudentAttentionItem {
    id: number;
    chapter: string;
    status: Extract<ThesisStatus, 'pending' | 'rejected'>;
    updated_at: string | null;
    submitted_at: string | null;
    title: string;
    thesis_title_id: number;
    url: string;
}

interface StudentMemberThesis {
    id: number;
    title: string;
    leader: { id: number; name: string } | null;
    pendingCount: number;
    totalChapters: number;
    url: string;
}

interface StudentSummary {
    activeThesis: StudentActiveThesis | null;
    needsAttention: StudentAttentionItem[];
    memberTheses: StudentMemberThesis[];
    links: {
        create: string | null;
        browse: string;
    };
}

interface TeacherPendingReview {
    id: number;
    chapter: string;
    status: ThesisStatus;
    submitted_at: string | null;
    updated_at: string | null;
    thesisTitle: {
        id: number;
        title: string;
        leader: { id: number; name: string } | null;
        url: string;
    } | null;
}

interface TeacherUpcomingEvent {
    type: MilestoneType;
    label: string;
    date: string;
    thesisTitle: {
        id: number;
        title: string;
        url: string;
    };
}

interface TeacherAdvisee {
    id: number;
    title: string;
    leader: { id: number; name: string } | null;
    pendingCount: number;
    totalChapters: number;
    url: string;
}

interface TeacherSummary {
    totals: {
        advisees: number;
        pendingReviews: number;
        upcomingEvents: number;
    };
    pendingReviews: TeacherPendingReview[];
    upcomingEvents: TeacherUpcomingEvent[];
    advisees: TeacherAdvisee[];
    links: {
        advisees: string;
    };
}

interface DashboardPayload {
    viewer: {
        name: string;
        email?: string | null;
        isStudent: boolean;
        isTeacher: boolean;
    };
    student: StudentSummary | null;
    teacher: TeacherSummary | null;
}

type PageProps = SharedData & {
    dashboard: DashboardPayload;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboardRoute().url,
    },
];

const STATUS_META: Record<
    ThesisStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
    pending: { label: 'Pending Review', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

const relativeTime = (value?: string | null) => {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
        { amount: 60, unit: 'second' },
        { amount: 60, unit: 'minute' },
        { amount: 24, unit: 'hour' },
        { amount: 7, unit: 'day' },
        { amount: 4.34524, unit: 'week' },
        { amount: 12, unit: 'month' },
        { amount: Number.POSITIVE_INFINITY, unit: 'year' },
    ];

    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    let duration = (date.getTime() - Date.now()) / 1000;
    let unit: Intl.RelativeTimeFormatUnit = 'second';

    for (const division of divisions) {
        if (Math.abs(duration) < division.amount) {
            break;
        }

        duration /= division.amount;
        unit = division.unit;
    }

    return formatter.format(Math.round(duration), unit);
};

const formatDateTime = (
    value?: string | null,
    options: Intl.DateTimeFormatOptions = {
        dateStyle: 'medium',
        timeStyle: 'short',
    },
) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    try {
        return date.toLocaleString(undefined, options);
    } catch (error) {
        return date.toISOString();
    }
};

function StudentSection({ data }: { data: StudentSummary }) {
    const active = data.activeThesis;
    const summaryCards = [
        {
            headline: 'Total Chapters',
            value: active ? active.totalChapters : 0,
        },
        {
            headline: 'Pending Review',
            value: active ? active.statusCounts.pending : 0,
        },
        {
            headline: 'Approved',
            value: active ? active.statusCounts.approved : 0,
        },
        {
            headline: 'Rejected',
            value: active ? active.statusCounts.rejected : 0,
        },
    ];
    const upcomingMilestones = (active?.milestones ?? [])
        .map((milestone) => {
            const dateObj = new Date(milestone.date);

            return {
                ...milestone,
                dateObj,
            };
        })
        .filter(
            ({ dateObj }) =>
                !Number.isNaN(dateObj.getTime()) &&
                dateObj.getTime() >= Date.now(),
        )
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
        .slice(0, 3);

    return (
        <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((card) => (
                    <Card key={card.headline}>
                        <CardHeader className="pb-2">
                            <CardDescription>{card.headline}</CardDescription>
                            <CardTitle className="text-3xl font-semibold">
                                {card.value}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <Card>
                    <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Active Thesis</CardTitle>
                            <CardDescription>
                                {active
                                    ? 'Keep track of your latest submission and milestones.'
                                    : 'Start a thesis record to begin tracking your progress.'}
                        </CardDescription>
                        </div>
                        {active ? (
                            <Button size="sm" asChild>
                                <Link href={active.links.view} prefetch>
                                    View thesis
                                </Link>
                            </Button>
                        ) : (
                            data.links.create && (
                                <Button size="sm" asChild>
                                    <Link href={data.links.create} prefetch>
                                        Create thesis
                                    </Link>
                                </Button>
                            )
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {active ? (
                            <>
                                <dl className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Title
                                        </dt>
                                        <dd className="text-sm text-foreground">
                                            {active.title}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Adviser
                                        </dt>
                                        <dd className="text-sm text-foreground">
                                            {active.adviser?.name ?? '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Program Level
                                        </dt>
                                        <dd className="text-sm text-foreground">
                                            {active.programLevel ?? '—'}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Team Members
                                        </dt>
                                        <dd className="text-sm text-foreground">
                                            {active.members.length > 0
                                                ? active.members
                                                      .map((member) => member.name)
                                                      .join(', ')
                                                : '—'}
                                        </dd>
                                    </div>
                                </dl>
                                <div>
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Upcoming Milestones
                                    </p>
                                    {active.milestones.length > 0 ? (
                                        <ul className="mt-2 space-y-2">
                                            {active.milestones.map((milestone) => {
                                                const relative = relativeTime(
                                                    milestone.date,
                                                );

                                                return (
                                                    <li
                                                        key={`${milestone.type}-${milestone.date}`}
                                                        className="flex flex-col gap-0.5 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm dark:border-border"
                                                    >
                                                        <span className="font-medium text-foreground">
                                                            {milestone.label}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {formatDateTime(milestone.date)}
                                                            {relative && (
                                                                <span className="ml-2 text-xs">
                                                                    ({relative})
                                                                </span>
                                                            )}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            No defense dates scheduled yet.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Approval Form
                                    </p>
                                    {active.links.approvalForm ? (
                                        <div className="mt-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <a
                                                    href={active.links.approvalForm.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {active.links.approvalForm.label}
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Approval form becomes available once your
                                            program level is identified.
                                        </p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-md border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground dark:border-border">
                                You haven&apos;t created a thesis title yet. Get
                                started by adding a thesis so you can track chapters,
                                milestones, and submissions here.
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Needs Attention</CardTitle>
                            <CardDescription>
                                Recently submitted or returned chapters that still
                                need work.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.needsAttention.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    You're all caught up. New submissions will appear
                                    here when they need your attention.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {data.needsAttention.map((item) => {
                                        const meta = STATUS_META[item.status];
                                        const updatedRelative = relativeTime(
                                            item.updated_at,
                                        );

                                        return (
                                            <li
                                                key={`${item.id}-${item.chapter}`}
                                                className="rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/40 dark:border-border"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {item.chapter}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.title}
                                                        </p>
                                                    </div>
                                                    <Badge variant={meta.variant}>
                                                        {meta.label}
                                                    </Badge>
                                                </div>
                                                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        Updated:{' '}
                                                        {formatDateTime(
                                                            item.updated_at,
                                                            {
                                                                dateStyle: 'medium',
                                                            },
                                                        )}
                                                    </span>
                                                    {updatedRelative && (
                                                        <span>{updatedRelative}</span>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="px-0 text-xs"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={item.url}
                                                            prefetch
                                                        >
                                                            View thesis
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Defenses</CardTitle>
                            <CardDescription>
                                Stay prepared for scheduled proposal and final
                                defenses.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingMilestones.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No defense schedule yet. Defense dates will
                                    appear here once they are set.
                                </p>
                            ) : (
                                <ul className="space-y-3">
                                    {upcomingMilestones.map((milestone) => {
                                        const relative = relativeTime(
                                            milestone.date,
                                        );
                                        const badgeLabel =
                                            milestone.type === 'proposal'
                                                ? 'Proposal'
                                                : 'Final';
                                        const badgeVariant =
                                            milestone.type === 'proposal'
                                                ? 'secondary'
                                                : 'default';

                                        return (
                                            <li
                                                key={`${milestone.type}-${milestone.date}`}
                                                className="rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/40 dark:border-border"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {milestone.label}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDateTime(
                                                                milestone.date,
                                                            )}
                                                            {relative && (
                                                                <span className="ml-2">
                                                                    ({relative})
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <Badge variant={badgeVariant}>
                                                        {badgeLabel}
                                                    </Badge>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle>Group Memberships</CardTitle>
                        <CardDescription>
                            Theses you participate in as a member.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={data.links.browse} prefetch>
                            View all theses
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    {data.memberTheses.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            You are not assigned to other thesis teams right now.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border text-sm dark:divide-border/80">
                            {data.memberTheses.map((member) => (
                                <li key={member.id} className="py-3">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {member.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Leader:{' '}
                                                {member.leader?.name ?? 'Unassigned'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                                            <div className="text-xs text-muted-foreground">
                                                Pending:{' '}
                                                <span className="font-medium text-foreground">
                                                    {member.pendingCount}
                                                </span>
                                                /{member.totalChapters}
                                            </div>
                                            <Button size="sm" variant="link" asChild>
                                                <Link href={member.url} prefetch>
                                                    Open
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

function TeacherSection({ data }: { data: TeacherSummary }) {
    const summaryCards = [
        {
            headline: 'Advisees',
            value: data.totals.advisees,
        },
        {
            headline: 'Chapters Pending Review',
            value: data.totals.pendingReviews,
        },
        {
            headline: 'Upcoming Events',
            value: data.totals.upcomingEvents,
        },
    ];

    return (
        <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                {summaryCards.map((card) => (
                    <Card key={card.headline}>
                        <CardHeader className="pb-2">
                            <CardDescription>{card.headline}</CardDescription>
                            <CardTitle className="text-3xl font-semibold">
                                {card.value}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <Card>
                    <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Pending Reviews</CardTitle>
                            <CardDescription>
                                Recent chapter submissions that await your approval.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={data.links.advisees} prefetch>
                                View advisees
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {data.pendingReviews.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Nothing needs your review right now.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {data.pendingReviews.map((item) => {
                                    const meta = STATUS_META[item.status];
                                    const submitted = formatDateTime(item.submitted_at);
                                    const relative = relativeTime(item.submitted_at);

                                    return (
                                        <li
                                            key={item.id}
                                            className="rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/40 dark:border-border"
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {item.chapter}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.thesisTitle?.title ?? '—'}
                                                        {item.thesisTitle?.leader?.name
                                                            ? ` • ${item.thesisTitle.leader.name}`
                                                            : ''}
                                                    </p>
                                                </div>
                                                <Badge variant={meta.variant}>
                                                    {meta.label}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Submitted: {submitted}</span>
                                                {relative && <span>{relative}</span>}
                                            </div>
                                            {item.thesisTitle?.url && (
                                                <div className="mt-2">
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="px-0 text-xs"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={item.thesisTitle.url}
                                                            prefetch
                                                        >
                                                            Open thesis
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Defenses</CardTitle>
                        <CardDescription>
                            Scheduled proposal and final defenses for your advisees.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.upcomingEvents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No defense schedules to show right now.
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {data.upcomingEvents.map((event) => {
                                    const relative = relativeTime(event.date);

                                    return (
                                        <li
                                            key={`${event.thesisTitle.id}-${event.type}-${event.date}`}
                                            className="rounded-lg border border-border/60 px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted/40 dark:border-border"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div>
                                                    <p className="font-medium text-foreground">
                                                        {event.label}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {event.thesisTitle.title}
                                                    </p>
                                                </div>
                                                <Badge variant="secondary">
                                                    {event.type === 'proposal'
                                                        ? 'Proposal'
                                                        : 'Final'}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                                <span>{formatDateTime(event.date)}</span>
                                                {relative && <span>{relative}</span>}
                                            </div>
                                            <div className="mt-2">
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="px-0 text-xs"
                                                    asChild
                                                >
                                                    <Link
                                                        href={event.thesisTitle.url}
                                                        prefetch
                                                    >
                                                        Manage thesis
                                                    </Link>
                                                </Button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recently Active Advisees</CardTitle>
                    <CardDescription>
                        A snapshot of the teams you guide and their chapter status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {data.advisees.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            You have no assigned advisees yet.
                        </p>
                    ) : (
                        <ul className="divide-y divide-border text-sm dark:divide-border/80">
                            {data.advisees.map((advisee) => (
                                <li key={advisee.id} className="py-3">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {advisee.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Leader:{' '}
                                                {advisee.leader?.name ?? 'Unassigned'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
                                            <div className="text-xs text-muted-foreground">
                                                Pending:{' '}
                                                <span className="font-medium text-foreground">
                                                    {advisee.pendingCount}
                                                </span>
                                                /{advisee.totalChapters}
                                            </div>
                                            <Button size="sm" variant="link" asChild>
                                                <Link href={advisee.url} prefetch>
                                                    Open
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

export default function Dashboard() {
    const { dashboard } = usePage<PageProps>().props;
    const { viewer, student, teacher } = dashboard;

    const viewerGreeting = (() => {
        const rawName =
            typeof viewer.name === 'string' ? viewer.name.trim() : '';

        if (!rawName) {
            return typeof viewer.email === 'string' && viewer.email !== ''
                ? viewer.email
                : 'there';
        }

        const [firstName] = rawName.split(/\s+/);

        return firstName && firstName.length > 0 ? firstName : rawName;
    })();

    const showStudent = Boolean(student);
    const showTeacher = Boolean(teacher);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="px-4 py-6 space-y-8">
                <Heading
                    title={`Welcome back, ${viewerGreeting}!`}
                    description={
                        showStudent && showTeacher
                            ? "Here's a quick view of your thesis progress and advisees."
                            : showStudent
                              ? "Here's what's happening with your thesis work."
                              : showTeacher
                                ? 'Monitor your advisees and upcoming milestones.'
                                : 'Keep track of your thesis work at a glance.'
                    }
                />

                {showStudent && student && <StudentSection data={student} />}
                {showTeacher && teacher && <TeacherSection data={teacher} />}

                {!showStudent && !showTeacher && (
                    <Card>
                        <CardHeader>
                            <CardTitle>No dashboard data yet</CardTitle>
                            <CardDescription>
                                Once you are assigned a role, summaries will appear
                                here.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
