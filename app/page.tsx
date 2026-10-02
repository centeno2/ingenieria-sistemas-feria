"use client";

import { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from "react";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const segment = (progress: number, start: number, end: number) => clamp((progress - start) / (end - start));
const mix = (a: number, b: number, t: number) => a + (b - a) * clamp(t);
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      raf.current = null;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const sectionTop = window.scrollY + rect.top;
      const travel = Math.max(1, el.offsetHeight - window.innerHeight);
      const next = clamp((window.scrollY - sectionTop) / travel);
      setProgress(next);
    };

    const requestUpdate = () => {
      if (raf.current !== null) return;
      raf.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    const observer = new ResizeObserver(requestUpdate);
    if (ref.current) observer.observe(ref.current);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      observer.disconnect();
      if (raf.current !== null) window.cancelAnimationFrame(raf.current);
    };
  }, []);

  return { ref, progress };
}

function usePageProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      raf = null;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(clamp(window.scrollY / max));
    };
    const onScroll = () => {
      if (raf !== null) return;
      raf = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, []);
  return progress;
}

function ScrollRail() {
  const progress = usePageProgress();
  return (
    <div className="scroll-rail" aria-hidden="true">
      <span style={{ transform: `scaleY(${progress})` }} />
      <i>{String(Math.round(progress * 100)).padStart(2, "0")}</i>
    </div>
  );
}

function Fade({ show, children, className = "" }: { show: number; children: ReactNode; className?: string }) {
  const value = ease(show);
  return (
    <div className={className} style={{ opacity: value, transform: `translateY(${(1 - value) * 22}px)` }}>
      {children}
    </div>
  );
}

const codeTokens = [
  "JAVA", "PY", "C#", "KOTLIN", "PHP", "TS", "DART", "SQL", "0101", "{}", "[]", "</>",
  "API", "JSON", "HTTP", "GIT", "LINUX", "DOCKER", "CLOUD", "DATA", "SELECT", "class", "=>", "npm", "while()", "const", "{ }", "</>", "0xFF", "async", "sudo", "git push"
];

