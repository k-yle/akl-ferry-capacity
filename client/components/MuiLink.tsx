import { Link } from "react-router-dom";

type LinkPropsWithHref = Omit<React.ComponentProps<typeof Link>, "to"> & {
  href: string;
};

export const MuiLink: React.FC<LinkPropsWithHref> = ({ href, ...props }) => (
  <Link to={href} {...props} />
);
