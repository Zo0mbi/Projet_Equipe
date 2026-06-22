import { Contravention } from '../types/database';

export function contraventionPdfHtml(contravention: Contravention): string {
  const date = new Date(contravention.date_entrer);
  const dateStr = date.toLocaleDateString('fr-CA');
  const heureStr = date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
  const motif = contravention.raison_custom ?? contravention.raison_contravention?.nom ?? '';
  const etatContravention = contravention.etat_contravention === "avertissement" ? "AVERTISSEMENT / WARNING" : "AVIS DE RÉCLAMATION / NOTICE OF CLAIM";

  //Doit être codé en html directement pour que le pdf puisse être affiché correctement sur web ET mobile
  return `
    <html>
      <head>
        <style>
          @page {
            size: 80mm 130mm;
            margin: 0;
          }
          @media print {
            html, body {
              width: 80mm;
              margin: 0;
              padding: 0;
            }
            .contravention {
              width: 80mm;
              margin: 0;
              padding: 4mm 5mm;
            }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background: white;
            font-family: Arial, sans-serif;
            font-size: 9px;
            width: 80mm;
            padding: 4mm 5mm;
          }
          .entete {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 3mm;
          }
          .logo {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 1px;
          }
          .numeroContravention {
            font-size: 11px;
            font-weight: bold;
            text-align: right;
          }
          .avis {
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 2mm 0;
            margin-bottom: 3mm;
          }
          .information {
            display: flex;
            margin-bottom: 4mm;
            align-items: baseline;
            gap: 10px;
          }
          .titreChamp {
            font-weight: bold;
            white-space: nowrap;
          }
          .champ {
            flex: 1;
            border-bottom: 1px solid black;
            min-height: 3mm;
            padding-bottom: 1px;
          }
          .info {
            font-weight: bold;
            text-align: center;
          }
          .dateEtHeure {
            display: flex;
            gap: 4mm;
            margin-bottom: 2mm;
          }
          .dateEtHeure .information {
            flex: 1;
            margin-bottom: 0;
          }
          .divider {
            border-top: 1px solid black;
            margin: 10mm 0;
          }
          .footer {
            margin-top: 10mm;
          }
        </style>
      </head>
      <body>
        <div class="contravention">
            <div class="entete">
              <span class="logo">PARKFLOW</span>
              <span class="numeroContravention">${contravention.numero_contravention}</span>
            </div>

            <div class="avis">${etatContravention}</div>
    
            <div class="dateEtHeure">
              <div class="information">
                <span class="titreChamp">Date :</span>
                <span class="champ">${dateStr}</span>
              </div>
              <div class="champ">
                <span class="titreChamp">Heure :</span>
                <span class="champ">${heureStr}</span>
              </div>
            </div>
    
            <div class="information">
              <span class="titreChamp">Emplacement :</span>
              <span class="champ">${contravention.emplacement?.nom ?? ''}</span>
            </div>
            
            <div class="information">
              <span class="titreChamp">Adresse :</span>
              <span class="champ">${contravention.emplacement?.adresse ?? ''}</span>
            </div>
    
            <div class="information">
              <span class="titreChamp">Immatriculation :</span>
              <span class="champ">${contravention.vehicule.numero_plaque ?? ''}</span>
            </div>
    
            <div class="information">
              <span class="titreChamp">Marque/Modèle :</span>
              <span class="champ">${contravention.vehicule.marque ?? ''} ${contravention.vehicule.modele ?? ''}</span>
            </div>
    
            <div class="information">
              <span class="titreChamp">Montant :</span>
              <span class="champ">${contravention.montant ? `${contravention.montant} $` : ''}</span>
            </div>
    
            <div class="information">
              <span class="titreChamp">Motif :</span>
              <span class="champ">${motif}</span>
            </div>
    
            <div class="divider"></div>
    
            <div class="footer">
              <div class="information">
                <span class="titreChamp">Contravention donnée par :</span>
                <span class="champ">${contravention.attribuer_par_utilisateur.nom ?? ''}</span>
              </div>
            </div>
        </div>
      </body>
    </html>
  `;
}