import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { useUserMenu } from "@/hooks/user-menu-context";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Settings, User } from "lucide-react";
import { CanAccess } from "ra-core";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { NotificationBell } from "@/components/NotificationBell";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const location = useLocation();

  let currentPath: string | boolean = "/";
  if (matchPath("/", location.pathname)) {
    currentPath = "/";
  } else if (matchPath("/contacts/*", location.pathname)) {
    currentPath = "/contacts";
  } else if (matchPath("/organizations/*", location.pathname)) {
    currentPath = "/organizations";
  } else if (matchPath("/opportunities/*", location.pathname)) {
    currentPath = "/opportunities";
  } else if (matchPath("/products/*", location.pathname)) {
    currentPath = "/products";
  } else if (matchPath("/tasks/*", location.pathname)) {
    currentPath = "/tasks";
  } else if (matchPath("/reports/*", location.pathname)) {
    currentPath = "/reports";
  } else {
    currentPath = false;
  }

  return (
    <nav className="flex-grow">
      <header className="bg-secondary">
        <div className="px-4">
          <div className="flex justify-between items-center flex-1">
            <Link to="/" className="flex items-center gap-2 text-secondary-foreground no-underline">
              <img className="[.light_&]:hidden h-8" src={darkModeLogo} alt={title} />
              <div
                className="[.dark_&]:hidden h-8 w-32 bg-[var(--brand-700)]"
                style={{
                  WebkitMaskImage: `url(${lightModeLogo})`,
                  maskImage: `url(${lightModeLogo})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "left center",
                  maskPosition: "left center",
                }}
                aria-label={title}
              />
            </Link>
            <div>
              <nav className="flex items-center">
                <NavigationTab label="Dashboard" to="/" isActive={currentPath === "/"} />
                <NavigationTab
                  label="Contacts"
                  to="/contacts"
                  isActive={currentPath === "/contacts"}
                />
                <NavigationTab
                  label="Organizations"
                  to="/organizations"
                  isActive={currentPath === "/organizations"}
                />
                <NavigationTab
                  label="Opportunities"
                  to="/opportunities"
                  isActive={currentPath === "/opportunities"}
                />
                <NavigationTab
                  label="Products"
                  to="/products"
                  isActive={currentPath === "/products"}
                />
                <NavigationTab label="Tasks" to="/tasks" isActive={currentPath === "/tasks"} />
                <NavigationMenu className="relative">
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={`px-1.5 lg:px-6 py-3 text-xs md:text-sm font-medium transition-colors border-b-2 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent ${
                          currentPath === "/reports"
                            ? "text-secondary-foreground border-secondary-foreground"
                            : "text-secondary-foreground/70 border-transparent hover:text-secondary-foreground/80"
                        }`}
                      >
                        Reports
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="min-w-[200px]">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/reports/opportunities-by-principal"
                            className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            Opportunities by Principal
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/reports/weekly-activity"
                            className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            Weekly Activity Summary
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            to="/reports/campaign-activity"
                            className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            Campaign Activity Report
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </nav>
            </div>
            <div className="flex items-center">
              <ThemeModeToggle />
              <RefreshButton />
              <NotificationBell />
              <UserMenu>
                <ConfigurationMenu />
                <CanAccess resource="sales" action="list">
                  <UsersMenu />
                </CanAccess>
              </UserMenu>
            </div>
          </div>
        </div>
      </header>
    </nav>
  );
};

const NavigationTab = ({
  label,
  to,
  isActive,
}: {
  label: string;
  to: string;
  isActive: boolean;
}) => (
  <Link
    to={to}
    className={`px-1.5 lg:px-6 py-3 text-xs md:text-sm font-medium transition-colors border-b-2 ${
      isActive
        ? "text-secondary-foreground border-secondary-foreground"
        : "text-secondary-foreground/70 border-transparent hover:text-secondary-foreground/80"
    }`}
  >
    {label}
  </Link>
);

const UsersMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/sales" className="flex items-center gap-2">
        <User /> Users
      </Link>
    </DropdownMenuItem>
  );
};

const ConfigurationMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/settings" className="flex items-center gap-2">
        <Settings />
        My info
      </Link>
    </DropdownMenuItem>
  );
};
export default Header;
