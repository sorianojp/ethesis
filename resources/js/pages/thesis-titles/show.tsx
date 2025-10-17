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
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

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
    rejection_remark: string | null;
}

interface ThesisTitleShowProps {
    thesisTitle: {
        id: number;
        title: string;
        adviser: { id: number; name: string } | null;
        leader: { id: number; name: string } | null;
        abstract_pdf_url: string | null;
        endorsement_pdf_url: string | null;
        proposal_defense_at: string | null;
        final_defense_at: string | null;
        created_at: string | null;
        theses: ThesisItem[];
        members: { id: number; name: string }[];
        panel: PanelAssignments;
    };
    permissions: {
        manage: boolean;
        review: boolean;
        view_documents: boolean;
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

const toDatetimeLocalValue = (value: string | null) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offsetInMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - offsetInMs);

    return localDate.toISOString().slice(0, 16);
};

const STATUS_META: Record<
    ThesisStatus,
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
    pending: { label: 'Pending', variant: 'secondary' },
    approved: { label: 'Approved', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'destructive' },
};

interface ThesisRemarkDialogProps {
    thesis: ThesisItem;
}

function ThesisRemarkDialog({ thesis }: ThesisRemarkDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!thesis.rejection_remark) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" variant="link" className="px-0">
                    View Remark
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{thesis.chapter} – Remark</DialogTitle>
                    <DialogDescription>
                        This is the feedback submitted with the rejection.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-80 overflow-y-auto rounded-md border border-muted-foreground/20 bg-muted/40 p-3 text-sm break-words whitespace-pre-line text-foreground">
                    {thesis.rejection_remark}
                </div>
                <DialogFooter className="gap-2 sm:justify-end">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface RejectThesisDialogProps {
    thesisTitleId: number;
    thesis: ThesisItem;
}

