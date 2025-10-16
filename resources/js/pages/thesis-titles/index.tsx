import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs = [
    {
        title: 'Thesis',
        href: ThesisTitleController.index().url,
    },
];

interface ThesisTitleListItem {
    id: number;
    title: string;
    theses_count: number;
    abstract_pdf_url: string | null;
    endorsement_pdf_url: string | null;
    created_at: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ThesisTitleIndexProps {
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

export default function ThesisTitleIndex({
    thesisTitles,
}: ThesisTitleIndexProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Thesis" />
            <div className="px-4 py-6">
                <Heading title="Thesis" description="Manage your thesis" />
                <Button asChild>
                    <Link href={ThesisTitleController.create().url} prefetch>
                        + Thesis
                    </Link>
                </Button>
                <div className="flex-1 overflow-x-auto">
                    <div className="min-w-full overflow-hidden rounded-xl border border-sidebar-border/60 bg-background shadow-sm dark:border-sidebar-border">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr className="text-left text-sm font-semibold text-muted-foreground">
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Chapters
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Abstract
                                    </th>
                                    <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                        Endorsement
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
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-sm text-muted-foreground"
                                        >
                                            No thesis yet. Create one to get
                                            started.
                                        </td>
                                    </tr>
                                )}

                                {thesisTitles.data.map((item) => (
                                    <tr key={item.id} className="text-sm">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {item.title}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {item.theses_count}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.abstract_pdf_url ? (
                                                <a
                                                    href={item.abstract_pdf_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.endorsement_pdf_url ? (
                                                <a
                                                    href={
                                                        item.endorsement_pdf_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm font-medium text-primary hover:underline"
                                                >
                                                    View
                                                </a>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3 text-sm font-medium">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
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
                                                <Button size="sm" asChild>
                                                    <Link
                                                        href={
                                                            ThesisTitleController.edit(
                                                                {
                                                                    thesis_title:
                                                                        item.id,
                                                                },
                                                            ).url
                                                        }
                                                        prefetch
                                                    >
                                                        Edit
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
