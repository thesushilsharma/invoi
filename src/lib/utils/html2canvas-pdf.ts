import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const EXPORT_MARKER = 'data-pdf-export-root';

function oklchToRgb(l: number, c: number, h: number, alpha = 1): string {
	// Convert OKLCH to OKLAB
	const a = c * Math.cos((h * Math.PI) / 180);
	const b = c * Math.sin((h * Math.PI) / 180);

	// Convert OKLAB to linear RGB
	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	const l3 = l_ * l_ * l_;
	const m3 = m_ * m_ * m_;
	const s3 = s_ * s_ * s_;

	let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
	let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
	let b_ = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

	// Convert linear RGB to sRGB
	const toSrgb = (val: number) => {
		val = Math.max(0, Math.min(1, val));
		return val <= 0.0031308 ? 12.92 * val : 1.055 * Math.pow(val, 1 / 2.4) - 0.055;
	};

	r = Math.round(toSrgb(r) * 255);
	g = Math.round(toSrgb(g) * 255);
	b_ = Math.round(toSrgb(b_) * 255);

	return alpha < 1 ? `rgba(${r}, ${g}, ${b_}, ${alpha})` : `rgb(${r}, ${g}, ${b_})`;
}

function convertOklchToRgb(colorValue: string): string {
	if (!colorValue || !colorValue.includes('oklch')) {
		return colorValue;
	}

	// Match oklch(L C H) or oklch(L C H / A)
	const match = colorValue.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/);
	if (!match) return colorValue;

	const l = parseFloat(match[1]);
	const c = parseFloat(match[2]);
	const h = parseFloat(match[3]);
	const alpha = match[4] ? (match[4].includes('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1;

	return oklchToRgb(l, c, h, alpha);
}

function copyComputedStyles(source: Element, target: Element) {
	const computedStyle = window.getComputedStyle(source as HTMLElement);
	const styleText = Array.from(computedStyle)
		.map((property) => {
			let value = computedStyle.getPropertyValue(property);
			// Convert oklch colors to rgb for html2canvas compatibility
			if (value && value.includes('oklch')) {
				value = convertOklchToRgb(value);
			}
			return `${property}: ${value};`;
		})
		.join(' ');

	target.setAttribute('style', styleText);

	if (source instanceof HTMLElement && target instanceof HTMLElement) {
		target.scrollTop = source.scrollTop;
		target.scrollLeft = source.scrollLeft;
	}

	const sourceChildren = Array.from(source.children);
	const targetChildren = Array.from(target.children);

	for (const [index, sourceChild] of sourceChildren.entries()) {
		const targetChild = targetChildren[index];
		if (targetChild) {
			copyComputedStyles(sourceChild, targetChild);
		}
	}
}

function inlineStylesAndStripGlobalCss(clonedDocument: Document, sourceRoot: HTMLElement) {
	const clonedRoot = clonedDocument.querySelector<HTMLElement>(`[${EXPORT_MARKER}="true"]`);
	if (!clonedRoot) return;

	copyComputedStyles(sourceRoot, clonedRoot);

	for (const stylesheet of clonedDocument.querySelectorAll('style, link[rel="stylesheet"]')) {
		stylesheet.remove();
	}

	clonedDocument.documentElement.style.backgroundColor = '#ffffff';
	clonedDocument.body.style.backgroundColor = '#ffffff';
	clonedDocument.body.style.margin = '0';
}

export async function exportElementToPdf(element: HTMLElement, filename: string) {
	element.setAttribute(EXPORT_MARKER, 'true');

	try {
		const canvas = await html2canvas(element, {
			scale: 2,
			useCORS: true,
			logging: false,
			backgroundColor: '#ffffff',
			allowTaint: true,
			width: element.scrollWidth,
			height: element.scrollHeight,
			onclone: (clonedDocument) => {
				inlineStylesAndStripGlobalCss(clonedDocument, element);
			}
		});

		if (!canvas) {
			throw new Error('Failed to create canvas');
		}

		const imgData = canvas.toDataURL('image/png');
		if (!imgData || imgData === 'data:,') {
			throw new Error('Failed to generate image data');
		}

		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'mm',
			format: 'a4'
		});

		const imgProps = pdf.getImageProperties(imgData);
		const pdfWidth = pdf.internal.pageSize.getWidth();
		const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

		if (pdfHeight > pdf.internal.pageSize.getHeight()) {
			const pageHeight = pdf.internal.pageSize.getHeight();
			let heightLeft = pdfHeight;
			let position = 0;

			pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
			heightLeft -= pageHeight;

			while (heightLeft > 0) {
				position = heightLeft - pdfHeight;
				pdf.addPage();
				pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
				heightLeft -= pageHeight;
			}
		} else {
			pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
		}

		pdf.save(filename);
	} finally {
		element.removeAttribute(EXPORT_MARKER);
	}
}
