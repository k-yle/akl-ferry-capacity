import { forwardRef } from "react";
import { Link } from "react-router-dom";

type LinkPropsWithHref = Omit<React.ComponentProps<typeof Link>, "to"> & {
  href: string;
};

export const MuiLink = forwardRef<HTMLAnchorElement, LinkPropsWithHref>(
  ({ href, ...props }, ref) => <Link to={href} ref={ref} {...props} />
);

MuiLink.displayName = "MuiLink";
