import {
  ArrowRight, BadgeCheck, BatteryCharging, CarFront, Clock3, Disc3, Facebook,
  Gauge, House, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, Settings,
  ShieldCheck, Wrench, X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { business } from "../config/business.js";

const copy = {
  es: {
    language: "Idioma",
    nav: ["Servicios", "Nosotros", "Contacto"],
    admin: "Login",
    availability: "Mecánica a domicilio disponible 24/7",
    kicker: "Servicio donde estés",
    heroTitle: "Mecánica general a domicilio.",
    heroLead: "Vamos hasta tu ubicación para diagnosticar, mantener y reparar tu vehículo, con atención directa por llamada o WhatsApp.",
    call: "Llamar ahora",
    whatsapp: "WhatsApp",
    trust: ["Servicio a domicilio", "Disponibilidad 24/7", "Atención confiable"],
    logoText: "Servicio mecánico a domicilio para ayudarte donde se encuentre tu vehículo.",
    needService: "¿Necesitas servicio?",
    goToYou: "Vamos hasta tu ubicación",
    strip: [["24/7", "Disponibilidad"], ["General", "Mecánica automotriz"], ["A domicilio", "Vamos hasta ti"], ["Directo", "Llamada o WhatsApp"]],
    servicesKicker: "Nuestros servicios",
    servicesTitle: "Servicio mecánico en la ubicación de tu vehículo.",
    servicesLead: "Desde mantenimiento hasta problemas de diagnóstico, contáctanos y cuéntanos qué está haciendo tu vehículo y dónde se encuentra.",
    askService: "Consultar servicio",
    services: [
      ["Mecánica general", "Diagnóstico y reparación para la mayoría de los problemas mecánicos del vehículo."],
      ["Frenos y suspensión", "Servicio de frenos, dirección, suspensión y problemas de manejo."],
      ["Diagnóstico de motor", "Luces de advertencia, códigos DTC, fallas de rendimiento y diagnóstico."],
      ["Sistema eléctrico y arranque", "Batería, alternador, motor de arranque y diagnóstico eléctrico automotriz."],
      ["Mantenimiento", "Mantenimiento preventivo y reparaciones para mantener tu vehículo confiable."],
      ["Mecánica a domicilio", "Vamos hasta tu ubicación para trabajos que puedan realizarse de forma segura en el lugar."],
    ],
    aboutKicker: "Sobre Yeros Auto Services",
    aboutTitle: "Comunicación clara. Diagnóstico práctico. Reparaciones de calidad.",
    aboutText: "Yeros Auto Services LLC ofrece mecánica general a domicilio para clientes que necesitan ayuda confiable con sus vehículos. Escuchamos los síntomas, diagnosticamos el problema y explicamos la reparación.",
    points: ["Mecánica automotriz general", "Diagnóstico y códigos DTC", "Estimados antes del trabajo", "Servicio disponible 24/7"],
    contactKicker: "Solicita servicio a domicilio",
    contactTitle: "Dinos qué ocurre y dónde está tu vehículo.",
    contactText: "Llama, escribe por WhatsApp o envía un correo. Incluye año, marca, modelo, síntomas, luces de advertencia y tu ubicación aproximada.",
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
    nav: ["Services", "About", "Contact"],
    admin: "Login",
    availability: "Mobile mechanic available 24/7",
    kicker: "Service where you are",
    heroTitle: "General mobile auto repair.",
    heroLead: "We come to your location to diagnose, maintain and repair your vehicle, with direct support by phone or WhatsApp.",
    call: "Call now",
    whatsapp: "WhatsApp",
    trust: ["Mobile service", "24/7 availability", "Reliable service"],
    logoText: "Mobile mechanical service to help you wherever your vehicle is located.",
    needService: "Need service?",
    goToYou: "We come to your location",
    strip: [["24/7", "Availability"], ["General", "Auto repair"], ["Mobile", "We come to you"], ["Direct", "Call or WhatsApp"]],
    servicesKicker: "Our services",
    servicesTitle: "Mechanical service at your vehicle's location.",
    servicesLead: "From routine maintenance to diagnostic problems, contact us and tell us what your vehicle is doing and where it is located.",
    askService: "Ask about this service",
    services: [
      ["General mechanical repair", "Diagnosis and repair for most vehicle mechanical problems."],
      ["Brakes and suspension", "Brake, steering, suspension and ride-quality service."],
      ["Engine diagnostics", "Warning lights, DTC codes, drivability problems and performance diagnosis."],
      ["Electrical and starting", "Battery, alternator, starter and general automotive electrical diagnosis."],
      ["Maintenance", "Preventive maintenance and repairs that help keep your vehicle dependable."],
      ["Mobile mechanic", "We come to your location for work that can be completed safely on site."],
    ],
    aboutKicker: "About Yeros Auto Services",
    aboutTitle: "Clear communication. Practical diagnosis. Quality repairs.",
    aboutText: "Yeros Auto Services LLC provides mobile general mechanical service for customers who need dependable help with their vehicles. We listen to the symptoms, diagnose the problem and explain the repair.",
    points: ["General automotive mechanics", "Diagnostics and DTC codes", "Estimates before approved work", "Service available 24/7"],
    contactKicker: "Request mobile service",
    contactTitle: "Tell us what is happening and where your vehicle is.",
    contactText: "Call, message us on WhatsApp or send an email. Include the year, make, model, symptoms, warning lights and your approximate location.",
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

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("yeros_public_language");
    if (saved === "en" || saved === "es") return saved;
    return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
  });
  const t = copy[language];

  function changeLanguage(value) {
    setLanguage(value);
    localStorage.setItem("yeros_public_language", value);
    document.documentElement.lang = value;
  }

  return <div className="public-site">
    <header className="public-header">
      <a className="public-brand" href="#top"><img src="/yeros-auto-logo.png" alt={business.name} /></a>
      <button className="public-menu-button" onClick={() => setMenuOpen((current) => !current)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? "public-nav open" : "public-nav"}>
        <a href="#services" onClick={() => setMenuOpen(false)}>{t.nav[0]}</a>
        <a href="#about" onClick={() => setMenuOpen(false)}>{t.nav[1]}</a>
        <a href="#contact" onClick={() => setMenuOpen(false)}>{t.nav[2]}</a>
        <Link to="/login" className="portal-link">{t.admin}</Link>
      </nav>
      <div className="public-header-actions">
        <div className="language-switch" aria-label={t.language}>
          <button className={language === "es" ? "active" : ""} onClick={() => changeLanguage("es")}>ES</button>
          <button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button>
        </div>
        <a className="public-call" href={`tel:${business.phone}`}><Phone size={17} /> {business.phoneDisplay}</a>
        
      </div>
    </header>

    <main id="top">
      <section className="public-hero">
        <div className="hero-glow" />
        <div className="public-hero-copy">
          <div className="availability"><span /> {t.availability}</div>
          <p className="public-kicker">{t.kicker}</p>
          <h1>{t.heroTitle}</h1>
          <p className="hero-lead">{t.heroLead}</p>
          <div className="hero-actions">
            <a className="public-button red" href={`tel:${business.phone}`}><Phone size={18} /> {t.call}</a>
            <a className="public-button whatsapp" href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> {t.whatsapp}</a>
          </div>
          <div className="hero-trust"><span><House />{t.trust[0]}</span><span><Clock3 />{t.trust[1]}</span><span><ShieldCheck />{t.trust[2]}</span></div>
        </div>
        <div className="hero-visual">
          <div className="hero-logo-card"><img src="/yeros-auto-logo.png" alt="" /><p>{t.logoText}</p></div>
          <div className="hero-contact-card"><House /><div><span>{t.needService}</span><strong>{t.goToYou}</strong></div></div>
        </div>
      </section>

      <section className="public-strip">{t.strip.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>

      <section className="public-section" id="services">
        <div className="public-section-heading"><p className="public-kicker">{t.servicesKicker}</p><h2>{t.servicesTitle}</h2><p>{t.servicesLead}</p></div>
        <div className="service-card-grid">{t.services.map(([title, text], index) => {
          const Icon = serviceIcons[index];
          return <article className="public-service-card" key={title}><div className="service-icon"><Icon /></div><h3>{title}</h3><p>{text}</p><a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer">{t.askService} <ArrowRight /></a></article>;
        })}</div>
      </section>

      <section className="public-about" id="about">
        <div className="about-mark"><img src="/yeros-auto-logo.png" alt={business.name} /></div>
        <div className="about-copy"><p className="public-kicker">{t.aboutKicker}</p><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><div className="about-points">{t.points.map((point) => <span key={point}><BadgeCheck />{point}</span>)}</div></div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy">
          <p className="public-kicker">{t.contactKicker}</p><h2>{t.contactTitle}</h2><p>{t.contactText}</p>
          <div className="contact-actions">
            <a href={`tel:${business.phone}`}><Phone /><div><span>{t.callAnytime}</span><strong>{business.phoneDisplay}</strong></div></a>
            <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /><div><span>WhatsApp</span><strong>{business.phoneDisplay}</strong></div></a>
            <a href={`mailto:${business.email}`}><Mail /><div><span>{t.email}</span><strong>{business.email}</strong></div></a>
            <div><MapPin /><div><span>{t.modality}</span><strong>{language === "es" ? business.location : "Mobile mechanical service"}</strong></div></div>
          </div>
        </div>
        <div className="contact-panel"><Clock3 /><p>{t.hours}</p><h3>{business.hours}</h3><span>{t.contactNotice}</span><a className="public-button red" href={`tel:${business.phone}`}>{t.request}<ArrowRight /></a></div>
      </section>
    </main>

    <footer className="public-footer">
      <div><img src="/yeros-auto-logo.png" alt={business.name} /><p>{t.footer}</p></div>
      <div className="social-links">
        <a href={`https://www.facebook.com/search/top?q=${encodeURIComponent(business.socialName)}`} target="_blank" rel="noreferrer"><Facebook /></a>
        <a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(business.socialName)}`} target="_blank" rel="noreferrer"><Instagram /></a>
        <a href={`https://www.tiktok.com/search?q=${encodeURIComponent(business.socialName)}`} target="_blank" rel="noreferrer"><span className="tiktok-mark">T</span></a>
      </div>
      <p>Copyright {new Date().getFullYear()} {business.name}. {t.rights}</p>
    </footer>
  </div>;
}
