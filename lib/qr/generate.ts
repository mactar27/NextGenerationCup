// lib/qr/generate.ts
import QRCode from 'qrcode'

/**
 * Génère un véritable QR Code standard ISO/IEC 18004 100% lisible par n'importe quel smartphone ou scanner d'arbitre.
 */
export async function generateQRCodeSVG(text: string, size = 180): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    })
    return svg
  } catch (err) {
    console.error('Erreur génération QR Code officiel:', err)
    return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/></svg>`
  }
}

/**
 * Génère également une version Data URL (PNG en base64) pour les PDF et aperçus rapides.
 */
export async function generateQRCodeDataURL(text: string, size = 180): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: 'M'
    })
  } catch (err) {
    console.error('Erreur DataURL QR Code:', err)
    return ''
  }
}
