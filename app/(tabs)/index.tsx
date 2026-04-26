import React, { useState } from 'react';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';
import Modal from 'react-native-modal';

type CartItem = {
  cartItemId: string;
  product: any;
  quantity: number;
  customizations: Record<string, number>;
};
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { catalog } from '../../constants/catalog';

const BIG_MAC_INGREDIENTS = [
  { id: 'cheese', name: 'American Cheese', price: 0.49, image: 'https://s7d1.scene7.com/is/image/mcdonalds/ingredient_american_cheese_180x180', max: 3, defaultQty: 2 },
  { id: 'bun', name: 'Big Mac Bun', price: 0.29, image: 'https://s7d1.scene7.com/is/image/mcdonalds/quarter_pounder_bun', max: 1, defaultQty: 1 },
  { id: 'patty', name: '100% Beef Patty', price: 0.59, image: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_Ingredient_202111_00005-086__4259_BigMac_FreshBeefPatty_1564x1564', max: 1, defaultQty: 1 },
  { id: 'lettuce', name: 'Shredded Lettuce', price: 0.15, image: 'https://s7d1.scene7.com/is/image/mcdonalds/shredded_lettuce', max: 3, defaultQty: 1 },
  { id: 'sauce', name: 'Big Mac Sauce', price: 0.20, image: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_Ingredient_202110_00055-080__9049_BigMacSauce_1564x1564', max: 3, defaultQty: 1 },
  { id: 'pickles', name: 'Pickle Slices', price: 0.15, image: 'https://s7d1.scene7.com/is/image/mcdonalds/pickles', max: 3, defaultQty: 0 },
];

const QUARTER_POUNDER_INGREDIENTS = [
  { id: 'cheese', name: 'American Cheese', price: 0.49, image: 'https://s7d1.scene7.com/is/image/mcdonalds/ingredient_american_cheese_180x180', max: 3, defaultQty: 2 },
  { id: 'pickles', name: 'Pickle Slices', price: 0.15, image: 'https://s7d1.scene7.com/is/image/mcdonalds/pickles', max: 3, defaultQty: 2 },
  { id: 'onions', name: 'Reconstituted Onions', price: 0.15, image: 'https://s7d1.scene7.com/is/image/mcdonalds/reconstituted_onions', max: 2, defaultQty: 1 },
  { id: 'bun', name: 'Quarter Pounder Bun', price: 0.29, image: 'https://s7d1.scene7.com/is/image/mcdonalds/quarter_pounder_bun', max: 1, defaultQty: 1 },
];

const FILET_O_FISH_INGREDIENTS = [
  { id: 'fish', name: 'Poisson', price: 0.59, image: 'https://s7d1.scene7.com/is/image/mcdonalds/fish', max: 1, defaultQty: 1 },
  { id: 'cheese_half', name: 'Fromage', price: 0.49, image: 'https://s7d1.scene7.com/is/image/mcdonalds/american_cheese_half', max: 3, defaultQty: 1 },
  { id: 'sauce_tartare', name: 'Sauce Tartare', price: 0.20, image: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_Ingredient_202312_00009-000__9087_TartarSauce_1564x1564', max: 3, defaultQty: 1 },
  { id: 'bun_regular', name: 'Pain', price: 0.29, image: 'https://s7d1.scene7.com/is/image/mcdonalds/regular_bun', max: 1, defaultQty: 1 },
];

const getIngredientsForProduct = (productName: string) => {
  if (!productName) return [];
  const nameUpper = productName.toUpperCase();
  if (nameUpper.includes('BIG MAC')) return BIG_MAC_INGREDIENTS;
  if (nameUpper.includes('QUARTER')) return QUARTER_POUNDER_INGREDIENTS;
  if (nameUpper.includes('FILET')) return FILET_O_FISH_INGREDIENTS;
  return [];
};

function MenuScreen() {
  const insets = useSafeAreaInsets();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [customizations, setCustomizations] = useState<Record<string, number>>({});

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleAddToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.some(item => item.product.id === product.id);
      if (exists) {
        return prev.filter(item => item.product.id !== product.id);
      }
      
      const defaultIngredients = getIngredientsForProduct(product.name);
      const defaultMods: Record<string, number> = {};
      defaultIngredients.forEach(ing => defaultMods[ing.id] = ing.defaultQty);

      return [...prev, {
        cartItemId: Math.random().toString(),
        product,
        quantity: 1,
        customizations: defaultMods
      }];
    });
  };

  const openCustomizer = (product: any) => {
    setSelectedProduct(product);
    const ingredients = getIngredientsForProduct(product.name);
    if (ingredients.length > 0) {
      const initialConfigs: Record<string, number> = {};
      ingredients.forEach(ing => initialConfigs[ing.id] = ing.defaultQty);
      setCustomizations(initialConfigs);
    }
  };

  const updateCustomization = (ingId: string, delta: number, max: number) => {
    setCustomizations(prev => {
      const current = prev[ingId] ?? 0;
      const next = current + delta;
      if (next < 0 || next > max) return prev;
      return { ...prev, [ingId]: next };
    });
  };

  const getCustomizedTotal = () => {
    if (!selectedProduct) return 0;
    let total = selectedProduct.price;
    const ingredients = getIngredientsForProduct(selectedProduct.name);
    if (ingredients.length > 0) {
      ingredients.forEach(ing => {
        const qty = customizations[ing.id] ?? ing.defaultQty;
        if (qty > ing.defaultQty) {
          total += (qty - ing.defaultQty) * ing.price;
        }
      });
    }
    return total;
  };

  const handleConfirmCustomization = () => {
    if (selectedProduct) {
      setCart(prev => {
        const existingIdx = prev.findIndex(item => 
          item.product.id === selectedProduct.id && 
          JSON.stringify(item.customizations) === JSON.stringify(customizations)
        );

        if (existingIdx >= 0) {
          const newCart = [...prev];
          newCart[existingIdx] = { ...newCart[existingIdx], quantity: newCart[existingIdx].quantity + 1 };
          return newCart;
        }

        return [...prev, {
          cartItemId: Math.random().toString(),
          product: selectedProduct,
          quantity: 1,
          customizations: { ...customizations }
        }];
      });
      setSelectedProduct(null);
    }
  };

  const removeModification = (cartItemId: string, ingId: string, defaultQty: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
         return {
           ...item,
           customizations: {
             ...item.customizations,
             [ingId]: defaultQty
           }
         };
      }
      return item;
    }));
  };

  const updateCartItemQty = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
         const next = item.quantity + delta;
         if (next <= 0) return null as unknown as CartItem;
         return { ...item, quantity: next };
      }
      return item;
    }).filter(Boolean));
  };

  const calculateOverallTotal = () => {
     return cart.reduce((total, item) => {
       let itemTotal = item.product.price;
       const ingredients = getIngredientsForProduct(item.product.name);
       ingredients.forEach(ing => {
          const qty = item.customizations[ing.id] ?? ing.defaultQty;
          if (qty > ing.defaultQty) itemTotal += (qty - ing.defaultQty) * ing.price;
       });
       return total + (itemTotal * item.quantity);
     }, 0);
  };

  const handleCheckout = async () => {
    try {
      const orderPayload = {
        total: calculateOverallTotal().toFixed(2),
        timestamp: new Date().toISOString(),
        items: cart.map(item => {
          const defaultIngredients = getIngredientsForProduct(item.product.name);
          const modifications: string[] = [];
          
          defaultIngredients.forEach(ing => {
            const qty = item.customizations[ing.id] ?? ing.defaultQty;
            if (qty > ing.defaultQty) {
              modifications.push(`+${qty - ing.defaultQty} ${ing.name}`);
            } else if (qty < ing.defaultQty) {
              modifications.push(`-${ing.defaultQty - qty} ${ing.name}`);
            }
          });

          return {
            product: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            modifications: modifications
          };
        })
      };

      const WEBHOOK_URL = 'https://votre-domaine-n8n.com/webhook/commande-whatsapp';
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        Alert.alert('Succès', 'Commande envoyée sur WhatsApp via n8n !');
        setCart([]);
        setIsCartOpen(false);
      } else {
        Alert.alert('Attention', 'Le webhook a échoué (Test ?), mais la commande a été traitée localement.');
        setCart([]);
        setIsCartOpen(false);
      }
    } catch (error) {
      console.log('Webhook n8n error:', error);
      Alert.alert('Avertissement', "Impossible de joindre n8n, n'oubliez pas d'ajouter votre vraie URL (WEBHOOK_URL).");
      setCart([]);
      setIsCartOpen(false);
    }
  };

  const renderProduct = ({ item }: { item: any }) => {
    const isAdded = cart.some(cItem => cItem.product.id === item.id);

    return (
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.7}
        onPress={() => openCustomizer(item)}
      >
        <TouchableOpacity 
          style={[styles.addButton, isAdded && styles.addedButton]} 
          activeOpacity={0.8}
          onPress={() => toggleAddToCart(item)}
        >
          {isAdded ? (
            <Text style={styles.checkIcon}>✓</Text>
          ) : (
            <Text style={styles.addButtonText}>+</Text>
          )}
        </TouchableOpacity>
        <Image source={{ uri: item.url }} style={styles.productImg} resizeMode="contain" />
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productPrice}>{item.price.toFixed(2)}€</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.topSection, { paddingTop: insets.top + 10 }]}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>MENU MCDONALD'S</Text>
          <TouchableOpacity style={styles.cartIconContainer} activeOpacity={0.7} onPress={() => setIsCartOpen(true)}>
            <Feather name="shopping-cart" size={28} color="#2D2D2D" />
            {cartTotal > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartTotal}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={catalog}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
        />

        <Modal
          isVisible={!!selectedProduct}
          onBackdropPress={() => setSelectedProduct(null)}
          onSwipeComplete={() => setSelectedProduct(null)}
          swipeDirection={['down']}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            {selectedProduct && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{selectedProduct.name} ®</Text>
                    <Text style={styles.modalTotalPrice}>Total: $ {getCustomizedTotal().toFixed(2)}</Text>
                  </View>
                  <Image source={{ uri: selectedProduct.url }} style={styles.modalHeroImg} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.ingredientsList}>
                  {(() => {
                    const ingredients = getIngredientsForProduct(selectedProduct.name);
                    return ingredients.map(ing => {
                      const qty = customizations[ing.id] ?? ing.defaultQty;
                      return (
                        <View key={ing.id} style={styles.ingredientRow}>
                          <Image source={{ uri: ing.image }} style={styles.ingredientImg} />
                          <View style={styles.ingredientInfo}>
                            <Text style={styles.ingredientName}>{ing.name}</Text>
                            <Text style={styles.ingredientPrice}>$ {ing.price.toFixed(2)}</Text>
                          </View>
                          <View style={styles.qtyControls}>
                            <TouchableOpacity onPress={() => updateCustomization(ing.id, -1, ing.max)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                              <Text style={qty === 0 ? styles.qtyBtnDisabled : styles.qtyBtnMinus}>—</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyValue}>{qty}</Text>
                            {qty >= ing.max ? (
                              <View style={styles.checkWrap}>
                                <Text style={styles.checkOk}>✓</Text>
                              </View>
                            ) : (
                              <TouchableOpacity style={styles.qtyBtnWrap} onPress={() => updateCustomization(ing.id, 1, ing.max)}>
                                <Text style={styles.qtyBtnPlus}>+</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    });
                  })()}
                </ScrollView>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmCustomization} activeOpacity={0.8}>
                   <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Modal>

        {/* Cart Modal */}
        <Modal
          isVisible={isCartOpen}
          onBackButtonPress={() => setIsCartOpen(false)}
          onSwipeComplete={() => setIsCartOpen(false)}
          swipeDirection={['down']}
          style={{ margin: 0, justifyContent: 'flex-end' }}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: 20 }}>
            <View style={styles.cartScreenHeader}>
              <TouchableOpacity onPress={() => setIsCartOpen(false)} style={styles.cartBackBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Feather name="chevron-left" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.cartScreenTitle}>Your order</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {cart.map(item => {
                const defaultIngredients = getIngredientsForProduct(item.product.name);
                const modifications: {ing: any, diff: number, type: 'add' | 'remove'}[] = [];
                let itemUnitPrice = item.product.price;
                
                defaultIngredients.forEach(ing => {
                  const qty = item.customizations[ing.id] ?? ing.defaultQty;
                  if (qty > ing.defaultQty) {
                    const diff = qty - ing.defaultQty;
                    modifications.push({ ing, diff, type: 'add' });
                    itemUnitPrice += diff * ing.price;
                  } else if (qty < ing.defaultQty) {
                    const diff = ing.defaultQty - qty;
                    modifications.push({ ing, diff, type: 'remove' });
                  }
                });

                return (
                  <View key={item.cartItemId} style={styles.cartItemRow}>
                    <View style={styles.cartItemMain}>
                      <Image source={{ uri: item.product.url }} style={styles.cartItemImg} />
                      <View style={styles.cartItemInfo}>
                        <Text style={styles.cartItemName}>{item.product.name} ®</Text>
                        <Text style={styles.cartItemPrice}>$ {itemUnitPrice.toFixed(2)} {item.quantity > 1 ? `x ${item.quantity}` : ''}</Text>
                      </View>
                      <View style={styles.cartItemQtyControls}>
                        <TouchableOpacity onPress={() => updateCartItemQty(item.cartItemId, -1)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                          <Text style={styles.cartItemQtyBtnMinus}>—</Text>
                        </TouchableOpacity>
                        <Text style={styles.cartItemQtyValue}>{item.quantity}</Text>
                        <TouchableOpacity style={styles.cartItemQtyBtnPlusWrap} onPress={() => updateCartItemQty(item.cartItemId, 1)}>
                          <Text style={styles.cartItemQtyBtnPlus}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {modifications.map(mod => (
                      <View key={mod.ing.id} style={styles.cartModRow}>
                        <View style={styles.cartModInfo}>
                          <Text style={styles.cartModName}>
                            {mod.type === 'add' ? `+${mod.diff}` : `-${mod.diff}`} {mod.ing.name}
                          </Text>
                          {mod.type === 'add' && <Text style={styles.cartModPrice}>$ {(mod.diff * mod.ing.price).toFixed(2)}</Text>}
                        </View>
                        <TouchableOpacity onPress={() => removeModification(item.cartItemId, mod.ing.id, mod.ing.defaultQty)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                          <Feather name="x" size={20} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.cartFooter}>
              <View style={styles.cartTotalScreenRow}>
                <Text style={styles.cartTotalLabel}>Total</Text>
                <Text style={styles.cartTotalValue}>$ {calculateOverallTotal().toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.8}>
                <Text style={styles.checkoutBtnText}>Envoyer</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </View>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <MenuScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  topSection: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },

  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },

  cartIconContainer: {
    padding: 6,
    marginRight: 4,
    position: 'relative',
  },

  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: '#E53935',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#f5f5f5',
  },

  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
  },

  productsGrid: {
    paddingBottom: 20,
    paddingHorizontal: 4,
  },

  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    margin: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    minHeight: 180,
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
    color: '#333',
    minHeight: 36,
  },

  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DA291C',
    marginTop: 6,
  },

  addButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFBC0D',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },

  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: -2,
  },

  addedButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowOpacity: 0.05,
  },

  checkIcon: {
    color: '#E01725',
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalOverlay: {
    justifyContent: 'flex-end',
    margin: 0,
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '80%',
    maxHeight: '90%',
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalTotalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E01725',
  },
  modalHeroImg: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  ingredientsList: {
    paddingBottom: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  ingredientImg: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
    marginRight: 16,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    color: '#333',
  },
  ingredientPrice: {
    fontSize: 14,
    color: '#E01725',
    marginTop: 4,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
    justifyContent: 'space-between',
  },
  qtyBtnMinus: {
    fontSize: 16,
    color: '#FFBC0D',
    fontWeight: 'bold',
  },
  qtyBtnDisabled: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: 'bold',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E01725',
  },
  qtyBtnWrap: {
    backgroundColor: '#FFBC0D',
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnPlus: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
  checkWrap: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOk: {
    color: '#FFBC0D',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmBtn: {
    backgroundColor: '#DA291C',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  cartScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  cartBackBtn: {
    padding: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  cartScreenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cartItemRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  cartItemMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemImg: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginRight: 16,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#DA291C',
    marginTop: 4,
  },
  cartItemQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'space-between',
  },
  cartItemQtyBtnMinus: {
    fontSize: 18,
    color: '#FFBC0D',
    fontWeight: 'bold',
  },
  cartItemQtyValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  cartItemQtyBtnPlusWrap: {
    backgroundColor: '#FFBC0D',
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemQtyBtnPlus: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: -2,
  },
  cartModRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginLeft: 76, 
  },
  cartModInfo: {
  },
  cartModName: {
    fontSize: 15,
    color: '#333',
  },
  cartModPrice: {
    fontSize: 14,
    color: '#DA291C',
    marginTop: 2,
  },
  cartFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  cartTotalScreenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cartTotalLabel: {
    fontSize: 20,
    color: '#333',
    fontWeight: '500',
  },
  cartTotalValue: {
    fontSize: 22,
    color: '#DA291C',
    fontWeight: 'bold',
  },
  checkoutBtn: {
    backgroundColor: '#357a38', 
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
