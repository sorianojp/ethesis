import ThesisController from '@/actions/App/Http/Controllers/ThesisController';
import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';

interface ThesisEditProps {
    thesisTitle: {
        id: number;
        title: string;
    };
    thesis: {
        id: number;
        chapter: string;
        thesis_pdf_url: string | null;
    };
}

export default function ThesisEdit({ thesisTitle, thesis }: ThesisEditProps) {
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
            title: 'Edit thesis file',
            href: ThesisController.edit({
                thesis_title: thesisTitle.id,
                thesis: thesis.id,
            }).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Chapter • ${thesisTitle.title}`} />
            <div className="px-4 py-6">
                <Heading
                    title={`Edit ${thesis.chapter}`}
                    description="Update the details of your chapter below."
                />
                <Form
                    {...ThesisController.update.form({
                        thesis_title: thesisTitle.id,
                        thesis: thesis.id,
                    })}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="chapter">Chapter</Label>
                                <Input
                                    id="chapter"
                                    name="chapter"
                                    defaultValue={thesis.chapter}
                                    required
                                />
                                <InputError message={errors.chapter} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="thesis_pdf">Thesis PDF</Label>
                                <Input
                                    id="thesis_pdf"
                                    name="thesis_pdf"
                                    type="file"
                                    accept="application/pdf"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave blank to keep the current file.
                                </p>
                                {thesis.thesis_pdf_url && (
                                    <p className="text-xs">
                                        Current:{' '}
                                        <a
                                            href={thesis.thesis_pdf_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-primary hover:underline"
                                        >
                                            View current file
                                        </a>
                                    </p>
                                )}
                                <InputError message={errors.thesis_pdf} />
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button variant="outline" type="button" asChild>
                                    <Link
                                        href={
                                            ThesisTitleController.show({
                                                thesis_title: thesisTitle.id,
                                            }).url
                                        }
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
