import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';

interface ThesisTitleEditProps {
    thesisTitle: {
        id: number;
        title: string;
        abstract_pdf_url: string | null;
        endorsement_pdf_url: string | null;
    };
}

export default function ThesisTitleEdit({ thesisTitle }: ThesisTitleEditProps) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${thesisTitle.title}`} />
            <div className="px-4 py-6">
                <Heading
                    title={`Edit ${thesisTitle.title}`}
                    description="Update the details of your thesis below."
                />

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
                                    Leave blank to keep the current abstract.
                                </p>
                                {thesisTitle.abstract_pdf_url && (
                                    <p className="text-xs">
                                        Current:{' '}
                                        <a
                                            href={thesisTitle.abstract_pdf_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            View abstract
                                        </a>
                                    </p>
                                )}
                                <InputError message={errors.abstract_pdf} />
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
                                    Leave blank to keep the current endorsement.
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
                                <InputError message={errors.endorsement_pdf} />
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button variant="outline" type="button" asChild>
                                    <Link
                                        href={ThesisTitleController.index().url}
                                        prefetch
                                    >
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Update
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
