/**
 * Drawer Navigation Configuration (2026 – Stack-based)
 * ✅ CORRECT: Drawer menu references STACKS, not individual screens
 * Role-based drawer menu for 4-tier hierarchy
 *
 * Hierarchy:
 * SUPER_ADMIN → SUPER → DISTRIBUTOR → RETAILER
 *
 * Mental Model:
 * - Drawer = Building directory (top-level sections)
 * - Stack = Floors inside building (screens within a section)
 */

import { UserRole } from "../api/types";
import { StackNames, type StackName } from "./types";

/* =====================================================
   DrawerSection Type (Stack-based)
   ===================================================== */
export type AppDrawerSection =
  | { type: "header"; title: string }
  | { type: "divider" }
  | {
      type: "item";
      label: string;
      icon: string;
      route: StackName;
      action?: never;
    }
  | {
      type: "item";
      label: string;
      icon: string;
      action: "logout";
      route?: never;
    };

/* =====================================================
   Public API
   ===================================================== */
export const getDrawerSections = (role: UserRole): AppDrawerSection[] => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return superAdminSections();
    case UserRole.SUPER:
      return superSections();
    case UserRole.DISTRIBUTOR:
      return distributorSections();
    case UserRole.RETAILER:
    default:
      return retailerSections();
  }
};

/* =====================================================
   SUPER ADMIN
   ===================================================== */
const superAdminSections = (): AppDrawerSection[] => [
  { type: "header", title: "Super Admin" },

  {
    type: "item",
    label: "Dashboard",
    icon: "view-dashboard",
    route: StackNames.Dashboard,
  },
  {
    type: "item",
    label: "Orders",
    icon: "clipboard-list",
    route: StackNames.Orders,
  },
  {
    type: "item",
    label: "Users",
    icon: "account-group",
    route: StackNames.Users,
  },
  {
    type: "item",
    label: "Companies",
    icon: "office-building",
    route: StackNames.Companies,
  },

  { type: "divider" },
  { type: "header", title: "System" },

  {
    type: "item",
    label: "System",
    icon: "cog",
    route: StackNames.System,
  },

  { type: "divider" },

  {
    type: "item",
    label: "Profile",
    icon: "account",
    route: StackNames.Profile,
  },
  {
    type: "item",
    label: "Logout",
    icon: "logout",
    action: "logout",
  },
];

/* =====================================================
   SUPER (Top-level Distributor)
   ===================================================== */
const superSections = (): AppDrawerSection[] => [
  { type: "header", title: "SUPER Distributor" },

  {
    type: "item",
    label: "Dashboard",
    icon: "view-dashboard",
    route: StackNames.Dashboard,
  },
  {
    type: "item",
    label: "Users",
    icon: "account-group",
    route: StackNames.Users,
  },
  {
    type: "item",
    label: "Clients",
    icon: "account",
    route: StackNames.Clients,
  },
  {
    type: "item",
    label: "Reports",
    icon: "chart-line",
    route: StackNames.Reports,
  },

  { type: "divider" },
  { type: "header", title: "Management" },

  {
    type: "item",
    label: "Orders",
    icon: "package-variant",
    route: StackNames.Orders,
  },

  { type: "divider" },

  {
    type: "item",
    label: "Profile",
    icon: "account",
    route: StackNames.Profile,
  },
  {
    type: "item",
    label: "Logout",
    icon: "logout",
    action: "logout",
  },
];

/* =====================================================
   DISTRIBUTOR
   ===================================================== */
const distributorSections = (): AppDrawerSection[] => [
  { type: "header", title: "Distributor" },

  {
    type: "item",
    label: "Dashboard",
    icon: "view-dashboard",
    route: StackNames.Dashboard,
  },
  {
    type: "item",
    label: "Retailers",
    icon: "account-tie",
    route: StackNames.Users,
  },
  {
    type: "item",
    label: "Clients",
    icon: "account",
    route: StackNames.Clients,
  },
  {
    type: "item",
    label: "Reports",
    icon: "chart-line",
    route: StackNames.Reports,
  },

  { type: "divider" },
  { type: "header", title: "Management" },

  {
    type: "item",
    label: "Orders",
    icon: "wallet",
    route: StackNames.Orders,
  },

  { type: "divider" },

  {
    type: "item",
    label: "Profile",
    icon: "account",
    route: StackNames.Profile,
  },
  {
    type: "item",
    label: "Logout",
    icon: "logout",
    action: "logout",
  },
];

/* =====================================================
   RETAILER
   ===================================================== */
const retailerSections = (): AppDrawerSection[] => [
  { type: "header", title: "Retailer" },

  {
    type: "item",
    label: "Dashboard",
    icon: "view-dashboard",
    route: StackNames.Dashboard,
  },
  {
    type: "item",
    label: "My Clients",
    icon: "account-group",
    route: StackNames.Clients,
  },
  {
    type: "item",
    label: "Reports",
    icon: "chart-line",
    route: StackNames.Reports,
  },

  { type: "divider" },
  { type: "header", title: "Management" },

  {
    type: "item",
    label: "Orders",
    icon: "wallet",
    route: StackNames.Orders,
  },

  { type: "divider" },

  {
    type: "item",
    label: "Profile",
    icon: "account",
    route: StackNames.Profile,
  },
  {
    type: "item",
    label: "Logout",
    icon: "logout",
    action: "logout",
  },
];

/* =====================================================
   Role Display Name
   ===================================================== */
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return "Super Admin";
    case UserRole.SUPER:
      return "SUPER Distributor";
    case UserRole.DISTRIBUTOR:
      return "Distributor";
    case UserRole.RETAILER:
      return "Retailer";
    default:
      return "User";
  }
};
