const sensitiveConfigKey =
  /(authorization|api[_-]?key|token|password|secret|credential)/i;

export function sanitizeDuplicatedConfig(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeDuplicatedConfig);
  }

  if (typeof value === "string") {
    return value
      .replace(
        /([?&](?:access[_-]?token|api[_-]?key|apikey|credential|password|secret|signature|token)=)[^&#]*/gi,
        "$1"
      )
      .replace(/(\bhttps?:\/\/)[^/\s@]+@/gi, "$1");
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveConfigKey.test(key)
          ? ""
          : sanitizeDuplicatedConfig(nestedValue),
      ])
    );
  }

  return value;
}
