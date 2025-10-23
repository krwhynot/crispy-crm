import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { useUserMenu } from "@/hooks/user-menu-context";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Settings, User } from "lucide-react";
import { CanAccess } from "ra-core";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useConfigurationContext } from "../root/ConfigurationContext";

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
  } else {
    currentPath = false;
  }

  return (
    <nav className="flex-grow">
      <header className="bg-secondary">
        <div className="px-4">
          <div className="flex justify-between items-center flex-1">
            <Link
              to="/"
              className="flex items-center gap-2 text-secondary-foreground no-underline"
            >
              <img
                className="[.light_&]:hidden h-8"
                src={darkModeLogo}
                alt={title}
              />
              <img
                className="[.dark_&]:hidden h-8 [filter:invert(27%)_sepia(44%)_saturate(1247%)_hue-rotate(94deg)_brightness(96%)_contrast(101%)]"
                src={lightModeLogo}
                alt={title}
              />
            </Link>
            <div>
              <nav className="flex">
                <NavigationTab
                  label="Dashboard"
                  to="/"
                  isActive={currentPath === "/"}
                />
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
              </nav>
            </div>
            <div className="flex items-center">
              <ThemeModeToggle />
              <RefreshButton />
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
    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
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
