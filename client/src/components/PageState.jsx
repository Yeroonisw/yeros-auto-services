export function Loading() {
  return <div className="state-card">Loading...</div>;
}

export function Empty({ children }) {
  return <div className="state-card">{children}</div>;
}

export function Alert({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="alert">
      <span>{message}</span>
      <button onClick={onClose}>x</button>
    </div>
  );
}
