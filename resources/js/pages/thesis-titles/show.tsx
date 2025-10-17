import ThesisController from '@/actions/App/Http/Controllers/ThesisController';
import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

type ThesisStatus = 'pending' | 'approved' | 'rejected';

interface PanelMember {
    id: number;
    name: string;
}

interface PanelAssignments {
    chairman: PanelMember | null;
    member_one: PanelMember | null;
    member_two: PanelMember | null;
}

interface PanelOption {
    id: number;
    name: string;
}

type PanelStateKey = 'chairman_id' | 'member_one_id' | 'member_two_id';
type PanelState = Record<PanelStateKey, string>;

const PANEL_FIELDS: Array<{
    field: PanelStateKey;
    label: string;
    placeholder: string;
}> = [
    {
        field: 'chairman_id',
        label: 'Chairman',
        placeholder: 'Select chairman',
    },
    {
        field: 'member_one_id',
        label: 'Member 1',
        placeholder: 'Select member',
    },
    {
        field: 'member_two_id',
        label: 'Member 2',
        placeholder: 'Select member',
    },
];

interface ThesisItem {
    id: number;
    chapter: string;
    thesis_pdf_url: string | null;
    created_at: string | null;
    status: ThesisStatus;
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
        panel: PanelAssignments;
    };
    permissions: {
        manage: boolean;
        review: boolean;
    };
    panelOptions: PanelOption[];
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

