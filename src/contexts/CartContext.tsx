'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  maxQuantity: number
  variant?: {
    size?: string
    color?: string
    colorName?: string
  }
}

type CartState = {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: { id: string; variant?: { size?: string; colorName?: string } } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; variant?: { size?: string; colorName?: string }; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string, variant?: { size?: string; colorName?: string }) => void
  updateQuantity: (id: string, variant: { size?: string; colorName?: string } | undefined, quantity: number) => void
  clearCart: () => void
  loading: boolean
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Match items by both ID and variant (size + color)
      const existingItem = state.items.find(item =>
        item.id === action.payload.id &&
        item.variant?.size === action.payload.variant?.size &&
        item.variant?.colorName === action.payload.variant?.colorName
      )

      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + 1, existingItem.maxQuantity)
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id &&
          item.variant?.size === action.payload.variant?.size &&
          item.variant?.colorName === action.payload.variant?.colorName
            ? { ...item, quantity: newQuantity }
            : item
        )
        return calculateTotals({ ...state, items: updatedItems })
      }

      const newItem = { ...action.payload, quantity: 1 }
      return calculateTotals({ ...state, items: [...state.items, newItem] })
    }

    case 'REMOVE_ITEM': {
      // Remove item matching both ID and variant (if provided)
      const updatedItems = state.items.filter(item => {
        if (item.id !== action.payload.id) return true

        // If no variant in payload, only match by ID
        if (!action.payload.variant) {
          return item.variant !== undefined
        }

        // Match by variant (size and colorName)
        return !(
          item.variant?.size === action.payload.variant.size &&
          item.variant?.colorName === action.payload.variant.colorName
        )
      })
      return calculateTotals({ ...state, items: updatedItems })
    }

    case 'UPDATE_QUANTITY': {
      const { id, variant, quantity } = action.payload
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { id, variant } })
      }

      // Update quantity matching both ID and variant
      const updatedItems = state.items.map(item => {
        if (item.id !== id) return item

        // Match by variant if provided
        if (variant) {
          if (
            item.variant?.size === variant.size &&
            item.variant?.colorName === variant.colorName
          ) {
            return { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          }
          return item
        }

        // No variant matching, update by ID only
        return { ...item, quantity: Math.min(quantity, item.maxQuantity) }
      })
      return calculateTotals({ ...state, items: updatedItems })
    }

    case 'CLEAR_CART': {
      return { items: [], totalItems: 0, totalAmount: 0 }
    }

    case 'LOAD_CART': {
      return calculateTotals({ ...state, items: action.payload })
    }

    default:
      return state
  }
}

function calculateTotals(state: CartState): CartState {
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  return { ...state, totalItems, totalAmount }
}

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [loading, setLoading] = useState(true)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartItems })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
    setLoading(false)
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items))
  }, [state.items])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });

    // Build display name with variant info
    let displayName = item.name;
    if (item.variant) {
      const variantParts = [];
      if (item.variant.size) variantParts.push(item.variant.size);
      if (item.variant.colorName) variantParts.push(item.variant.colorName);
      if (variantParts.length > 0) {
        displayName = `${item.name} (${variantParts.join(', ')})`;
      }
    }

    toast.success(`${displayName} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const removeItem = (id: string, variant?: { size?: string; colorName?: string }) => {
    const item = state.items.find(i => {
      if (i.id !== id) return false
      if (!variant) return !i.variant
      return i.variant?.size === variant.size && i.variant?.colorName === variant.colorName
    });
    dispatch({ type: 'REMOVE_ITEM', payload: { id, variant } });
    if (item) {
      // Build display name with variant info
      let displayName = item.name;
      if (item.variant) {
        const variantParts = [];
        if (item.variant.size) variantParts.push(item.variant.size);
        if (item.variant.colorName) variantParts.push(item.variant.colorName);
        if (variantParts.length > 0) {
          displayName = `${item.name} (${variantParts.join(', ')})`;
        }
      }
      toast.info(`${displayName} removed from cart`, {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const updateQuantity = (id: string, variant: { size?: string; colorName?: string } | undefined, quantity: number) => {
    const item = state.items.find(i => {
      if (i.id !== id) return false
      if (!variant) return !i.variant
      return i.variant?.size === variant.size && i.variant?.colorName === variant.colorName
    });
    const oldQuantity = item?.quantity || 0;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, variant, quantity } });

    if (item && quantity > 0) {
      if (quantity > oldQuantity) {
        toast.success(`${item.name} added`, {
          position: "bottom-right",
          autoClose: 1500,
        });
      } else if (quantity < oldQuantity) {
        toast.info(`${item.name} removed`, {
          position: "bottom-right",
          autoClose: 1500,
        });
      }
    }
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  return (
    <CartContext.Provider value={{
      state,
      dispatch,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      loading
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}