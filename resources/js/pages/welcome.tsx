import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { dashboard, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

const highlights: Array<{ title: string; description: string }> = [
    {
        title: 'Centralized thesis workspace',
        description:
            'Students upload chapters, track revisions, and stay aligned with program requirements in one place.',
    },
    {
        title: 'Advisor visibility',
        description:
            'Pending submissions, defense schedules, and approval forms surface immediately for quick action.',
    },
    {
        title: 'Milestone tracking',
        description:
            'Proposal and final defense timelines remain visible so teams can plan ahead and stay compliant.',
    },
];

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = Boolean(auth.user);

    const primaryHref = isAuthenticated ? dashboard() : login();
    const primaryLabel = isAuthenticated ? 'Go to dashboard' : 'Log in';

    return (
        <>
            <Head title="eThesis" />
            <div className="min-h-screen bg-background text-foreground">
                <header className="border-b bg-white/80 backdrop-blur">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/logo.png"
                                alt="eThesis logo"
                                className="h-10 w-auto"
                            />
                            <span className="text-lg font-semibold tracking-wide">
                                eThesis
                            </span>
                        </div>
                        <Button asChild>
                            <Link href={primaryHref}>{primaryLabel}</Link>
                        </Button>
                    </div>
                </header>

                <main className="mx-auto flex w-full max-w-6xl flex-col-reverse items-center gap-12 px-6 pt-12 pb-20 md:flex-row md:items-start lg:px-10">
                    <section className="flex-1">
                        <Card className="border-none bg-transparent p-0 shadow-none">
                            <CardHeader className="px-0">
                                <CardTitle className="text-4xl leading-tight font-semibold text-foreground md:text-5xl">
                                    Guiding student research from proposal to
                                    final defense.
                                </CardTitle>
                                <CardDescription className="mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
                                    eThesis keeps students, advisers, and panels
                                    aligned. Upload chapters, track approvals,
                                    and stay ahead of every milestone with a
                                    platform built for academic teams.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="px-0">
                                <div className="mt-6 grid gap-3">
                                    {highlights.map((item) => (
                                        <Card
                                            key={item.title}
                                            className="border border-border/70 bg-white shadow-sm transition hover:border-primary/40 hover:shadow-md"
                                        >
                                            <CardContent className="px-5 py-5">
                                                <p className="text-sm font-semibold text-foreground md:text-base">
                                                    {item.title}
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {item.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <aside className="w-full max-w-md">
                        <Card className="border border-border bg-white shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">
                                    Keep every thesis on track
                                </CardTitle>
                                <CardDescription>
                                    Summaries surface pending chapter reviews,
                                    deadlines, and available forms so no detail
                                    is missed.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3 rounded-xl border border-border/70 bg-muted/40 p-4">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Chapters awaiting review</span>
                                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                            8 tasks
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Upcoming defenses</span>
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                                            3 scheduled
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>Approval forms ready</span>
                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
                                            5 available
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    With automatic reminders and chapter
                                    history, advisers and students focus on
                                    feedback and quality—not chasing updates.
                                </p>
                            </CardContent>
                        </Card>
                    </aside>
                </main>

                <footer className="border-t border-border/60 bg-white py-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-10">
                        <p>
                            © {new Date().getFullYear()} eThesis. All rights
                            reserved.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <TextLink href="mailto:helpdesk@your-campus.edu">
                                Support
                            </TextLink>
                            <TextLink
                                href="https://your-campus.edu"
                                target="_blank"
                                rel="noreferrer"
                            >
                                University website
                            </TextLink>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
