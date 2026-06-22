export type TDashboardNavMenuItem = {
  title: string;
  url?: string;
  items?: TDashboardNavMenuItem[];
};

export type TDashboardNavMenu = {
  versions?: string[];
  navMain: TDashboardNavMenuItem[];
};

export const teacherMenu: TDashboardNavMenu = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          url: "/teacher/dashboard",
        },
        {
          title: "Analytics",
          url: "/teacher/analytics",
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          title: "Courses",
          url: "/teacher/courses",
        },
        {
          title: "Create Course",
          url: "/teacher/courses/create",
        },
        {
          title: "Students",
          url: "/teacher/students",
        },
      ],
    },
    {
      title: "Financial",
      items: [
        {
          title: "Earnings",
          url: "/teacher/earnings",
        },
        {
          title: "Payouts",
          url: "/teacher/payouts",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "Profile",
          url: "/teacher/profile",
        },
        {
          title: "Account",
          url: "/teacher/settings",
        },
      ],
    },
  ],
};

export const studentMenu = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
  ],
};
