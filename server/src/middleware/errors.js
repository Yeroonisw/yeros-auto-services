export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((item) => item.message)
      .join(". ");
    return res.status(400).json({ message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid record identifier" });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: "A record with that value already exists" });
  }
  res.status(error.status || 500).json({ message: error.message || "Server error" });
}
