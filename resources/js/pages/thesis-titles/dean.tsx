import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'College theses',
        href: ThesisTitleController.dean().url,
    },
];

interface ThesisTitleListItem {
    id: number;
    title: string;
    college_name: string | null;
    leader: { id: number; name: string } | null;
    adviser: { id: number; name: string } | null;
    theses_count: number;
    created_at: string | null;
    view_url: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface DeanThesesProps {
    collegeName: string | null;
    thesisTitles: {
        data: ThesisTitleListItem[];
        links: PaginationLink[];
    };
}

const formatDate = (value: string | null) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString();
};

export default function DeanTheses({ collegeName, thesisTitles }: DeanThesesProps) {
    const headingDescription = collegeName
        ? `All theses submitted under ${collegeName}`
        : 'All theses from your college';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="College Theses" />
            <div className="px-4 py-6">
                <Heading
                    title="College Theses"
                    description={headingDescription}
                />

                {!collegeName && (
                    <Alert className="mb-4">
                        <AlertTitle>College not found</AlertTitle>
                        <AlertDescription>
                            We could not detect your college from your staff profile.
                            You can still browse, but results will be unfiltered.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex-1 overflow-x-auto">
                    <div className="min-w-full overflow-hidden rounded-xl border border-sidebar-border/60 bg-background shadow-sm dark:border-sidebar-border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr className="text-left text-sm font-semibold text-muted-foreground">
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Leader
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Adviser
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        College
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Chapters
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {thesisTitles.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-10 text-center text-sm text-muted-foreground"
                                        >
                                            No theses found for this college.
                                        </td>
                                    </tr>
                                )}

                                {thesisTitles.data.map((item) => (
                                    <tr key={item.id} className="text-sm">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {item.title}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.leader?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.adviser?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.college_name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.theses_count}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button size="sm" asChild>
                                                <Link href={item.view_url} prefetch>
                                                    View
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {thesisTitles.links.length > 1 && (
                    <nav className="mt-2 flex justify-end gap-2">
                        {thesisTitles.links.map((link, index) => {
                            const label = link.label
                                .replace('&laquo;', '«')
                                .replace('&raquo;', '»');
                            if (!link.url) {
                                return (
                                    <span
                                        key={`${label}-${index}`}
                                        className="rounded-md px-3 py-1 text-sm text-muted-foreground"
                                    >
                                        {label}
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={`${label}-${index}`}
                                    href={link.url}
                                    preserveScroll
                                    className={`rounded-md px-3 py-1 text-sm transition-colors ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </nav>
                )}
            </div>
        </AppLayout>
    );
}
