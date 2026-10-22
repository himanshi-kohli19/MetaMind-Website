const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = new Set(["Agency", "In-house team", "Founder", "Other"]);

export function validateDemoRequest(input) {
  const values = {
    name: String(input.name ?? "").trim(),
    email: String(input.email ?? "").trim(),
    company: String(input.company ?? "").trim(),
    role: String(input.role ?? "").trim(),
    goal: String(input.goal ?? "").trim(),
    website: String(input.website ?? "").trim()
  };
  const errors = {};

  if (values.name.length < 2) errors.name = "Enter your name.";
  if (values.name.length > 80) errors.name = "Keep your name under 80 characters.";
  if (!emailPattern.test(values.email)) errors.email = "Enter a valid work email.";
  if (values.email.length > 160) errors.email = "Keep your email under 160 characters.";
  if (values.company.length < 2) errors.company = "Enter your company name.";
  if (values.company.length > 120) errors.company = "Keep your company name under 120 characters.";
  if (!allowedRoles.has(values.role)) errors.role = "Select the option that best describes you.";
  if (values.goal.length > 600) errors.goal = "Keep your goal under 600 characters.";
  if (values.website) errors.website = "Unable to process this request.";

  return { values, errors, valid: Object.keys(errors).length === 0 };
}
