import { CSSProperties, Fragment, useEffect, useRef, useState } from "react";

/* ---------- helpers ---------- */

export function safeStorage(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function useMedia(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)");

function useInViewOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

/* ---------- entrance reveals (one-shot) ---------- */

/** Adds `.in` once to every [data-reveal], [data-words] and [data-line] when it enters the viewport. */
export function useRevealObserver(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal], [data-words], [data-line]"),
    );

    // Stagger siblings that share a parent (80ms steps, capped).
    const groups = new Map<Element, HTMLElement[]>();
    nodes
      .filter((node) => node.hasAttribute("data-reveal"))
      .forEach((node) => {
        const parent = node.parentElement as Element;
        groups.set(parent, [...(groups.get(parent) ?? []), node]);
      });
    groups.forEach((items) =>
      items.forEach((node, index) => {
        const base = Number(node.dataset.delay ?? 0);
        node.style.setProperty("--reveal-delay", `${base + Math.min(index, 5) * 80}ms`);
      }),
    );

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [enabled]);
}

/** Headline split into words; the last line takes the accent colour. */
export function Headline({
  as: Tag = "h2",
  lines,
  className,
  id,
}: {
  as?: "h1" | "h2";
  lines: [string, string];
  className?: string;
  id?: string;
}) {
  let index = 0;
  const words = (text: string) =>
    text.split(" ").map((word, i, all) => (
      <Fragment key={`${word}-${i}`}>
        <span className="word" style={{ "--w": index++ } as CSSProperties}>
          {word}
        </span>
        {i < all.length - 1 ? " " : null}
      </Fragment>
    ));
  return (
    <Tag className={className} id={id} data-words>
      {words(lines[0])}
      <span className="accent-line">{words(lines[1])}</span>
    </Tag>
  );
}

/* ---------- typewriter / counters ---------- */

export function Typewriter({
  text,
  start,
  delay = 0,
  speed = 36,
}: {
  text: string;
  start: boolean;
  delay?: number;
  speed?: number;
}) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (reduced) {
      setCount(text.length);
      return;
    }
    let timer = 0;
    const begin = window.setTimeout(() => {
      let i = 0;
      timer = window.setInterval(() => {
        i += 1;
        setCount(i);
        if (i >= text.length) window.clearInterval(timer);
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(begin);
      window.clearInterval(timer);
    };
  }, [start, reduced, text, delay, speed]);
  return (
    <span aria-label={text}>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      <span aria-hidden="true" className="type-rest">
        {text.slice(count)}
      </span>
    </span>
  );
}

/** Counts the first real number found in `text` from 0 to its value; placeholders such as "XX%" stay untouched. */
export function CountUp({ text, duration = 800 }: { text: string; duration?: number }) {
  const reduced = useReducedMotion();
  const [ref, seen] = useInViewOnce<HTMLSpanElement>();
  const match = text.match(/\d+(?:[.,]\d+)?(?![\dxX])/);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!match || !seen) return;
    if (reduced) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, reduced, duration, match?.[0]]);

  if (!match || match.index === undefined) return <span ref={ref}>{text}</span>;
  const raw = match[0];
  const decimals = raw.includes(",") || raw.includes(".") ? raw.split(/[.,]/)[1].length : 0;
  const separator = raw.includes(",") ? "," : ".";
  const value = Number(raw.replace(",", ".")) * progress;
  const shown = value.toFixed(decimals).replace(".", separator);
  return (
    <span ref={ref} className="count">
      {text.slice(0, match.index)}
      {shown}
      {text.slice(match.index + raw.length)}
    </span>
  );
}

/* ---------- scroll-linked layers ---------- */

export function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="scroll-progress" aria-hidden="true">
      <span ref={bar} />
    </div>
  );
}

export function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <a className={`back-to-top ${visible ? "visible" : ""}`} href="#inicio" aria-label={label}>
      ↑
    </a>
  );
}