function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let time = 0;
    let lastScroll = window.scrollY;
    let scrollBoost = 0;
    let streams: { x: number; y: number; speed: number; size: number; offset: number; gap: number; drift: number; phase: number }[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(24, Math.floor(width / 48));
      streams = Array.from({ length: count }, (_, i) => ({
        x: (i + 0.3 + Math.random() * 0.4) * (width / count),
        y: Math.random() * (height + 500) - 250,
        speed: 0.42 + Math.random() * 0.78,
        size: 10 + Math.random() * 5.5,
        offset: Math.floor(Math.random() * codeTokens.length),
        gap: 29 + Math.random() * 17,
        drift: 1.5 + Math.random() * 3.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const onScroll = () => {
      const now = window.scrollY;
      scrollBoost = Math.min(7, scrollBoost + Math.abs(now - lastScroll) * 0.014);
      lastScroll = now;
    };

    const draw = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      streams.forEach((stream, column) => {
        const x = stream.x + Math.sin(time + stream.phase) * stream.drift;
        ctx.font = `700 ${stream.size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        for (let j = 0; j < 14; j++) {
          const token = codeTokens[(stream.offset + j + column) % codeTokens.length];
          const y = stream.y - j * stream.gap;
          if (y < -60 || y > height + 60) continue;
          const head = j === 0;
          const alpha = head ? 0.72 : Math.max(0.075, 0.40 - j * 0.024);
          ctx.shadowBlur = head ? 18 : 0;
          ctx.shadowColor = head ? "rgba(56, 196, 229, .58)" : "transparent";
          ctx.fillStyle = head ? `rgba(8, 113, 151, ${alpha})` : `rgba(20, 145, 180, ${alpha})`;
          ctx.fillText(token, x, y);
        }
        stream.y += stream.speed + scrollBoost * 0.24;
        if (stream.y > height + 380) {
          stream.y = -60 - Math.random() * 420;
          stream.offset = Math.floor(Math.random() * codeTokens.length);
        }
      });

      ctx.shadowBlur = 0;
      scrollBoost *= 0.91;
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="code-rain" aria-hidden="true" />;
}

function BootSequence({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState(0);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setPhase(5);
    window.setTimeout(() => {
      setVisible(false);
      onDone();
    }, 420);
  };

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase(1), 180),
      window.setTimeout(() => setPhase(2), 520),
      window.setTimeout(() => setPhase(3), 860),
      window.setTimeout(() => setPhase(4), 1200),
      window.setTimeout(finish, 1650),
    ];
    return () => timers.forEach(window.clearTimeout);
  }, []);

  if (!visible) return null;
  return (
    <div className={`boot ${phase >= 5 ? "boot--leaving" : ""}`} onClick={finish}>
      <div className="boot-grid" />
      <div className="boot-inner">
        <p className="boot-kicker">UNAN_SYS / INITIALIZING_CAREER</p>
        <div className="boot-code">
          <span>{phase >= 1 ? "$ load --career systems-engineering" : ""}</span>
          <span>{phase >= 2 ? "> linking PEOPLE + DATA + SOFTWARE + TI" : ""}</span>
          <span>{phase >= 3 ? "> compile skills: DATABASES / APPS / ANALYTICS / IT" : ""}</span>
          <span className="accent">{phase >= 4 ? "> objective: transform problems into systems" : ""}</span>
        </div>
        <div className="boot-progress"><i style={{ transform: `scaleX(${phase / 5})` }} /></div>
        <div className="boot-status"><span>{phase >= 5 ? "READY" : "BUILDING"}</span><small>click para omitir</small></div>
      </div>
    </div>
  );
}

function Navigation({ ready }: { ready: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={`nav nav--minimal ${ready ? "is-ready" : ""}`}>
      <button className="nav-toggle" onClick={() => setOpen((v) => !v)} aria-label="Abrir navegación"><i /><i /></button>
      <div className={`nav-links ${open ? "open" : ""}`}>
        <a href="#carrera" onClick={() => setOpen(false)}>Carrera</a>
        <a href="#campo" onClick={() => setOpen(false)}>Campo laboral</a>
        <a href="#plan" onClick={() => setOpen(false)}>Plan</a>
        <a className="pdf-link" href="/docs/unan-managua-ingenieria-en-sistemas.pdf" target="_blank" rel="noreferrer">PDF oficial ↗</a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow"><span /> FERIA TECNOLÓGICA · UNAN-MANAGUA</p>
        <h1>Ingeniería<br /><em>en Sistemas</em></h1>
        <p className="hero-statement">Diseñamos sistemas que conectan <strong>personas, datos y tecnología</strong> para convertir problemas reales en soluciones.</p>
        <div className="hero-actions">
          <a href="#carrera" className="primary-action">Explorar la carrera <i>↓</i></a>
          <a href="/docs/unan-managua-ingenieria-en-sistemas.pdf" target="_blank" rel="noreferrer" className="secondary-action">Perfil oficial UNAN ↗</a>
        </div>
      </div>
      <div className="hero-schematic" aria-hidden="true">
        <div className="schematic-core"><span>SYSTEM</span><strong>READY</strong></div>
        {[
          ["SOFTWARE", "s1"], ["DATOS", "s2"], ["TI", "s3"], ["USUARIO", "s4"], ["PROCESOS", "s5"], ["SEGURIDAD", "s6"]
        ].map(([label, cls]) => <div className={`schematic-node ${cls}`} key={label}><i />{label}</div>)}
        {Array.from({ length: 6 }).map((_, i) => <span className={`schematic-line l${i + 1}`} key={i} />)}
      </div>
      <div className="career-facts">
        <div><small>DURACIÓN</small><strong>4 años</strong></div>
        <div><small>MODALIDADES</small><strong>Presencial · Semipresencial · Por encuentro</strong></div>
        <div><small>ENFOQUE</small><strong>Sistemas · Datos · TI</strong></div>
      </div>
    </section>
  );
}

const lifecycle = [
  ["01", "DISEÑAR", "Entender el problema y modelar la solución."],
  ["02", "DESARROLLAR", "Convertir ideas en aplicaciones y sistemas funcionales."],
  ["03", "GESTIONAR", "Coordinar servicios, procesos y recursos de TI."],
  ["04", "IMPLEMENTAR", "Integrar la solución en organizaciones y contextos reales."],
];

function PurposeSection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  return (
    <section className="scroll-scene purpose" ref={ref} id="carrera">
      <div className="sticky-stage">
        <div className="purpose-copy">
          <p>EL OBJETO DE ESTUDIO</p>
          <h2>Los <em>sistemas informáticos</em> durante todo su ciclo de vida.</h2>
        </div>
        <div className="lifecycle">
          {lifecycle.map(([n, title, copy], i) => {
            const reveal = segment(progress, 0.08 + i * 0.16, 0.22 + i * 0.16);
            return (
              <div className="lifecycle-step" key={title} style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 28}px)` }}>
                <span>{n}</span><div><strong>{title}</strong><p>{copy}</p></div><i style={{ transform: `scaleX(${reveal})` }} />
              </div>
            );
          })}
        </div>
        <div className="purpose-impact" style={{ opacity: segment(progress, 0.76, 0.94) }}>
          <span>PARA</span>
          <strong>apoyar decisiones</strong><i />
          <strong>optimizar procesos</strong><i />
          <strong>contribuir al desarrollo tecnológico, productivo y social</strong>
        </div>
        <div className="source-note" style={{ opacity: segment(progress, 0.84, 0.96) }}>Basado en el perfil académico oficial de UNAN-Managua.</div>
      </div>
    </section>
  );
}

