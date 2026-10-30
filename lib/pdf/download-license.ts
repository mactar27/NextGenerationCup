// lib/pdf/download-license.ts
import { LicenseData } from '@/components/license-card'

/**
 * Télécharge la licence officielle sous forme d'un document HTML/Imprimable autonome
 * ou déclenche la sauvegarde PDF officielle directe du navigateur.
 */
export function downloadLicenseDocument(license: LicenseData) {
  const printWindow = window.open('', '_blank', 'width=800,height=900')
  if (!printWindow) {
    alert("Veuillez autoriser les fenêtres pop-up pour télécharger la licence.")
    return
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Licence_${license.licenseNumber}_${license.lastName}_${license.firstName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .license-card {
      width: 580px;
      background: #ffffff;
      border: 2px solid #0f3d23;
      border-radius: 12px;
      padding: 28px;
      position: relative;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .zebra-accent {
      position: absolute;
      top: 0;
      left: 0;
      width: 90px;
      height: 140px;
      background: repeating-linear-gradient(-45deg, #0f3d23 0, #0f3d23 6px, transparent 6px, transparent 14px);
      clip-path: polygon(0 0, 100% 0, 0 100%);
      opacity: 0.85;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 14px;
      margin-bottom: 16px;
      padding-left: 50px;
    }
    .header-logo {
      height: 48px;
      width: auto;
    }
    .header-center {
      text-align: center;
      flex: 1;
    }
    .tournament-title {
      font-size: 14px;
      font-weight: 900;
      color: #0f3d23;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .organizer {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      margin-top: 2px;
    }
    .season {
      font-size: 14px;
      font-weight: 900;
      color: #0f3d23;
    }
    .team-badge-row {
      text-align: center;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .team-header-content {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .team-badge-logo {
      height: 32px;
      width: 32px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      padding: 1px;
      background: #ffffff;
    }
    .team-badge-code {
      height: 32px;
      min-width: 32px;
      padding: 0 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 13px;
      border-radius: 6px;
    }
    .team-name {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .doc-type {
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
    }
    .lic-number {
      font-size: 18px;
      font-weight: 900;
      color: #0f3d23;
      font-family: monospace;
      margin-top: 2px;
    }
    .dates-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .dates-bar strong {
      color: #0f172a;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 100px 1fr 90px;
      gap: 16px;
      align-items: center;
      margin-bottom: 20px;
    }
    .photo-box {
      width: 95px;
      height: 120px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #94a3b8;
      font-weight: bold;
      overflow: hidden;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .details {
      display: flex;
      flex-direction: column;
      gap: 7px;
      font-size: 12px;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 100px 1fr;
      align-items: baseline;
    }
    .detail-label {
      color: #475569;
      font-weight: 600;
      text-decoration: underline;
    }
    .detail-value {
      color: #0f172a;
      font-weight: 800;
    }
    .qr-box {
      width: 90px;
      height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      background: #ffffff;
    }
    .qr-box svg {
      width: 100%;
      height: 100%;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 11px;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      background: #dcfce7;
      color: #15803d;
      font-weight: 800;
      font-size: 10px;
      text-transform: uppercase;
    }
    .signature {
      font-style: italic;
      color: #1e3a8a;
      font-family: Georgia, serif;
      font-size: 14px;
    }
    .actions-bar {
      margin-top: 20px;
      display: flex;
      gap: 12px;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary {
      background: #157a38;
      color: #ffffff;
    }
    .btn-secondary {
      background: #0f172a;
      color: #ffffff;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .actions-bar {
        display: none !important;
      }
      .license-card {
        box-shadow: none;
        border: 2px solid #0f3d23;
        margin: auto;
      }
    }
  </style>
</head>
<body>
  <div class="actions-bar">
    <button class="btn btn-primary" onclick="window.print()">
      💾 Télécharger / Imprimer en PDF
    </button>
    <button class="btn btn-secondary" onclick="window.close()">
      Fermer
    </button>
  </div>

  <div class="license-card">
    <div class="zebra-accent"></div>

    <div class="header">
      <img src="${window.location.origin}/logo-teranga-agency.jpg" class="header-logo" alt="Teranga Agency" />
      <div class="header-center">
        <div class="tournament-title">Next Generation Cup</div>
        <div class="organizer">Teranga Agency • Homologation Officielle</div>
      </div>
      <div class="season">${license.season || '2026/2027'}</div>
    </div>

    <div class="team-badge-row">
      <div class="team-header-content">
        ${
          license.teamLogoUrl
            ? `<img src="${license.teamLogoUrl}" class="team-badge-logo" alt="${license.teamName}" />`
            : `<div class="team-badge-code" style="background-color: ${license.teamColor || '#157a38'};">${(license.teamCode || license.teamName || 'CL').substring(0, 3)}</div>`
        }
        <h2 class="team-name">${license.teamName}</h2>
      </div>
      <div class="doc-type">LICENCE OFFICIELLE DE JOUEUR</div>
      <div class="lic-number">N° ${license.licenseNumber}</div>
    </div>

    <div class="dates-bar">
      <div>Enregistrement : <strong>${license.issueDate || '01/11/2026'}</strong></div>
      <div>Statut : <span class="status-badge">${license.status || 'VALIDÉE'}</span></div>
      <div>Expiration : <strong>${license.expirationDate || '30/06/2027'}</strong></div>
    </div>

    <div class="content-grid">
      <div class="photo-box">
        ${license.photoUrl ? `<img src="${license.photoUrl}" alt="${license.lastName}" />` : 'PHOTO JOUEUR'}
      </div>

      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Nom</span>
          <span class="detail-value">${license.lastName.toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Prénoms</span>
          <span class="detail-value">${license.firstName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Né(e) le</span>
          <span class="detail-value">${license.birthDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Nationalité</span>
          <span class="detail-value">${license.nationality}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Poste / Maillot</span>
          <span class="detail-value">#${license.jerseyNumber || '—'} — ${license.position || 'ATTAQUANT'}</span>
        </div>
      </div>

      <div class="qr-box">
        ${license.qrSvg || '<div style="font-size:9px;text-align:center;">QR CODE</div>'}
      </div>
    </div>

    <div class="footer">
      <div>
        <span style="color:#64748b; font-size:10px;">Document certifié & infalsifiable</span>
      </div>
      <div>
        <span style="font-size:10px; color:#64748b; margin-right:6px;">Le titulaire :</span>
        <span class="signature">${license.firstName.charAt(0).toUpperCase()}. ${license.lastName}</span>
      </div>
    </div>
  </div>

  <script>
    // Déclenche automatiquement l'impression / enregistrement PDF
    setTimeout(() => {
      window.print();
    }, 400);
  </script>
</body>
</html>
  `

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
