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

interface PlagiarismFinding {
    startIndex?: number;
    endIndex?: number;
    sequence?: string;
}

interface PlagiarismSource {
    score?: number;
    url?: string;
    title?: string;
    author?: string;
    source?: string;
    description?: string;
    plagiarismWords?: number;
    totalNumberOfWords?: number;
    identicalWordCounts?: number;
    similarWordCounts?: number;
    similarWords?: unknown[];
    citation?: boolean;
    canAccess?: boolean;
    is_excluded?: boolean;
    publishedDate?: string;
    plagiarismFound?: PlagiarismFinding[];
    [key: string]: unknown;
}

interface PlagiarismScan {
    id: number;
    status: 'pending' | 'completed' | 'failed' | string;
    document_path: string | null;
    document_url: string | null;
    language: string | null;
    country: string | null;
    score: number | null;
    source_count: number | null;
    text_word_count: number | null;
    total_plagiarism_words: number | null;
    identical_word_count: number | null;
    similar_word_count: number | null;
    sources: PlagiarismSource[] | null;
    raw_response: Record<string, unknown> | null;
    error_message: string | null;
    scanned_at: string | null;
    created_at: string | null;
    updated_at: string | null;
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
    post_grad: boolean;
    created_at: string | null;
    status: ThesisStatus;
    rejection_remark: string | null;
    plagiarism_scan: PlagiarismScan | null;
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
        certificates: {
            proposal: string;
            final: string;
        };
        approval_forms: {
            undergrad: string;
            postgrad: string;
        };
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
                    View
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

interface PlagiarismScanDialogProps {
    scan: PlagiarismScan;
}

const SCAN_STATUS_BADGE: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
> = {
    completed: 'default',
    pending: 'secondary',
    failed: 'destructive',
};

function PlagiarismScanDialog({ scan }: PlagiarismScanDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const label =
        scan.score !== null
            ? `${scan.score}%`
            : scan.status === 'failed'
              ? 'Failed'
              : 'Pending';

    const statusVariant =
        SCAN_STATUS_BADGE[scan.status] ?? SCAN_STATUS_BADGE.pending;

    const metrics = [
        { label: 'Score', value: scan.score !== null ? `${scan.score}%` : '—' },
        {
            label: 'Source Count',
            value: scan.source_count ?? '—',
        },
        {
            label: 'Identical Words',
            value: scan.identical_word_count ?? '—',
        },
        {
            label: 'Similar Words',
            value: scan.similar_word_count ?? '—',
        },
        {
            label: 'Total Plagiarized Words',
            value: scan.total_plagiarism_words ?? '—',
        },
        {
            label: 'Text Word Count',
            value: scan.text_word_count ?? '—',
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button type="button" size="sm" variant="link" className="px-0">
                    {scan.status === 'pending' && (
                        <Spinner className="mr-1 h-3 w-3" />
                    )}
                    {label}
                </Button>
            </DialogTrigger>
            <DialogContent className="flex max-h-[85vh] w-full flex-col sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Plagiarism Scan</DialogTitle>
                    <DialogDescription>
                        Winston AI scan details for this thesis file.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={statusVariant} className="uppercase">
                            {scan.status}
                        </Badge>
                        {scan.scanned_at && (
                            <span className="text-muted-foreground">
                                Scanned:{' '}
                                <span className="font-medium text-foreground">
                                    {formatDate(scan.scanned_at)}
                                </span>
                            </span>
                        )}
                        {scan.document_url && (
                            <Button
                                size="sm"
                                variant="outline"
                                asChild
                                className="ml-auto"
                            >
                                <a
                                    href={scan.document_url}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    View Document
                                </a>
                            </Button>
                        )}
                    </div>

                    {scan.error_message && (
                        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                            {scan.error_message}
                        </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                        {metrics.map((metric) => (
                            <div
                                key={metric.label}
                                className="rounded-md border border-muted-foreground/20 bg-muted/40 p-3"
                            >
                                <p className="text-xs text-muted-foreground uppercase">
                                    {metric.label}
                                </p>
                                <p className="mt-1 text-base font-semibold text-foreground">
                                    {metric.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {Array.isArray(scan.sources) && scan.sources.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                Sources
                            </p>
                            <div className="space-y-3">
                                {scan.sources.map((source, index) => (
                                    <div
                                        key={`${source.url ?? index}-${index}`}
                                        className="space-y-3 rounded-md border border-muted-foreground/20 p-3"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">
                                                {source.title ??
                                                    source.url ??
                                                    `Source ${index + 1}`}
                                            </span>
                                            {typeof source.score ===
                                                'number' && (
                                                <Badge variant="outline">
                                                    {source.score}%
                                                </Badge>
                                            )}
                                            {source.citation === true && (
                                                <Badge variant="secondary">
                                                    Citation
                                                </Badge>
                                            )}
                                            {source.canAccess !== undefined && (
                                                <Badge
                                                    variant={
                                                        source.canAccess
                                                            ? 'outline'
                                                            : 'destructive'
                                                    }
                                                >
                                                    {source.canAccess
                                                        ? 'Accessible'
                                                        : 'Blocked'}
                                                </Badge>
                                            )}
                                            {source.is_excluded === true && (
                                                <Badge variant="secondary">
                                                    Excluded
                                                </Badge>
                                            )}
                                        </div>

                                        {source.description && (
                                            <p className="text-xs text-muted-foreground">
                                                {source.description}
                                            </p>
                                        )}

                                        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                            {source.author && (
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Author:
                                                    </span>{' '}
                                                    {source.author}
                                                </div>
                                            )}
                                            {source.source && (
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Source:
                                                    </span>{' '}
                                                    {source.source}
                                                </div>
                                            )}
                                            {source.publishedDate && (
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Published:
                                                    </span>{' '}
                                                    {source.publishedDate}
                                                </div>
                                            )}
                                            {typeof source.totalNumberOfWords ===
                                                'number' && (
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Total Words:
                                                    </span>{' '}
                                                    {source.totalNumberOfWords.toLocaleString()}
                                                </div>
                                            )}
                                            {typeof source.plagiarismWords ===
                                                'number' && (
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Plagiarized Words:
                                                    </span>{' '}
                                                    {source.plagiarismWords.toLocaleString()}
                                                </div>
                                            )}
                                            {typeof source.identicalWordCounts ===
                                                'number' && (
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Identical Words:
                                                    </span>{' '}
                                                    {source.identicalWordCounts.toLocaleString()}
                                                </div>
                                            )}
                                            {typeof source.similarWordCounts ===
                                                'number' && (
                                                <div>
                                                    <span className="font-medium text-foreground">
                                                        Similar Words:
                                                    </span>{' '}
                                                    {source.similarWordCounts.toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        {source.url && (
                                            <p className="text-xs">
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary underline-offset-4 hover:underline"
                                                >
                                                    {source.url}
                                                </a>
                                            </p>
                                        )}

                                        {Array.isArray(source.similarWords) &&
                                            source.similarWords.length > 0 && (
                                                <div className="space-y-1 text-xs text-muted-foreground">
                                                    <p className="font-semibold uppercase">
                                                        Similar Words
                                                    </p>
                                                    <ul className="list-inside list-disc space-y-1">
                                                        {source.similarWords.map(
                                                            (
                                                                word,
                                                                wordIndex,
                                                            ) => (
                                                                <li
                                                                    key={`${wordIndex}-${String(
                                                                        word,
                                                                    )}`}
                                                                    className="text-foreground"
                                                                >
                                                                    {String(
                                                                        word,
                                                                    )}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                        {Array.isArray(
                                            source.plagiarismFound,
                                        ) &&
                                            source.plagiarismFound.length >
                                                0 && (
                                                <div className="space-y-2 text-xs text-muted-foreground">
                                                    <p className="font-semibold uppercase">
                                                        Plagiarized Passages
                                                    </p>
                                                    {source.plagiarismFound.map(
                                                        (
                                                            finding,
                                                            findingIndex,
                                                        ) => (
                                                            <div
                                                                key={`${findingIndex}-${finding.startIndex}-${finding.endIndex}`}
                                                                className="rounded-md border border-muted-foreground/20 bg-muted/40 p-2"
                                                            >
                                                                {finding.sequence && (
                                                                    <p className="whitespace-pre-wrap text-foreground">
                                                                        {
                                                                            finding.sequence
                                                                        }
                                                                    </p>
                                                                )}
                                                                {(typeof finding.startIndex ===
                                                                    'number' ||
                                                                    typeof finding.endIndex ===
                                                                        'number') && (
                                                                    <p className="mt-1 text-[10px] text-muted-foreground uppercase">
                                                                        Span:{' '}
                                                                        {typeof finding.startIndex ===
                                                                        'number'
                                                                            ? finding.startIndex
                                                                            : '—'}{' '}
                                                                        –{' '}
                                                                        {typeof finding.endIndex ===
                                                                        'number'
                                                                            ? finding.endIndex
                                                                            : '—'}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            No sources were reported in this scan.
                        </p>
                    )}

                    {scan.raw_response && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">
                                Raw Response
                            </p>
                            <pre className="max-h-56 overflow-auto rounded-md border border-muted-foreground/20 bg-muted/30 p-3 text-xs leading-relaxed break-words whitespace-pre-wrap text-foreground">
                                {JSON.stringify(scan.raw_response, null, 2)}
                            </pre>
                        </div>
                    )}
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
    const programLevel = useMemo(() => {
        const thesisSource = thesisTitle.theses.find(() => true);

        if (thesisSource) {
            return thesisSource.post_grad ? 'Postgrad' : 'Undergrad';
        }

        const rawStudent = (auth.user as Record<string, unknown> | undefined)
            ?.student;

        if (rawStudent && typeof rawStudent === 'object') {
            const course = (rawStudent as Record<string, unknown>).course;

            if (course && typeof course === 'object') {
                const postGradValue = (course as Record<string, unknown>)
                    .post_grad;

                if (typeof postGradValue === 'number') {
                    return postGradValue === 1 ? 'Postgrad' : 'Undergrad';
                }

                if (typeof postGradValue === 'string') {
                    const numeric = Number(postGradValue.trim());

                    if (!Number.isNaN(numeric)) {
                        return numeric === 1 ? 'Postgrad' : 'Undergrad';
                    }
                }
            }
        }

        return null;
    }, [auth.user, thesisTitle.theses]);
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

    const approvalForms = thesisTitle.approval_forms;
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

    const recommendedForm =
        programLevel === 'Postgrad'
            ? 'postgrad'
            : programLevel === 'Undergrad'
              ? 'undergrad'
              : null;
    const recommendedFormLabel =
        recommendedForm === 'postgrad'
            ? 'Postgraduate'
            : recommendedForm === 'undergrad'
              ? 'Undergraduate'
              : null;
    const approvalFormEntries = useMemo(() => {
        const entries: Array<{
            key: 'undergrad' | 'postgrad';
            label: string;
            href: string;
        }> = [];

        if (approvalForms.undergrad) {
            entries.push({
                key: 'undergrad',
                label: 'Undergraduate Form',
                href: approvalForms.undergrad,
            });
        }

        if (approvalForms.postgrad) {
            entries.push({
                key: 'postgrad',
                label: 'Postgraduate Form',
                href: approvalForms.postgrad,
            });
        }

        if (recommendedForm) {
            const recommendedEntry = entries.find(
                (entry) => entry.key === recommendedForm,
            );

            if (recommendedEntry) {
                return [recommendedEntry];
            }
        }

        return entries;
    }, [approvalForms.postgrad, approvalForms.undergrad, recommendedForm]);
    const hasApprovalForms = approvalFormEntries.length > 0;
    const showRecommendedFormNotice =
        recommendedForm !== null &&
        recommendedFormLabel !== null &&
        approvalFormEntries.length === 1 &&
        approvalFormEntries[0].key === recommendedForm;

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
    const membersDisplayName = hasMembers
        ? thesisTitle.members.map((member) => member.name).join(', ')
        : '—';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={thesisTitle.title} />
            <div className="px-4 py-6">
                <Heading
                    title={thesisTitle.title}
                    description={headingDescription}
                />

                <div className="mt-6 space-y-6">
                    {showTeamSummary && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Thesis Details</CardTitle>
                                <CardDescription>
                                    Snapshot of the project team and adviser
                                    assignments.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid gap-4 text-sm text-foreground">
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Leader
                                        </dt>
                                        <dd className="mt-1">
                                            {leaderDisplayName}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Adviser
                                        </dt>
                                        <dd className="mt-1">
                                            {adviserDisplayName}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Members
                                        </dt>
                                        <dd className="mt-1">
                                            {membersDisplayName}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                            Program Level
                                        </dt>
                                        <dd className="mt-1">
                                            {programLevel ?? '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>
                    )}

                    <section className="space-y-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-base font-semibold text-foreground">
                                Thesis Files
                            </h2>
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
                                            Plagiarism Score
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
                                                colSpan={6}
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
                                                                thesis.status
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
                                                <td className="px-6 py-4">
                                                    {thesis.rejection_remark ? (
                                                        <ThesisRemarkDialog
                                                            thesis={thesis}
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {thesis.plagiarism_scan ? (
                                                        <PlagiarismScanDialog
                                                            scan={
                                                                thesis.plagiarism_scan
                                                            }
                                                        />
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            —
                                                        </span>
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
                                                                thesis={thesis}
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
                    </section>
                    {canAccessPrimaryFiles && (
                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thesis Documents</CardTitle>
                                    <CardDescription>
                                        Access the uploaded abstract and
                                        endorsement files.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4">
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

                            <Card>
                                <CardHeader>
                                    <CardTitle>Certificates</CardTitle>
                                    <CardDescription>
                                        Download eligibility certificates for
                                        scheduled defenses.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-sm font-medium"
                                            asChild
                                        >
                                            <a
                                                href={
                                                    thesisTitle.certificates
                                                        .proposal
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Proposal Defense
                                            </a>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-sm font-medium"
                                            asChild
                                        >
                                            <a
                                                href={
                                                    thesisTitle.certificates
                                                        .final
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                Final Defense
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                            {hasApprovalForms && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Approval Forms</CardTitle>
                                        <CardDescription>
                                            Download the approval sheet template
                                            required for submission.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 gap-4">
                                            {approvalFormEntries.map((form) => (
                                                <Button
                                                    key={form.key}
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-sm font-medium"
                                                    asChild
                                                >
                                                    <a
                                                        href={form.href}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        {form.label}
                                                    </a>
                                                </Button>
                                            ))}
                                        </div>
                                        {showRecommendedFormNotice &&
                                            recommendedFormLabel && (
                                                <p className="mt-3 text-xs text-muted-foreground">
                                                    Recommended based on program
                                                    level:{' '}
                                                    <span className="font-medium text-foreground">
                                                        {recommendedFormLabel}
                                                    </span>
                                                    .
                                                </p>
                                            )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                    <div className="grid gap-6 lg:grid-cols-2">
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
                                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <CardTitle>Panel Members</CardTitle>
                                        <CardDescription>
                                            {canReview
                                                ? 'Assign panel members for this thesis.'
                                                : 'Assigned panel members for this thesis.'}
                                        </CardDescription>
                                    </div>
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
                                        className="space-y-6"
                                    >
                                        {({
                                            processing,
                                            errors,
                                            recentlySuccessful,
                                        }) => (
                                            <>
                                                <div className="grid grid-cols-1 gap-4">
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
