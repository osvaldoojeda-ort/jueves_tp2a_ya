function logger(req, res, next) {
  const timestamp = new Date().toISOString();
  console.log(`${req.method} ${req.url} -- ${timestamp}`);
  next();
}

module.exports = logger;
