import ThesisController from '@/actions/App/Http/Controllers/ThesisController';
import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';

interface ThesisItem {
    id: number;
    chapter: string;
    thesis_pdf_url: string | null;
    created_at: string | null;
}

interface ThesisTitleShowProps {
    thesisTitle: {
        id: number;
        title: string;
        abstract_pdf_url: string | null;
        endorsement_pdf_url: string | null;
        created_at: string | null;
        theses: ThesisItem[];
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

export default function ThesisTitleShow({ thesisTitle }: ThesisTitleShowProps) {
    const breadcrumbs = [
        {
            title: 'Thesis',
            href: ThesisTitleController.index().url,
        },
        {
            title: thesisTitle.title,
            href: ThesisTitleController.show({
                thesis_title: thesisTitle.id,
            }).url,
        },
    ];

    const createdLabel = formatDate(thesisTitle.created_at);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={thesisTitle.title} />
            <div className="px-4 py-6">
                <Heading
                    title="Thesis Chapters"
                    description={`Upload ${thesisTitle.title} Chapters here.`}
                />
                <Button asChild>
                    <Link
                        href={
                            ThesisController.create({
                                thesis_title: thesisTitle.id,
                            }).url
                        }
                        prefetch
                    >
                        Upload Chapter
                    </Link>
                </Button>

                <div className="overflow-hidden rounded-xl border border-sidebar-border/60 bg-background shadow-sm dark:border-sidebar-border">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr className="text-left text-sm font-semibold text-muted-foreground">
                                <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                    Chapter
                                </th>
                                <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                    File
                                </th>
                                <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                    Uploaded
                                </th>
                                <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {thesisTitle.theses.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-10 text-center text-sm text-muted-foreground"
                                    >
                                        No thesis files yet.
                                    </td>
                                </tr>
                            )}

                            {thesisTitle.theses.map((thesis) => (
                                <tr key={thesis.id} className="text-sm">
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {thesis.chapter}
                                    </td>
                                    <td className="px-6 py-4">
                                        {thesis.thesis_pdf_url ? (
                                            <a
                                                href={thesis.thesis_pdf_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                View PDF
                                            </a>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {formatDate(thesis.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={
                                                    ThesisController.edit({
                                                        thesis_title:
                                                            thesisTitle.id,
                                                        thesis: thesis.id,
                                                    }).url
                                                }
                                                className="text-sm font-medium text-primary hover:underline"
                                                prefetch
                                            >
                                                Edit
                                            </Link>
                                            <Form
                                                {...ThesisController.destroy.form(
                                                    {
                                                        thesis_title:
                                                            thesisTitle.id,
                                                        thesis: thesis.id,
                                                    },
                                                )}
                                                onSubmit={(event) => {
                                                    if (
                                                        !window.confirm(
                                                            'Delete this thesis file? This action cannot be undone.',
                                                        )
                                                    ) {
                                                        event.preventDefault();
                                                    }
                                                }}
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        variant="link"
                                                        disabled={processing}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </Form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
