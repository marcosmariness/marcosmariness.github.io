import { CSSProperties, Fragment, MouseEvent, useEffect, useState } from "react";
import { ContactForm } from "./ContactForm";
import {
  BackToTop,
  CountUp,
  Headline,
  HeroDecoration,
  HeroFloaters,
  LocalTime,
  Marquee,
  PointerEffects,
  ScrollProgress,
  SideDots,
  Typewriter,
  findActiveSection,
  safeStorage,
  sideSections,
  useRevealObserver,
} from "./effects";

type SectionId = "perfil" | "herramientas" | "formacion" | "proyecto" | "contacto";

// Single source of truth for the sections: sideSections (effects.tsx)
const navigation = sideSections.map((item) => ({ ...item, id: item.id as SectionId }));

const EMAIL = "marcosmariness@gmail.com";
const GITHUB_PROFILE = "https://github.com/marcosmariness";
const GITHUB_PROJECT = "https://github.com/marcosmariness/domotica-nodejs-sockets";

const LOGO_UGR = {
  src: "/logo-ugr.png",
  alt: "Logo de la Universidad de Granada",
  altEn: "University of Granada logo",
};
const LOGO_JXXIII = {
  src: "/logo-jxxiii.png",
  alt: "Logo del IES Juan XXIII Chana",
  altEn: "IES Juan XXIII Chana logo",
};

const HERO_LINE = "MARCOS GARCÍA ÁLVAREZ — ESTUDIANTE DE INGENIERÍA INFORMÁTICA";
const HERO_LINE_EN = "MARCOS GARCÍA ÁLVAREZ — COMPUTER ENGINEERING STUDENT";

const profileFacts = [
  "Universidad de Granada",
  "Especialidad en Ingeniería del Software",
  "Granada, España",
  "Grado completado al 75%",
];

const profileFactsEn = [
  "University of Granada",
  "Software Engineering specialization",
  "Granada, Spain",
  "Degree 75% completed",
];

const toolCategories = [
  {
    name: "Backend & Distribuidos",
    nameEn: "Backend & Distributed",
    items: ["Python", "Java", "SQL", "MongoDB", "C++", "Node.js", "Socket.io", "APIs REST"],
  },
  {
    name: "DevOps & Sistemas",
    nameEn: "DevOps & Systems",
    items: [
      "Linux (Bash)",
      "Docker",
      "Kubernetes",
      "Git / GitHub",
      "Redes (TCP/IP)",
      "Nginx / Apache",
      "Zabbix",
    ],
  },
  {
    name: "Frontend & Otros",
    nameEn: "Frontend & Others",
    items: ["JavaScript", "HTML/CSS", "PHP", "Flutter", "Dart", "Figma"],
  },
];

const education = [
  {
    year: "2023 — 2027",
    logo: LOGO_UGR,
    title: "Ingeniería Informática",
    titleEn: "Computer Engineering",
    center: "Universidad de Granada",
    centerEn: "University of Granada",
    result: "75%",
    resultEn: "75%",
    bar: "75%",
  },
  {
    year: "2021 — 2023",
    logo: LOGO_JXXIII,
    title: "Bachillerato Tecnológico",
    titleEn: "Technology High School Diploma",
    center: "IES Juan XXIII Chana",
    centerEn: "IES Juan XXIII Chana",
    result: "9,4",
    resultEn: "9.4",
    bar: null,
  },
];

const certifications = [
  {
    title: "Machine Learning y Big Data para la Bioinformática",
    titleEn: "Machine Learning and Big Data for Bioinformatics",
    year: "2026",
  },
  { title: "Creación de videojuegos", titleEn: "Video Game Creation", year: "2026" },
  { title: "Internet de las Cosas (IoT)", titleEn: "Internet of Things (IoT)", year: "2025" },
];

const SectionLabel = ({ number, label }: { number: string; label: string }) => (
  <div className="section-label" data-line>
    <span className="section-number">{number}</span>
    <span>{label}</span>
    <span className="section-rule" />
  </div>
);

