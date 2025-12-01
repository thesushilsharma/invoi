/**
 * Convert file to base64 string for storage and PDF generation
 */
export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			resolve(result);
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Validate image file type and size
 */
export function validateImageFile(file: File, maxSizeMB: number = 2): { valid: boolean; error?: string } {
	const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
	
	if (!validTypes.includes(file.type)) {
		return {
			valid: false,
			error: 'Invalid file type. Please upload PNG, JPG, or SVG files only.'
		};
	}

	const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
	if (file.size > maxSize) {
		return {
			valid: false,
			error: `File size exceeds ${maxSizeMB}MB limit.`
		};
	}

	return { valid: true };
}

/**
 * Compress image if needed (client-side)
 */
export async function compressImage(file: File, maxWidth: number = 800): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;

				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL(file.type));
			};
			img.onerror = reject;
			img.src = e.target?.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Create a placeholder image for stamp/signature
 */
export function createPlaceholderImage(text: string, width: number = 200, height: number = 100): string {
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	
	const ctx = canvas.getContext('2d');
	if (!ctx) return '';

	// Background
	ctx.fillStyle = '#f3f4f6';
	ctx.fillRect(0, 0, width, height);

	// Border
	ctx.strokeStyle = '#d1d5db';
	ctx.lineWidth = 2;
	ctx.strokeRect(0, 0, width, height);

	// Text
	ctx.fillStyle = '#9ca3af';
	ctx.font = '14px Arial';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, width / 2, height / 2);

	return canvas.toDataURL('image/png');
}