const STATUS_META: Record<
    ThesisStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
    pending: { label: 'Pending', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

export default function ThesisTitleShow({
    thesisTitle,
    permissions,
    panelOptions,
}: ThesisTitleShowProps) {
    const canManage = permissions.manage;
    const canReview = permissions.review;
    const UNASSIGNED_VALUE = 'unassigned';

    const panelOptionsList = useMemo(
        () =>
            panelOptions.map((option) => ({
                id: option.id.toString(),
                name: option.name,
            })),
        [panelOptions],
    );

    const panelStateFromProps = useMemo<PanelState>(
        () => ({
            chairman_id: thesisTitle.panel.chairman
                ? thesisTitle.panel.chairman.id.toString()
                : '',
            member_one_id: thesisTitle.panel.member_one
                ? thesisTitle.panel.member_one.id.toString()
                : '',
            member_two_id: thesisTitle.panel.member_two
                ? thesisTitle.panel.member_two.id.toString()
                : '',
        }),
        [
            thesisTitle.panel.chairman?.id,
            thesisTitle.panel.member_one?.id,
            thesisTitle.panel.member_two?.id,
        ],
    );

    const [panelState, setPanelState] =
        useState<PanelState>(panelStateFromProps);

    useEffect(() => {
        setPanelState(panelStateFromProps);
    }, [panelStateFromProps]);

    const panelSummary = useMemo(
        () => [
            {
                label: 'Chairman',
                value: thesisTitle.panel.chairman?.name ?? '—',
            },
            {
                label: 'Member 1',
                value: thesisTitle.panel.member_one?.name ?? '—',
            },
            {
                label: 'Member 2',
                value: thesisTitle.panel.member_two?.name ?? '—',
            },
        ],
        [
            thesisTitle.panel.chairman?.name,
            thesisTitle.panel.member_one?.name,
            thesisTitle.panel.member_two?.name,
        ],
    );

    const updatePanelStateValue = (field: PanelStateKey) => (value: string) => {
        setPanelState((prev) => ({
            ...prev,
            [field]: value === UNASSIGNED_VALUE ? '' : value,
        }));
    };

    const selectValueFor = (field: PanelStateKey) =>
        panelState[field] === '' ? UNASSIGNED_VALUE : panelState[field];

    const panelOptionsEmpty = panelOptionsList.length === 0;

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
    const canAccessPrimaryFiles = canManage || canReview;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={thesisTitle.title} />
            <div className="px-4 py-6">
                <Heading
                    title={thesisTitle.title}
                    description={headingDescription}
                />

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
                            <div
                                className={showLeaderInfo ? 'mt-4' : undefined}
                            >
                                <p className="text-foreground">
                                    <span className="font-medium text-muted-foreground">
                                        Members:
                                    </span>{' '}
                                    {thesisTitle.members
                                        .map((member) => member.name)
                                        .join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex justify-end">
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
                    </div>
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
                                        Status
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
                                            colSpan={5}
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
                                                        href={
                                                            thesis.thesis_pdf_url
                                                        }
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
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const statusInfo =
                                                    STATUS_META[
                                                        thesis.status
                                                    ] ?? STATUS_META.pending;

                                                return (
                                                    <Badge
                                                        variant={
                                                            statusInfo.variant
                                                        }
                                                        className="px-3 py-1 text-xs tracking-wide uppercase"
                                                    >
                                                        {statusInfo.label}
                                                    </Badge>
                                                );
                                            })()}
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
                                            ) : canReview ? (
                                                <div className="flex items-center gap-3">
                                                    <Form
                                                        {...ThesisController.updateStatus.form(
                                                            {
                                                                thesis_title:
                                                                    thesisTitle.id,
                                                                thesis: thesis.id,
                                                            },
                                                        )}
                                                    >
                                                        {({ processing }) => (
                                                            <>
                                                                <input
                                                                    type="hidden"
                                                                    name="status"
                                                                    value="approved"
                                                                />
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={
                                                                        processing ||
                                                                        thesis.status ===
                                                                            'approved'
                                                                    }
                                                                >
                                                                    Approve
                                                                </Button>
                                                            </>
                                                        )}
                                                    </Form>
                                                    <Form
                                                        {...ThesisController.updateStatus.form(
                                                            {
                                                                thesis_title:
                                                                    thesisTitle.id,
                                                                thesis: thesis.id,
                                                            },
                                                        )}
                                                    >
                                                        {({ processing }) => (
                                                            <>
                                                                <input
                                                                    type="hidden"
                                                                    name="status"
                                                                    value="rejected"
                                                                />
                                                                <Button
                                                                    type="submit"
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    disabled={
                                                                        processing ||
                                                                        thesis.status ===
                                                                            'rejected'
                                                                    }
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </>
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

                {canAccessPrimaryFiles && (
                    <Card className="my-6">
                        <CardHeader>
                            <CardTitle>Thesis Documents</CardTitle>
                            <CardDescription>
                                Access the uploaded abstract and endorsement
                                files.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="grid gap-2 md:grid-cols-2">
                                {/* Abstract Button/Message */}
                                {thesisTitle.abstract_pdf_url ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-sm font-medium"
                                        asChild
                                    >
                                        <a
                                            href={thesisTitle.abstract_pdf_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Abstract
                                        </a>
                                    </Button>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        No abstract uploaded.
                                    </span>
                                )}

                                {/* Endorsement Button/Message */}
                                {thesisTitle.endorsement_pdf_url ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-sm font-medium"
                                        asChild
                                    >
                                        <a
                                            href={
                                                thesisTitle.endorsement_pdf_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Endorsement
                                        </a>
                                    </Button>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        No endorsement uploaded.
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="my-6">
                    <CardHeader>
                        {/* The original structure had two divs to handle space-between, but CardHeader is simpler */}
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Panel Members</CardTitle>
                                <CardDescription>
                                    {canReview
                                        ? 'Assign panel members for this thesis.'
                                        : 'Assigned panel members for this thesis.'}
                                </CardDescription>
                            </div>
                            {/* Any header-level actions (like an 'Edit' button) would go here */}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {canReview && (
                            <Form
                                {...ThesisTitleController.updatePanel.form({
                                    thesis_title: thesisTitle.id,
                                })}
                                options={{ preserveScroll: true }}
                                className="space-y-4" // Removed 'mt-4' as CardHeader provides appropriate vertical spacing
                            >
                                {({
                                    processing,
                                    errors,
                                    recentlySuccessful,
                                }) => (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            {PANEL_FIELDS.map(
                                                ({
                                                    field,
                                                    label,
                                                    placeholder,
                                                }) => (
                                                    <div
                                                        key={field}
                                                        className="space-y-2"
                                                    >
                                                        <Label
                                                            htmlFor={`panel-${field}`}
                                                        >
                                                            {label}
                                                        </Label>
                                                        <Select
                                                            value={selectValueFor(
                                                                field,
                                                            )}
                                                            onValueChange={updatePanelStateValue(
                                                                field,
                                                            )}
                                                        >
                                                            <SelectTrigger
                                                                id={`panel-${field}`}
                                                                aria-invalid={Boolean(
                                                                    errors[
                                                                        field
                                                                    ],
                                                                )}
                                                            >
                                                                <SelectValue
                                                                    placeholder={
                                                                        placeholder
                                                                    }
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem
                                                                    value={
                                                                        UNASSIGNED_VALUE
                                                                    }
                                                                >
                                                                    Unassigned
                                                                </SelectItem>
                                                                {panelOptionsList.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <SelectItem
                                                                            key={
                                                                                option.id
                                                                            }
                                                                            value={
                                                                                option.id
                                                                            }
                                                                        >
                                                                            {
                                                                                option.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <input
                                                            type="hidden"
                                                            name={field}
                                                            value={
                                                                panelState[
                                                                    field
                                                                ]
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors[field]
                                                            }
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        {panelOptionsEmpty && (
                                            <p className="text-xs text-muted-foreground">
                                                No other teachers are currently
                                                available to assign.
                                            </p>
                                        )}

                                        <div className="flex items-center justify-end gap-3 pt-4">
                                            {recentlySuccessful && (
                                                <span className="text-sm text-muted-foreground">
                                                    Assigned!
                                                </span>
                                            )}
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <>
                                                        <Spinner />
                                                        Assigning...
                                                    </>
                                                ) : (
                                                    'Assign Panel'
                                                )}
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </Form>
                        )}

                        {!canReview && (
                            <div className="mt-4">
                                <dl className="grid gap-4 md:grid-cols-3">
                                    {panelSummary.map((item) => (
                                        <div key={item.label}>
                                            <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                {item.label}
                                            </dt>
                                            <dd className="mt-1 text-sm text-foreground">
                                                {item.value}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
