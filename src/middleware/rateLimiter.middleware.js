/**
 * In-memory sliding window rate limiter middleware
 * Protects against brute-force attacks and abusive request floods
 */
const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 100, message = "Too many requests, please try again later." } = {}) => {
  const requests = new Map();

  // Cleanup expired entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now - data.startTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
    const now = Date.now();

    const currentRecord = requests.get(ip);

    if (!currentRecord || now - currentRecord.startTime > windowMs) {
      requests.set(ip, { count: 1, startTime: now });
      return next();
    }

    if (currentRecord.count >= max) {
      const resetTime = Math.ceil((currentRecord.startTime + windowMs - now) / 1000);
      res.set("Retry-After", String(resetTime));
      return res.status(429).json({
        message,
        retryAfterSeconds: resetTime,
      });
    }

    currentRecord.count += 1;
    next();
  };
};

// Auth specific stricter rate limiter (10 attempts per 15 mins)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
});

// General API rate limiter (100 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP. Please try again later.",
});

module.exports = {
  rateLimit,
  authLimiter,
  apiLimiter,
};
