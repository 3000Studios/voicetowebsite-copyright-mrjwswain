export interface NavigationItem {
  href: string;
  label: string;
}

export const SHARED_NAV_ITEMS: NavigationItem[] = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Examples" },
  { href: "/api-documentation", label: "API" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];
