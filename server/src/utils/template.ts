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

/**
 * Clean Markdown syntax and unresolved bracket placeholders from text.
 */
function cleanText(text: string, contextValues: Record<string, string>): string {
  if (!text) return "";

  let cleaned = text
    // Replace specific bracketed placeholders first
    .replace(/\[Your Name\]/gi, "HR Assistant")
    .replace(/\[Manager Name\]/gi, contextValues.manager_name || "your manager")
    .replace(/\[Company Name\]|\[Company\]/gi, contextValues.company_name || "FlowPilot")
    .replace(/\[Job Title\]/gi, contextValues.job_title || "")
    .replace(/\[Employee Name\]/gi, contextValues.employee_name || "")
    .replace(/\[Date\]|\[Start Date\]/gi, contextValues.start_date || "")

    // Strip remaining bracketed placeholders if any exist
    .replace(/\[[^\]]+\]/g, "")

    // Strip Mustache placeholders {{...}}
    .replace(/\{\{\s*[\w\.-]+\s*\}\}/g, "")

    // Remove bold/italic markdown (**text**, *text*, __text__, _text_)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")

    // Remove heading markers (# Heading)
    .replace(/^#+\s+/gm, "")

    // Remove inline code ticks
    .replace(/`([^`]+)`/g, "$1")

    // Trim whitespace
    .trim();

  return cleaned;
}

/**
 * Formats date strings cleanly (e.g. "08/08/2026" or "2026-08-08" -> "August 8, 2026")
 */
function formatStartDate(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return "";
  const str = dateStr.trim();

  // If already formatted with month name, return as is
  if (/[a-zA-Z]/.test(str)) return str;

  // Try parsing date string
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  return str;
}

/**
 * Renders a production-grade, Gmail-compatible HTML welcome email.
 */
export function renderWelcomeEmailHtml(
  triggerData: Record<string, any>,
  aiBodyMessage?: string
): string {
  const employeeName =
    triggerData.employee_name || triggerData.name || "Team Member";
  const employeeEmail =
    triggerData.employee_email || triggerData.email || "";
  const jobTitle = triggerData.job_title || "";
  const department = triggerData.department || "";
  const managerName =
    triggerData.manager_name || triggerData.manager || triggerData.reporting_manager || "";
  const rawStartDate = triggerData.start_date || "";
  const formattedStartDate = formatStartDate(rawStartDate);
  const companyName = triggerData.company_name || "FlowPilot";

  const contextMap: Record<string, string> = {
    employee_name: employeeName,
    employee_email: employeeEmail,
    job_title: jobTitle,
    department: department,
    manager_name: managerName,
    start_date: formattedStartDate || rawStartDate,
    company_name: companyName,
  };

  const cleanedAiMessage = aiBodyMessage ? cleanText(aiBodyMessage, contextMap) : "";

  // Build Onboarding details table rows (only display non-empty fields)
  const detailRows: { label: string; value: string }[] = [];
  if (jobTitle) detailRows.push({ label: "Job Title", value: jobTitle });
  if (department) detailRows.push({ label: "Department", value: department });
  if (formattedStartDate || rawStartDate)
    detailRows.push({ label: "Start Date", value: formattedStartDate || rawStartDate });
  if (managerName) detailRows.push({ label: "Reporting Manager", value: managerName });
  if (companyName) detailRows.push({ label: "Company", value: companyName });

  const tableRowsHtml = detailRows
    .map(
      (row) => `
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #64748b; width: 40%; border-bottom: 1px solid #f1f5f9;">
            ${row.label}
          </td>
          <td style="padding: 8px 12px; font-size: 14px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
            ${row.value}
          </td>
        </tr>`
    )
    .join("");

  const onboardingTableBlock =
    detailRows.length > 0
      ? `
      <!-- Employee Information Table -->
      <tr>
        <td style="padding: 0 40px 24px 40px;">
          <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
              Your Onboarding Details
            </h3>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              ${tableRowsHtml}
            </table>
          </div>
        </td>
      </tr>`
      : "";

  const managerNextStep = managerName
    ? `Your manager, <strong>${managerName}</strong>, will connect with you regarding your onboarding schedule, team introduction, and initial setup.`
    : `Your team will connect with you regarding your onboarding schedule, team introduction, and initial setup.`;

  const welcomeMessageCallout = cleanedAiMessage
    ? `<div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; padding: 18px 20px; margin-bottom: 16px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6; font-style: italic;">
          "${cleanedAiMessage}"
        </p>
       </div>`
    : `<div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; padding: 18px 20px; margin-bottom: 16px;">
        <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6; font-style: italic;">
          "We're excited to have you on board and look forward to seeing the impact you'll make at ${companyName}."
        </p>
       </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- FLOWPILOT HEADER -->
          <tr>
            <td style="background-color: #2563eb; background-image: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 36px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 3px; text-transform: uppercase;">
                FLOWPILOT
              </h1>
              <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;">
                AUTOMATE. CONNECT. EXECUTE.
              </p>
            </td>
          </tr>

          <!-- WELCOME SECTION -->
          <tr>
            <td style="padding: 40px 40px 24px 40px;">
              <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 700; line-height: 1.3;">
                Welcome to the ${companyName} team, ${employeeName}! 🎉
              </h2>
              <p style="margin: 0 0 16px 0; color: #334155; font-size: 15px; line-height: 1.6;">
                Dear ${employeeName},
              </p>
              <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">
                On behalf of the entire team at <strong>${companyName}</strong>, we are excited to welcome you as our new <strong>${jobTitle || "team member"}</strong>.
              </p>
            </td>
          </tr>

          ${onboardingTableBlock}

          <!-- NEXT STEPS -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px; font-weight: 700;">
                What happens next?
              </h3>
              <p style="margin: 0 0 10px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                ${managerNextStep}
              </p>
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Please keep an eye on your inbox for additional information and onboarding instructions.
              </p>
            </td>
          </tr>

          <!-- WELCOME MESSAGE / AI CALLOUT -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              ${welcomeMessageCallout}
            </td>
          </tr>

          <!-- SIGN-OFF -->
          <tr>
            <td style="padding: 0 40px 36px 40px;">
              <p style="margin: 0 0 16px 0; color: #0f172a; font-size: 15px; font-weight: 600;">
                Welcome aboard, ${employeeName}! 🚀
              </p>
              <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                Best regards,<br>
                <strong style="color: #1e293b;">HR Assistant</strong><br>
                <span style="color: #64748b;">${companyName}</span>
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px; font-weight: 500;">
                © ${companyName}
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
                Automate. Connect. Execute.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

