import { RefreshButton } from "@/components/ra-wrappers/refresh-button";
import { ThemeModeToggle } from "@/components/ra-wrappers/theme-mode-toggle";
import { UserMenu } from "@/components/ra-wrappers/user-menu";
import { useUserMenu } from "ra-core";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, Moon, Monitor, Settings, Sun, Users } from "lucide-react";
import { useTheme } from "@/components/ra-wrappers/theme-provider";
import { cn } from "@/lib/utils";
import { CanAccess } from "ra-core";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useAppBranding } from "../root/ConfigurationContext";
import { NotificationBell } from "@/components/NotificationBell";

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useAppBranding();
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
    <nav className="shrink-0">
      <header className="bg-secondary">
        <div className="px-4">
          <div className="flex justify-between items-center flex-1">
            <Link to="/" className="flex items-center gap-2 text-secondary-foreground no-underline">
              <img className="[.light_&]:hidden h-8" src={darkModeLogo} alt={title} />
              <div
                className="[.dark_&]:hidden h-8 w-32 bg-primary"
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
                <NavigationTab
                  label="Reports"
                  to="/reports"
                  isActive={currentPath === "/reports"}
                />
              </nav>
            </div>
            <div className="flex items-center">
              <ThemeModeToggle />
              <RefreshButton />
              <NotificationBell />
              <UserMenu>
                <ConfigurationMenu />
                <DropdownMenuSeparator />
                <ThemeMenu />
                <DropdownMenuSeparator />
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
    className={`px-1.5 lg:px-6 py-3 min-h-11 flex items-center text-xs md:text-sm font-medium transition-colors border-b-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
      isActive
        ? "text-secondary-foreground border-secondary-foreground"
        : "text-secondary-foreground border-transparent hover:text-secondary-foreground"
    }`}
  >
    {label}
  </Link>
);

const ThemeMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleSelect = (value: "light" | "dark" | "system") => {
    setTheme(value);
    onClose?.();
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun className="h-4 w-4 mr-2 dark:hidden" />
        <Moon className="h-4 w-4 mr-2 hidden dark:block" />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => handleSelect("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          <Check className={cn("ml-auto h-4 w-4", theme !== "light" && "opacity-0")} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          <Check className={cn("ml-auto h-4 w-4", theme !== "dark" && "opacity-0")} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === "system" && (
            <span className="ml-1 text-xs text-muted-foreground">({resolvedTheme})</span>
          )}
          <Check className={cn("ml-auto h-4 w-4", theme !== "system" && "opacity-0")} />
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

const UsersMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/admin/users" className="flex items-center gap-2">
        <Users className="h-4 w-4" /> Team Management
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
