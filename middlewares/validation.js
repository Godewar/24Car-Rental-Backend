/**
 * Request Validation Middleware
 * Validates incoming request data
 */

// Generic validation function
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

// Validate required fields
export const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = [];

    fields.forEach((field) => {
      if (!req.body[field]) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      return res.status(400).json({
        message: "Missing required fields",
        fields: missing,
      });
    }

    next();
  };
};

// Validate email format
export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next();
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  next();
};

// Validate phone number
export const validatePhone = (req, res, next) => {
  const { phone } = req.body;

  if (!phone) {
    return next();
  }

  const phoneRegex = /^[0-9]{10}$/;

  if (!phoneRegex.test(phone)) {
    return res.status(400).json({
      message: "Invalid phone number. Must be 10 digits.",
    });
  }

  next();
};

// Sanitize input (remove dangerous characters)
export const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        // Remove script tags and other dangerous HTML
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .trim();
      } else if (typeof value === "object") {
        sanitized[key] = sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  req.body = sanitize(req.body);
  next();
};

// Validate ID parameter
export const validateIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({
      message: "Invalid ID parameter",
    });
  }

  next();
};

// Strip auth fields from body
export const stripAuthFields = (req, res, next) => {
  const disallowed = new Set([
    "token",
    "authToken",
    "accessToken",
    "authorization",
    "Authorization",
    "bearer",
    "Bearer",
  ]);

  const cleaned = {};

  for (const [k, v] of Object.entries(req.body)) {
    if (!disallowed.has(k)) {
      cleaned[k] = v;
    }
  }

  req.body = cleaned;
  next();
};
