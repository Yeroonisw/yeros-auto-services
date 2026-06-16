import { useEffect, useState } from "react";
import api, { errorMessage } from "../api.js";
import { Alert } from "../components/PageState.jsx";

const emptyVehicle = { year: "", make: "", model: "", engine: "", mileage: "", dtcCodes: "", symptoms: "" };

export default function Assistant() {
  const [vehicle, setVehicle] = useState(emptyVehicle);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [previousResponseId, setPreviousResponseId] = useState("");
  const [configured, setConfigured] = useState(true);
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/assistant/status")
      .then(({ data }) => { setConfigured(data.configured); setModel(data.model); })
      .catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  async function ask(event) {
    event.preventDefault();
    if (!question.trim()) return;
    const asked = question.trim();
    setMessages((current) => [...current, { role: "user", text: asked }]);
    setQuestion("");
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/assistant", { question: asked, vehicle, previousResponseId: previousResponseId || undefined });
      setMessages((current) => [...current, { role: "assistant", text: data.answer }]);
      setPreviousResponseId(data.responseId);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setPreviousResponseId("");
    setQuestion("");
  }

  return <div className="page">
    <div className="page-heading">
      <div><p className="eyebrow">Technical support</p><h1>AI diagnostics</h1><p>Describe the vehicle and problem to build a diagnostic plan.</p></div>
      <button className="button secondary" onClick={newConversation}>New conversation</button>
    </div>
    {!configured && <Alert message="OpenAI is not configured. Add OPENAI_API_KEY to server/.env and restart the backend." onClose={() => {}} />}
    <Alert message={error} onClose={() => setError("")} />
    <div className="assistant-layout">
      <section className="panel assistant-context">
        <div className="panel-heading"><h2>Vehicle context</h2><p>Optional details improve the answer.</p></div>
        <div className="context-form">
          <div className="context-grid">
            <label>Year<input value={vehicle.year} onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} /></label>
            <label>Make<input value={vehicle.make} onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })} /></label>
            <label>Model<input value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} /></label>
            <label>Engine<input placeholder="2.0L, 5.3L..." value={vehicle.engine} onChange={(e) => setVehicle({ ...vehicle, engine: e.target.value })} /></label>
            <label>Mileage<input value={vehicle.mileage} onChange={(e) => setVehicle({ ...vehicle, mileage: e.target.value })} /></label>
            <label>DTC codes<input placeholder="P0300, P0171" value={vehicle.dtcCodes} onChange={(e) => setVehicle({ ...vehicle, dtcCodes: e.target.value.toUpperCase() })} /></label>
          </div>
          <label>Symptoms<textarea rows="5" placeholder="When it happens, noises, readings, recent repairs..." value={vehicle.symptoms} onChange={(e) => setVehicle({ ...vehicle, symptoms: e.target.value })} /></label>
          <small className="assistant-note">AI can make mistakes. Verify wiring, torque values and specifications in service information before repair.</small>
        </div>
      </section>
      <section className="panel chat-panel">
        <div className="panel-heading"><h2>Ask the assistant</h2><p>{model ? `Using ${model}` : "Automotive diagnostic guidance"}</p></div>
        <div className="chat-messages">
          {!messages.length && <div className="chat-empty"><strong>Start with the symptom.</strong><span>Example: “2018 Ford F-150 3.5L has P0302 and shakes under load. What should I test first?”</span></div>}
          {messages.map((message, index) => <div className={`chat-message ${message.role}`} key={index}>
            <strong>{message.role === "user" ? "You" : "Diagnostic assistant"}</strong>
            <p>{message.text}</p>
          </div>)}
          {loading && <div className="chat-message assistant"><strong>Diagnostic assistant</strong><p>Analyzing the problem...</p></div>}
        </div>
        <form className="chat-compose" onSubmit={ask}>
          <textarea rows="3" placeholder="Ask about a symptom, DTC code or test procedure..." value={question} onChange={(e) => setQuestion(e.target.value)} disabled={!configured || loading} />
          <button className="button primary" disabled={!configured || loading || !question.trim()}>{loading ? "Thinking..." : "Ask"}</button>
        </form>
      </section>
    </div>
  </div>;
}
