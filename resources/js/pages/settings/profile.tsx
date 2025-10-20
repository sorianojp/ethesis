import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { send } from '@/routes/verification';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const rawRoles = auth.user.roles as unknown;
    const roleNames = Array.isArray(rawRoles)
        ? rawRoles
              .map((role) => {
                  if (typeof role === 'string') {
                      return role;
                  }

                  if (role && typeof role === 'object') {
                      if (
                          'name' in role &&
                          typeof (role as { name?: unknown }).name === 'string'
                      ) {
                          return (role as { name: string }).name;
                      }

                      if (
                          'title' in role &&
                          typeof (role as { title?: unknown }).title ===
                              'string'
                      ) {
                          return (role as { title: string }).title;
                      }
                  }

                  return null;
              })
              .filter((roleName): roleName is string => Boolean(roleName))
        : [];
    const userRecord = auth.user as Record<string, unknown>;

    const getNestedString = (
        source: unknown,
        path: string[],
    ): string | null => {
        let current: unknown = source;

        for (const segment of path) {
            if (!current || typeof current !== 'object' || current === null) {
                return null;
            }

            current = (current as Record<string, unknown>)[segment];
        }

        if (typeof current !== 'string') {
            return null;
        }

        const trimmed = current.trim();

        return trimmed === '' ? null : trimmed;
    };

    const getNestedNumber = (
        source: unknown,
        path: string[],
    ): number | null => {
        let current: unknown = source;

        for (const segment of path) {
            if (!current || typeof current !== 'object' || current === null) {
                return null;
            }

            current = (current as Record<string, unknown>)[segment];
        }

        if (typeof current === 'number') {
            return current;
        }

        if (typeof current === 'string') {
            const numeric = Number(current.trim());

            if (!Number.isNaN(numeric)) {
                return numeric;
            }
        }

        return null;
    };

    const studentData = userRecord['student'];
    const staffData = userRecord['staff'];

    const studentCollegeName = getNestedString(studentData, [
        'college',
        'name',
    ]);
    const studentCourseName = getNestedString(studentData, ['course', 'name']);
    const staffCollegeName = getNestedString(staffData, ['college', 'name']);
    const studentPostGradFlag = getNestedNumber(studentData, [
        'course',
        'post_grad',
    ]);
    const programLevel =
        studentPostGradFlag === null
            ? null
            : studentPostGradFlag === 1
              ? 'Postgrad'
              : 'Undergrad';

    const academicDetails: Array<{ label: string; value: string }> = [];

    if (studentCollegeName) {
        academicDetails.push({ label: 'College', value: studentCollegeName });
    }

    if (studentCourseName) {
        academicDetails.push({ label: 'Course', value: studentCourseName });
    }

    if (programLevel) {
        academicDetails.push({ label: 'Program level', value: programLevel });
    }

    if (academicDetails.length === 0 && staffCollegeName) {
        academicDetails.push({ label: 'College', value: staffCollegeName });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Profile information"
                        description="Update your name and email address"
                    />

                    {roleNames.length > 0 && (
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                Roles
                            </p>
                            <p className="mt-1">{roleNames.join(', ')}</p>
                        </div>
                    )}

                    {academicDetails.length > 0 && (
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                            <p className="font-medium text-neutral-900 dark:text-neutral-50">
                                Academic Details
                            </p>

                            <ul className="mt-1 space-y-1">
                                {academicDetails.map(({ label, value }) => (
                                    <li
                                        key={`${label}-${value}`}
                                        className="flex flex-wrap gap-1"
                                    >
                                        <span className="font-medium text-neutral-900 dark:text-neutral-50">
                                            {label}:
                                        </span>
                                        <span>{value}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Full name"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Email address"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Your email address is
                                                unverified.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Click here to resend the
                                                    verification email.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    A new verification link has
                                                    been sent to your email
                                                    address.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Save
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
