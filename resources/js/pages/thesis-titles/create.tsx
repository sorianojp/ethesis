import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Form, Head, Link } from '@inertiajs/react';

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

export default function ThesisTitleCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create thesis" />
            <div className="px-4 py-6">
                <Heading
                    title="Create Thesis"
                    description="Fill in the form below to create a new thesis."
                />
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

                            <div className="space-y-2">
                                <Label htmlFor="abstract_pdf">
                                    Abstract PDF{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="abstract_pdf"
                                    name="abstract_pdf"
                                    type="file"
                                    accept="application/pdf"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload the final abstract in PDF format.
                                </p>
                                <InputError message={errors.abstract_pdf} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endorsement_pdf">
                                    Endorsement PDF{' '}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="endorsement_pdf"
                                    name="endorsement_pdf"
                                    type="file"
                                    accept="application/pdf"
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Upload the signed endorsement in PDF format.
                                </p>
                                <InputError message={errors.endorsement_pdf} />
                            </div>

                            <div className="flex items-center justify-end gap-3">
                                <Button type="button" variant="outline" asChild>
                                    <Link
                                        href={ThesisTitleController.index().url}
                                        prefetch
                                    >
                                        Cancel
                                    </Link>
                                </Button>

                                <Button type="submit" disabled={processing}>
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
