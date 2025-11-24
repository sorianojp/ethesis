import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth.user);

    const primaryHref = isAuthenticated ? dashboard() : login();
    const primaryLabel = isAuthenticated ? 'Go to dashboard' : 'Login';

    return (
        <>
            <Head title="eThesis" />
            <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
                <div className="w-full space-y-6 text-center">
                    <h1 className="text-sm font-semibold tracking-[0.5em] text-primary/80 uppercase">
                        eThesis
                    </h1>
                    <p className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                        Keep every thesis team aligned from first draft to
                        defense day.
                    </p>
                    <div className="flex justify-center">
                        <Button asChild size="lg" className="rounded-full">
                            <Link href={primaryHref}>{primaryLabel}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
