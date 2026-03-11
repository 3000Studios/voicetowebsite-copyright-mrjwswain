import React, { useEffect, useRef, useState } from "react";

type RevealVariant = "fade" | "up" | "blur";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  delayMs?: number;
  variant?: RevealVariant;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  as = "div",
  children,
  className = "",
  delayMs = 0,
  style,
  variant = "up",
  ...rest
}) => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const Component = as as React.ElementType;

  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      className={`vtw-reveal ${isVisible ? "is-visible" : ""} ${className}`.trim()}
      data-reveal-variant={variant}
      style={{
        ...style,
        transitionDelay: `${delayMs}ms`,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default ScrollReveal;
