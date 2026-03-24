/**
 * Get the cropped image blob from a ReactCrop crop result.
 * Works with react-image-crop's PixelCrop type.
 */
export async function getCroppedImg(
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob | null> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = pixelCrop.width;
			canvas.height = pixelCrop.height;
			const ctx = canvas.getContext('2d');
			if (!ctx) return resolve(null);

			ctx.drawImage(
				image,
				pixelCrop.x,
				pixelCrop.y,
				pixelCrop.width,
				pixelCrop.height,
				0,
				0,
				pixelCrop.width,
				pixelCrop.height
			);

			canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
		};
		image.onerror = reject;
		image.src = imageSrc;
	});
}
