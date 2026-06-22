import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import Button from "../components/common/Button"
import * as Print from 'expo-print';
import { contraventionPdfHtml } from './ContraventionPDF';
import { Contravention } from '../types/database';

interface Props {
  contravention: Contravention;
}

export function AffichagePDF({contravention} : Props) {
  const [enChargement, setEnChargement] = useState(false);

  const handleImprimer = async () => {
    setEnChargement(true);
    const html = contraventionPdfHtml(contravention);
    try {
      if (Platform.OS === 'web') {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument!.write(html);
        iframe.contentDocument!.close();
        iframe.contentWindow!.onload = () => {
          iframe.contentWindow!.print();
          setTimeout(() => document.body.removeChild(iframe), 1000);
        };
      } else {
        await Print.printAsync({html});
      }
    } finally {
      setEnChargement(false);
    }
  };

  //Affiche l'icone de chargement si le pdf est en chargement
  if (enChargement) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <iframe
          srcDoc={contraventionPdfHtml(contravention)}
          style={iframeStyle}
          title="Aperçu contravention"
        />
      )}
      <Button title="IMPRIMER" style={styles.boutonImprimer} onPress={handleImprimer} />
    </View>
  );
}

const iframeStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 320,
  height: 400,
  border: '1px solid #ccc',
  borderRadius: 8,
  backgroundColor: 'white',
  display: 'block',
  margin: '8px auto',
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 12 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  boutonImprimer: {marginTop: 20}
});