import {
  ArrowRight, BadgeCheck, BatteryCharging, CalendarCheck, CheckCircle2, ChevronDown,
  Clock3, Disc3, Facebook, Gauge, House, Instagram, Mail, MapPin, Menu,
  MessageCircle, Phone, Settings, ShieldCheck, Sparkles, Wrench, X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { business } from "../config/business.js";

const copy = {
  es: {
    nav: ["Servicios", "Cómo funciona", "Precios", "Contacto"], admin: "Portal",
    available: "Mecánico móvil disponible 24/7", kicker: "Nosotros vamos hasta ti",
    title: "Tu auto vuelve a moverse. Sin salir de casa.",
    lead: "Diagnóstico, mantenimiento y reparación móvil con comunicación clara, precios transparentes y atención cuando la necesitas.",
    call: "Llamar ahora", whatsapp: "Cotizar por WhatsApp",
    trust: ["Servicio a domicilio", "Atención 24/7", "Estimado antes de reparar"],
    photoTitle: "Respuesta rápida", photoText: "Cuéntanos qué sucede y confirma tu servicio directamente por WhatsApp.",
    strip: [["24/7", "Disponibilidad"], ["Móvil", "Vamos hasta ti"], ["Claro", "Precio por adelantado"], ["Directo", "Hablas con el mecánico"]],
    servicesKicker: "Lo que hacemos", servicesTitle: "Servicio completo, justo donde está tu vehículo.",
    servicesLead: "Resolvemos mantenimiento y reparaciones comunes de forma segura en tu casa, trabajo o ubicación.", ask: "Consultar",
    services: [
      ["Mecánica general", "Diagnóstico y reparación de los problemas mecánicos más comunes."],
      ["Frenos y suspensión", "Pastillas, rotores, dirección, suspensión y problemas de manejo."],
      ["Diagnóstico de motor", "Check engine, códigos DTC, pérdida de potencia y escaneo profesional."],
      ["Sistema eléctrico", "Batería, alternador, starter y fallas eléctricas automotrices."],
      ["Mantenimiento", "Aceite, filtros, bujías y cuidado preventivo para evitar averías."],
      ["Servicio móvil", "Herramientas y experiencia directamente en la ubicación de tu auto."],
    ],
    processKicker: "Así de fácil", processTitle: "Tres pasos. Cero complicaciones.",
    process: [
      ["Cuéntanos el problema", "Envíanos año, marca, modelo, síntomas y tu ubicación aproximada."],
      ["Recibe orientación", "Confirmamos disponibilidad, alcance del trabajo y un estimado claro."],
      ["Reparamos tu vehículo", "Llegamos a tu ubicación y comenzamos solo con tu autorización."],
    ],
    pricingKicker: "Precios transparentes", pricingTitle: "Estimados de mano de obra.",
    pricingLead: "Una referencia rápida para los servicios móviles más solicitados.",
    pricingNote: "Precios de mano de obra. Piezas y trabajos adicionales se cotizan por separado después de revisar el vehículo.",
    quoteKicker: "Cotización rápida", quoteTitle: "Cuéntanos qué necesita tu auto.",
    quoteLead: "Completa los datos y abriremos WhatsApp con tu solicitud lista para enviar.",
    name: "Tu nombre", phone: "Teléfono", vehicle: "Año, marca y modelo", location: "Ciudad o ubicación",
    issue: "¿Qué sucede con el vehículo?", issuePlaceholder: "Ej. No enciende, hace un ruido al frenar o tiene la luz de check engine...",
    urgency: "¿Cuándo necesitas servicio?", urgencyOptions: ["Lo antes posible", "Hoy", "Esta semana", "Solo quiero una cotización"],
    send: "Enviar solicitud por WhatsApp", privacy: "No almacenamos estos datos. Solo se usan para preparar tu mensaje.",
    messageTitle: "Nueva solicitud de servicio",
    aboutKicker: "Por qué elegirnos", aboutTitle: "Servicio honesto, práctico y hecho con cuidado.",
    aboutText: "Escuchamos los síntomas, revisamos el vehículo con criterio y explicamos la reparación en palabras simples antes de comenzar.",
    points: ["Atención directa", "Diagnóstico profesional", "Aprobación antes del trabajo", "Servicio disponible 24/7"],
    faqKicker: "Preguntas frecuentes", faqTitle: "Antes de solicitar servicio.",
    faqs: [
      ["¿A qué lugares van?", "El servicio depende de tu ubicación y la disponibilidad. Envíanos tu ciudad o código postal para confirmarlo."],
      ["¿El precio incluye las piezas?", "Los precios publicados son estimados de mano de obra. Las piezas se cotizan por separado."],
      ["¿Pueden reparar cualquier problema a domicilio?", "Muchos trabajos sí. Primero confirmamos que pueda realizarse de forma segura en tu ubicación."],
      ["¿Atienden emergencias?", "Estamos disponibles 24/7. La llegada depende de la ubicación, el trabajo y las citas activas."],
    ],
    contactKicker: "Estamos listos", contactTitle: "Habla directamente con Yeros Auto Services.",
    contactText: "Incluye los datos del vehículo, los síntomas y tu ubicación para responderte más rápido.",
    mobile: "Mecánica a domicilio", hours: "Horario", open: "Abierto 24/7",
    footer: "Mecánica móvil clara, confiable y disponible 24/7.", rights: "Todos los derechos reservados.",
  },
  en: {
    nav: ["Services", "How it works", "Pricing", "Contact"], admin: "Portal",
    available: "Mobile mechanic available 24/7", kicker: "We come to you",
    title: "Get your car moving. Without leaving home.",
    lead: "Mobile diagnostics, maintenance and repair with clear communication, transparent pricing and help when you need it.",
    call: "Call now", whatsapp: "Get a WhatsApp quote",
    trust: ["Mobile service", "24/7 availability", "Estimate before repair"],
    photoTitle: "Fast response", photoText: "Tell us what happened and confirm your service directly through WhatsApp.",
    strip: [["24/7", "Availability"], ["Mobile", "We come to you"], ["Clear", "Upfront pricing"], ["Direct", "Talk to the mechanic"]],
    servicesKicker: "What we do", servicesTitle: "Complete service, right where your vehicle is.",
    servicesLead: "We handle common maintenance and repairs safely at your home, workplace or vehicle location.", ask: "Ask about it",
    services: [
      ["General repair", "Diagnosis and repair for the most common mechanical problems."],
      ["Brakes and suspension", "Pads, rotors, steering, suspension and ride concerns."],
      ["Engine diagnostics", "Check-engine lights, DTC codes, power loss and professional scanning."],
      ["Electrical systems", "Battery, alternator, starter and automotive electrical faults."],
      ["Maintenance", "Oil, filters, spark plugs and preventive care that helps avoid breakdowns."],
      ["Mobile service", "Professional tools and experience brought directly to your vehicle."],
    ],
    processKicker: "That simple", processTitle: "Three steps. No hassle.",
    process: [
      ["Tell us the problem", "Send the year, make, model, symptoms and your approximate location."],
      ["Get clear guidance", "We confirm availability, job scope and a straightforward estimate."],
      ["We repair your vehicle", "We arrive at your location and only begin with your approval."],
    ],
    pricingKicker: "Transparent pricing", pricingTitle: "Estimated labor prices.",
    pricingLead: "A quick reference for our most requested mobile services.",
    pricingNote: "Labor estimates only. Parts and additional work are quoted separately after the vehicle is assessed.",
    quoteKicker: "Quick quote", quoteTitle: "Tell us what your car needs.",
    quoteLead: "Complete the details and we will open WhatsApp with your request ready to send.",
    name: "Your name", phone: "Phone", vehicle: "Year, make and model", location: "City or location",
    issue: "What is happening with the vehicle?", issuePlaceholder: "Example: It won't start, makes noise while braking or the check-engine light is on...",
    urgency: "When do you need service?", urgencyOptions: ["As soon as possible", "Today", "This week", "I only need a quote"],
    send: "Send request through WhatsApp", privacy: "We do not store this information. It is only used to prepare your message.",
    messageTitle: "New service request",
    aboutKicker: "Why choose us", aboutTitle: "Honest, practical service done with care.",
    aboutText: "We listen to the symptoms, assess the vehicle carefully and explain the repair in plain language before starting.",
    points: ["Direct communication", "Professional diagnostics", "Approval before work", "Available 24/7"],
    faqKicker: "Frequently asked", faqTitle: "Before requesting service.",
    faqs: [
      ["What areas do you serve?", "Service depends on your location and daily availability. Send your city or ZIP code so we can confirm."],
      ["Does the price include parts?", "Published prices are labor estimates. Parts are quoted separately."],
      ["Can every repair be done on-site?", "Many can. We first confirm the repair can be completed safely at your location."],
      ["Do you handle emergencies?", "We are available 24/7. Arrival time depends on location, job type and active appointments."],
    ],
    contactKicker: "We are ready", contactTitle: "Talk directly with Yeros Auto Services.",
    contactText: "Include vehicle details, symptoms and location for a faster response.",
    mobile: "Mobile auto repair", hours: "Hours", open: "Open 24/7",
    footer: "Clear, reliable mobile auto repair available 24/7.", rights: "All rights reserved.",
  },
};

const prices = {
  es: [["Cambio de aceite y filtro", "$30 – $40"], ["Pastillas de freno (un eje)", "$80 – $100"], ["Cambio de batería", "$25 – $35"], ["Alternador", "$100 – $140"], ["Bujías 4 cilindros", "$90 – $120"], ["Escaneo simple", "$40 – $50"]],
  en: [["Oil and filter change", "$30 – $40"], ["Brake pads (one axle)", "$80 – $100"], ["Battery replacement", "$25 – $35"], ["Alternator", "$100 – $140"], ["4-cylinder spark plugs", "$90 – $120"], ["Basic scan", "$40 – $50"]],
};
const serviceIcons = [Settings, Disc3, Gauge, BatteryCharging, Wrench, House];
const processIcons = [MessageCircle, CalendarCheck, CheckCircle2];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem("yeros_public_language");
      if (saved === "es" || saved === "en") return saved;
      return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
    } catch { return "es"; }
  });
  const [quote, setQuote] = useState({ name: "", phone: "", vehicle: "", location: "", issue: "", urgency: "" });
  const [openFaq, setOpenFaq] = useState(0);
  const t = copy[language];

  function changeLanguage(next) {
    setLanguage(next);
    try { localStorage.setItem("yeros_public_language", next); } catch { /* language still changes */ }
    document.documentElement.lang = next;
  }
  function updateQuote(event) {
    setQuote((current) => ({ ...current, [event.target.name]: event.target.value }));
  }
  function submitQuote(event) {
    event.preventDefault();
    const message = [`*${t.messageTitle}*`, `${t.name}: ${quote.name}`, `${t.phone}: ${quote.phone}`, `${t.vehicle}: ${quote.vehicle}`, `${t.location}: ${quote.location}`, `${t.urgency}: ${quote.urgency}`, `${t.issue}: ${quote.issue}`].join("\n");
    window.open(`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="public-site refreshed-public-site">
    <header className="public-header">
      <a className="public-brand" href="#top" aria-label={business.name}><img src="/yeros-auto-logo.png" alt={business.name} /></a>
      <button className="public-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? "public-nav open" : "public-nav"}>
        {["#services", "#process", "#pricing", "#contact"].map((href, index) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{t.nav[index]}</a>)}
        <Link to="/login" className="portal-link">{t.admin}</Link>
      </nav>
      <div className="public-header-actions">
        <div className="language-switch">{["es", "en"].map((lang) => <button key={lang} className={language === lang ? "active" : ""} onClick={() => changeLanguage(lang)}>{lang.toUpperCase()}</button>)}</div>
        <a className="public-call" href={`tel:${business.phone}`}><Phone size={17} /> {business.phoneDisplay}</a>
      </div>
    </header>

    <main id="top">
      <section className="public-hero">
        <div className="public-hero-copy">
          <div className="availability"><span /> {t.available}</div><p className="public-kicker">{t.kicker}</p>
          <h1>{t.title}</h1><p className="hero-lead">{t.lead}</p>
          <div className="hero-actions"><a className="public-button red" href={`tel:${business.phone}`}><Phone size={18} /> {t.call}</a><a className="public-button whatsapp" href="#quote"><MessageCircle size={18} /> {t.whatsapp}</a></div>
          <div className="hero-trust">{t.trust.map((item, index) => { const Icon = [House, Clock3, ShieldCheck][index]; return <span key={item}><Icon size={16} />{item}</span>; })}</div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo-card"><img src="/mobile-mechanic-hero.png" alt={language === "es" ? "Mecánico trabajando en un vehículo" : "Mechanic working on a vehicle"} /><div className="scene-card hero-photo-caption"><CheckCircle2 /><strong>{t.photoTitle}</strong><span>{t.photoText}</span></div></div>
          <a className="hero-contact-card" href="#quote"><Sparkles /><div><span>{t.whatsapp}</span><strong>{business.phoneDisplay}</strong></div><ArrowRight /></a>
        </div>
      </section>

      <section className="public-strip">{t.strip.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</section>

      <section className="public-section" id="services">
        <div className="public-section-heading"><p className="public-kicker">{t.servicesKicker}</p><h2>{t.servicesTitle}</h2><p>{t.servicesLead}</p></div>
        <div className="service-card-grid">{t.services.map(([title, text], index) => { const Icon = serviceIcons[index]; return <article className="public-service-card" key={title}><div className="service-icon"><Icon /></div><h3>{title}</h3><p>{text}</p><a href="#quote">{t.ask} <ArrowRight /></a></article>; })}</div>
      </section>

      <section className="process-section" id="process">
        <div className="public-section-heading"><p className="public-kicker">{t.processKicker}</p><h2>{t.processTitle}</h2></div>
        <div className="process-grid">{t.process.map(([title, text], index) => { const Icon = processIcons[index]; return <article key={title}><span className="process-number">0{index + 1}</span><div><Icon /></div><h3>{title}</h3><p>{text}</p></article>; })}</div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="public-section-heading"><p className="public-kicker">{t.pricingKicker}</p><h2>{t.pricingTitle}</h2><p>{t.pricingLead}</p></div>
        <div className="price-list-card">{prices[language].map(([service, price]) => <div key={service}><span>{service}</span><strong>{price}</strong></div>)}</div>
        <div className="pricing-condition"><BadgeCheck /><p>{t.pricingNote}</p></div>
      </section>

      <section className="quote-section" id="quote">
        <div className="quote-copy"><p className="public-kicker">{t.quoteKicker}</p><h2>{t.quoteTitle}</h2><p>{t.quoteLead}</p><div className="quote-contact-points"><a href={`tel:${business.phone}`}><Phone />{business.phoneDisplay}</a><span><Clock3 />{t.open}</span><span><MapPin />{t.mobile}</span></div></div>
        <form className="quote-form" onSubmit={submitQuote}>
          <div className="quote-form-grid">
            <label>{t.name}<input name="name" value={quote.name} onChange={updateQuote} required autoComplete="name" /></label>
            <label>{t.phone}<input name="phone" type="tel" value={quote.phone} onChange={updateQuote} required autoComplete="tel" /></label>
            <label>{t.vehicle}<input name="vehicle" value={quote.vehicle} onChange={updateQuote} placeholder="2018 Toyota Camry" required /></label>
            <label>{t.location}<input name="location" value={quote.location} onChange={updateQuote} required /></label>
            <label className="span-2">{t.urgency}<select name="urgency" value={quote.urgency} onChange={updateQuote} required><option value="">—</option>{t.urgencyOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="span-2">{t.issue}<textarea name="issue" value={quote.issue} onChange={updateQuote} placeholder={t.issuePlaceholder} rows="4" required /></label>
          </div>
          <button className="public-button quote-submit" type="submit"><MessageCircle />{t.send}<ArrowRight /></button>
          <small><ShieldCheck /> {t.privacy}</small>
        </form>
      </section>

      <section className="public-about"><div className="about-mark"><img src="/yeros-auto-logo.png" alt={business.name} /></div><div className="about-copy"><p className="public-kicker">{t.aboutKicker}</p><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><div className="about-points">{t.points.map((point) => <span key={point}><BadgeCheck />{point}</span>)}</div></div></section>

      <section className="faq-section">
        <div className="public-section-heading"><p className="public-kicker">{t.faqKicker}</p><h2>{t.faqTitle}</h2></div>
        <div className="faq-list">{t.faqs.map(([question, answer], index) => <article className={openFaq === index ? "open" : ""} key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span><ChevronDown /></button>{openFaq === index && <p>{answer}</p>}</article>)}</div>
      </section>

      <section className="contact-section" id="contact">
        <div className="contact-copy"><p className="public-kicker">{t.contactKicker}</p><h2>{t.contactTitle}</h2><p>{t.contactText}</p></div>
        <div className="contact-actions compact"><a href={`tel:${business.phone}`}><Phone /><div><span>{t.call}</span><strong>{business.phoneDisplay}</strong></div></a><a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /><div><span>WhatsApp</span><strong>{business.phoneDisplay}</strong></div></a><a href={`mailto:${business.email}`}><Mail /><div><span>Email</span><strong>{business.email}</strong></div></a><div><Clock3 /><div><span>{t.hours}</span><strong>{t.open}</strong></div></div></div>
      </section>
    </main>

    <a className="mobile-whatsapp" href="#quote" aria-label={t.whatsapp}><MessageCircle /></a>
    <footer className="public-footer"><div><img src="/yeros-auto-logo.png" alt={business.name} /><p>{t.footer}</p></div><div className="social-links"><a href={`https://www.facebook.com/search/top?q=${encodeURIComponent(business.socialName)}`} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a><a href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(business.socialName)}`} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a></div><p>© {new Date().getFullYear()} {business.name}. {t.rights}</p></footer>
  </div>;
}
