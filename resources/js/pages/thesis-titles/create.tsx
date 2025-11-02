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
import { useEffect, useMemo, useState } from 'react';

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

export default function ThesisTitleCreate({
    teachers,
    students,
}: ThesisTitleCreateProps) {
    const teacherOptions = useMemo(
        () =>
            teachers.map((teacher) => ({
                id: teacher.id.toString(),
                name: teacher.name,
            })),
        [teachers],
    );

    const [adviserId, setAdviserId] = useState<string>(
        teacherOptions[0]?.id ?? '',
    );

    useEffect(() => {
        if (teacherOptions.length === 0) {
            setAdviserId('');
            return;
        }

        setAdviserId((current) =>
            current !== '' ? current : (teacherOptions[0]?.id ?? ''),
        );
    }, [teacherOptions]);

    const adviserSelected = adviserId !== '';
    const [memberIds, setMemberIds] = useState<string[]>([]);
    const [memberQuery, setMemberQuery] = useState('');

    const studentOptions = useMemo(
        () =>
            students.map((student) => ({
                id: student.id.toString(),
                name: student.name,
            })),
        [students],
    );

    const selectedMembers = useMemo(
        () => studentOptions.filter((option) => memberIds.includes(option.id)),
        [studentOptions, memberIds],
    );

    const filteredMembers = useMemo(() => {
        const query = memberQuery.trim().toLowerCase();

        return studentOptions.filter((student) => {
            if (memberIds.includes(student.id)) {
                return false;
            }

            if (query === '') {
                return true;
            }

            return student.name.toLowerCase().includes(query);
        });
    }, [studentOptions, memberIds, memberQuery]);

    const addMember = (id: string) => {
        setMemberIds((prev) => {
            if (prev.includes(id)) {
                return prev;
            }

            return [...prev, id];
        });
        setMemberQuery('');
    };

    const removeMember = (id: string) => {
        setMemberIds((prev) => prev.filter((value) => value !== id));
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
                                        {studentOptions.length === 0 ? (
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
                                                        {filteredMembers.length ===
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
                                                                                student.id,
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

                                        {memberIds.map((id, index) => (
                                            <input
                                                key={id}
                                                type="hidden"
                                                name={`member_ids[${index}]`}
                                                value={id}
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
                                            value={adviserId}
                                            onValueChange={setAdviserId}
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
                                        <input
                                            type="hidden"
                                            name="adviser_id"
                                            value={adviserId}
                                        />
                                        {teacherOptions.length === 0 && (
                                            <p className="text-xs text-destructive">
                                                No teachers available. Contact
                                                an administrator.
                                            </p>
                                        )}
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
