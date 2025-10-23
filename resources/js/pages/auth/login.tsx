import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';
import { LockKeyhole } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status }: LoginProps) {
    return (
        <AuthLayout
            title="eThesis"
            description="Organize, write, succeed. Simplified."
        >
            <Head title="Log in" />

            <Form
                {...AuthenticatedSessionController.store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <Card className="border border-border/70">
                            <CardHeader>
                                <CardTitle className="flex gap-3">
                                    <LockKeyhole
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    Login to your account.
                                </CardTitle>
                                <CardDescription>
                                    Use your STEP-S LMS Credentials
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <Separator />
                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email address
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            required
                                            autoFocus
                                            tabIndex={1}
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="password">
                                            Password
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="Password"
                                        />
                                        <InputError message={errors.password} />
                                    </div>

                                    <Button
                                        type="submit"
                                        className="mt-2 w-full"
                                        tabIndex={3}
                                        disabled={processing}
                                        data-test="login-button"
                                    >
                                        {processing && <Spinner />}
                                        Log in
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                        <div className="text-center text-xs text-muted-foreground">
                            Need access? Contact your ArzaTech.
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