/** Dot grid + soft halo of the hero, drifting slower than the page (parallax). */
export function HeroDecoration() {
  const grid = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.min(window.scrollY, 1400);
      if (grid.current) grid.current.style.transform = `translate3d(0, ${y * 0.1}px, 0)`;
      if (halo.current) halo.current.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      if (grid.current) grid.current.style.transform = "";
      if (halo.current) halo.current.style.transform = "";
    };
  }, [reduced]);
  return (
    <div className="hero-decoration" aria-hidden="true">
      <div className="dot-grid" ref={grid} />
      <div className="blue-halo" ref={halo} />
    </div>
  );
}

const floaters: {
  label: string;
  top: string;
  left?: string;
  right?: string;
  duration: string;
  delay: string;
}[] = [
  { label: "Docker", top: "17%", left: "8%", duration: "7s", delay: "-1s" },
  { label: "Linux", top: "15%", left: "36%", duration: "9s", delay: "-4s" },
  { label: "Node.js", top: "12%", right: "21%", duration: "6.5s", delay: "-2.5s" },
  { label: "Python", top: "26%", right: "6%", duration: "8s", delay: "-6s" },
  { label: "Kubernetes", top: "46%", right: "3%", duration: "7.5s", delay: "-3.5s" },
];

/** Chips drifting behind the headline; paused while the hero is off screen. */
export function HeroFloaters() {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`hero-floaters ${paused ? "paused" : ""}`} ref={ref} aria-hidden="true">
      {floaters.map((item, index) => (
        <span
          className="chip float-chip"
          key={index}
          style={
            {
              top: item.top,
              left: item.left,
              right: item.right,
              "--float-duration": item.duration,
              "--float-delay": item.delay,
            } as CSSProperties
          }
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

/* ---------- side section indicator ---------- */

export const sideSections = [
  { id: "perfil", number: "01", label: "Perfil", labelEn: "Profile" },
  { id: "herramientas", number: "02", label: "Herramientas", labelEn: "Tools" },
  { id: "formacion", number: "03", label: "Formación", labelEn: "Education" },
  { id: "proyecto", number: "04", label: "Proyectos", labelEn: "Projects" },
  { id: "contacto", number: "05", label: "Contacto", labelEn: "Contact" },
];

/**
 * Active section = the last one (in sideSections order) whose top has passed the reading line
 * (35% of the viewport). The hero highlights nothing; the bottom of the page means the last section.
 * Used by the top navigation and by the side dots so both stay in sync.
 */
export function findActiveSection(): string | null {
  const line = Math.max(140, window.innerHeight * 0.35);
  let current: string | null = null;
  for (const { id } of sideSections) {
    const element = document.getElementById(id);
    if (element && element.getBoundingClientRect().top <= line) current = id;
  }
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  return atBottom ? sideSections[sideSections.length - 1].id : current;
}

export function SideDots({ language }: { language: "ES" | "EN" }) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setActive(findActiveSection());
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <nav className="side-dots" aria-label={language === "ES" ? "Secciones" : "Sections"}>
      {sideSections.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={active === item.id ? "active" : ""}
          aria-label={language === "ES" ? item.label : item.labelEn}
        >
          <span className="side-label">
            {item.number} {language === "ES" ? item.label : item.labelEn}
          </span>
          <span className="side-dot" />
        </a>
      ))}
    </nav>
  );
}

/* ---------- marquee ---------- */

const marqueeItems = [
  "Python",
  "Java",
  "SQL",
  "C++",
  "Node.js",
  "Socket.io",
  "APIs REST",
  "Linux",
  "Docker",
  "Kubernetes",
  "Git",
  "GitHub",
  "TCP/IP",
  "Nginx",
  "Apache",
  "Zabbix",
  "JavaScript",
  "HTML/CSS",
  "PHP",
  "Flutter",
  "Dart",
  "Figma",
];

