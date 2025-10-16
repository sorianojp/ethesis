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
        adviser: { id: number; name: string } | null;
        leader: { id: number; name: string } | null;
        abstract_pdf_url: string | null;
        endorsement_pdf_url: string | null;
        created_at: string | null;
        theses: ThesisItem[];
        members: { id: number; name: string }[];
    };
    permissions: {
        manage: boolean;
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

export default function ThesisTitleShow({
    thesisTitle,
    permissions,
}: ThesisTitleShowProps) {
    const canManage = permissions.manage;

    const breadcrumbs = canManage
        ? [
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
          ]
        : [
              {
                  title: 'Advisees',
                  href: ThesisTitleController.advisees().url,
              },
              {
                  title: thesisTitle.title,
                  href: ThesisTitleController.show({
                      thesis_title: thesisTitle.id,
                  }).url,
              },
          ];

    const headingDescription = canManage
        ? `Upload ${thesisTitle.title} Chapters here.`
        : `Review ${thesisTitle.title} chapters.`;
    const hasMembers = thesisTitle.members.length > 0;
    const showLeaderInfo = !canManage && thesisTitle.leader !== null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={thesisTitle.title} />
            <div className="px-4 py-6">
                <Heading
                    title="Thesis Chapters"
                    description={headingDescription}
                />
                {canManage && (
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
                )}

                {(showLeaderInfo || hasMembers) && (
                    <div className="my-6 rounded-xl border border-sidebar-border/60 bg-muted/40 p-4 text-sm dark:border-sidebar-border">
                        {showLeaderInfo && (
                            <p className="text-foreground">
                                <span className="font-medium text-muted-foreground">
                                    Leader:
                                </span>{' '}
                                {thesisTitle.leader?.name ?? '—'}
                            </p>
                        )}

                        {hasMembers && (
                            <div className={showLeaderInfo ? 'mt-4' : undefined}>
                                <p className="font-medium text-muted-foreground">
                                    Members
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5">
                                    {thesisTitle.members.map((member) => (
                                        <li key={member.id} className="text-foreground">
                                            {member.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

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
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="px-3 text-sm font-medium"
                                                asChild
                                            >
                                                <a
                                                    href={thesis.thesis_pdf_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    View
                                                </a>
                                            </Button>
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
                                        {canManage ? (
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={
                                                            ThesisController.edit(
                                                                {
                                                                    thesis_title:
                                                                        thesisTitle.id,
                                                                    thesis: thesis.id,
                                                                },
                                                            ).url
                                                        }
                                                        prefetch
                                                    >
                                                        Edit
                                                    </Link>
                                                </Button>
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
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    )}
                                                </Form>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                —
                                            </span>
                                        )}
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
