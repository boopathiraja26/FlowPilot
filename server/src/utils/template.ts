/**
 * Utility functions for template placeholder resolution in FlowPilot.
 * Supports dot-notation nested paths, e.g. {{trigger.employee_name}}, {{step_1.employee_email}}, {{step_2.output}}
 */

/**
 * Safely accesses a nested property within an object using a dot-delimited path.
 *
 * @param obj The source object or context
 * @param path Dot-separated path string (e.g. "step_1.employee_email")
 * @returns The resolved value at path, or undefined if not found
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }

  const parts = path.trim().split(".");
  let current: any = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Resolves placeholder strings in a template string using execution context.
 *
 * Example:
 *   resolveTemplate("Hello {{trigger.employee_name}}, email: {{step_1.employee_email}}", context)
 *
 * @param template The template string containing {{path}} placeholders
 * @param context The execution context object containing step and trigger data
 * @returns The interpolated string
 */
export function resolveTemplate(
  template: string,
  context: Record<string, any>
): string {
  if (typeof template !== "string") {
    return template;
  }

  return template.replace(/\{\{\s*([\w\.-]+)\s*\}\}/g, (_match, path) => {
    const value = getNestedValue(context, path);
    if (value === undefined || value === null) {
      return "";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  });
}

/**
 * Recursively resolves placeholder strings in all properties of an object or array.
 *
 * @param obj The target object, array, or primitive value
 * @param context The execution context object containing step and trigger data
 * @returns A new object/array/value with all string templates resolved
 */
export function resolveObjectTemplates<T>(
  obj: T,
  context: Record<string, any>
): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return resolveTemplate(obj, context) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      resolveObjectTemplates(item, context)
    ) as unknown as T;
  }

  if (typeof obj === "object") {
    const resolvedObj: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      resolvedObj[key] = resolveObjectTemplates(
        (obj as Record<string, any>)[key],
        context
      );
    }
    return resolvedObj as T;
  }

  return obj;
}
