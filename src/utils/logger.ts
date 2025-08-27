// Production-safe logging utility

interface LogMessage {
  level: "log" | "error" | "warn" | "info";
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  context?: string;
}

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development";

// Enhanced logger object
export const logger = {
  log: (message: string, data?: Record<string, unknown>, context?: string) => {
    if (isDevelopment) {
      console.log(`[${context || "APP"}] ${message}`, data || "");
    }
    // In production, you might want to send to an error reporting service
  },

  error: (
    message: string,
    data?: Record<string, unknown>,
    context?: string
  ) => {
    const logMessage: LogMessage = {
      level: "error",
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };

    if (isDevelopment) {
      console.error(
        `[ERROR${context ? ` - ${context}` : ""}] ${message}`,
        data || ""
      );
    } else {
      // In production, send to error reporting service like Sentry
      // Example: Sentry.captureException(new Error(message), { extra: logMessage });
    }
  },

  warn: (message: string, data?: Record<string, unknown>, context?: string) => {
    if (isDevelopment) {
      console.warn(
        `[WARN${context ? ` - ${context}` : ""}] ${message}`,
        data || ""
      );
    }
    // In production, you might want to send warnings to monitoring service
  },

  info: (message: string, data?: Record<string, unknown>, context?: string) => {
    if (isDevelopment) {
      console.info(
        `[INFO${context ? ` - ${context}` : ""}] ${message}`,
        data || ""
      );
    }
  },
};

// Helper function to report errors with proper typing
export const reportError = (
  error: Error,
  context?: string,
  additionalData?: Record<string, unknown>
) => {
  logger.error(
    error.message,
    {
      stack: error.stack,
      name: error.name,
      ...additionalData,
    },
    context
  );
};
