import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
};

type RevealStyle = CSSProperties & {
  "--reveal-delay"?: string;
};

const AUTO_REVEAL_SELECTOR =
  "main section:not(.scroll-reveal), main article:not(.scroll-reveal), main form:not(.scroll-reveal), main table:not(.scroll-reveal), main > div > .grid > *:not(.scroll-reveal)";

export function ScrollReveal({
  children,
  className,
  delay = 0,
  once = true,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setRevealed(true);
        if (once) observer.unobserve(element);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once]);

  const style: RevealStyle = { "--reveal-delay": `${delay}ms` };

  return (
    <div ref={elementRef} className={cn("scroll-reveal", revealed && "is-revealed", className)} style={style}>
      {children}
    </div>
  );
}

export function ScrollRevealObserver({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = reducedMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              entry.target.classList.toggle("is-revealed", entry.isIntersecting);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
        );

    const observeTargets = () => {
      root.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR).forEach((element, index) => {
        if (element.dataset["scrollRevealObserved"]) return;
        element.dataset["scrollRevealObserved"] = "true";
        element.classList.add("scroll-reveal");
        element.style.setProperty("--reveal-delay", `${(index % 5) * 40}ms`);

        if (reducedMotion || !observer) {
          element.classList.add("is-revealed");
        } else {
          observer.observe(element);
        }
      });
    };

    observeTargets();
    const mutationObserver = new MutationObserver(observeTargets);
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer?.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="scroll-reveal-root">
      {children}
    </div>
  );
}
