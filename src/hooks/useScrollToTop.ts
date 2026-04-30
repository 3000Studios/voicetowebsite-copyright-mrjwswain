import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook to scroll to top on route change
 * This fixes the issue where clicking a link from the footer
 * keeps the page scrolled down instead of jumping to top
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Smooth scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
}

/**
 * Component version for use in Router
 */
export function ScrollToTop() {
  useScrollToTop();
  return null;
}
