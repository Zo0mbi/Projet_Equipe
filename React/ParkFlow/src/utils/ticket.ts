
export const formatEmplacement = (emplacement?: { nom: string; adresse?: string } | null): string => {
  if (!emplacement || !emplacement.nom) {
    return 'N/A';
  }

  return emplacement.adresse && emplacement.adresse.trim().length > 0
    ? `${emplacement.nom} — ${emplacement.adresse}`
    : emplacement.nom;
};
