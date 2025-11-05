import { Badge } from '@/components/ui/badge';
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

const benefits = [
    {
        title: 'Unified thesis workspace',
        body: 'Students upload chapters, download approval forms, and see adviser feedback without bouncing between tools.',
    },
    {
        title: 'Advisor visibility',
        body: 'Pending reviews, panel assignments, and certificates stay front and center so mentors can act fast.',
    },
    {
        title: 'Defense-ready timelines',
        body: 'Proposal and final defense schedules flow into dashboards so every team knows what is next.',
    },
];

const featureCards: Array<{
    title: string;
    description: string;
    bullets: string[];
}> = [
    {
        title: 'Document lifecycle at a glance',
        description:
            'Leader dashboards surface chapter status, recommended approval forms, and membership summaries automatically.',
        bullets: [
            'Upload proposal, final, and supporting documents with revision history.',
            'Dynamic badges highlight pending, approved, and returned chapters.',
            'Members and advisers see the same context, reducing back-and-forth.',
        ],
    },
    {
        title: 'Advisor workflow tools',
        description:
            'Faculty dashboards prioritize reviews, panel assignments, and upcoming defenses for quicker approvals.',
        bullets: [
            'Pending reviews list newest submissions with quick links.',
            'Eligibility certificates and endorsement files stay one click away.',
            'Proactive alerts for missing panel roles or unsigned forms.',
        ],
    },
    {
        title: 'Defense planning made easy',
        description:
            'Milestones roll into both student and adviser views so teams prepare for proposal and final defenses on time.',
        bullets: [
            'Upcoming defense card shows dates plus relative countdowns.',
            'Certificates and approval sheets matched to program level.',
            'Panel summaries ensure every seat is confirmed before defense day.',
        ],
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
                <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

                <main className="space-y-16 bg-muted/40 pb-16">
                    <section className="border-y bg-card py-16">
                        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 lg:flex-row lg:items-center lg:px-10">
                            <div className="flex-1">
                                <Badge className="bg-primary/10 text-primary">
                                    Thesis Management Platform
                                </Badge>
                                <h1 className="mt-6 text-4xl leading-tight font-semibold text-foreground md:text-5xl">
                                    Keep every thesis team aligned from first
                                    draft to defense day.
                                </h1>
                                <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
                                    eThesis brings students, advisers, and panel
                                    members into a single workflow—documents,
                                    approvals, schedules, and notifications stay
                                    synchronized automatically.
                                </p>
                            </div>

                            <Card className="flex-1 shadow-lg">
                                <CardHeader className="space-y-1">
                                    <CardTitle className="text-xl font-semibold">
                                        What students see
                                    </CardTitle>
                                    <CardDescription>
                                        The dashboard pinpoints chapter status,
                                        upcoming defenses, and program
                                        requirements.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>
                                                Chapters awaiting review
                                            </span>
                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                                8 tasks
                                            </span>
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Upcoming defenses</span>
                                            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                                                3 scheduled
                                            </span>
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>Approval forms ready</span>
                                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                                                5 available
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Program level determines which approval
                                        sheet is recommended automatically, so
                                        leaders always grab the right document
                                        on the first try.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <section className="mx-auto w-full max-w-6xl px-6 lg:px-10">
                        <div className="grid gap-6 md:grid-cols-3">
                            {benefits.map((item) => (
                                <Card
                                    key={item.title}
                                    className="shadow-sm transition hover:border-primary/40 hover:shadow-md"
                                >
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {item.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {item.body}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <section className="mx-auto w-full max-w-6xl space-y-6 px-6 lg:px-10">
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-semibold text-foreground">
                                Purpose-built features
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                eThesis mirrors the workflows your campus
                                follows—from submission to certification—using
                                the same UI components students and advisers
                                already recognize inside the app.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {featureCards.map((feature) => (
                                <Card
                                    key={feature.title}
                                    className="shadow-sm transition hover:border-primary/40 hover:shadow-md"
                                >
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold text-foreground">
                                            {feature.title}
                                        </CardTitle>
                                        <CardDescription>
                                            {feature.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            {feature.bullets.map((bullet) => (
                                                <li
                                                    key={bullet}
                                                    className="flex items-start gap-2"
                                                >
                                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                </main>

                <footer className="border-t border-border/60 bg-background/90 py-6">
                    <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-xs text-muted-foreground lg:flex-row lg:items-center lg:justify-between lg:px-10">
                        <p>
                            © {new Date().getFullYear()} eThesis. All rights
                            reserved.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a
                                href="mailto:arzatechnologies@gmail.com"
                                className="text-xs text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
                            >
                                Support
                            </a>
                            <a
                                href="https://udd.edu.ph/"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-muted-foreground underline-offset-4 transition hover:text-primary hover:underline"
                            >
                                Universidad de Dagupan
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
