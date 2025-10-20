import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs = [
    {
        title: 'Advisees',
        href: ThesisTitleController.advisees().url,
    },
];

interface ThesisTitleListItem {
    id: number;
    title: string;
    student: { id: number; name: string } | null;
    theses_count: number;
    created_at: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ThesisTitleAdviseesProps {
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

export default function ThesisTitleAdvisees({
    thesisTitles,
}: ThesisTitleAdviseesProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Advisees" />
            <div className="px-4 py-6">
                <Heading
                    title="Advisees"
                    description="Review thesis progress for your advisees."
                />

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
                                            colSpan={5}
                                            className="px-6 py-10 text-center text-sm text-muted-foreground"
                                        >
                                            You have no advisees yet.
                                        </td>
                                    </tr>
                                )}

                                {thesisTitles.data.map((item) => (
                                    <tr key={item.id} className="text-sm">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {item.title}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.student?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.theses_count}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-sm font-medium">
                                                <Button size="sm" asChild>
                                                    <Link
                                                        href={
                                                            ThesisTitleController.show(
                                                                {
                                                                    thesis_title:
                                                                        item.id,
                                                                },
                                                            ).url
                                                        }
                                                        prefetch
                                                    >
                                                        View
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {thesisTitles.links.length > 1 && (
                    <nav className="flex justify-end gap-2">
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
