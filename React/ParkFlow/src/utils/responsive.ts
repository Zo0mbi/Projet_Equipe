/**
 * Utilitaire pour le redimensionnement dynamique de l'interface
 * afin de supporter les petits écrans (ex: smartphones) en rapetissant
 * de manière fluide les polices, marges et espacements.
 */

export const getScale = (width: number) => {
  // Si l'écran est plus petit que 400px, on calcule un ratio.
  // Sinon, le ratio reste à 1 (pas de changement).
  return width < 400 ? width / 400 : 1;
};
