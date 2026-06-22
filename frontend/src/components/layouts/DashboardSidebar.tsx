import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { MessageNotificationBadge } from '@/components/ui/message-notification-badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSidebar } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useGetMeQuery, useLogoutMutation } from '@/redux/features/auth/authApi';
import { logout } from '@/redux/features/auth/authSlice';
import { useGetMessageStatsQuery } from '@/redux/features/message/messageApi';
import { useAppDispatch } from '@/redux/hooks';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  DollarSign,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Star,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface NavItem {
  path: string;
  name: string;
  icon: React.ReactNode;
  badge?: number;
  description?: string;
  group: 'main' | 'content' | 'analytics' | 'settings';
}

interface LogoFallbackProps {
  className?: string;
}

const LogoFallback: React.FC<LogoFallbackProps> = ({ className }) => (
  <div className={cn('bg-brand-primary rounded-full flex items-center justify-center', className)}>
    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
    </svg>
  </div>
);

const DashboardSidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { collapsed, toggleCollapsed, sidebarWidth } = useSidebar();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const [signOut] = useLogoutMutation();

  // Enhanced message stats query with real-time updates and error handling
  // For messaging APIs, we need the User._id (not Teacher._id)
  // The Teacher document has a 'user' field that references the User._id
  const userId = userData?.data?.user?._id || userData?.data?._id;

  const { data: messageStats } = useGetMessageStatsQuery(
    { userId: userId || '', period: 'all' },
    {
      skip: !userId,
      // Enhanced real-time configuration
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      // Polling for real-time updates (every 30 seconds)
      pollingInterval: 30000,
    }
  );

  // Close popover when sheet is closed
  useEffect(() => {
    if (!open) {
      setPopoverOpen(false);
    }
  }, [open]);

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await signOut(undefined).unwrap();
      dispatch(logout());
      navigate('/login', { replace: true });
      toast.success('Logged out successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred during logout';

      console.error('Logout error:', error);
      toast.error(`Logout failed: ${errorMessage}`);
    }
  }, [signOut, dispatch, navigate]);

  const navItems: NavItem[] = useMemo(
    () => [
      // Main Navigation
      {
        path: '/teacher/dashboard',
        name: 'Dashboard',
        icon: <LayoutDashboard className="sidebar-nav-icon" />,
        description: 'Overview and analytics',
        group: 'main',
      },
      {
        path: '/teacher/analytics',
        name: 'Analytics',
        icon: <BarChart3 className="sidebar-nav-icon" />,
        description: 'Performance insights',
        group: 'analytics',
      },

      // Content Management
      {
        path: '/teacher/courses',
        name: 'Courses',
        icon: <BookOpen className="sidebar-nav-icon" />,
        description: 'Manage courses & lectures',
        group: 'content',
      },

      // Student Management
      {
        path: '/teacher/students',
        name: 'Students',
        icon: <Users className="sidebar-nav-icon" />,
        description: 'Student management',
        group: 'main',
      },
      {
        path: '/teacher/reviews',
        name: 'Reviews',
        icon: <Star className="sidebar-nav-icon" />,
        description: 'Course reviews',
        group: 'analytics',
      },

      // Financial
      {
        path: '/teacher/earnings',
        name: 'Earnings',
        icon: <DollarSign className="sidebar-nav-icon" />,
        description: 'Revenue and payouts',
        group: 'analytics',
      },

      // Communication
      {
        path: '/teacher/messages',
        name: 'Messages',
        icon: <MessageSquare className="sidebar-nav-icon" />,
        badge: messageStats?.data?.unreadMessages || 0,
        description: 'Student communications',
        group: 'main',
      },

      // Settings
      {
        path: '/teacher/settings',
        name: 'Settings',
        icon: <Settings className="sidebar-nav-icon" />,
        description: 'Account settings',
        group: 'settings',
      },
      {
        path: '/teacher/help-support',
        name: 'Help & Support',
        icon: <HelpCircle className="sidebar-nav-icon" />,
        description: 'Get assistance',
        group: 'settings',
      },
    ],
    [messageStats?.data?.unreadMessages]
  );

  // Filter navigation items based on search
  const filteredNavItems = useMemo(() => {
    if (!searchQuery) return navItems;
    return navItems.filter(
      item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, navItems]);

  // Group navigation items
  const groupedNavItems = useMemo(() => {
    const groups = {
      main: filteredNavItems.filter(item => item.group === 'main'),
      content: filteredNavItems.filter(item => item.group === 'content'),
      analytics: filteredNavItems.filter(item => item.group === 'analytics'),
      settings: filteredNavItems.filter(item => item.group === 'settings'),
    };
    return groups;
  }, [filteredNavItems]);

  const renderNavGroup = (title: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        {!collapsed && (
          <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {title}
          </h3>
        )}
        <nav className="space-y-1">
          {items.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={e => {
                  // Provide immediate visual feedback
                  const target = e.currentTarget;
                  target.style.transform = 'scale(0.98)';
                  setTimeout(() => {
                    target.style.transform = '';
                  }, 100);

                  // Close mobile menu
                  if (isMobile) {
                    setOpen(false);
                  }
                }}
                className={cn(
                  'sidebar-nav-item group relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-white',
                  isActive && 'active',
                  collapsed && 'justify-center px-2 min-h-[44px]'
                )}
                title={collapsed ? item.name : undefined}
                aria-label={`Navigate to ${item.name}${
                  item.description ? `: ${item.description}` : ''
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative transform transition-transform duration-200 group-hover:scale-110">
                  {item.icon}
                  {item.badge !== undefined && (
                    <MessageNotificationBadge
                      count={item.badge}
                      isCollapsed={collapsed}
                      size="md"
                      variant="compact"
                      ariaLabel={`${item.badge} unread messages in ${item.name}`}
                    />
                  )}
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge !== undefined && (
                      <MessageNotificationBadge
                        count={item.badge}
                        isCollapsed={false}
                        size="md"
                        variant="default"
                        ariaLabel={`${item.badge} unread messages in ${item.name}`}
                      />
                    )}
                  </>
                )}

                {/* Modern tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-gray-700">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-gray-300 text-xs mt-1">{item.description}</div>
                    )}
                    {/* Tooltip arrow */}
                    <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 border-l border-b border-gray-700 rotate-45"></div>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
    );
  };

  const handleLogoError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>): void => {
      try {
        const target = e.target as HTMLImageElement;
        setLogoError(true);

        // Log error for debugging but don't show to user
        console.warn('Logo failed to load, using fallback');

        // Hide the failed image
        target.style.display = 'none';
      } catch (error) {
        console.error('Error handling logo fallback:', error);
      }
    },
    [setLogoError]
  );

  const SidebarContent = () => (
    <div
      className="flex flex-col h-full bg-white border-r border-gray-200"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Skip navigation link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Header with improved responsive design and clickable branding */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[73px]"
        role="banner"
      >
        {!collapsed && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 flex-1 hover:bg-brand-accent/50 rounded-lg p-2 -m-2 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
            title="Go to Home"
            aria-label="Navigate to Green Uni Mind homepage"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 overflow-hidden transform group-hover:scale-105">
              {!logoError ? (
                <img
                  src="/images/logo.png"
                  alt="Green Uni Mind Logo"
                  className="w-full h-full object-cover rounded-lg transition-transform duration-200 group-hover:scale-110"
                  onError={handleLogoError}
                />
              ) : (
                <LogoFallback className="w-full h-full rounded-lg transition-transform duration-200 group-hover:scale-110" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-lg font-bold text-brand-text-primary leading-tight group-hover:text-brand-primary transition-colors truncate">
                Green Uni Mind
              </h2>
              <p className="text-xs text-brand-primary font-medium opacity-80 group-hover:opacity-100 transition-opacity truncate">
                Learn Green. Live Better.
              </p>
            </div>
          </button>
        )}

        {/* Collapsed state logo */}
        {collapsed && (
          <div className="w-full flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center hover:bg-brand-accent/50 rounded-lg p-2 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              title="Go to Home - Green Uni Mind"
              aria-label="Navigate to Green Uni Mind homepage"
            >
              {!logoError ? (
                <img
                  src="/images/logo.png"
                  alt="Green Uni Mind Logo"
                  className="w-8 h-8 rounded-full object-cover shadow-sm group-hover:shadow-md transition-all duration-200 transform group-hover:scale-110"
                  onError={handleLogoError}
                />
              ) : (
                <LogoFallback className="w-8 h-8 shadow-sm group-hover:shadow-md transition-all duration-200 transform group-hover:scale-110" />
              )}
            </button>
          </div>
        )}

        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className="p-2 h-auto hover:bg-brand-accent transition-all duration-200 ml-2 focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 group"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-primary transition-colors" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-primary transition-colors" />
            )}
          </Button>
        )}
      </div>

      {/* Enhanced Search */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
            <Input
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-gray-300 focus:border-brand-primary focus:ring-brand-primary transition-all duration-200"
              aria-label="Search navigation items"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-4" role="navigation" aria-label="Main navigation menu">
        {renderNavGroup('Main', groupedNavItems.main)}
        {renderNavGroup('Content', groupedNavItems.content)}
        {renderNavGroup('Analytics', groupedNavItems.analytics)}
        {renderNavGroup('Settings', groupedNavItems.settings)}
      </div>
      {/* User Profile Section */}
      <div
        className="border-t border-gray-200 p-4"
        role="region"
        aria-label="User profile and settings"
      >
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start p-2 h-auto hover:bg-gray-50 transition-all duration-200 focus:ring-2 focus:ring-brand-primary focus:ring-offset-2',
                collapsed && 'justify-center min-h-[44px]'
              )}
              aria-label={
                collapsed
                  ? 'User menu'
                  : `User menu for ${userData?.data?.name?.firstName || 'User'}`
              }
            >
              <div className="flex items-center gap-3">
                {isUserLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : (
                  <Avatar className="h-8 w-8 border-2 border-lms-primary">
                    <AvatarImage
                      src={userData?.data?.profileImg || userData?.data?.photoUrl}
                      alt={userData?.data?.name?.firstName || 'User'}
                    />
                    <AvatarFallback className="bg-lms-primary text-white text-sm font-semibold">
                      {userData?.data?.name?.firstName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                {!collapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium text-gray-900 text-sm">
                      {userData?.data?.name?.firstName || 'User'}{' '}
                      {userData?.data?.name?.lastName || ''}
                    </div>
                    <div className="text-xs text-gray-500">Teacher</div>
                  </div>
                )}
                {!collapsed && (
                  <div className="flex items-center gap-1">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <ChevronsUpDown className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-0"
            align="start"
            side="top"
            role="menu"
            aria-label="User menu options"
          >
            <Command>
              <CommandList role="group">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={userData?.data?.profileImg || userData?.data?.photoUrl}
                        alt={userData?.data?.name?.firstName || 'User'}
                      />
                      <AvatarFallback className="bg-lms-primary text-white">
                        {userData?.data?.name?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-gray-900">
                        {userData?.data?.name?.firstName || 'User'}{' '}
                        {userData?.data?.name?.lastName || ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {userData?.data?.email || 'teacher@example.com'}
                      </div>
                    </div>
                  </div>
                </div>

                <CommandGroup heading="Account">
                  <CommandItem
                    onSelect={() => {
                      navigate('/teacher/settings');
                      setPopoverOpen(false);
                      if (isMobile) setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      navigate('/teacher/notifications');
                      setPopoverOpen(false);
                      if (isMobile) setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      handleLogout();
                      if (isMobile) setOpen(false);
                    }}
                    className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    role="menuitem"
                    aria-label="Sign out of your account"
                  >
                    <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                    <span>Sign Out</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  // Mobile sidebar with enhanced responsiveness
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button - positioned for optimal accessibility */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <Sheet
            open={open}
            onOpenChange={isOpen => {
              setOpen(isOpen);
              if (!isOpen) {
                setPopoverOpen(false);
                setSearchQuery('');
              }
            }}
          >
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/95 backdrop-blur-sm shadow-lg border-gray-200 hover:bg-brand-accent hover:border-brand-primary transition-all duration-200 h-12 w-12 focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5 text-brand-text-primary" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="p-0 w-[280px] sm:w-[320px] border-r-brand-primary/20 bg-white"
              onInteractOutside={() => setOpen(false)}
              onEscapeKeyDown={() => setOpen(false)}
              aria-label="Navigation menu"
            >
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </>
    );
  }

  // Desktop sidebar with modern enterprise design
  return (
    <aside
      className={cn(
        'bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-20 sidebar-transition',
        'hidden md:block', // Hidden on mobile, visible on tablet and desktop
        'overflow-hidden shadow-lg backdrop-blur-sm'
      )}
      style={
        {
          width: sidebarWidth,
          '--sidebar-width': sidebarWidth,
        } as React.CSSProperties
      }
      role="navigation"
      aria-label="Main navigation sidebar"
    >
      <SidebarContent />
    </aside>
  );
};

export default DashboardSidebar;
