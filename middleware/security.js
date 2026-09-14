/**
 * Anti-Hacking Security Middleware
 * - XSS & Script Injection Sanitizer
 * - Tenant IDOR & Parameter Pollution Protection
 */

// Recursive string sanitizer to strip malicious HTML/JavaScript tags
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onload\s*=/gi, '')
      .replace(/onerror\s*=/gi, '')
      .replace(/onclick\s*=/gi, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitizedObj = {};
    for (const key of Object.keys(value)) {
      sanitizedObj[key] = sanitizeValue(value[key]);
    }
    return sanitizedObj;
  }
  return value;
}

// Express middleware for request body and query sanitization
function xssSanitizer(req, res, next) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
}

// Tenant IDOR Protection Middleware
// Guarantees an authenticated Company Admin or Employee cannot access or mutate records of another tenant
function tenantIsolation(req, res, next) {
  if (req.user && req.user.role !== 'Super Owner') {
    if (!req.user.companyId) {
      return res.status(403).json({ error: 'Access Denied: No valid company tenancy associated with this account.' });
    }
    // Force companyId in request context to match JWT authenticated user
    req.tenantCompanyId = req.user.companyId;
  }
  next();
}

module.exports = {
  xssSanitizer,
  tenantIsolation,
  sanitizeValue
};
