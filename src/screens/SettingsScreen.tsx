import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>
          {t('settings.title')}
        </Text>
      </View>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
          {t('settings.general')}
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold' },
  card: { margin: 20, padding: 20, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
});

export default SettingsScreen;