const Monogram = () => <span className="monogram">MG</span>;

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="chip" data-reveal>
    {children}
  </span>
);

function App() {
  const [loading, setLoading] = useState(
    () => safeStorage("session")?.getItem("portfolio-loaded") !== "true",
  );
  const [exiting, setExiting] = useState(false);
  const [ready, setReady] = useState(() => !loading);
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(
    () => safeStorage("local")?.getItem("portfolio-theme") !== "light",
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<SectionId | null>(null);
  const [language, setLanguage] = useState<"ES" | "EN">("ES");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const startedAt = performance.now();
    let frame = 0;
    const timers: number[] = [];
    const tick = (now: number) => {
      const next = Math.min(100, Math.round(((now - startedAt) / 1900) * 100));
      setProgress(next);
      if (next < 100) {
        frame = requestAnimationFrame(tick);
      } else {
        safeStorage("session")?.setItem("portfolio-loaded", "true");
        timers.push(window.setTimeout(() => setExiting(true), 200));
        timers.push(window.setTimeout(() => setReady(true), 650));
        timers.push(window.setTimeout(() => setLoading(false), 1100));
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      timers.forEach(window.clearTimeout);
    };
  }, [loading]);

  useRevealObserver(ready);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    safeStorage("local")?.setItem("portfolio-theme", dark ? "dark" : "light");
  }, [dark]);

  // 300ms cross-fade between themes (class is only present while switching).
  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    window.setTimeout(() => root.classList.remove("theme-switching"), 400);
    setDark((value) => !value);
  };

  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
    document.title =
      language === "ES"
        ? "Marcos García Álvarez — Portfolio de Ingeniería Informática"
        : "Marcos García Álvarez — Computer Engineering Portfolio";
  }, [language]);

  useEffect(() => {
    // Scroll-spy shared with the side dots (findActiveSection in effects.tsx).
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 24);
      setActive(findActiveSection() as SectionId | null);
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

  useEffect(() => {
    document.body.style.overflow = menuOpen || loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, loading]);

  const closeAndNavigate = () => setMenuOpen(false);

  // Copies the address and lets the mailto: link continue to open the mail client.
  const copyEmail = (_event: MouseEvent<HTMLAnchorElement>) => {
    const fallback = () => {
      const field = document.createElement("textarea");
      field.value = EMAIL;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(EMAIL).catch(fallback);
    } else {
      fallback();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {loading && (
        <div className={`loader ${exiting ? "loader-exit" : ""}`} aria-live="polite">
          <div className="loader-content">
            <Monogram />
            <div className="loader-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="loader-meta">
              <span>{language === "ES" ? "Cargando portfolio..." : "Loading portfolio..."}</span>
              <span>{progress.toString().padStart(3, "0")}%</span>
            </div>
          </div>
        </div>
      )}

      <ScrollProgress />
      <PointerEffects />
      <SideDots language={language} />
      <BackToTop label={language === "ES" ? "Volver arriba" : "Back to top"} />
      <div className={`toast ${copied ? "show" : ""}`} role="status">
        {copied ? (language === "ES" ? "Copiado" : "Copied") : ""}
      </div>

      <header className={`topbar ${scrolled ? "topbar-scrolled" : ""}`}>
        <a
          className="brand"
          href="#inicio"
          aria-label={language === "ES" ? "Ir al inicio" : "Go to home"}
        >
          <Monogram />
          <span>MARCOS GARCÍA ÁLVAREZ</span>
        </a>
        <nav
          className="desktop-nav"
          aria-label={language === "ES" ? "Navegación principal" : "Main navigation"}
        >
          {navigation.map((item) => (
            <a className={active === item.id ? "active" : ""} href={`#${item.id}`} key={item.id}>
              <span>{item.number}</span> {language === "ES" ? item.label : item.labelEn}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <div
            className="language"
            aria-label={language === "ES" ? "Selector de idioma" : "Language selector"}
          >
            <button
              className={language === "ES" ? "selected" : ""}
              onClick={() => setLanguage("ES")}
            >
              ES
            </button>
            <span>|</span>
            <button
              className={language === "EN" ? "selected" : ""}
              onClick={() => setLanguage("EN")}
            >
              EN
            </button>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {dark ? (language === "ES" ? "CLARO" : "LIGHT") : language === "ES" ? "OSCURO" : "DARK"}
          </button>
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            {language === "ES" ? "Menú" : "Menu"}
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-head">
          <Monogram />
          <button onClick={() => setMenuOpen(false)}>
            {language === "ES" ? "Cerrar" : "Close"}
          </button>
        </div>
        <nav>
          {navigation.map((item) => (
            <a href={`#${item.id}`} key={item.id} onClick={closeAndNavigate}>
              <span>{item.number}</span>
              {language === "ES" ? item.label : item.labelEn}
            </a>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <span>MARCOS GARCÍA ÁLVAREZ — PORTFOLIO 2026</span>
          <div>
            <button onClick={() => setLanguage((value) => (value === "ES" ? "EN" : "ES"))}>
              {language === "ES" ? "ENGLISH" : "ESPAÑOL"}
            </button>
            <button onClick={toggleTheme}>
              {dark
                ? language === "ES"
                  ? "MODO CLARO"
                  : "LIGHT MODE"
                : language === "ES"
                  ? "MODO OSCURO"
                  : "DARK MODE"}
            </button>
          </div>
        </div>
      </div>

      <main>
        <section className={`hero glow-section ${ready ? "ready" : ""}`} id="inicio">
          <HeroDecoration />
          <HeroFloaters />
          <div className="hero-content">
            <div className="hero-meta">
              <p className="eyebrow">
                <Typewriter text={language === "ES" ? HERO_LINE : HERO_LINE_EN} start={ready} />
              </p>
              <p className="availability" data-reveal data-delay={HERO_LINE.length * 36}>
                <span className="availability-dot" />
                <Typewriter
                  text={language === "ES" ? "APRENDIENDO CADA DÍA" : "LEARNING EVERY DAY"}
                  start={ready}
                  delay={HERO_LINE.length * 36 + 200}
                />
              </p>
            </div>
            <Headline
              as="h1"
              lines={language === "ES" ? ["Mejorando", "Aprendiendo."] : ["Improving", "Learning."]}
            />
            <div className="hero-bottom">
              <p className="hero-intro" data-reveal data-delay="350">
                {language === "ES"
                  ? "Último curso de Ingeniería del Software en la UGR. Full-stack, Linux y Docker, y ganas de seguir aprendiendo en IA y cloud."
                  : "Final-year Software Engineering student at UGR. Full-stack, Linux and Docker, eager to keep learning in AI and cloud."}
              </p>
              <a className="primary-link" href="#perfil" data-magnetic data-reveal data-delay="350">
                <span className="arrow-circle">
                  <span className="arrow-glyph">↓</span>
                </span>
                {language === "ES" ? "Ver mi camino" : "See my path"}
              </a>
            </div>
          </div>
        </section>

        <section className="content-section glow-section" id="perfil">
          <SectionLabel number="01" label={language === "ES" ? "PERFIL" : "PROFILE"} />
          <div className="profile-layout">
            <Headline
              lines={
                language === "ES"
                  ? ["Pensamiento claro.", "Impacto real."]
                  : ["Clear thinking.", "Real impact."]
              }
            />
            <div className="card profile-card" data-reveal>
              <p>
                {language === "ES"
                  ? "Estudiante de último curso de Ingeniería Informática (especialidad en Ingeniería del Software) en la Universidad de Granada. Base técnica en desarrollo full-stack, Linux y Docker, con alto interés en el aprendizaje continuo. Busco prácticas profesionales donde aportar valor y seguir formándome en desarrollo de software, Inteligencia Artificial e infraestructura cloud."
                  : "Final-year Computer Engineering student (Software Engineering specialization) at the University of Granada. Technical foundation in full-stack development, Linux and Docker, with a strong interest in continuous learning. I'm looking for a professional internship where I can add value and keep growing in software development, Artificial Intelligence and cloud infrastructure."}
              </p>
              <div className="chips">
                {(language === "ES" ? profileFacts : profileFactsEn).map((fact) => (
                  <Chip key={fact}>{fact}</Chip>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="tools-wrap glow-section" id="herramientas">
          <div className="tools-panel">
            <SectionLabel number="02" label={language === "ES" ? "HERRAMIENTAS" : "TOOLS"} />
            <div className="tools-heading">
              <Headline
                lines={
                  language === "ES" ? ["Mi ecosistema", "técnico."] : ["My technical", "ecosystem."]
                }
              />
              <p data-reveal>
                {language === "ES"
                  ? "Las herramientas con las que construyo y mantengo software."
                  : "The tools I use to build and maintain software."}
              </p>
            </div>
            <div className="tools-grid">
              {toolCategories.map((category, index) => (
                <article
                  className={`tool-card ${index === 2 ? "wide" : ""}`}
                  key={category.name}
                  data-reveal
                  data-spotlight
                >
                  <div className="tool-name">
                    <span className="blue-dot" />
                    <h3>{language === "ES" ? category.name : category.nameEn}</h3>
                  </div>
                  <p>
                    {category.items.map((item, n) => (
                      <Fragment key={item}>
                        {n > 0 ? " · " : null}
                        <span className="tool-item" style={{ "--i": n } as CSSProperties}>
                          {item}
                        </span>
                      </Fragment>
                    ))}
                  </p>
                  <span className="tool-number">0{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <Marquee />

        <section className="content-section glow-section" id="formacion">
          <SectionLabel number="03" label={language === "ES" ? "FORMACIÓN" : "EDUCATION"} />
          <Headline
            className="section-title"
            lines={language === "ES" ? ["Trayectoria", "en desarrollo."] : ["Developing", "path."]}
          />
          <div className="education-list">
            {education.map((item, index) => (
              <article className="education-row" key={item.title} data-reveal>
                <span className={`timeline-dot ${index === 0 ? "filled" : ""}`} />
                <p className="dates">{item.year}</p>
                <div className="education-logo">
                  <img
                    src={item.logo.src}
                    alt={language === "ES" ? item.logo.alt : item.logo.altEn}
                  />
                </div>
                <div>
                  <h3>{language === "ES" ? item.title : item.titleEn}</h3>
                  <p>{language === "ES" ? item.center : item.centerEn}</p>
                </div>
                <div className="education-result">
                  <span>
                    <CountUp text={language === "ES" ? item.result : item.resultEn} />
                  </span>
                  {item.bar && (
                    <div className="progress-line">
                      <span style={{ "--value": item.bar } as CSSProperties} />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="cert-block" role="group" aria-labelledby="cert-title">
            <p className="block-label">
              {language === "ES" ? "CERTIFICACIONES" : "CERTIFICATIONS"}
            </p>
            <Headline
              className="section-title"
              id="cert-title"
              lines={language === "ES" ? ["El siguiente", "objetivo."] : ["The next", "goal."]}
            />
            <article className="featured-cert" data-reveal>
              <p>{language === "ES" ? "PRÓXIMO OBJETIVO" : "NEXT GOAL"}</p>
              <div>
                <h3>
                  {language === "ES"
                    ? "Grado, TFG y primeras prácticas."
                    : "Degree, final project and first internship."}
                </h3>
              </div>
              <a
                className="featured-arrow"
                href="#contacto"
                aria-label={language === "ES" ? "Ir a Contacto" : "Go to Contact"}
              >
                ↗
              </a>
            </article>
            <div className="cert-grid">
              {certifications.map((cert) => (
                <article className="card cert-card" key={cert.title} data-reveal data-spotlight>
                  <div className="cert-logo">
                    <img
                      src={LOGO_UGR.src}
                      alt={language === "ES" ? LOGO_UGR.alt : LOGO_UGR.altEn}
                    />
                  </div>
                  <p className="dates">
                    {language === "ES"
                      ? "AbiertaUGR · Universidad de Granada"
                      : "AbiertaUGR · University of Granada"}
                  </p>
                  <h3>{language === "ES" ? cert.title : cert.titleEn}</h3>
                  <span className="complete-mark">
                    {language === "ES" ? "COMPLETADO" : "COMPLETED"} · {cert.year}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="content-section glow-section" id="proyecto">
          <SectionLabel number="04" label={language === "ES" ? "PROYECTOS" : "PROJECTS"} />
          <Headline
            className="section-title"
            lines={
              language === "ES"
                ? ["Código al servicio", "de una idea."]
                : ["Code in the service", "of an idea."]
            }
          />
          <div className="project-list">
            <article className="card project-card" data-reveal data-spotlight data-tilt>
              <div className="project-mockup">
                <div className="browser-bar">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mockup-layout" aria-hidden="true">
                  <div className="mockup-side">
                    <span className="mk-nav active">
                      {language === "ES" ? "Panel" : "Dashboard"}
                    </span>
                    <span className="mk-nav">{language === "ES" ? "Sensores" : "Sensors"}</span>
                    <span className="mk-nav">{language === "ES" ? "Alarmas" : "Alarms"}</span>
                    <span className="mk-live">
                      <i />
                      {language === "ES" ? "EN VIVO" : "LIVE"}
                    </span>
                  </div>
                  <div className="mockup-content">
                    <div className="mk-card">
                      <span className="mk-label">
                        {language === "ES" ? "Temperatura interior" : "Indoor temperature"}
                      </span>
                      <strong className="mk-value">24 °C</strong>
                      <span className="mk-sub">
                        {language === "ES" ? "Exterior Granada · 18 °C" : "Outdoor Granada · 18 °C"}
                      </span>
                      <svg className="mk-chart" viewBox="0 0 200 40" preserveAspectRatio="none">
                        <polyline points="0,30 20,26 40,28 60,19 80,23 100,15 120,18 140,10 160,14 180,8 200,11" />
                      </svg>
                    </div>
                    <div className="mk-card">
                      <span className="mk-label">
                        {language === "ES" ? "Aire acondicionado" : "Air conditioning"}
                      </span>
                      <strong className="mk-state">OFF</strong>
                      <span className="mk-sub">
                        {language === "ES" ? "Sin presencia" : "No presence"}
                      </span>
                    </div>
                    <div className="mk-card">
                      <span className="mk-label">{language === "ES" ? "Persianas" : "Blinds"}</span>
                      <strong className="mk-state">
                        {language === "ES" ? "Cerradas" : "Closed"}
                      </strong>
                      <span className="mk-sub">{language === "ES" ? "Luz 86%" : "Light 86%"}</span>
                      <span className="mk-bar">
                        <span />
                      </span>
                    </div>
                  </div>
                </div>
                <span>
                  {language === "ES"
                    ? "Panel de control (ilustrativo)"
                    : "Control panel (illustrative)"}
                </span>
              </div>
              <div className="project-copy">
                <p className="project-tags">FULL-STACK · NODE.JS · MONGODB</p>
                <h3>
                  {language === "ES"
                    ? "Sistema domótico inteligente en tiempo real"
                    : "Smart real-time home automation system"}
                </h3>
                <p>
                  {language === "ES"
                    ? "Agente domótico en tiempo real: lee sensores, aplica reglas de ahorro energético, consulta el clima exterior, guarda el historial en MongoDB y avisa con notificaciones de escritorio."
                    : "Real-time home automation agent: reads sensors, applies energy-saving rules, checks outdoor weather, stores history in MongoDB and sends desktop notifications."}
                </p>
                <a href={GITHUB_PROJECT} target="_blank" rel="noopener noreferrer">
                  {language === "ES" ? "Ver en GitHub →" : "View on GitHub →"}
                </a>
              </div>
            </article>
            <article className="card project-card" data-reveal data-spotlight data-tilt>
              <div className="project-mockup">
                <div className="mockup-phones" aria-hidden="true">
                  <div className="mk-phone">
                    <span className="mk-label">{language === "ES" ? "Catálogo" : "Catalog"}</span>
                    <span className="mk-row on">
                      <span className="mk-label">Tractor</span>
                    </span>
                    <span className="mk-row">
                      <span className="mk-label">
                        {language === "ES" ? "Excavadora" : "Excavator"}
                      </span>
                    </span>
                    <span className="mk-row">
                      <span className="mk-label">
                        {language === "ES" ? "Accesorios" : "Accessories"}
                      </span>
                    </span>
                  </div>
                  <div className="mk-phone">
                    <span className="mk-label">Extras</span>
                    <strong className="mk-price">
                      {language === "ES" ? "+55 €/día" : "+€55/day"}
                    </strong>
                    <span className="mk-sub">
                      {language === "ES" ? "Remolque + GPS" : "Trailer + GPS"}
                    </span>
                    <span className="mk-row" />
                    <span className="mk-row" />
                  </div>
                  <div className="mk-phone">
                    <span className="mk-label">{language === "ES" ? "Envío" : "Delivery"}</span>
                    <span className="mk-row">
                      <span className="mk-label">
                        {language === "ES" ? "Estándar" : "Standard"}
                      </span>
                    </span>
                    <span className="mk-row">
                      <span className="mk-label">{language === "ES" ? "Urgente" : "Express"}</span>
                    </span>
                    <span className="mk-row">
                      <span className="mk-label">{language === "ES" ? "Recogida" : "Pickup"}</span>
                    </span>
                    <span className="mk-btn" />
                  </div>
                </div>
                <span>
                  {language === "ES" ? "Prototipo (ilustrativo)" : "Prototype (illustrative)"}
                </span>
              </div>
              <div className="project-copy">
                <p className="project-tags">
                  {language === "ES"
                    ? "EQUIPO DE 3 · FLUTTER · RUBY ON RAILS"
                    : "TEAM OF 3 · FLUTTER · RUBY ON RAILS"}
                </p>
                <h3>
                  {language === "ES"
                    ? "AgroRent: alquiler de maquinaria pesada y agrícola"
                    : "AgroRent: heavy and agricultural machinery rental"}
                </h3>
                <p>
                  {language === "ES"
                    ? "Proyecto en equipo de Desarrollo de Software: app móvil con API REST para reservar maquinaria. Diseñé la arquitectura: patrones Decorator, Composite y Strategy, control de solapes de fechas y tests."
                    : "Team project for Software Development: mobile app with a REST API to book machinery. I designed the architecture: Decorator, Composite and Strategy patterns, date-overlap control and tests."}
                </p>
                <a
                  href="https://github.com/marcosmariness/alquiler-maquinaria-pesada"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {language === "ES" ? "Ver en GitHub →" : "View on GitHub →"}
                </a>
              </div>
            </article>
            <article className="card project-card" data-reveal data-spotlight data-tilt>
              <div className="project-mockup">
                <div className="mockup-phones" aria-hidden="true">
                  <div className="mk-phone">
                    <span className="mk-label">
                      {language === "ES" ? "Selecciona campus" : "Select campus"}
                    </span>
                    <span className="mk-row on" />
                    <span className="mk-row" />
                    <span className="mk-row" />
                  </div>
                  <div className="mk-phone">
                    <span className="mk-label">
                      {language === "ES" ? "Cesta ecológica" : "Organic basket"}
                    </span>
                    <strong className="mk-price">{language === "ES" ? "8,50 €" : "€8.50"}</strong>
                    <span className="mk-sub">3 kg</span>
                    <span className="mk-row" />
                    <span className="mk-row" />
                  </div>
                  <div className="mk-phone">
                    <span className="mk-label">
                      {language === "ES" ? "Reserva con QR" : "Book with QR"}
                    </span>
                    <span className="mk-qr">
                      <span className="on" />
                      <span className="on" />
                      <span className="on" />
                      <span className="" />
                      <span className="on" />
                      <span className="on" />
                      <span className="" />
                      <span className="on" />
                      <span className="on" />
                      <span className="" />
                      <span className="on" />
                      <span className="on" />
                      <span className="" />
                      <span className="on" />
                      <span className="on" />
                      <span className="" />
                      <span className="on" />
                      <span className="on" />
                      <span className="" />
                      <span className="on" />
                      <span className="on" />
                      <span className="" />
                      <span className="on" />
                      <span className="on" />
                      <span className="on" />
                    </span>
                    <span className="mk-btn" />
                  </div>
                </div>
                <span>
                  {language === "ES" ? "Prototipo (ilustrativo)" : "Prototype (illustrative)"}
                </span>
              </div>
              <div className="project-copy">
                <p className="project-tags">UX/UI · FIGMA · FIGMA MAKE</p>
                <h3>
                  {language === "ES"
                    ? "Caso de estudio UX: EcoMercado UGR"
                    : "UX case study: EcoMercado UGR"}
                </h3>
                <p>
                  {language === "ES"
                    ? "App móvil para el mercado ecológico de la UGR: auditoría de usabilidad, personas, flujos, wireframes, mockups y prototipo interactivo."
                    : "Mobile app for the UGR organic market: usability audit, personas, flows, wireframes, mockups and interactive prototype."}
                </p>
                <a
                  href="https://github.com/marcosmariness/ux-case-study-ecomercado"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {language === "ES" ? "Ver caso →" : "View case →"}
                </a>
              </div>
            </article>
          </div>
          <p className="project-more" data-reveal>
            <a href="https://github.com/marcosmariness" target="_blank" rel="noopener noreferrer">
              {language === "ES"
                ? "Ver más proyectos en GitHub →"
                : "View more projects on GitHub →"}
            </a>
          </p>
        </section>

        <section className="contact-section" id="contacto">
          <div className="contact-glow" />
          <SectionLabel number="05" label={language === "ES" ? "CONTACTO" : "CONTACT"} />
          <Headline
            lines={
              language === "ES"
                ? ["¿Construimos algo", "juntos?"]
                : ["Shall we build something", "together?"]
            }
          />
          <div className="contact-layout">
            <div className="contact-copy">
              <p data-reveal>
                {language === "ES"
                  ? "Si tienes una idea o una oportunidad, escríbeme y lo hablamos."
                  : "If you have an idea or an opportunity, write to me and let's talk."}
              </p>
              <a className="email-link" href={`mailto:${EMAIL}`} onClick={copyEmail}>
                {EMAIL} <span>↗</span>
              </a>
              <div className="contact-meta">
                <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
                  GITHUB ↗
                </a>
                {/* LinkedIn oculto por ahora. Para reactivarlo, descomenta el enlace y pon tu URL:
                <a href="URL_DE_LINKEDIN" target="_blank" rel="noopener noreferrer">
                  LINKEDIN ↗
                </a>
                */}
                <span>{language === "ES" ? "GRANADA, ESPAÑA" : "GRANADA, SPAIN"}</span>
              </div>
            </div>
            <ContactForm language={language} />
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <Monogram />
            <p>
              {language === "ES"
                ? "Aprendamos a mejorar juntos."
                : "Let's learn to improve together."}
            </p>
          </div>
          <a href="#inicio">{language === "ES" ? "Volver arriba ↑" : "Back to top ↑"}</a>
        </div>
        <div className="footer-bottom">
          <span>© 2026 MARCOS GARCÍA ÁLVAREZ</span>
          <LocalTime language={language} />
          <span>{language === "ES" ? "PORTFOLIO PERSONAL" : "PERSONAL PORTFOLIO"}</span>
        </div>
      </footer>
    </>
  );
}

export default App;
