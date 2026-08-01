import {
  ArrowRight, BatteryCharging, CalendarDays, Check, ChevronLeft, ChevronRight,
  CircleDollarSign, Clock3, CreditCard, Droplets, Facebook, Gauge, Instagram,
  Mail, MapPin, Menu, MessageCircle, Phone, ShieldCheck, Sparkles, Wrench, X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { business } from "../config/business.js";

const translations = {
  en: {
    nav: ["About", "Pricing", "Services", "Coverage", "Book", "Contact"],
    portal: "Portal", available: "Available Now · 24/7",
    heroTop: "MOBILE", heroMiddle: "MECHANIC", heroAccent: "SOUTHWEST FLORIDA",
    whatsapp: "WhatsApp", book: "Book Now", call: "Call",
    stats: [["24/7", "Availability"], ["35mi", "Coverage Radius"], ["14+", "Mobile Services"]],
    payments: "We accept:", paymentNames: ["Cash", "Zelle", "Venmo", "Cash App", "Card"],
    aboutTag: "About Us", aboutTitle: "Your Mechanic Comes to You",
    aboutText1: "Yeros Auto Services is a professional mobile mechanic serving Southwest Florida and surrounding areas 24 hours a day, 7 days a week. We bring the tools and experience directly to your home, workplace, or wherever your vehicle is.",
    aboutText2: "No tow trucks. No waiting rooms. No surprise fees. Just fast, honest, professional service at your doorstep — any time you need it.",
    always: "Always Open", coverage: "Coverage", servicesCount: "Services",
    offerTag: "Special Offer", pricingTitle: "Fixed Pricing",
    pricingLead: "No surprises. We bring everything needed right to your location.",
    fixed: "fixed price",
    pricing: [
      ["Oil Change — 4 Cylinder", "Includes oil + filter + diagnostic", "$100", "🔧"],
      ["Oil Change — 6 Cylinder", "Includes oil + filter + diagnostic", "$120", "🔧"],
      ["Oil Change — 8 Cylinder", "Includes oil + filter + diagnostic", "$140", "🔧"],
      ["Front Brake Pads", "Pads + labor + diagnostic included", "$140", "🛑"],
      ["Rear Brake Pads", "Pads + labor + diagnostic included", "$140", "🛑"],
    ],
    pricingQuote: "You don't have to do anything — just call us and we come to you!",
    servicesTag: "What We Do", servicesTitle: "All Our Services",
    servicesLead: "All services are 100% mobile. We bring tools and parts directly to you.",
    serviceData: [
      ["Engine Oil Change", "We drain old oil and replace it with fresh conventional or synthetic oil, plus a new filter. Keeps your engine clean and well-lubricated.", "~1 hr · 30 min travel + 30 min work", "🔧"],
      ["Transmission Fluid Change", "We replace the fluid in automatic or manual transmissions to prevent wear and shifting problems. A key preventive service.", "~1.5 hrs · 30 min travel + 1 hr work", "⚙️"],
      ["Battery Replacement", "We test your battery and replace it on the spot if needed. Ideal if your car will not start or has slow cranking.", "~45 min · 30 min travel + 15 min work", "🔋"],
      ["Brake Pad Replacement", "We replace worn brake pads. Squealing while braking or a soft pedal means it may be time to change them.", "~1.5 hrs · 30 min travel + 1 hr work", "🛑"],
      ["Head Gasket Replacement", "The gasket prevents oil and coolant from mixing with engine gases. Oil leaks or overheating can signal this issue.", "~3.5–5 hrs · 30 min travel + 3–4.5 hrs work", "🔩"],
      ["Alternator Replacement", "The alternator charges your battery while driving. Flickering lights or a battery warning can mean alternator failure.", "~2–2.5 hrs · 30 min travel + 1.5–2 hrs work", "⚡"],
      ["Water Pump Replacement", "The water pump circulates coolant to keep your engine cool. Coolant leaks or overheating are common warning signs.", "~2.5–3 hrs · 30 min travel + 2–2.5 hrs work", "💧"],
      ["Wheel Bearing Replacement", "Bearings let wheels spin smoothly. A humming or rumbling sound that increases with speed is a key warning sign.", "~2–2.5 hrs · 30 min travel + 1.5–2 hrs work", "🔄"],
      ["Front End Suspension", "Includes ball joints, control arms and spindles. Pulling to one side or clunking in turns means it needs inspection.", "~3–4 hrs · 30 min travel + 2.5–3.5 hrs work", "🚗"],
      ["Starter Replacement", "The starter cranks the engine. A clicking noise with no start or intermittent starting can point to starter failure.", "~2–2.5 hrs · 30 min travel + 1.5–2 hrs work", "🔑"],
      ["Spark Plugs & Ignition Coils", "Rough idle, reduced fuel economy or sluggish acceleration are signs of worn plugs or coils.", "~1.5 hrs · 30 min travel + 1 hr work", "🔌"],
      ["Fuel Pump Replacement", "Sudden stalling, no-start with a full tank or loss of power can point to fuel pump failure.", "~2.5–3 hrs · 30 min travel + 2–2.5 hrs work", "⛽"],
      ["A/C Compressor Replacement", "No cold air, unusual noise when turning on the A/C or complete failure means it needs attention.", "~3–3.5 hrs · 30 min travel + 2.5–3 hrs work", "❄️"],
      ["Radiator Replacement", "The radiator keeps the engine cool. Overheating, white smoke or coolant leaks can indicate radiator trouble.", "~2.5–3 hrs · 30 min travel + 2–2.5 hrs work", "🌡️"],
    ],
    areaTag: "Service Area", areaTitle: "Where Do We Operate?",
    areaText: "We serve Southwest Florida and locations up to 35 miles around our service area. Contact us with your address to confirm availability.",
    areaPoints: ["Home", "Workplace", "Roadside", "Parking lot"],
    bookingTag: "Schedule Your Appointment", bookingTitle: "Book Your Service",
    bookingSteps: [["Fill out the form", "Your name, phone and vehicle info"], ["We receive your request", "Yeros gets your vehicle details instantly"], ["Confirm your appointment", "We contact you to agree on a date and time"]],
    faster: "Prefer a quicker option?", next: "Next", back: "Back", send: "Send Booking Request",
    stepNames: ["You", "Vehicle", "Service", "Date"],
    fields: {
      name: "Your Full Name", phone: "Phone Number", address: "Your Location / Address",
      year: "Vehicle Year", make: "Make", model: "Model", service: "Service Needed",
      notes: "Describe the issue", date: "Preferred Date", time: "Preferred Time",
    },
    select: "Select a service", requestTitle: "New Mobile Service Booking",
    contactTag: "Contact Us", contactTitle: "Always Available",
    phoneLabel: "Phone", emailLabel: "Email", instagram: "Instagram", messageNow: "Message Now",
    footer: "Mobile service 24 hours · 7 days a week",
  },
  es: {
    nav: ["Nosotros", "Precios", "Servicios", "Cobertura", "Reservar", "Contacto"],
    portal: "Portal", available: "Disponible Ahora · 24/7",
    heroTop: "MECÁNICO", heroMiddle: "MÓVIL", heroAccent: "SUROESTE DE FLORIDA",
    whatsapp: "WhatsApp", book: "Reservar", call: "Llamar",
    stats: [["24/7", "Disponibilidad"], ["35mi", "Radio de cobertura"], ["14+", "Servicios móviles"]],
    payments: "Aceptamos:", paymentNames: ["Efectivo", "Zelle", "Venmo", "Cash App", "Tarjeta"],
    aboutTag: "Sobre Nosotros", aboutTitle: "Tu Mecánico Va Hasta Ti",
    aboutText1: "Yeros Auto Services ofrece mecánica móvil profesional en el suroeste de Florida y áreas cercanas, las 24 horas del día. Llevamos herramientas y experiencia a tu casa, trabajo o donde esté tu vehículo.",
    aboutText2: "Sin grúa. Sin sala de espera. Sin cargos sorpresa. Solo servicio rápido, honesto y profesional en tu ubicación.",
    always: "Siempre abierto", coverage: "Cobertura", servicesCount: "Servicios",
    offerTag: "Oferta Especial", pricingTitle: "Precios Fijos",
    pricingLead: "Sin sorpresas. Llevamos todo lo necesario directamente a tu ubicación.",
    fixed: "precio fijo",
    pricing: [
      ["Cambio de aceite — 4 cilindros", "Incluye aceite + filtro + diagnóstico", "$100", "🔧"],
      ["Cambio de aceite — 6 cilindros", "Incluye aceite + filtro + diagnóstico", "$120", "🔧"],
      ["Cambio de aceite — 8 cilindros", "Incluye aceite + filtro + diagnóstico", "$140", "🔧"],
      ["Pastillas de freno delanteras", "Pastillas + mano de obra + diagnóstico", "$140", "🛑"],
      ["Pastillas de freno traseras", "Pastillas + mano de obra + diagnóstico", "$140", "🛑"],
    ],
    pricingQuote: "¡No tienes que hacer nada — solo llámanos y vamos hasta ti!",
    servicesTag: "Lo Que Hacemos", servicesTitle: "Todos Nuestros Servicios",
    servicesLead: "Todos los servicios son 100% móviles. Llevamos herramientas y piezas directamente a ti.",
    serviceData: [
      ["Cambio de aceite de motor", "Drenamos el aceite usado y lo reemplazamos con aceite nuevo y filtro. Mantiene el motor limpio y lubricado.", "~1 h · 30 min viaje + 30 min trabajo", "🔧"],
      ["Cambio de fluido de transmisión", "Reemplazamos el fluido para prevenir desgaste y problemas al cambiar velocidades.", "~1.5 h · 30 min viaje + 1 h trabajo", "⚙️"],
      ["Cambio de batería", "Probamos la batería y la reemplazamos en el lugar si es necesario.", "~45 min · 30 min viaje + 15 min trabajo", "🔋"],
      ["Cambio de pastillas de freno", "Cambiamos pastillas gastadas. Chirridos o pedal suave indican que necesitan revisión.", "~1.5 h · 30 min viaje + 1 h trabajo", "🛑"],
      ["Empaque de culata", "Evita que aceite y refrigerante se mezclen. Fugas o sobrecalentamiento pueden indicar una falla.", "~3.5–5 h · 30 min viaje + 3–4.5 h trabajo", "🔩"],
      ["Cambio de alternador", "El alternador carga la batería. Luces intermitentes o el testigo de batería pueden indicar una falla.", "~2–2.5 h · 30 min viaje + 1.5–2 h trabajo", "⚡"],
      ["Cambio de bomba de agua", "Circula el refrigerante. Fugas o sobrecalentamiento son señales comunes.", "~2.5–3 h · 30 min viaje + 2–2.5 h trabajo", "💧"],
      ["Cambio de rodamiento", "Permite que la rueda gire suavemente. Un zumbido que aumenta con la velocidad es una señal.", "~2–2.5 h · 30 min viaje + 1.5–2 h trabajo", "🔄"],
      ["Suspensión delantera", "Incluye ball joints, control arms y spindles. Golpes o desvío requieren inspección.", "~3–4 h · 30 min viaje + 2.5–3.5 h trabajo", "🚗"],
      ["Cambio de starter", "Un clic sin encender o arranque intermitente puede indicar falla del starter.", "~2–2.5 h · 30 min viaje + 1.5–2 h trabajo", "🔑"],
      ["Bujías y bobinas", "Marcha irregular, menor rendimiento o aceleración lenta son señales de desgaste.", "~1.5 h · 30 min viaje + 1 h trabajo", "🔌"],
      ["Cambio de bomba de gasolina", "Apagones, falta de encendido o pérdida de potencia pueden indicar una falla.", "~2.5–3 h · 30 min viaje + 2–2.5 h trabajo", "⛽"],
      ["Cambio de compresor A/C", "Aire no frío, ruidos al encender el A/C o falla total requieren atención.", "~3–3.5 h · 30 min viaje + 2.5–3 h trabajo", "❄️"],
      ["Cambio de radiador", "Sobrecalentamiento, humo blanco o fugas de refrigerante indican problemas.", "~2.5–3 h · 30 min viaje + 2–2.5 h trabajo", "🌡️"],
    ],
    areaTag: "Área de Servicio", areaTitle: "¿Dónde Trabajamos?",
    areaText: "Atendemos el suroeste de Florida y ubicaciones hasta 35 millas alrededor del área de servicio. Envíanos tu dirección para confirmar disponibilidad.",
    areaPoints: ["Casa", "Trabajo", "Carretera", "Estacionamiento"],
    bookingTag: "Agenda Tu Cita", bookingTitle: "Reserva Tu Servicio",
    bookingSteps: [["Completa el formulario", "Tu nombre, teléfono y vehículo"], ["Recibimos la solicitud", "Yeros recibe los datos al instante"], ["Confirmamos tu cita", "Te contactamos para acordar día y hora"]],
    faster: "¿Prefieres una opción más rápida?", next: "Siguiente", back: "Atrás", send: "Enviar Solicitud",
    stepNames: ["Tú", "Vehículo", "Servicio", "Fecha"],
    fields: {
      name: "Nombre completo", phone: "Teléfono", address: "Ubicación / Dirección",
      year: "Año del vehículo", make: "Marca", model: "Modelo", service: "Servicio necesario",
      notes: "Describe el problema", date: "Fecha preferida", time: "Hora preferida",
    },
    select: "Selecciona un servicio", requestTitle: "Nueva Reserva de Servicio Móvil",
    contactTag: "Contáctanos", contactTitle: "Siempre Disponibles",
    phoneLabel: "Teléfono", emailLabel: "Correo", instagram: "Instagram", messageNow: "Escribir Ahora",
    footer: "Servicio móvil 24 horas · 7 días a la semana",
  },
};

const emptyBooking = { name: "", phone: "", address: "", year: "", make: "", model: "", service: "", notes: "", date: "", time: "" };

export default function Home() {
  const [language, setLanguage] = useState(() => localStorage.getItem("yeros_public_language") || "en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(emptyBooking);
  const t = translations[language];
  const serviceNames = useMemo(() => t.serviceData.map(([name]) => name), [t]);

  function changeLanguage(value) {
    setLanguage(value);
    localStorage.setItem("yeros_public_language", value);
    document.documentElement.lang = value;
  }

  function updateBooking(event) {
    setBooking((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function nextStep(event) {
    event.preventDefault();
    setStep((current) => Math.min(4, current + 1));
  }

  function submitBooking(event) {
    event.preventDefault();
    const message = [
      `*${t.requestTitle}*`,
      `${t.fields.name}: ${booking.name}`,
      `${t.fields.phone}: ${booking.phone}`,
      `${t.fields.address}: ${booking.address}`,
      `${t.fields.year}: ${booking.year}`,
      `${t.fields.make}: ${booking.make}`,
      `${t.fields.model}: ${booking.model}`,
      `${t.fields.service}: ${booking.service}`,
      `${t.fields.notes}: ${booking.notes}`,
      `${t.fields.date}: ${booking.date}`,
      `${t.fields.time}: ${booking.time}`,
    ].join("\n");
    window.open(`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="public-site baruch-style-home">
    <header className="bm-header">
      <a href="#top" className="bm-logo"><img src="/yeros-auto-logo.png" alt={business.name} /></a>
      <button className="bm-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menu">{menuOpen ? <X /> : <Menu />}</button>
      <nav className={menuOpen ? "open" : ""}>
        {["about", "precios", "servicios", "cobertura", "reservar", "contacto"].map((id, index) =>
          <a href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>{t.nav[index]}</a>
        )}
        <Link to="/login">{t.portal}</Link>
      </nav>
      <div className="bm-header-actions">
        <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /> {t.whatsapp}</a>
        <a href={`tel:${business.phone}`}><Phone /> {t.call}</a>
        <div className="bm-language"><button className={language === "en" ? "active" : ""} onClick={() => changeLanguage("en")}>EN</button><button className={language === "es" ? "active" : ""} onClick={() => changeLanguage("es")}>ES</button></div>
      </div>
    </header>

    <main id="top">
      <section className="bm-hero">
        <div className="bm-hero-copy">
          <div className="bm-available"><span />{t.available}</div>
          <h1><span>{t.heroTop}</span><span>{t.heroMiddle}</span><em>{t.heroAccent}</em></h1>
          <div className="bm-hero-buttons">
            <a className="bm-button green" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(language === "es" ? "Hola Yeros, necesito servicio mecánico móvil. Mi ubicación: " : "Hi Yeros, I need mobile mechanic service. My location: ")}`} target="_blank" rel="noreferrer"><MessageCircle />{t.whatsapp}</a>
            <a className="bm-button red" href="#reservar"><CalendarDays />{t.book}</a>
            <a className="bm-phone" href={`tel:${business.phone}`}><Phone />{business.phoneDisplay}</a>
          </div>
          <div className="bm-stats">{t.stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
          <div className="bm-payments"><span>{t.payments}</span>{t.paymentNames.map((name, index) => <strong key={name}>{index === 0 ? "💵" : index === 4 ? "💳" : "●"} {name}</strong>)}</div>
        </div>
        <div className="bm-hero-media">
          <div className="bm-photo-wrap"><img src="/mobile-mechanic-hero.png" alt={`${business.name} mobile mechanic`} fetchPriority="high" decoding="async" /></div>
          <div className="bm-floating-card"><span />{t.available}</div>
        </div>
      </section>

      <section className="bm-about" id="about">
        <div className="bm-about-photo"><img src="/mobile-mechanic-hero.png" alt="Mobile mechanic at work" loading="lazy" decoding="async" /><div><strong>24/7</strong><span>{t.always}</span></div></div>
        <div className="bm-about-copy"><p className="bm-tag">{t.aboutTag}</p><h2>{t.aboutTitle}</h2><p>{t.aboutText1}</p><p>{t.aboutText2}</p>
          <div className="bm-about-stats"><div><strong>24/7</strong><span>{t.always}</span></div><div><strong>35mi</strong><span>{t.coverage}</span></div><div><strong>14+</strong><span>{t.servicesCount}</span></div></div>
          <div className="bm-inline-actions"><a className="bm-button red" href={`tel:${business.phone}`}><Phone />{t.call}</a><a className="bm-button outline" href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle />{t.whatsapp}</a></div>
        </div>
      </section>

      <section className="bm-pricing" id="precios">
        <div className="bm-section-heading"><p className="bm-tag">{t.offerTag}</p><h2>{t.pricingTitle}</h2><p>{t.pricingLead}</p></div>
        <div className="bm-price-grid">{t.pricing.map(([name, detail, price, icon]) => <article key={name}><span className="bm-price-icon">{icon}</span><div><h3>{name}</h3><p>{detail}</p><small>{t.fixed}</small></div><strong>{price}</strong></article>)}</div>
        <blockquote>“{t.pricingQuote}”</blockquote>
        <a className="bm-big-phone" href={`tel:${business.phone}`}><Phone />{business.phoneDisplay}</a>
      </section>

      <section className="bm-services" id="servicios">
        <div className="bm-section-heading"><p className="bm-tag">{t.servicesTag}</p><h2>{t.servicesTitle}</h2><p>{t.servicesLead}</p></div>
        <div className="bm-service-grid">{t.serviceData.map(([name, description, time, icon], index) => <article key={name}>
          <span className="bm-service-number">{String(index + 1).padStart(2, "0")}</span><span className="bm-service-icon">{icon}</span><h3>{name}</h3><p>{description}</p><small><Clock3 />{time}</small>
        </article>)}</div>
      </section>

      <section className="bm-coverage" id="cobertura">
        <div className="bm-coverage-copy"><p className="bm-tag">{t.areaTag}</p><h2>{t.areaTitle}</h2><p>{t.areaText}</p><div className="bm-area-points">{t.areaPoints.map((item, index) => <span key={item}>{[<MapPin key="a" />, <Wrench key="b" />, <Gauge key="c" />, <ShieldCheck key="d" />][index]}{item}</span>)}</div>
          <a className="bm-button green" href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle />{t.whatsapp}</a>
        </div>
        <div className="bm-map-card"><div className="bm-radius r1" /><div className="bm-radius r2" /><div className="bm-map-center"><MapPin /><strong>YEROS</strong><span>35 mi</span></div>{["Fort Myers", "Cape Coral", "Lehigh Acres", "Estero"].map((city, index) => <span className={`bm-city c${index + 1}`} key={city}>{city}</span>)}</div>
      </section>

      <section className="bm-booking" id="reservar">
        <div className="bm-section-heading"><p className="bm-tag">{t.bookingTag}</p><h2>{t.bookingTitle}</h2></div>
        <div className="bm-booking-intro">{t.bookingSteps.map(([title, detail], index) => <div key={title}><strong>{index + 1}</strong><span><b>{title}</b>{detail}</span></div>)}</div>
        <div className="bm-quick"><span>{t.faster}</span><a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle />{t.whatsapp}</a><a href={`tel:${business.phone}`}><Phone />{t.call}</a></div>

        <form className="bm-booking-form" onSubmit={step === 4 ? submitBooking : nextStep}>
          <div className="bm-stepper">{t.stepNames.map((name, index) => <div className={step >= index + 1 ? "active" : ""} key={name}><span>{step > index + 1 ? <Check /> : index + 1}</span><b>{name}</b></div>)}</div>
          <div className="bm-form-body">
            {step === 1 && <div className="bm-form-grid"><label>{t.fields.name} *<input name="name" value={booking.name} onChange={updateBooking} required /></label><label>{t.fields.phone} *<input type="tel" name="phone" value={booking.phone} onChange={updateBooking} required /></label><label className="wide">{t.fields.address} *<input name="address" value={booking.address} onChange={updateBooking} required /></label></div>}
            {step === 2 && <div className="bm-form-grid"><label>{t.fields.year} *<input type="number" min="1950" max="2030" name="year" value={booking.year} onChange={updateBooking} required /></label><label>{t.fields.make} *<input name="make" value={booking.make} onChange={updateBooking} required /></label><label className="wide">{t.fields.model} *<input name="model" value={booking.model} onChange={updateBooking} required /></label></div>}
            {step === 3 && <div className="bm-form-grid"><label className="wide">{t.fields.service} *<select name="service" value={booking.service} onChange={updateBooking} required><option value="">{t.select}</option>{serviceNames.map((name) => <option key={name}>{name}</option>)}</select></label><label className="wide">{t.fields.notes}<textarea name="notes" value={booking.notes} onChange={updateBooking} rows="4" /></label></div>}
            {step === 4 && <div className="bm-form-grid"><label>{t.fields.date} *<input type="date" name="date" value={booking.date} onChange={updateBooking} required /></label><label>{t.fields.time} *<input type="time" name="time" value={booking.time} onChange={updateBooking} required /></label><div className="bm-booking-summary wide"><Sparkles /><div><strong>{booking.year} {booking.make} {booking.model}</strong><span>{booking.service} · {booking.address}</span></div></div></div>}
          </div>
          <div className="bm-form-nav">{step > 1 && <button type="button" onClick={() => setStep(step - 1)}><ChevronLeft />{t.back}</button>}<button className="primary" type="submit">{step === 4 ? t.send : t.next}{step < 4 ? <ChevronRight /> : <MessageCircle />}</button></div>
        </form>
      </section>

      <section className="bm-contact" id="contacto">
        <div className="bm-section-heading"><p className="bm-tag">{t.contactTag}</p><h2>{t.contactTitle}</h2></div>
        <div className="bm-contact-grid">
          <a href={`tel:${business.phone}`}><Phone /><span>{t.phoneLabel}</span><strong>{business.phoneDisplay}</strong></a>
          <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle /><span>WhatsApp</span><strong>{t.messageNow}</strong></a>
          <a href={`mailto:${business.email}`}><Mail /><span>{t.emailLabel}</span><strong>{business.email}</strong></a>
          <div><Instagram /><span>{t.instagram}</span><strong>Yeros Auto Services</strong></div>
        </div>
      </section>
    </main>

    <footer className="bm-footer"><img src="/yeros-auto-logo.png" alt={business.name} /><span>© {new Date().getFullYear()} {business.name} · Southwest Florida</span><strong>{t.footer}</strong><div><Facebook /><Instagram /></div></footer>
    <div className="bm-mobile-bar"><a href={`tel:${business.phone}`}><Phone />{t.call}</a><a href={`https://wa.me/${business.whatsapp}`}><MessageCircle />{t.whatsapp}</a><a href="#reservar"><CalendarDays />{t.book}</a></div>
  </div>;
}
