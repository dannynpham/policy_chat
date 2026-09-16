export type PolicyDocument = {
	id: string;
	fileId: string;
	name: string;
	size: number;
	contentHash?: string;
};

export async function hashFile(file: File): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
	return Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
}