export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((group) => (
          <div className="marquee-group" key={group}>
            {marqueeItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- footer clock ---------- */

const madridTime = new Intl.DateTimeFormat("es-ES", {
  timeZone: "Europe/Madrid",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Live 24h clock in Europe/Madrid, refreshed every minute. Timers are cleared on unmount. */
export function LocalTime({ language: _language }: { language: "ES" | "EN" }) {
  const [time, setTime] = useState(() => madridTime.format(new Date()));
  useEffect(() => {
    let interval = 0;
    const update = () => setTime(madridTime.format(new Date()));
    update();
    // Align the first refresh with the next minute change, then tick every 60s.
    const align = window.setTimeout(
      () => {
        update();
        interval = window.setInterval(update, 60000);
      },
      60000 - (Date.now() % 60000) + 50,
    );
    return () => {
      window.clearTimeout(align);
      window.clearInterval(interval);
    };
  }, []);
  return (
    <span className="local-time">
      GRANADA · <time>{time}</time>
    </span>
  );
}

/* ---------- pointer effects: cursor halo, spotlight, tilt, magnetic ---------- */

const INTERACTIVE = 'a, button, input, textarea, label, [role="button"]';

export function PointerEffects() {
  const finePointer = useMedia("(hover: hover) and (pointer: fine)");
  const wide = useMedia("(min-width: 761px)");
  const reduced = useReducedMotion();
  const halo = useRef<HTMLDivElement>(null);
  const desktop = finePointer && wide;
  const motion = desktop && !reduced;

  // Spotlight: radial glow that follows the cursor inside a card.
  useEffect(() => {
    if (!finePointer) return;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const card = (event.target as Element | null)?.closest<HTMLElement>("[data-spotlight]");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => document.removeEventListener("pointermove", onMove);
  }, [finePointer]);

  // Tilt (max 4deg) and magnetic buttons (max 8px).
  useEffect(() => {
    if (!motion) return;
    let tilted: HTMLElement | null = null;
    const resetTilt = () => {
      if (!tilted) return;
      tilted.style.setProperty("--rx", "0deg");
      tilted.style.setProperty("--ry", "0deg");
      tilted = null;
    };
    const resetMagnets = () =>
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
      });
    const clamp = (value: number) => Math.max(-8, Math.min(8, value));

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const card = (event.target as Element | null)?.closest<HTMLElement>("[data-tilt]") ?? null;
      if (tilted && tilted !== card) resetTilt();
      if (card) {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
        card.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
        tilted = card;
      }

      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const reach = 36;
        const near =
          event.clientX > rect.left - reach &&
          event.clientX < rect.right + reach &&
          event.clientY > rect.top - reach &&
          event.clientY < rect.bottom + reach;
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.setProperty("--tx", near ? `${clamp(dx * 0.18)}px` : "0px");
        el.style.setProperty("--ty", near ? `${clamp(dy * 0.18)}px` : "0px");
      });
    };
    const onLeave = () => {
      resetTilt();
      resetMagnets();
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      onLeave();
    };
  }, [motion]);

  // Cursor halo with soft lag.
  useEffect(() => {
    const node = halo.current;
    if (!motion || !node) return;
    let x = -100;
    let y = -100;
    let targetX = -100;
    let targetY = -100;
    let raf = 0;
    const tick = () => {
      x += (targetX - x) * 0.16;
      y += (targetY - y) * 0.16;
      node.style.transform = `translate3d(${x - 20}px, ${y - 20}px, 0)`;
      raf = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.4 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!node.classList.contains("visible")) {
        x = targetX = event.clientX;
        y = targetY = event.clientY;
        node.classList.add("visible");
      }
      targetX = event.clientX;
      targetY = event.clientY;
      node.classList.toggle(
        "active",
        Boolean((event.target as Element | null)?.closest(INTERACTIVE)),
      );
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => node.classList.remove("visible");
    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [motion]);

  if (!motion) return null;
  return (
    <div className="cursor-halo" ref={halo} aria-hidden="true">
      <span />
    </div>
  );
}
