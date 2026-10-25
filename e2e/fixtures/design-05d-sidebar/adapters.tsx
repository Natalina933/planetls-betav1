import React, { createContext, useContext } from "react";

export const NavigationContext = createContext({ path: "/dashboard/concierge", navigate: (_path: string) => {} });
export const usePathname = () => useContext(NavigationContext).path.split("?")[0];
export const useSearchParams = () => new URLSearchParams(useContext(NavigationContext).path.split("?")[1]);
export const useUserType = () => ({ userType: "concierge" });
export const useTheme = () => ({ theme: "mucha-dark" });

export function Link({ href, onClick, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useContext(NavigationContext);
  return <a {...props} href={href} onClick={event => {
    event.preventDefault();
    onClick?.(event);
    if (href?.startsWith("/dashboard/concierge")) navigate(href);
  }}>{children}</a>;
}

export function Image({ priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) {
  // La recette conserve le PNG local sans passer par un optimiseur réseau.
  return <img {...props} />;
}
