function notFound(req, res) {
  res.status(404).json({
    error: {
      code: "RUTA_NO_ENCONTRADA",
      message: `La ruta ${req.method} ${req.url} no existe`,
    },
  });
}

module.exports = notFound;
