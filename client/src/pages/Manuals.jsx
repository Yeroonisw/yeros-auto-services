export default function Manuals() {
  return <div className="page manuals-page">
    <div className="page-heading">
      <div><p className="eyebrow">Service information</p><h1>Lemon Manuals</h1><p>Browse external vehicle service manuals without leaving the shop workspace.</p></div>
      <a className="button primary external-button" href="https://lemon-manuals.la/" target="_blank" rel="noreferrer">Open in new tab</a>
    </div>
    <div className="manual-notice">This is an external website. If it does not appear below, use “Open in new tab”.</div>
    <section className="manual-frame-wrap">
      <iframe title="Lemon Manuals" src="https://lemon-manuals.la/" className="manual-frame" />
    </section>
  </div>;
}
