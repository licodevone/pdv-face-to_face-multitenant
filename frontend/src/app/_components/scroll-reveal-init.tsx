"use client";

import { useEffect } from "react";

export function ScrollRevealInit() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("fd-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.8, rootMargin: "0px 0px -32px 0px" },
    );

    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
