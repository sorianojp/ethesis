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

const breadcrumbs = [
    {
        title: 'Thesis',
        href: ThesisTitleController.index().url,
    },
    {
        title: 'Create',
        href: ThesisTitleController.create().url,
    },
];

interface ThesisTitleCreateProps {
    teachers: {
        id: number;
        name: string;
    }[];
    students: {
        id: number;
        name: string;
    }[];
}

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

type Option = {
    id: string;
    name: string;
};

export default function ThesisTitleCreate({
    teachers,
    students,
}: ThesisTitleCreateProps) {
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

    const [selectedAdviser, setSelectedAdviser] = useState<Option | null>(
        initialTeacherOptions[0] ?? null,
    );

    const teacherOptions = useMemo(
        () =>
            mergeOptions(
                initialTeacherOptions,
                selectedAdviser ? [selectedAdviser] : [],
            ),
        [initialTeacherOptions, selectedAdviser],
    );

    const [studentOptions, setStudentOptions] = useState<Option[]>(
        initialStudentOptions,
    );
    const [studentLoading, setStudentLoading] = useState(false);
    const [studentError, setStudentError] = useState<string | null>(null);
    const [memberQuery, setMemberQuery] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<Option[]>([]);

    useEffect(() => {
        if (!selectedAdviser && initialTeacherOptions.length > 0) {
            setSelectedAdviser(initialTeacherOptions[0]);
        }
    }, [initialTeacherOptions, selectedAdviser]);

    useEffect(() => {
        setStudentOptions(initialStudentOptions);
    }, [initialStudentOptions]);

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
            <Head title="Create thesis" />
            <div className="max-w-xl px-4 py-6">
                <Heading
                    title="Create Thesis"
                    description="Fill in the form below to create a new thesis."
                />
                <Card>
                    <CardContent>
                        <Form
                            {...ThesisTitleController.store.form()}
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
                                            placeholder="Thesis title"
                                            autoFocus
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
                                                    <div className="absolute z-10 mt-2 max-h-48 w-full space-y-1 overflow-y-auto rounded-md border border-border bg-white shadow-lg">
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
                                            Abstract PDF{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="abstract_pdf"
                                            name="abstract_pdf"
                                            type="file"
                                            accept="application/pdf"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload the final abstract in PDF
                                            format.
                                        </p>
                                        <InputError
                                            message={errors.abstract_pdf}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endorsement_pdf">
                                            Endorsement PDF{' '}
                                            <span className="text-destructive">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="endorsement_pdf"
                                            name="endorsement_pdf"
                                            type="file"
                                            accept="application/pdf"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload the signed endorsement in PDF
                                            format.
                                        </p>
                                        <InputError
                                            message={errors.endorsement_pdf}
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
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
