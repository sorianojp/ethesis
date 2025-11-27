import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

interface ThesisTitleEditProps {
    thesisTitle: {
        id: number;
        title: string;
        adviser: { id: number; name: string } | null;
        abstract_pdf_url: string | null;
        endorsement_pdf_url: string | null;
        member_ids: number[];
        members: {
            id: number;
            name: string;
        }[];
    };
    teachers: {
        id: number;
        name: string;
    }[];
    students: {
        id: number;
        name: string;
    }[];
}

type Option = {
    id: string;
    name: string;
};

function mergeOptions(...lists: Option[][]): Option[] {
    const seen = new Set<string>();
    const result: Option[] = [];

    lists.forEach((list) => {
        list.forEach((option) => {
            if (seen.has(option.id)) {
                return;
            }

            result.push(option);
            seen.add(option.id);
        });
    });

    return result;
}

export default function ThesisTitleEdit({
    thesisTitle,
    teachers,
    students,
}: ThesisTitleEditProps) {
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
        {
            title: 'Edit',
            href: ThesisTitleController.edit({
                thesis_title: thesisTitle.id,
            }).url,
        },
    ];

    const initialTeacherOptions = useMemo<Option[]>(
        () =>
            teachers.map((teacher) => ({
                id: teacher.id.toString(),
                name: teacher.name,
            })),
        [teachers],
    );

    const initialStudentOptions = useMemo<Option[]>(
        () =>
            students.map((student) => ({
                id: student.id.toString(),
                name: student.name,
            })),
        [students],
    );

    const initialSelectedMembers = useMemo<Option[]>(
        () =>
            thesisTitle.members.map((member) => ({
                id: member.id.toString(),
                name: member.name,
            })),
        [thesisTitle.members],
    );

    const [selectedAdviser, setSelectedAdviser] = useState<Option | null>(() => {
        if (thesisTitle.adviser) {
            return {
                id: thesisTitle.adviser.id.toString(),
                name: thesisTitle.adviser.name,
            };
        }

        return initialTeacherOptions[0] ?? null;
    });

    const teacherOptions = useMemo(
        () =>
            mergeOptions(
                initialTeacherOptions,
                selectedAdviser ? [selectedAdviser] : [],
            ),
        [initialTeacherOptions, selectedAdviser],
    );

    const [studentOptions, setStudentOptions] = useState<Option[]>(() =>
        mergeOptions(initialStudentOptions, initialSelectedMembers),
    );
    const [studentLoading, setStudentLoading] = useState(false);
    const [studentError, setStudentError] = useState<string | null>(null);
    const [memberQuery, setMemberQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<Option[]>(
        initialSelectedMembers,
    );

    useEffect(() => {
        setStudentOptions((current) =>
            mergeOptions(initialStudentOptions, selectedMembers, current),
        );
    }, [initialStudentOptions, selectedMembers]);

    useEffect(() => {
        if (selectedAdviser) {
            return;
        }

        if (thesisTitle.adviser) {
            setSelectedAdviser({
                id: thesisTitle.adviser.id.toString(),
                name: thesisTitle.adviser.name,
            });
            return;
        }

        if (initialTeacherOptions.length > 0) {
            setSelectedAdviser(initialTeacherOptions[0]);
        }
    }, [thesisTitle.adviser, initialTeacherOptions, selectedAdviser]);

    const fetchOptions = useCallback(
        async (
            type: 'teachers' | 'students',
            query: string,
            signal: AbortSignal,
        ): Promise<Option[]> => {
            const params = new URLSearchParams({
                type,
                limit: '20',
            });

            const trimmed = query.trim();

            if (trimmed !== '') {
                params.set('search', trimmed);
            }

            const response = await fetch(
                `/thesis-titles/options?${params.toString()}`,
                {
                    method: 'GET',
                    signal,
                    headers: {
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Failed to load ${type}`);
            }

            const payload = (await response.json()) as {
                data: { id: number; name: string }[];
            };

            return payload.data.map((item) => ({
                id: item.id.toString(),
                name: item.name,
            }));
        },
        [],
    );

    useEffect(() => {
        const trimmed = memberQuery.trim();

        if (trimmed === '') {
            setStudentLoading(false);
            setStudentError(null);
            setStudentOptions(initialStudentOptions);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => {
            setStudentLoading(true);
            setStudentError(null);

            fetchOptions('students', trimmed, controller.signal)
                .then((options) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    setStudentOptions(options);
                })
                .catch((error: unknown) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    console.error(error);
                    setStudentError('Unable to load students right now.');
                })
                .finally(() => {
                    if (!controller.signal.aborted) {
                        setStudentLoading(false);
                    }
                });
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [memberQuery, initialStudentOptions, fetchOptions]);

    const adviserSelected = selectedAdviser !== null;

    const filteredMembers = useMemo(
        () =>
            studentOptions.filter(
                (option) =>
                    !selectedMembers.some((member) => member.id === option.id),
            ),
        [studentOptions, selectedMembers],
    );

    const addMember = (member: Option) => {
        setSelectedMembers((prev) => {
            if (prev.some((item) => item.id === member.id)) {
                return prev;
            }

            return [...prev, member];
        });
        setMemberQuery('');
    };

    const removeMember = (id: string) => {
        setSelectedMembers((prev) => prev.filter((value) => value.id !== id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${thesisTitle.title}`} />
            <div className="max-w-xl px-4 py-6">
                <Heading
                    title={`Edit ${thesisTitle.title}`}
                    description="Update the details of your thesis below."
                />
                <Card>
                    <CardContent>
                        <Form
                            {...ThesisTitleController.update.form({
                                thesis_title: thesisTitle.id,
                            })}
                            encType="multipart/form-data"
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            required
                                            defaultValue={thesisTitle.title}
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Members</Label>
                                        {initialStudentOptions.length === 0 &&
                                        selectedMembers.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                No students are available to add
                                                as members.
                                            </p>
                                        ) : (
                                            <div className="relative space-y-3">
                                                <Input
                                                    value={memberQuery}
                                                    onChange={(event) =>
                                                        setMemberQuery(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Search students by name"
                                                    aria-label="Search members"
                                                />
                                                {memberQuery.trim() !== '' && (
                                                    <div className="absolute z-10 mt-2 max-h-48 w-full space-y-1 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
                                                        {studentLoading ? (
                                                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                                                                <Spinner className="h-4 w-4" />
                                                                <span>
                                                                    Searching…
                                                                </span>
                                                            </div>
                                                        ) : studentError ? (
                                                            <p className="px-3 py-2 text-sm text-destructive">
                                                                {studentError}
                                                            </p>
                                                        ) : filteredMembers.length ===
                                                        0 ? (
                                                            <p className="px-3 py-2 text-sm text-muted-foreground">
                                                                No students
                                                                match your
                                                                search.
                                                            </p>
                                                        ) : (
                                                            filteredMembers.map(
                                                                (student) => (
                                                                    <Button
                                                                        key={
                                                                            student.id
                                                                        }
                                                                        type="button"
                                                                        variant="ghost"
                                                                        className="h-auto w-full justify-start px-3 py-2 text-left text-sm"
                                                                        onClick={() =>
                                                                            addMember(
                                                                                student,
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            student.name
                                                                        }
                                                                    </Button>
                                                                ),
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {selectedMembers.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedMembers.map(
                                                    (member) => (
                                                        <Badge
                                                            key={member.id}
                                                            variant="secondary"
                                                            className="flex items-center gap-1"
                                                        >
                                                            <span>
                                                                {member.name}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeMember(
                                                                        member.id,
                                                                    )
                                                                }
                                                                className="rounded-full p-0.5 text-muted-foreground transition hover:text-destructive"
                                                                aria-label={`Remove ${member.name}`}
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        )}

                                        {selectedMembers.map((member, index) => (
                                            <input
                                                key={member.id}
                                                type="hidden"
                                                name={`member_ids[${index}]`}
                                                value={member.id}
                                            />
                                        ))}
                                        <InputError
                                            message={errors.member_ids}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adviser_id">
                                            Adviser
                                        </Label>
                                        <Select
                                            value={selectedAdviser?.id ?? ''}
                                            onValueChange={(value) => {
                                                const adviser =
                                                    teacherOptions.find(
                                                        (option) =>
                                                            option.id ===
                                                            value,
                                                    ) ?? null;

                                                setSelectedAdviser(adviser);
                                            }}
                                            disabled={
                                                teacherOptions.length === 0
                                            }
                                        >
                                            <SelectTrigger
                                                id="adviser_id"
                                                aria-invalid={Boolean(
                                                    errors.adviser_id,
                                                )}
                                            >
                                                <SelectValue placeholder="Choose adviser" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teacherOptions.map(
                                                    (teacher) => (
                                                        <SelectItem
                                                            value={teacher.id}
                                                            key={teacher.id}
                                                        >
                                                            {teacher.name}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {teacherOptions.length === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                No teachers available. Contact
                                                an administrator.
                                            </p>
                                        )}
                                        <input
                                            type="hidden"
                                            name="adviser_id"
                                            value={selectedAdviser?.id ?? ''}
                                        />
                                        <InputError
                                            message={errors.adviser_id}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="abstract_pdf">
                                            Abstract PDF
                                        </Label>
                                        <Input
                                            id="abstract_pdf"
                                            name="abstract_pdf"
                                            type="file"
                                            accept="application/pdf"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank to keep the current
                                            abstract.
                                        </p>
                                        {thesisTitle.abstract_pdf_url && (
                                            <p className="text-xs">
                                                Current:{' '}
                                                <a
                                                    href={
                                                        thesisTitle.abstract_pdf_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    View abstract
                                                </a>
                                            </p>
                                        )}
                                        <InputError
                                            message={errors.abstract_pdf}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endorsement_pdf">
                                            Endorsement PDF
                                        </Label>
                                        <Input
                                            id="endorsement_pdf"
                                            name="endorsement_pdf"
                                            type="file"
                                            accept="application/pdf"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank to keep the current
                                            endorsement.
                                        </p>
                                        {thesisTitle.endorsement_pdf_url && (
                                            <p className="text-xs">
                                                Current:{' '}
                                                <a
                                                    href={
                                                        thesisTitle.endorsement_pdf_url
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    View endorsement
                                                </a>
                                            </p>
                                        )}
                                        <InputError
                                            message={errors.endorsement_pdf}
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-3">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            asChild
                                        >
                                            <Link
                                                href={
                                                    ThesisTitleController.index()
                                                        .url
                                                }
                                                prefetch
                                            >
                                                Cancel
                                            </Link>
                                        </Button>

                                        <Button
                                            type="submit"
                                            disabled={
                                                processing || !adviserSelected
                                            }
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