const evolutionSteps = [
  { at: 0.03, year: "1940", title: "CÁLCULO", code: "000101", copy: "Computadoras enormes para tareas específicas." },
  { at: 0.29, year: "1980", title: "PC", code: "C:\\>_", copy: "La computación entra a oficinas, hogares y universidades." },
  { at: 0.55, year: "2000", title: "INTERNET", code: "www._", copy: "Los equipos dejan de ser islas y empiezan a formar redes globales." },
  { at: 0.80, year: "2026", title: "ECOSISTEMAS", code: "AI://ONLINE", copy: "Datos, cloud, automatización y seguridad operan como un sistema." },
];

function EvolutionSection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  const active = [...evolutionSteps].reverse().find((step) => progress >= step.at) ?? evolutionSteps[0];
  return (
    <section className="scroll-scene evolution" ref={ref}>
      <div className="sticky-stage">
        <div className="evolution-year">{active.year}</div>
        <div className="evolution-copy"><p>{active.title}</p><h2>{active.copy}</h2></div>
        <div className="evolution-device" style={{ "--p": progress } as CSSProperties}>
          <div className="device-shell"><div className="device-screen"><span>{active.code}</span><i /></div></div>
          <div className="device-packets">{Array.from({ length: 9 }).map((_, i) => <i key={i} style={{ "--i": i } as CSSProperties} />)}</div>
        </div>
        <div className="timeline"><i style={{ transform: `scaleX(${progress})` }} />{evolutionSteps.map((s) => <span className={progress >= s.at ? "active" : ""} key={s.year}>{s.year}</span>)}</div>
        <p className="evolution-bottom" style={{ opacity: segment(progress, 0.87, 0.97) }}>La tecnología cambia. <strong>El ingeniero aprende a conectar lo nuevo con problemas reales.</strong></p>
      </div>
    </section>
  );
}

const competencies = [
  ["BASES DE DATOS", "Implementar y administrar información con integridad, respaldo, control de acceso y eficiencia."],
  ["DESARROLLO", "Crear aplicaciones funcionales e innovadoras con diseño centrado en el usuario y buenas prácticas."],
  ["DATOS → DECISIONES", "Transformar información en conocimiento útil para decisiones estratégicas."],
  ["GESTIÓN DE TI", "Gestionar procesos y servicios con estándares de calidad, seguridad y responsabilidad."],
];

function CompetenciesSection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  return (
    <section className="scroll-scene competencies" ref={ref}>
      <div className="sticky-stage">
        <div className="competency-head"><p>NO ES SOLO PROGRAMAR</p><h2>Aprendes a construir, administrar y mejorar <em>sistemas completos.</em></h2></div>
        <div className="competency-stack">
          {competencies.map(([title, copy], i) => {
            const reveal = segment(progress, 0.10 + i * 0.17, 0.27 + i * 0.17);
            return <article key={title} style={{ opacity: reveal, transform: `translateX(${(1 - reveal) * 54}px)` }}><span>0{i + 1}</span><div><strong>{title}</strong><p>{copy}</p></div></article>;
          })}
        </div>
        <div className="competency-caption" style={{ opacity: segment(progress, 0.80, 0.95) }}>Una formación técnica con enfoque científico, ético, inclusivo e innovador.</div>
      </div>
    </section>
  );
}

