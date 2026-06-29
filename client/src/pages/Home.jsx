import {
  ArrowRight, BadgeCheck, BatteryCharging, CalendarCheck, CheckCircle2, Clock3,
  Disc3, Facebook, Gauge, House, Instagram, Mail, MapPin, Menu, MessageCircle,
  Phone, Settings, ShieldCheck, Wrench, X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { business } from "../config/business.js";

const copy = {
  es: {
    language: "Idioma",
    nav: ["Servicios", "Precios", "Nosotros", "Contacto"],
    admin: "Portal administrativo",
    availability: "Mecánica a domicilio disponible 24/7",
    kicker: "Vamos hasta tu ubicación",
    heroTitle: "Servicio mecánico móvil, claro y confiable.",
    heroLead: "Diagnóstico, mantenimiento y reparación donde esté tu vehículo. Hablamos directo, explicamos el problema y confirmamos el trabajo antes de comenzar.",
    call: "Llamar ahora",
    whatsapp: "Escribir por WhatsApp",
    trust: ["Servicio a domicilio", "Atención 24/7", "Estimados claros"],
    visualTitle: "Respuesta rápida",
    visualText: "Comparte tu ubicación, síntomas, año, marca y modelo. Te orientamos por llamada o WhatsApp.",
    needService: "¿Necesitas servicio?",
    goToYou: "Vamos hasta tu ubicación",
    strip: [["24/7", "Disponibilidad"], ["Móvil", "Servicio a domicilio"], ["Directo", "Llamada o WhatsApp"], ["Claro", "Estimado antes del trabajo"]],
    servicesKicker: "Servicios",
    servicesTitle: "Soluciones para el vehículo sin moverlo del lugar.",
    servicesLead: "Atendemos trabajos comunes de mantenimiento, diagnóstico y reparación que puedan realizarse de forma segura en tu ubicación.",
    askService: "Consultar servicio",
    services: [
      ["Mecánica general", "Diagnóstico y reparación para la mayoría de problemas mecánicos del vehículo."],
      ["Frenos y suspensión", "Pastillas, rotores, dirección, suspensión y problemas de manejo."],
      ["Diagnóstico de motor", "Luces de advertencia, códigos DTC, fallas de rendimiento y escaneo."],
      ["Eléctrico y arranque", "Batería, alternador, motor de arranque y revisión eléctrica automotriz."],
      ["Mantenimiento", "Servicios preventivos para mantener tu vehículo confiable."],
      ["Servicio móvil", "Vamos hasta tu ubicación para trabajos seguros en sitio."],
    ],
    processKicker: "Cómo trabajamos",
    processTitle: "Simple desde el primer mensaje.",
    process: [
      ["Nos cuentas el problema", "Año, marca, modelo, síntomas, luces y ubicación aproximada."],
      ["Confirmamos alcance", "Revisamos disponibilidad, acceso y si el trabajo puede hacerse en sitio."],
      ["Reparamos con claridad", "Explicamos hallazgos, piezas necesarias y mano de obra antes de avanzar."],
    ],
    pricingKicker: "Precios",
    pricingTitle: "Mano de obra estimada.",
    pricingLead: "Precios orientativos para servicios móviles comunes. El costo final puede variar según vehículo, acceso, condición y trabajo adicional.",
    pricingCondition: "Los precios incluyen solo mano de obra. Las piezas se cobran aparte. Trabajos adicionales pueden generar costos extras.",
    aboutKicker: "Yeros Auto Services LLC",
    aboutTitle: "Comunicación clara, diagnóstico práctico y trabajo hecho con cuidado.",
    aboutText: "Ayudamos a clientes que necesitan resolver fallas sin perder tiempo moviendo el vehículo. Nuestro enfoque es escuchar los síntomas, diagnosticar con criterio y explicar la reparación en palabras simples.",
    points: ["Mecánica automotriz general", "Diagnóstico y códigos DTC", "Estimados antes del trabajo", "Servicio disponible 24/7"],
    contactKicker: "Solicita servicio",
    contactTitle: "Dinos qué ocurre y dónde está tu vehículo.",
    contactText: "Llama, escribe por WhatsApp o envía un correo. Incluye año, marca, modelo, síntomas, luces de advertencia y ubicación aproximada.",
    callAnytime: "Llama a cualquier hora",
    email: "Correo",
    modality: "Modalidad",
    hours: "Horario",
    contactNotice: "Contáctanos para confirmar disponibilidad, ubicación y si la reparación puede realizarse de forma segura a domicilio.",
    request: "Solicitar servicio",
    footer: "Servicio de mecánica general a domicilio disponible 24/7.",
    rights: "Todos los derechos reservados.",
  },
  en: {
    language: "Language",
    nav: ["Services", "Pricing", "About", "Contact"],
    admin: "Admin portal",
    availability: "Mobile mechanic available 24/7",
    kicker: "We come to your location",
    heroTitle: "Mobile auto repair that feels clear and reliable.",
    heroLead: "Diagnostics, maintenance and repair wherever your vehicle is. We communicate directly, explain the issue and confirm the work before starting.",
    call: "Call now",
    whatsapp: "Message on WhatsApp",
    trust: ["Mobile service", "24/7 support", "Clear estimates"],
    visualTitle: "Fast response",
    visualText: "Share your location, symptoms, year, make and model. We help by phone or WhatsApp.",
    needService: "Need service?",
    goToYou: "We come to your location",
    strip: [["24/7", "Availability"], ["Mobile", "At-home service"], ["Direct", "Call or WhatsApp"], ["Clear", "Estimate before work"]],
    servicesKicker: "Services",
    servicesTitle: "Auto solutions without moving the vehicle.",
    servicesLead: "We handle common maintenance, diagnostic and repair jobs that can be completed safely at your location.",
    askService: "Ask about service",
    services: [
      ["General mechanical repair", "Diagnosis and repair for most vehicle mechanical problems."],
      ["Brakes and suspension", "Pads, rotors, steering, suspension and ride-quality concerns."],
      ["Engine diagnostics", "Warning lights, DTC codes, drivability problems and scan checks."],
      ["Electrical and starting", "Battery, alternator, starter and general automotive electrical checks."],
      ["Maintenance", "Preventive services that help keep your vehicle dependable."],
      ["Mobile service", "We come to your location for work that can be completed safely on site."],
    ],
    processKicker: "How it works",
    processTitle: "Simple from the first message.",
    process: [
      ["Tell us the issue", "Year, make, model, symptoms, warning lights and approximate location."],
      ["We confirm the scope", "We check availability, access and whether the job can be completed on site."],
      ["We repair with clarity", "We explain findings, needed parts and labor before moving forward."],
    ],
    pricingKicker: "Pricing",
    pricingTitle: "Estimated labor.",
    pricingLead: "Estimated labor prices for common mobile services. Final cost can vary by vehicle, access, condition and additional work.",
    pricingCondition: "Prices include labor only. Parts are charged separately. Additional work may generate extra costs.",
    aboutKicker: "Yeros Auto Services LLC",
    aboutTitle: "Clear communication, practical diagnosis and careful work.",
    aboutText: "We help customers solve vehicle problems without wasting time moving the car. Our approach is to listen to symptoms, diagnose carefully and explain the repair in plain language.",
    points: ["General automotive mechanics", "Diagnostics and DTC codes", "Estimates before approved work", "Service available 24/7"],
    contactKicker: "Request service",
    contactTitle: "Tell us what is happening and where your vehicle is.",
    contactText: "Call, message us on WhatsApp or send an email. Include the year, make, model, symptoms, warning lights and approximate location.",
    callAnytime: "Call anytime",
    email: "Email",
    modality: "Service type",
    hours: "Hours",
    contactNotice: "Contact us to confirm availability, location and whether the repair can be completed safely on site.",
    request: "Request service",
    footer: "General mobile mechanical service available 24/7.",
    rights: "All rights reserved.",
  },
};

const serviceIcons = [Settings, Disc3, Gauge, BatteryCharging, Wrench, House];
const processIcons = [MessageCircle, CalendarCheck, CheckCircle2];

const pricingSections = {
  es: [
    { title: "Servicios básicos", items: [["Cambio de aceite y filtro", "$30 - $40"], ["Pastillas de freno (un eje)", "$80 - $100"], ["Freno completo (un eje)", "$140 - $180"], ["Cambio de batería", "$25 - $35"], ["Alternador", "$100 - $140"], ["Starter", "$110 - $150"]] },
    { title: "Suspensión y dirección", items: [["Strut o amortiguador (cada uno)", "$90 - $130"], ["2 struts delanteros", "$180 - $240"], ["Ball joint", "$100 - $150"], ["Terminal de dirección", "$70 - $100"], ["Control arm", "$120 - $160"], ["Hub/Bearing", "$120 - $180"]] },
    { title: "Motor", items: [["Bobina", "$30 - $50"], ["Bujías 4 cilindros", "$90 - $120"], ["Bujías 6 cilindros", "$140 - $180"], ["Empaque tapa válvulas", "$150 - $200"], ["Bomba de agua", "$180 - $300"], ["Radiador", "$150 - $200"]] },
    { title: "Aire acondicionado", items: [["Compresor AC", "$220 - $350"], ["Condensador", "$150 - $200"], ["Vaciar y cargar AC", "$100 - $150"]] },
    { title: "Diagnóstico", items: [["Escaneo simple", "$40 - $50"], ["Diagnóstico eléctrico", "$100 - $150"], ["Diagnóstico profundo", "$120 - $180"]] },
  ],
  en: [
    { title: "Basic services", items: [["Oil and filter change", "$30 - $40"], ["Brake pads (one axle)", "$80 - $100"], ["Complete brake service (one axle)", "$140 - $180"], ["Battery replacement", "$25 - $35"], ["Alternator", "$100 - $140"], ["Starter", "$110 - $150"]] },
    { title: "Suspension and steering", items: [["Strut or shock (each)", "$90 - $130"], ["2 front struts", "$180 - $240"], ["Ball joint", "$100 - $150"], ["Tie rod end", "$70 - $100"], ["Control arm", "$120 - $160"], ["Hub/Bearing", "$120 - $180"]] },
    { title: "Engine", items: [["Ignition coil", "$30 - $50"], ["Spark plugs 4-cylinder", "$90 - $120"], ["Spark plugs 6-cylinder", "$140 - $180"], ["Valve cover gasket", "$150 - $200"], ["Water pump", "$180 - $300"], ["Radiator", "$150 - $200"]] },
    { title: "Air conditioning", items: [["AC compressor", "$220 - $350"], ["Condenser", "$150 - $200"], ["Evacuate and recharge AC", "$100 - $150"]] },
    { title: "Diagnostics", items: [["Simple scan", "$40 - $50"], ["Electrical diagnosis", "$100 - $150"], ["Deep diagnosis", "$120 - $180"]] },
  ],
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      const saved = window.localStorage?.getItem("yeros_public_language");
      if (saved === "en" || saved === "es") return saved;
      return window.navigator?.language?.toLowerCase().startsWith("es") ? "es" : "en";
    } catch {
      return "en";
    }
  });
  const t = copy[language];

  function changeLanguage(value) {
    setLanguage(value);
    try {
      window.localStorage?.setItem("yeros_public_language", value);
    } catch {
      // Browser storage can be blocked; language still changes for this visit.
    }
    document.documentElement.lang = value;
  }

  return <div className="public-site">
    <header className="public-header">
      <a className="public-brand" href="#top" aria-label={business.name}><img src="/yeros-auto-logo.png" alt={business.name} /></a>
      <button className="public-menu-button" onClick={() => setMenuOpen((current) => !current)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? "public-nav open" : "public-nav"}>
        <a href="#services" onClick={() => setMenuOpen(false)}>{t.nav[0]}</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>{t.nav[1]}</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>{t.nav[2]}</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>{t.nav[3]}</a>
        <Link to="/login" className="portal-link">{t.admin}</Link>
      </nav>
      <div className="public-header-actions">
        <div className="language-switch" aria-label={t.language}>
          <button className={language === "es" ? "active" : ""} onClick={() => changeLanguage("es")}>ES</button>
          <button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button>
        </div>
        <a className="public-call" href={"tel:" + business.phone}><Phone size={17} /> {business.phoneDisplay}</a>
      </div>
    </header>

    <main id="top">
      <section className="public-hero">
        <div className="public-hero-copy">
          <div className="availability"><span /> {t.availability}</div>
          <p className="public-kicker">{t.kicker}</p>
          <h1>{t.heroTitle}</h1>
          <p className="hero-lead">{t.heroLead}</p>
          <div className="hero-actions">
            <a className="public-button red" href={"tel:" + business.phone}><Phone size={18} /> {t.call}</a>
            <a className="public-button whatsapp" href={"https://wa.me/" + business.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18} /> {t.whatsapp}</a>
          </div>
          <div className="hero-trust">{t.trust.map((item, index) => {
            const Icon = [House, Clock3, ShieldCheck][index];
            return <span key={item}><Icon />{item}</span>;
          })}</div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-photo-card">
            <img src="/mobile-mechanic-hero.png" alt="" loading="eager" />
            <div className="scene-card hero-photo-caption"><CheckCircle2 /><strong>{t.visualTitle}</strong><span>{t.visualText}</span></div>
          </div>
          <div className="hero-contact-card"><House /><div><span>{t.needService}</span><strong>{t.goToYou}</strong></div></div>
        </div>
      </section>

      <section className="public-strip">{t.strip.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>

      <section className="public-section" id="services">
        <div className="public-section-heading"><p className="public-kicker">{t.servicesKicker}</p><h2>{t.servicesTitle}</h2><p>{t.servicesLead}</p></div>
        <div className="service-card-grid">{t.services.map(([title, text], index) => {
          const Icon = serviceIcons[index];
          return <article className="public-service-card" key={title}><div className="service-icon"><Icon /></div><h3>{title}</h3><p>{text}</p><a href={"https://wa.me/" + business.whatsapp} target="_blank" rel="noreferrer">{t.askService} <ArrowRight /></a></article>;
        })}</div>
      </section>

      <section className="process-section">
        <div className="public-section-heading"><p className="public-kicker">{t.processKicker}</p><h2>{t.processTitle}</h2></div>
        <div className="process-grid">{t.process.map(([title, text], index) => {
          const Icon = processIcons[index];
          return <article key={title}><div><Icon /></div><h3>{title}</h3><p>{text}</p></article>;
        })}</div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="public-section-heading"><p className="public-kicker">{t.pricingKicker}</p><h2>{t.pricingTitle}</h2><p>{t.pricingLead}</p></div>
        <div className="pricing-grid">{pricingSections[language].map((section) => <article className="pricing-card" key={section.title}><h3>{section.title}</h3><div className="pricing-lines">{section.items.map(([job, price]) => <div key={job}><span>{job}</span><strong>{price}</strong></div>)}</div></article>)}</div>
        <div className="pricing-condition"><BadgeCheck /><p>{t.pricingCondition}</p></div>
      </section>

      <section className="public-about" id="about">
        <div className="about-mark"><img src="/yeros-auto-logo.png" alt={business.name} /></div>
        <div className="about-copy"><p className="public-kicker">{t.aboutKicker}</p><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><div className="about-points">{t.points.map((point) => <span key={point}><BadgeCheck />{point}</span>)}</div></div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy"><p className="public-kicker">{t.contactKicker}</p><h2>{t.contactTitle}</h2><p>{t.contactText}</p><div className="contact-actions">
          <a href={"tel:" + business.phone}><Phone /><div><span>{t.callAnytime}</span><strong>{business.phoneDisplay}</strong></div></a>
          <a href={"https://wa.me/" + business.whatsapp} target="_blank" rel="noreferrer"><MessageCircle /><div><span>WhatsApp</span><strong>{business.phoneDisplay}</strong></div></a>
          <a href={"mailto:" + business.email}><Mail /><div><span>{t.email}</span><strong>{business.email}</strong></div></a>
          <div><MapPin /><div><span>{t.modality}</span><strong>{language === "es" ? business.location : "Mobile mechanical service"}</strong></div></div>
        </div></div>
        <div className="contact-panel"><Clock3 /><p>{t.hours}</p><h3>{business.hours}</h3><span>{t.contactNotice}</span><a className="public-button red" href={"tel:" + business.phone}>{t.request}<ArrowRight /></a></div>
      </section>
    </main>

    <footer className="public-footer">
      <div><img src="/yeros-auto-logo.png" alt={business.name} /><p>{t.footer}</p></div>
      <div className="social-links">
        <a href={"https://www.facebook.com/search/top?q=" + encodeURIComponent(business.socialName)} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a>
        <a href={"https://www.instagram.com/explore/search/keyword/?q=" + encodeURIComponent(business.socialName)} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a>
        <a href={"https://www.tiktok.com/search?q=" + encodeURIComponent(business.socialName)} target="_blank" rel="noreferrer" aria-label="TikTok"><span className="tiktok-mark">T</span></a>
      </div>
      <p>Copyright {new Date().getFullYear()} {business.name}. {t.rights}</p>
    </footer>
  </div>;
}
