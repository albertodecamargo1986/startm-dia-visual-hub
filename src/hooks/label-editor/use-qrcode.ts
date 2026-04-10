import QRCode from 'qrcode';
import { FabricImage, type Canvas as FabricCanvas } from 'fabric';

export async function addQRCode(canvas: FabricCanvas, content: string) {
  const dataUrl = await QRCode.toDataURL(content, { width: 200, margin: 1 });
  const img = await FabricImage.fromURL(dataUrl);
  img.set({
    left: canvas.width! / 2,
    top: canvas.height! / 2,
    originX: 'center',
    originY: 'center',
  });
  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
}
