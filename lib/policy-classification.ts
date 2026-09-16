export function isInsurancePolicyClassification(output: string): boolean {
  const normalizedOutput = output.trim().toLowerCase();
  return normalizedOutput === "yes" || normalizedOutput.startsWith("yes\n");
}