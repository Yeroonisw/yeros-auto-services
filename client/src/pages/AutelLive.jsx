import { useEffect, useState } from "react";
import { ExternalLink, MonitorSmartphone, ShieldCheck, Smartphone, Video } from "lucide-react";

const teamViewerWebUrl = "https://web.teamviewer.com/";
const quickSupportUrl = "https://www.teamviewer.com/en/download/mobile-apps/";
const storageKey = "yeros_autel_live_session";

export default function AutelLive() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || { partnerId: "", notes: "" };
    } catch {
      return { partnerId: "", notes: "" };
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(session));
  }, [session]);

  return <div className="page">
    <div className="page-heading">
      <div>
        <p className="eyebrow">Live remote view</p>
        <h1>Autel MK900 Live</h1>
        <p>Use TeamViewer Web to view or support your Autel MK900 live while keeping scanner reports connected to your shop workflow.</p>
      </div>
      <a className="button primary external-button" href={teamViewerWebUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open TeamViewer Web</a>
    </div>

    <section className="live-layout">
      <div className="live-main">
        <section className="live-hero">
          <MonitorSmartphone size={38} />
          <p className="eyebrow">TeamViewer connection</p>
          <h2>See the MK900 screen live from your browser.</h2>
          <p>Install or open TeamViewer QuickSupport on the MK900, copy the device ID, then connect from TeamViewer Web in a separate secure tab.</p>
          <div className="live-actions">
            <a className="button primary" href={teamViewerWebUrl} target="_blank" rel="noreferrer"><Video size={16} /> Start live session</a>
            <a className="button secondary" href={quickSupportUrl} target="_blank" rel="noreferrer"><Smartphone size={16} /> Get QuickSupport</a>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2>How to connect</h2><p>Use this checklist each time you want to see the scanner live.</p></div>
          <div className="live-steps">
            <article><strong>1</strong><div><h3>Open TeamViewer on the MK900</h3><p>Use TeamViewer QuickSupport or the TeamViewer app if it is already installed on the tablet.</p></div></article>
            <article><strong>2</strong><div><h3>Copy the ID</h3><p>The MK900 will show a TeamViewer ID. Put it in the box on the right so you do not lose it during the job.</p></div></article>
            <article><strong>3</strong><div><h3>Connect from the browser</h3><p>Open TeamViewer Web, sign in if requested, enter the ID and accept the connection on the MK900.</p></div></article>
            <article><strong>4</strong><div><h3>Save the report after the scan</h3><p>When the scan is complete, download the PDF from Autel Cloud and import it using Autel Import Center.</p></div></article>
          </div>
        </section>
      </div>

      <aside className="live-side">
        <section className="panel">
          <div className="panel-heading"><h2>Session notes</h2><p>Saved only in this browser.</p></div>
          <div className="live-session-form">
            <label>TeamViewer ID<input value={session.partnerId} onChange={(event) => setSession({ ...session, partnerId: event.target.value })} placeholder="Example: 123 456 789" /></label>
            <label>Job notes<textarea rows="6" value={session.notes} onChange={(event) => setSession({ ...session, notes: event.target.value })} placeholder="Customer, vehicle, issue, scan reason..." /></label>
            <a className="button primary" href={teamViewerWebUrl} target="_blank" rel="noreferrer">Connect in TeamViewer</a>
          </div>
        </section>

        <section className="live-security">
          <ShieldCheck />
          <strong>Security note</strong>
          <p>The live connection stays inside TeamViewer. Your web app stores only the ID/notes locally in this browser, not the remote screen.</p>
        </section>
      </aside>
    </section>
  </div>;
}