function RejectThesisDialog({
    thesisTitleId,
    thesis,
}: RejectThesisDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<{ status: ThesisStatus; rejection_remark: string }>({
            status: 'rejected',
            rejection_remark: '',
        });

    const formDefinition = useMemo(
        () =>
            ThesisController.updateStatus.form({
                thesis_title: thesisTitleId,
                thesis: thesis.id,
            }),
        [thesisTitleId, thesis.id],
    );

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);

        if (open) {
            setData('rejection_remark', thesis.rejection_remark ?? '');
        } else {
            reset('rejection_remark');
        }

        clearErrors();
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(formDefinition.action, {
            preserveScroll: true,
            onSuccess: () => {
                reset('rejection_remark');
                clearErrors();
                setIsOpen(false);
            },
            onError: () => {
                setIsOpen(true);
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="destructive"
                    disabled={processing || thesis.status === 'rejected'}
                >
                    Reject
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Reject {thesis.chapter}</DialogTitle>
                    <DialogDescription>
                        Share a brief remark so the group knows what to fix.
                    </DialogDescription>
                </DialogHeader>
                <form
                    action={formDefinition.action}
                    method="post"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <input type="hidden" name="status" value={data.status} />
                    <div className="space-y-2">
                        <Label htmlFor={`rejection_remark_${thesis.id}`}>
                            Remark
                        </Label>
                        <Textarea
                            id={`rejection_remark_${thesis.id}`}
                            name="rejection_remark"
                            value={data.rejection_remark}
                            onChange={(event) =>
                                setData('rejection_remark', event.target.value)
                            }
                            aria-invalid={Boolean(errors.rejection_remark)}
                            placeholder="Explain why this chapter is being rejected."
                            maxLength={1000}
                            className="max-h-60"
                            required
                        />
                        <InputError message={errors.rejection_remark} />
                        <p className="text-xs text-muted-foreground">
                            {data.rejection_remark.length} / 1000 characters
                        </p>
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            Submit
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ThesisTitleShow({
    thesisTitle,
    permissions,
    panelOptions,
}: ThesisTitleShowProps) {
    const { auth } = usePage<SharedData>().props;
    const currentUserId = auth.user?.id ?? null;
    const isLeaderViewer =
        thesisTitle.leader !== null &&
        currentUserId !== null &&
        thesisTitle.leader.id === currentUserId;
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

    const proposalDefenseInputFromProps = useMemo(
        () => toDatetimeLocalValue(thesisTitle.proposal_defense_at),
        [thesisTitle.proposal_defense_at],
    );

    const finalDefenseInputFromProps = useMemo(
        () => toDatetimeLocalValue(thesisTitle.final_defense_at),
        [thesisTitle.final_defense_at],
    );

    const [proposalDefenseInput, setProposalDefenseInput] = useState<string>(
        proposalDefenseInputFromProps,
    );
    const [finalDefenseInput, setFinalDefenseInput] = useState<string>(
        finalDefenseInputFromProps,
    );

    useEffect(() => {
        setProposalDefenseInput(proposalDefenseInputFromProps);
    }, [proposalDefenseInputFromProps]);

    useEffect(() => {
        setFinalDefenseInput(finalDefenseInputFromProps);
    }, [finalDefenseInputFromProps]);

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

    const scheduleSummary = useMemo(
        () => [
            {
                label: 'Proposal Defense',
                value: formatDate(thesisTitle.proposal_defense_at),
            },
            {
                label: 'Final Defense',
                value: formatDate(thesisTitle.final_defense_at),
            },
        ],
        [thesisTitle.proposal_defense_at, thesisTitle.final_defense_at],
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
    const canAccessPrimaryFiles = permissions.view_documents;
    const showTeamSummary =
        thesisTitle.leader !== null ||
        thesisTitle.adviser !== null ||
        hasMembers;
    const leaderDisplayName =
        thesisTitle.leader !== null
            ? `${thesisTitle.leader.name}${isLeaderViewer ? ' (You)' : ''}`
            : '—';
    const adviserDisplayName = thesisTitle.adviser?.name ?? '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={thesisTitle.title} />
            <div className="px-4 py-6">
                <Heading
                    title={thesisTitle.title}
                    description={headingDescription}
                />

                <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">
                    <div className="space-y-6">
                        {showTeamSummary && (
                            <div className="rounded-xl border border-sidebar-border/60 bg-muted/40 p-4 text-sm text-foreground dark:border-sidebar-border">
                                <div className="space-y-3">
                                    <p>
                                        <span className="font-medium text-muted-foreground">
                                            Leader:
                                        </span>{' '}
                                        {leaderDisplayName}
                                    </p>
                                    <p>
                                        <span className="font-medium text-muted-foreground">
                                            Adviser:
                                        </span>{' '}
                                        {adviserDisplayName}
                                    </p>
                                    {hasMembers && (
                                        <p>
                                            <span className="font-medium text-muted-foreground">
                                                Members:
                                            </span>{' '}
                                            {thesisTitle.members
                                                .map((member) => member.name)
                                                .join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="flex justify-end">
                                {canManage && (
                                    <Button asChild>
                                        <Link
                                            href={
                                                ThesisController.create({
                                                    thesis_title:
                                                        thesisTitle.id,
                                                }).url
                                            }
                                            prefetch
                                        >
                                            Upload
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <div className="overflow-hidden rounded-xl border border-sidebar-border/60 bg-background shadow-sm dark:border-sidebar-border">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr className="text-left text-sm font-semibold text-muted-foreground">
                                            <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                                Chapter/Other File
                                            </th>
                                            <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground uppercase">
                                                Remark
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

                                        {thesisTitle.theses.map((thesis) => {
                                            const isStatusFinal =
                                                thesis.status === 'approved' ||
                                                thesis.status === 'rejected';

                                            return (
                                                <tr
                                                    key={thesis.id}
                                                    className="text-sm"
                                                >
                                                    <td className="px-6 py-4 font-medium text-foreground">
                                                        {thesis.thesis_pdf_url ? (
                                                            <a
                                                                href={
                                                                    thesis.thesis_pdf_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-primary underline-offset-4 hover:underline"
                                                            >
                                                                {thesis.chapter}
                                                            </a>
                                                        ) : (
                                                            thesis.chapter
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {(() => {
                                                            const statusInfo =
                                                                STATUS_META[
                                                                    thesis
                                                                        .status
                                                                ] ??
                                                                STATUS_META.pending;

                                                            return (
                                                                <Badge
                                                                    variant={
                                                                        statusInfo.variant
                                                                    }
                                                                    className="px-3 py-1 text-xs tracking-wide uppercase"
                                                                >
                                                                    {
                                                                        statusInfo.label
                                                                    }
                                                                </Badge>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-6 py-4 text-left">
                                                        {thesis.status ===
                                                            'rejected' &&
                                                        thesis.rejection_remark ? (
                                                            <ThesisRemarkDialog
                                                                thesis={thesis}
                                                            />
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {formatDate(
                                                            thesis.created_at,
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {canManage ? (
                                                            <div className="flex items-center gap-3">
                                                                {isStatusFinal ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                ) : (
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
                                                                                )
                                                                                    .url
                                                                            }
                                                                            prefetch
                                                                        >
                                                                            Edit
                                                                        </Link>
                                                                    </Button>
                                                                )}
                                                                <Form
                                                                    {...ThesisController.destroy.form(
                                                                        {
                                                                            thesis_title:
                                                                                thesisTitle.id,
                                                                            thesis: thesis.id,
                                                                        },
                                                                    )}
                                                                    onSubmit={(
                                                                        event,
                                                                    ) => {
                                                                        if (
                                                                            !window.confirm(
                                                                                'Delete this thesis file? This action cannot be undone.',
                                                                            )
                                                                        ) {
                                                                            event.preventDefault();
                                                                        }
                                                                    }}
                                                                >
                                                                    {({
                                                                        processing,
                                                                    }) => (
                                                                        <Button
                                                                            type="submit"
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            disabled={
                                                                                processing ||
                                                                                isStatusFinal
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
                                                                    {({
                                                                        processing,
                                                                    }) => (
                                                                        <>
                                                                            <input
                                                                                type="hidden"
                                                                                name="status"
                                                                                value="approved"
                                                                            />
                                                                            <Button
                                                                                type="submit"
                                                                                size="sm"
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
                                                                <RejectThesisDialog
                                                                    thesisTitleId={
                                                                        thesisTitle.id
                                                                    }
                                                                    thesis={
                                                                        thesis
                                                                    }
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">
                                                                —
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {canAccessPrimaryFiles && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thesis Documents</CardTitle>
                                    <CardDescription>
                                        Access the uploaded abstract and
                                        endorsement files.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {/* Abstract Button/Message */}
                                        {thesisTitle.abstract_pdf_url ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-sm font-medium"
                                                asChild
                                            >
                                                <a
                                                    href={
                                                        thesisTitle.abstract_pdf_url
                                                    }
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

                        <Card>
                            <CardHeader>
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Defense Schedule</CardTitle>
                                        <CardDescription>
                                            {canReview
                                                ? 'Set the proposal and final defense schedule for this thesis title.'
                                                : 'Scheduled defense dates for this thesis title.'}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {canReview ? (
                                    <Form
                                        {...ThesisTitleController.updateSchedule.form(
                                            {
                                                thesis_title: thesisTitle.id,
                                            },
                                        )}
                                        options={{ preserveScroll: true }}
                                        className="space-y-6"
                                    >
                                        {({
                                            processing,
                                            errors,
                                            recentlySuccessful,
                                        }) => (
                                            <>
                                                <div className="grid gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="proposal_defense_at">
                                                            Proposal Defense
                                                            Date
                                                        </Label>
                                                        <Input
                                                            id="proposal_defense_at"
                                                            name="proposal_defense_at"
                                                            type="datetime-local"
                                                            value={
                                                                proposalDefenseInput
                                                            }
                                                            onChange={(event) =>
                                                                setProposalDefenseInput(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            aria-invalid={Boolean(
                                                                errors.proposal_defense_at,
                                                            )}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.proposal_defense_at
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="final_defense_at">
                                                            Final Defense Date
                                                        </Label>
                                                        <Input
                                                            id="final_defense_at"
                                                            name="final_defense_at"
                                                            type="datetime-local"
                                                            value={
                                                                finalDefenseInput
                                                            }
                                                            onChange={(event) =>
                                                                setFinalDefenseInput(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            aria-invalid={Boolean(
                                                                errors.final_defense_at,
                                                            )}
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.final_defense_at
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
                                                    {recentlySuccessful && (
                                                        <span className="text-sm text-muted-foreground">
                                                            Saved!
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col gap-3 sm:flex-row">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setProposalDefenseInput(
                                                                    '',
                                                                );
                                                                setFinalDefenseInput(
                                                                    '',
                                                                );
                                                            }}
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Clear
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            {processing ? (
                                                                <>
                                                                    <Spinner />
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                'Save'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                ) : (
                                    <dl className="grid gap-4">
                                        {scheduleSummary.map((item) => (
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
                                )}
                            </CardContent>
                        </Card>

                        <Card>
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
                                        {...ThesisTitleController.updatePanel.form(
                                            {
                                                thesis_title: thesisTitle.id,
                                            },
                                        )}
                                        options={{ preserveScroll: true }}
                                        className="space-y-6" // Removed 'mt-4' as CardHeader provides appropriate vertical spacing
                                    >
                                        {({
                                            processing,
                                            errors,
                                            recentlySuccessful,
                                        }) => (
                                            <>
                                                <div className="grid gap-4 md:grid-cols-2">
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
                                                                        errors[
                                                                            field
                                                                        ]
                                                                    }
                                                                />
                                                            </div>
                                                        ),
                                                    )}
                                                </div>

                                                {panelOptionsEmpty && (
                                                    <p className="text-xs text-muted-foreground">
                                                        No other teachers are
                                                        currently available to
                                                        assign.
                                                    </p>
                                                )}

                                                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-end">
                                                    {recentlySuccessful && (
                                                        <span className="text-sm text-muted-foreground">
                                                            Assigned!
                                                        </span>
                                                    )}
                                                    <div className="flex flex-col gap-3 sm:flex-row">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() =>
                                                                setPanelState({
                                                                    chairman_id:
                                                                        '',
                                                                    member_one_id:
                                                                        '',
                                                                    member_two_id:
                                                                        '',
                                                                })
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            Clear
                                                        </Button>
                                                        <Button
                                                            type="submit"
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            {processing ? (
                                                                <>
                                                                    <Spinner />
                                                                    Assigning...
                                                                </>
                                                            ) : (
                                                                'Assign'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                )}

                                {!canReview && (
                                    <div className="mt-4">
                                        <dl className="grid gap-4">
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
                </div>
            </div>
        </AppLayout>
    );
}
