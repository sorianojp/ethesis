import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useEffect, useMemo, useState } from 'react';

interface ThesisTitleEditProps {
    thesisTitle: {
        id: number;
        title: string;
        adviser: { id: number; name: string } | null;
        abstract_pdf_url: string | null;
        endorsement_pdf_url: string | null;
        member_ids: number[];
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

    const teacherOptions = useMemo(
        () =>
            teachers.map((teacher) => ({
                id: teacher.id.toString(),
                name: teacher.name,
            })),
        [teachers],
    );

    const [adviserId, setAdviserId] = useState<string>(
        thesisTitle.adviser?.id.toString() ?? teacherOptions[0]?.id ?? '',
    );
    const [memberIds, setMemberIds] = useState<string[]>(
        thesisTitle.member_ids.map((memberId) => memberId.toString()),
    );

    useEffect(() => {
        if (teacherOptions.length === 0) {
            setAdviserId('');
            return;
        }

        setAdviserId((current) => {
            if (current !== '') {
                return current;
            }

            return (
                thesisTitle.adviser?.id.toString() ??
                teacherOptions[0]?.id ??
                ''
            );
        });
    }, [teacherOptions, thesisTitle.adviser?.id]);

    const adviserSelected = adviserId !== '';
    const studentOptions = useMemo(
        () =>
            students.map((student) => ({
                id: student.id.toString(),
                name: student.name,
            })),
        [students],
    );

    const toggleMember = (id: string, checked: boolean | 'indeterminate') => {
        setMemberIds((prev) => {
            const normalized = checked === true;
            if (normalized) {
                if (prev.includes(id)) {
                    return prev;
                }

                return [...prev, id];
            }

            return prev.filter((value) => value !== id);
        });
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

                                    <div className="space-y-2">
                                        <Label>Members</Label>
                                        {studentOptions.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                No students are available to add
                                                as members.
                                            </p>
                                        ) : (
                                            <div className="space-y-2 rounded-md border border-border p-3">
                                                {studentOptions.map(
                                                    (student) => (
                                                        <label
                                                            key={student.id}
                                                            className="flex items-center gap-2"
                                                            htmlFor={`member-${student.id}`}
                                                        >
                                                            <Checkbox
                                                                id={`member-${student.id}`}
                                                                checked={memberIds.includes(
                                                                    student.id,
                                                                )}
                                                                onCheckedChange={(
                                                                    checked,
                                                                ) =>
                                                                    toggleMember(
                                                                        student.id,
                                                                        checked,
                                                                    )
                                                                }
                                                            />
                                                            <span>
                                                                {student.name}
                                                            </span>
                                                        </label>
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
                                            Update
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
