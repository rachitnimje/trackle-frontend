// Input sanitization utilities to prevent XSS, injection attacks, etc.

/**
 * Sanitizes HTML by removing potentially dangerous tags and attributes
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return "";

  // Remove script tags and their content
  const withoutScripts = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ""
  );

  // Remove dangerous HTML tags
  const dangerousTags =
    /<(iframe|object|embed|form|input|script|link|meta|style)[^>]*>/gi;
  const withoutDangerousTags = withoutScripts.replace(dangerousTags, "");

  // Remove javascript: and data: URLs
  const withoutJSUrls = withoutDangerousTags.replace(
    /(javascript|data):[^"'\s>]*/gi,
    ""
  );

  // Remove event handlers
  const withoutEventHandlers = withoutJSUrls.replace(
    /\s*on\w+\s*=\s*["'][^"']*["']/gi,
    ""
  );

  return withoutEventHandlers.trim();
};

/**
 * Sanitizes search query to prevent injection attacks
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return "";

  // Remove dangerous characters
  const sanitized = query
    .replace(/[<>"/\\&]/g, "") // Remove HTML/JS injection chars
    .replace(/[';-]/g, "") // Remove SQL injection chars
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Limit length
  return sanitized.substring(0, 200);
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitizes user input for forms
 */
export const sanitizeFormInput = (input: string): string => {
  if (!input) return "";

  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript protocol
    .trim();
};

/**
 * Rate limiting utility for client-side
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private maxRequests: number, private windowMs: number) {}

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}
