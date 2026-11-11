import { createContext, useContext } from "react";

/**
 * Lets a dashboard page title open the sidebar, which on smaller screens
 * is a drawer owned by the dashboard layout. Null when there is no sidebar
 * (basic mode).
 */
export const ProfileSidebarContext = createContext<{
  openSidebar: () => void;
} | null>(null);

export const useProfileSidebar = () => useContext(ProfileSidebarContext);
