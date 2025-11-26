import ThesisTitleController from '@/actions/App/Http/Controllers/ThesisTitleController';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookMarked, BookOpen, Building2, GraduationCap, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

const dashboardNavItem: NavItem = {
    title: 'Dashboard',
    href: dashboard(),
    icon: LayoutGrid,
};

const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

const extractRoleNames = (rawRoles: unknown): string[] => {
    if (!Array.isArray(rawRoles)) {
        return [];
    }

    return rawRoles
        .map((role) => {
            if (typeof role === 'string') {
                return role;
            }

            if (role && typeof role === 'object') {
                if ('name' in role && typeof (role as { name?: unknown }).name === 'string') {
                    return (role as { name: string }).name;
                }

                if ('title' in role && typeof (role as { title?: unknown }).title === 'string') {
                    return (role as { title: string }).title;
                }
            }

            return null;
        })
        .filter((roleName): roleName is string => Boolean(roleName));
};

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const roleNames = extractRoleNames(auth.user?.roles);
    const isTeacher = roleNames.includes('Teacher');
    const isStudent = roleNames.includes('Student') || !isTeacher;
    const isDean = roleNames.includes('Dean');

    const mainNavItems: NavItem[] = [dashboardNavItem];

    if (isStudent) {
        mainNavItems.push({
            title: 'Thesis',
            href: ThesisTitleController.index(),
            icon: BookMarked,
        });
    }

    if (isTeacher) {
        mainNavItems.push({
            title: 'Advisees',
            href: ThesisTitleController.advisees(),
            icon: GraduationCap,
        });
    }

    const deanRoute = typeof ThesisTitleController.dean === 'function'
        ? ThesisTitleController.dean()
        : null;

    if (isDean && deanRoute) {
        mainNavItems.push({
            title: 'Thesis Deans',
            href: deanRoute,
            icon: Building2,
        });
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
