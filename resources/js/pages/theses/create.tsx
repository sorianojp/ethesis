import ThesisController from '@/actions/App/Http/Controllers/ThesisController';
import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';

interface ThesisCreateProps {
    thesisTitle: {
        id: number;
        title: string;
    };
}

export default function ThesisCreate({ thesisTitle }: ThesisCreateProps) {
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
            title: 'Add chapter/file',
            href: ThesisController.create({
                thesis_title: thesisTitle.id,
            }).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Upload Chapter/File • ${thesisTitle.title}`} />
            <div className="max-w-xl px-4 py-6">
                <Heading
                    title={`Upload Chapter/File for ${thesisTitle.title}`}
                    description="Provide the chapter details below."
                />
                <Card>
                    <CardContent>
                        <Form
                            {...ThesisController.store.form({
                                thesis_title: thesisTitle.id,
                            })}
                            encType="multipart/form-data"
                            className="space-y-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="chapter">
                                            Chapter/File
                                        </Label>
                                        <Input
                                            id="chapter"
                                            name="chapter"
                                            required
                                            placeholder="Chapter name or number"
                                        />
                                        <InputError message={errors.chapter} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="thesis_pdf">
                                            Word Document
                                        </Label>
                                        <Input
                                            id="thesis_pdf"
                                            name="thesis_pdf"
                                            type="file"
                                            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Upload the finalized chapter as a
                                            DOC or DOCX file.
                                        </p>
                                        <InputError
                                            message={errors.thesis_pdf}
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
                                                    ThesisTitleController.show({
                                                        thesis_title:
                                                            thesisTitle.id,
                                                    }).url
                                                }
                                                prefetch
                                            >
                                                Cancel
                                            </Link>
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Uploading...'
                                                : 'Save'}
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
