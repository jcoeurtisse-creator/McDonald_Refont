import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { catalog } from '../../constants/catalog';

// --- CONFIGURATION DU SPLIT VIEW ---
const MIN_HEADER_HEIGHT = 180;
const MAX_HEADER_HEIGHT = 700;
const DEFAULT_HEADER_HEIGHT = 400;
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.5 };

// --- DONNÉES (CATALOGUE) ---
const TAX_RATE = 0.10;



const fmt = (n: number) => {
  return n.toFixed(2).replace('.', ',') + ' €';
};

function SplitScreenPOS() {
  const insets = useSafeAreaInsets();

  const [order, setOrder] = useState<any[]>([]);

  const addToOrder = useCallback((item: any) => {
    setOrder(prevOrder => {
      const existingItemIndex = prevOrder.findIndex(l => l.id === item.id);
      if (existingItemIndex >= 0) {
        const newOrder = [...prevOrder];
        newOrder[existingItemIndex].qty += 1;
        return newOrder;
      } else {
        return [...prevOrder, { ...item, qty: 1, unitPriceTTC: item.priceTTC }];
      }
    });
  }, []);

  const deleteLine = useCallback((index: number) => {
    setOrder(prev => {
      const newOrder = [...prev];
      newOrder.splice(index, 1);
      return newOrder;
    });
  }, []);

  const clearOrder = useCallback(() => {
    setOrder([]);
  }, []);

  const totals = useMemo(() => {
    const totalTTC = order.reduce((sum, l) => sum + l.qty * l.unitPriceTTC, 0);
    const subtotalHT = totalTTC / (1 + TAX_RATE);
    const tax = totalTTC - subtotalHT;
    return {
      totalTTC,
      subtotalHT,
      tax
    };
  }, [order]);

  // --- ANIMATION ---
  const headerHeight = useSharedValue(DEFAULT_HEADER_HEIGHT);
  const contextHeight = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextHeight.value = headerHeight.value;
    })
    .onUpdate((e) => {
      headerHeight.value = Math.max(
        MIN_HEADER_HEIGHT,
        Math.min(contextHeight.value + e.translationY, MAX_HEADER_HEIGHT)
      );
    })
    .onEnd((e) => {
      const velocity = e.velocityY;
      let target = headerHeight.value;

      if (velocity > 800) target = MAX_HEADER_HEIGHT;
      else if (velocity < -800) target = MIN_HEADER_HEIGHT;
      else {
        const distances = [
          { h: MIN_HEADER_HEIGHT, d: Math.abs(headerHeight.value - MIN_HEADER_HEIGHT) },
          { h: DEFAULT_HEADER_HEIGHT, d: Math.abs(headerHeight.value - DEFAULT_HEADER_HEIGHT) },
          { h: MAX_HEADER_HEIGHT, d: Math.abs(headerHeight.value - MAX_HEADER_HEIGHT) },
        ];
        target = distances.sort((a, b) => a.d - b.d)[0].h;
      }
      headerHeight.value = withSpring(target, SPRING_CONFIG);
    });

  const headerStyle = useAnimatedStyle(() => ({
    height: headerHeight.value,
  }));

  const dragHandleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      headerHeight.value,
      [MIN_HEADER_HEIGHT, DEFAULT_HEADER_HEIGHT],
      [0.6, 1],
      Extrapolate.CLAMP
    ),
  }));

  const renderProduct = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => addToOrder(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.img }} style={styles.productImg} resizeMode="contain" />
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.productPrice}>{fmt(item.priceTTC)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ZONE PRODUITS */}
      <Animated.View style={[styles.topSection, headerStyle, { paddingTop: insets.top + 10 }]}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>MENU MCDONALD'S</Text>
          <Text style={styles.menuHint}>Cliquez pour ajouter</Text>
        </View>

        <FlatList
          data={catalog}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
        />

        {/* DRAG HANDLE */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.dragZone, dragHandleStyle]}>
            <View style={styles.dragPill} />
          </Animated.View>
        </GestureDetector>
      </Animated.View>

      {/* ZONE FACTURE */}
      <View style={styles.bottomSectionWrapper}>
        <View style={styles.bottomSection}>

          {/* Header Ticket */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptLogo}>MCDONALD'S FRANCE</Text>
            <Text style={styles.receiptSub}>Restaurant #1234 - Champs-Élysées</Text>

            <View style={styles.metaContainer}>
              <Text style={styles.metaText}>Commande : <Text style={styles.bold}>#88</Text></Text>
              <Text style={styles.metaText}>Type : <Text style={styles.bold}>SUR PLACE</Text></Text>
            </View>
            <View style={styles.dashedLine} />
          </View>

          {/* Liste articles */}
          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            {order.length === 0 ? (
              <Text style={styles.emptyHint}>Votre commande est vide.</Text>
            ) : (
              order.map((line, idx) => (
                <View key={`${line.id}-${idx}`} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{line.qty} x</Text>
                  <Text style={styles.itemName}>{line.name.toUpperCase()}</Text>
                  <Text style={styles.itemPrice}>{fmt(line.qty * line.unitPriceTTC)}</Text>
                  <TouchableOpacity onPress={() => deleteLine(idx)} style={styles.deleteBtn}>
                    <Text style={styles.deleteText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* Totaux */}
          <View style={styles.totalsContainer}>
            <View style={styles.dashedLine} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Sous-total HT</Text>
              <Text style={styles.totalValue}>{fmt(totals.subtotalHT)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA (10%)</Text>
              <Text style={styles.totalValue}>{fmt(totals.tax)}</Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 8 }]}>
              <Text style={styles.totalBigLabel}>TOTAL TTC</Text>
              <Text style={styles.totalBigValue}>{fmt(totals.totalTTC)}</Text>
            </View>
          </View>

          {/* Boutons Actions */}
          <View style={[styles.toolbar, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={clearOrder}
            >
              <Text style={[styles.btnText, styles.btnTextDanger]}>VIDER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => Alert.alert('Paiement', 'Lancement du paiement...')}
            >
              <Text style={styles.btnText}>PAYER</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SplitScreenPOS />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// --- STYLES CORRIGÉS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fond noir critique
  },

  // --- SECTION PRODUITS ---
  topSection: {
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 16,
    overflow: 'hidden',
    zIndex: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
  },
  menuHint: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  productsGrid: {
    paddingBottom: 60,
    paddingHorizontal: 4,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    margin: 8, // ← AUGMENTÉ de 6 à 8
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    minHeight: 180, // ← AJOUTÉ pour uniformité
  },
  productImg: {
    width: '100%',
    height: 90,
    marginBottom: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
    color: '#333',
    minHeight: 36,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#DA291C',
  },

  // --- DRAG HANDLE ---
  dragZone: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5', // ← MÊME couleur que topSection
    zIndex: 20,
  },
  dragPill: {
    width: 50,
    height: 5,
    backgroundColor: '#bbb', // ← Plus foncé pour visibilité
    borderRadius: 3,
    marginBottom: 8,
  },

  // --- SECTION FACTURE ---
  bottomSectionWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  bottomSection: {
    flex: 1,
    marginTop: 12, // ← CORRIGÉ : positif au lieu de -25
    backgroundColor: '#fffef8', // Couleur papier ticket
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 1,
    ...Platform.select({
      ios: { fontFamily: 'Courier-Bold' },
      android: { fontFamily: 'monospace', fontWeight: '900' },
    }),
  },
  receiptSub: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
    ...Platform.select({
      ios: { fontFamily: 'Courier' },
      android: { fontFamily: 'monospace' },
    }),
  },
  metaContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  metaText: {
    fontSize: 12,
    color: '#444',
    ...Platform.select({
      ios: { fontFamily: 'Courier' },
      android: { fontFamily: 'monospace' },
    }),
  },
  bold: {
    fontWeight: 'bold',
  },
  dashedLine: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginVertical: 8,
  },

  // Liste items
  itemsList: {
    flex: 1,
    marginBottom: 10,
  },
  emptyHint: {
    textAlign: 'center',
    marginTop: 30,
    color: '#999',
    fontStyle: 'italic',
    fontSize: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemQty: {
    width: 35,
    fontWeight: 'bold',
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: 'Courier-Bold' },
      android: { fontFamily: 'monospace', fontWeight: '900' },
    }),
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#222',
    ...Platform.select({
      ios: { fontFamily: 'Courier' },
      android: { fontFamily: 'monospace' },
    }),
  },
  itemPrice: {
    width: 75,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 13,
    ...Platform.select({
      ios: { fontFamily: 'Courier-Bold' },
      android: { fontFamily: 'monospace', fontWeight: '900' },
    }),
  },
  deleteBtn: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 22,
    color: '#ff3333',
    fontWeight: 'bold',
  },

  // Totaux
  totalsContainer: {
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: '#666',
    ...Platform.select({
      ios: { fontFamily: 'Courier' },
      android: { fontFamily: 'monospace' },
    }),
  },
  totalValue: {
    fontSize: 13,
    fontWeight: 'bold',
    ...Platform.select({
      ios: { fontFamily: 'Courier-Bold' },
      android: { fontFamily: 'monospace', fontWeight: '900' },
    }),
  },
  totalBigLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    ...Platform.select({
      ios: { fontFamily: 'Courier-Bold' },
      android: { fontFamily: 'monospace', fontWeight: '900' },
    }),
  },
  totalBigValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DA291C',
    ...Platform.select({
      ios: { fontFamily: 'Courier-Bold' },
      android: { fontFamily: 'monospace', fontWeight: '900' },
    }),
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#DA291C', // Rouge McDo
  },
  btnDanger: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#DA291C',
  },
  btnText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  btnTextDanger: {
    color: '#DA291C',
  },
});