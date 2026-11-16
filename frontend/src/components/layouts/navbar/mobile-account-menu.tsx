import { useRef, useState } from "react";
import { useAuth } from "@/app/providers/auth-provider";
import { HankoAuthComponent } from "@/components/layouts/navbar/hanko-auth";
import { Avatar } from "@/components/ui/avatar/avatar";
import { ChevronDownIcon } from "@/components/ui/icons";
import { AUTH_PROVIDER, HANKO_URL } from "@/config";
import { cn } from "@/utils";

const IS_HANKO_AUTH = AUTH_PROVIDER === "hanko";

type HotosmAuthElement = HTMLElement & { handleLogout?: () => Promise<void> };

/**
 * Signed-in account section of the mobile menu: the user's avatar and email,
 * which open "My HOT Account" and "Log Out".
 */
export const MobileAccountMenu = ({
  returnTo,
  onNavigate,
}: {
  /** Where the HOT sign-in component returns to after signing in. */
  returnTo: string;
  /** Called after an action, e.g. to close the menu. */
  onNavigate?: () => void;
}) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const hankoRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    if (IS_HANKO_AUTH) {
      // The HOT sign-in component ends the HOT session (not just fAIr's) and
      // redirects home afterwards.
      const auth = hankoRef.current?.querySelector(
        "hotosm-auth",
      ) as HotosmAuthElement | null;
      await auth?.handleLogout?.();
    }
    logout();
    onNavigate?.();
  };

  const label = user?.email || user?.username;

  return (
    <div className="flex w-full flex-col items-center gap-5 px-[var(--body-spacing)]">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        className="flex max-w-full items-center gap-3 text-lg text-dark"
      >
        <Avatar
          label={user?.username}
          imageUrl={user?.img_url}
          size="40px"
          className="shrink-0"
        />
        <span className="truncate">{label}</span>
        <ChevronDownIcon
          className={cn(
            "h-2.5 w-4 shrink-0 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <>
          {IS_HANKO_AUTH && (
            <a
              href={`${HANKO_URL}/app`}
              className="text-lg text-dark hover:text-primary"
            >
              My HOT Account
            </a>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="text-lg text-primary"
          >
            Log Out
          </button>
        </>
      )}

      {/* Hidden: provides the HOT sign-out used by Log Out. */}
      {IS_HANKO_AUTH && (
        <div ref={hankoRef} hidden>
          <HankoAuthComponent redirectAfterLogin={returnTo} />
        </div>
      )}
    </div>
  );
};
