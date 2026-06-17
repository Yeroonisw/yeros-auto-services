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
    nav: ["Servicios", "Precios", "Nosotros", "Contacto"],
    admin: "Portal administrativo",
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
    pricingKicker: "Lista de precios",
    pricingTitle: "Precios de mano de obra.",
    pricingLead: "Valores estimados para servicios comunes a domicilio. El precio final puede variar segun el vehiculo, acceso, condicion y trabajo adicional necesario.",
    priceLabel: "Precio",
    pricingCondition: "Precios solo incluyen mano de obra. Piezas se cobran aparte. Trabajos adicionales pueden generar costos extras.",
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
    nav: ["Services", "Pricing", "About", "Contact"],
    admin: "Admin portal",
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
    pricingKicker: "Price list",
    pricingTitle: "Labor pricing.",
    pricingLead: "Estimated labor prices for common mobile services. Final price can vary by vehicle, access, condition and any additional work needed.",
    priceLabel: "Price",
    pricingCondition: "Prices include labor only. Parts are charged separately. Additional work may generate extra costs.",
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

const pricingSections = {
  es: [
    {
      title: "Servicios Basicos",
      items: [
        ["Cambio de aceite y filtro", "$30 - $40"],
        ["Pastillas de freno (un eje)", "$80 - $100"],
        ["Freno completo (un eje)", "$140 - $180"],
        ["Cambio de bateria", "$25 - $35"],
        ["Alternador", "$100 - $140"],
        ["Starter", "$110 - $150"],
      ],
    },
    {
      title: "Suspension y Direccion",
      items: [
        ["Strut o amortiguador (cada uno)", "$90 - $130"],
        ["2 Struts delanteros", "$180 - $240"],
        ["Ball joint", "$100 - $150"],
        ["Terminal de direccion", "$70 - $100"],
        ["Control arm", "$120 - $160"],
        ["Hub/Bearing", "$120 - $180"],
      ],
    },
    {
      title: "Motor",
      items: [
        ["Bobina", "$30 - $50"],
        ["Bujias 4 cilindros", "$90 - $120"],
        ["Bujias 6 cilindros", "$140 - $180"],
        ["Empaque tapa valvulas", "$150 - $200"],
        ["Bomba de agua", "$180 - $300"],
        ["Radiador", "$150 - $200"],
      ],
    },
    {
      title: "Aire Acondicionado",
      items: [
        ["Compresor AC", "$220 - $350"],
        ["Condensador", "$150 - $200"],
        ["Vaciar y cargar AC", "$100 - $150"],
      ],
    },
    {
      title: "Diagnostico",
      items: [
        ["Escaneo simple", "$40 - $50"],
        ["Diagnostico electrico", "$100 - $150"],
        ["Diagnostico profundo", "$120 - $180"],
      ],
    },
  ],
  en: [
    {
      title: "Basic Services",
      items: [
        ["Oil and filter change", "$30 - $40"],
        ["Brake pads (one axle)", "$80 - $100"],
        ["Complete brake service (one axle)", "$140 - $180"],
        ["Battery replacement", "$25 - $35"],
        ["Alternator", "$100 - $140"],
        ["Starter", "$110 - $150"],
      ],
    },
    {
      title: "Suspension and Steering",
      items: [
        ["Strut or shock (each)", "$90 - $130"],
        ["2 front struts", "$180 - $240"],
        ["Ball joint", "$100 - $150"],
        ["Tie rod end", "$70 - $100"],
        ["Control arm", "$120 - $160"],
        ["Hub/Bearing", "$120 - $180"],
      ],
    },
    {
      title: "Engine",
      items: [
        ["Ignition coil", "$30 - $50"],
        ["Spark plugs 4-cylinder", "$90 - $120"],
        ["Spark plugs 6-cylinder", "$140 - $180"],
        ["Valve cover gasket", "$150 - $200"],
        ["Water pump", "$180 - $300"],
        ["Radiator", "$150 - $200"],
      ],
    },
    {
      title: "Air Conditioning",
      items: [
        ["AC compressor", "$220 - $350"],
        ["Condenser", "$150 - $200"],
        ["Evacuate and recharge AC", "$100 - $150"],
      ],
    },
    {
      title: "Diagnostics",
      items: [
        ["Simple scan", "$40 - $50"],
        ["Electrical diagnosis", "$100 - $150"],
        ["Deep diagnosis", "$120 - $180"],
      ],
    },
  ],
};

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

      <section className="pricing-section" id="pricing">
        <div className="public-section-heading"><p className="public-kicker">{t.pricingKicker}</p><h2>{t.pricingTitle}</h2><p>{t.pricingLead}</p></div>
        <div className="pricing-grid">{pricingSections[language].map((section) => <article className="pricing-card" key={section.title}>
          <h3>{section.title}</h3>
          <div className="pricing-lines">{section.items.map(([job, price]) => <div key={job}><span>{job}</span><strong>{price}</strong></div>)}</div>
        </article>)}</div>
        <div className="pricing-condition"><BadgeCheck /><p>{t.pricingCondition}</p></div>
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