type TechItem = { name: string; icon: string };
const languages: TechItem[] = [
  { name: "Java", icon: "devicon-java-plain colored" }, { name: "Python", icon: "devicon-python-plain colored" },
  { name: "C#", icon: "devicon-csharp-plain colored" }, { name: "Kotlin", icon: "devicon-kotlin-plain colored" },
  { name: "PHP", icon: "devicon-php-plain colored" }, { name: "TypeScript", icon: "devicon-typescript-plain colored" },
  { name: "Dart", icon: "devicon-dart-plain colored" }, { name: "SQL", icon: "devicon-mysql-original colored" },
];
const frameworks: TechItem[] = [
  { name: "Spring", icon: "devicon-spring-original colored" }, { name: ".NET", icon: "devicon-dotnetcore-plain colored" },
  { name: "Next.js", icon: "devicon-nextjs-plain" }, { name: "React", icon: "devicon-react-original colored" },
  { name: "Flutter", icon: "devicon-flutter-plain colored" }, { name: "Laravel", icon: "devicon-laravel-original colored" },
  { name: "Node.js", icon: "devicon-nodejs-plain colored" }, { name: "Angular", icon: "devicon-angularjs-plain colored" },
];
const platforms: TechItem[] = [
  { name: "Linux", icon: "devicon-linux-plain" }, { name: "Docker", icon: "devicon-docker-plain colored" },
  { name: "Git", icon: "devicon-git-plain colored" }, { name: "PostgreSQL", icon: "devicon-postgresql-plain colored" },
  { name: "MongoDB", icon: "devicon-mongodb-plain colored" }, { name: "Kubernetes", icon: "devicon-kubernetes-plain colored" },
  { name: "GitHub", icon: "devicon-github-original" }, { name: "Nginx", icon: "devicon-nginx-original colored" },
];

function Orbit({ items, radius, rotation, reveal, label }: { items: TechItem[]; radius: number; rotation: number; reveal: number; label: string }) {
  return (
    <div className="orbit" data-ring={label} style={{ width: radius * 2, height: radius * 2, opacity: reveal, transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${0.90 + reveal * 0.1})` }}>
      {items.map((item, i) => {
        const angle = 360 / items.length * i;
        return (
          <span className="tech-chip" key={item.name} style={{ transform: `rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)` }}>
            <span className="tech-chip-inner" style={{ transform: `rotate(${-rotation}deg)` }}><i className={item.icon} aria-hidden="true" /><b>{item.name}</b></span>
          </span>
        );
      })}
    </div>
  );
}

function TechnologySection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  const base = mix(-20, 38, segment(progress, 0.18, 0.82));
  const stage = segment(progress, 0.12, 0.35) * (1 - segment(progress, 0.78, 0.94));
  return (
    <section className="scroll-scene technologies" ref={ref}>
      <div className="sticky-stage">
        <div className="tech-copy" style={{ opacity: 1 - segment(progress, 0.24, 0.42) }}><p>EL STACK CAMBIA</p><h2>La carrera te da la base para <em>adaptarte a la tecnología.</em></h2></div>
        <div className="orbit-stage" style={{ opacity: stage, transform: `translate(-50%, -50%) scale(${mix(.78, 1, segment(progress, .12, .62))})` }}>
          <div className="orbit-core"><small>EL CENTRO ES</small><strong>RESOLVER</strong><span>la herramienta es el medio</span></div>
          <Orbit items={languages} radius={150} rotation={base} reveal={segment(progress, .18, .34)} label="lenguajes" />
          <Orbit items={frameworks} radius={250} rotation={-base * .72} reveal={segment(progress, .28, .46)} label="frameworks" />
          <Orbit items={platforms} radius={350} rotation={base * .48} reveal={segment(progress, .38, .56)} label="plataformas" />
        </div>
        <p className="tech-bottom" style={{ opacity: segment(progress, .72, .89) }}><span>Aprendes tecnologías concretas.</span><strong>Pero la habilidad que permanece es analizar, diseñar, integrar y mejorar.</strong></p>
      </div>
    </section>
  );
}

const dailyScenarios = [
  { action: "ENVIAR UN MENSAJE", chain: ["Interfaz", "Internet", "API", "Servidor", "Datos", "Notificación"] },
  { action: "PAGAR EN LÍNEA", chain: ["Aplicación", "Cifrado", "Autorización", "Servicios", "Banco", "Respuesta"] },
  { action: "GESTIONAR UNA EMPRESA", chain: ["Procesos", "Usuarios", "Aplicaciones", "Datos", "Indicadores", "Decisiones"] },
];

function EverydaySection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  const idx = Math.min(2, Math.floor(progress * 3));
  const local = (progress * 3) % 1;
  const scenario = dailyScenarios[idx];
  return (
    <section className="scroll-scene everyday" ref={ref}>
      <div className="sticky-stage">
        <div className="everyday-copy"><p>PARA EL USUARIO</p><h2>{scenario.action}</h2></div>
        <div className="everyday-system">
          {scenario.chain.map((item, i) => {
            const reveal = segment(local, i / scenario.chain.length - .04, i / scenario.chain.length + .14);
            return <div className="chain-node" key={`${scenario.action}-${item}`} style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 20}px)` }}><span>0{i + 1}</span><strong>{item}</strong>{i < scenario.chain.length - 1 && <i style={{ transform: `scaleY(${reveal})` }} />}</div>;
          })}
        </div>
        <div className="everyday-result" style={{ opacity: segment(local, .72, .94) }}><span>TÚ VES UNA ACCIÓN.</span><strong>UN INGENIERO VE TODO EL SISTEMA.</strong></div>
        <div className="scenario-counter">0{idx + 1} / 03</div>
      </div>
    </section>
  );
}

const workPaths = [
  ["DESARROLLO DE SOFTWARE", "Desarrollo de aplicaciones", "Web, móvil y sistemas para organizaciones."],
  ["ANALÍTICA DE DATOS", "Análisis y modelos de datos", "Convertir información en apoyo para decisiones."],
  ["GESTIÓN DE TI", "Gestión de servicios TI", "Planificación, implementación y mejora de servicios tecnológicos."],
  ["CONSULTORÍA", "Consultoría tecnológica", "Software, datos, seguridad, gestión TI y transformación digital."],
  ["EMPRENDIMIENTO", "Emprendimiento tecnológico", "Soluciones digitales, automatización y productos propios."],
  ["INNOVACIÓN APLICADA", "Prototipado e innovación", "Plataformas y sistemas para necesidades productivas y sociales."],
];

function CareerSection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  const fade = 1 - segment(progress, .76, .90);
  return (
    <section className="scroll-scene careers" ref={ref} id="campo">
      <div className="sticky-stage">
        <div className="career-map" style={{ opacity: fade }}>
          <svg className="career-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {[
              [50, 50, 27, 17], [50, 50, 73, 17], [50, 50, 73, 50],
              [50, 50, 73, 83], [50, 50, 27, 83], [50, 50, 27, 50],
            ].map(([x1, y1, x2, y2], i) => {
              const draw = segment(progress, .12 + i * .05, .25 + i * .05);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} pathLength="1" style={{ strokeDashoffset: 1 - draw }} />;
            })}
          </svg>
          <div className="career-center" style={{ opacity: segment(progress, .02, .12) }}><small>PUEDES</small><strong>DESEMPEÑARTE</strong><span>en múltiples contextos</span></div>
          <div className="career-items">
            {workPaths.map(([title, role, copy], i) => {
              const reveal = segment(progress, .18 + i * .07, .31 + i * .07);
              return <article data-slot={i} key={title} style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 18}px)` }}><span>0{i + 1}</span><strong>{title}</strong><small className="career-role">{role}</small><p>{copy}</p></article>;
            })}
          </div>
        </div>
        <div className="career-summary" style={{ opacity: segment(progress, .82, .95) }}><p>DÓNDE</p><h2>Instituciones públicas, privadas, académicas y comunitarias; consultoría, emprendimiento y proyectos de transformación digital.</h2></div>
      </div>
    </section>
  );
}

const advantages = [
  ["CICLO COMPLETO", "Comprendes desde el diseño hasta la implementación y operación."],
  ["DECISIONES CON DATOS", "La información deja de ser ruido y se convierte en conocimiento útil."],
  ["VERSATILIDAD", "Puedes trabajar en organizaciones, consultoría, innovación o emprendimiento."],
  ["IMPACTO REAL", "La tecnología se aplica a productividad, educación, comunidad y transformación digital."],
];

function AdvantagesSection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  return (
    <section className="scroll-scene advantages" ref={ref}>
      <div className="sticky-stage">
        <div className="advantage-title"><p>VENTAJAS FORMATIVAS</p><h2>Una carrera que no te encierra en una sola herramienta ni en un solo rol.</h2></div>
        <div className="advantage-grid">
          {advantages.map(([title, copy], i) => {
            const reveal = segment(progress, .10 + i * .17, .26 + i * .17);
            return <article key={title} style={{ opacity: reveal, transform: `translateY(${(1 - reveal) * 36}px)` }}><span>0{i + 1}</span><i /><strong>{title}</strong><p>{copy}</p></article>;
          })}
        </div>
      </div>
    </section>
  );
}

const semesters = [
  { n: "I", courses: ["Introducción a la Programación", "Precálculo", "Diseño de Interfaces de Usuario", "Ingeniería de Sistemas I", "Integrador I"] },
  { n: "II", courses: ["Historia e Identidad Nacional", "Programación Estructurada", "Matemática Discreta", "TI en la Empresa", "Integrador II"] },
  { n: "III", courses: ["Base de Datos I", "Programación Orientada a Objetos", "Ingeniería de Sistemas II", "Álgebra lineal", "Integrador III"] },
  { n: "IV", courses: ["Programación de Aplicaciones de Escritorio", "Ingeniería de Sistemas III", "Base de Datos II", "Inglés Comunicativo A1", "Integrador IV"] },
  { n: "V", courses: ["Desarrollo Web Frontend", "Bases de datos NoSQL", "Inglés Comunicativo A2", "Infraestructura de TI", "Optativo I", "Integrador V"] },
  { n: "VI", courses: ["Desarrollo Web BackEnd", "Estadísticas y Probabilidades", "Ingeniería de datos", "Inglés Comunicativo A2+", "Optativo II", "Integrador VI"] },
  { n: "VII", courses: ["Minería de datos", "Analítica de Negocios", "Gestión de Procesos y Servicios de TI", "Proyecto de TI", "Práctica Preprofesional"] },
  { n: "VIII", courses: ["Práctica Profesional", "Modalidad de Graduación"] },
];

function CurriculumSection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  const active = Math.min(7, Math.floor(progress * 8));
  const semester = semesters[active];
  return (
    <section className="scroll-scene curriculum" ref={ref} id="plan">
      <div className="sticky-stage">
        <div className="curriculum-head"><p>LA FORMACIÓN SE CONSTRUYE SEMESTRE A SEMESTRE</p><h2>Del fundamento al <em>proyecto profesional.</em></h2></div>
        <div className="semester-card" key={semester.n}>
          <span>SEMESTRE</span><strong>{semester.n}</strong>
          <ul>{semester.courses.map((course, i) => <li key={course}><small>{String(i + 1).padStart(2, "0")}</small>{course}</li>)}</ul>
        </div>
        <div className="semester-track"><i style={{ transform: `scaleX(${progress})` }} />{semesters.map((s, i) => <span className={i <= active ? "active" : ""} key={s.n}>{s.n}</span>)}</div>
        <a className="curriculum-pdf" href="/docs/unan-managua-ingenieria-en-sistemas.pdf" target="_blank" rel="noreferrer">Abrir plan oficial completo ↗</a>
      </div>
    </section>
  );
}

function FinalSection() {
  const { ref, progress } = useScrollProgress<HTMLElement>();
  return (
    <section className="scroll-scene final" ref={ref}>
      <div className="sticky-stage">
        <div className="final-rays">{Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ transform: `rotate(${i * 30}deg) scaleX(${segment(progress, i * .024, .34 + i * .024)})` }} />)}</div>
        <div className="final-copy">
          <Fade show={1 - segment(progress, .26, .42)}><p>NO SE TRATA DE APRENDER UNA SOLA TECNOLOGÍA.</p></Fade>
          <Fade show={segment(progress, .31, .49) * (1 - segment(progress, .60, .72))}><h2>SE TRATA DE<br /><em>CONSTRUIR SISTEMAS.</em></h2></Fade>
          <Fade show={segment(progress, .66, .84)}><div className="final-question"><small>INGENIERÍA EN SISTEMAS · UNAN-MANAGUA</small><h2>¿QUÉ PROBLEMA<br />QUIERES RESOLVER?</h2><a href="/docs/unan-managua-ingenieria-en-sistemas.pdf" target="_blank" rel="noreferrer">Conocer la carrera ↗</a></div></Fade>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  return (
    <main>
      <CodeRain />
      <ScrollRail />
      <BootSequence onDone={() => setReady(true)} />
      <Navigation ready={ready} />
      <div className={`site-content ${ready ? "is-ready" : ""}`}>
        <Hero />
        <PurposeSection />
        <EvolutionSection />
        <CompetenciesSection />
        <TechnologySection />
        <EverydaySection />
        <CareerSection />
        <AdvantagesSection />
        <CurriculumSection />
        <FinalSection />
      </div>
    </main>
  );
}
