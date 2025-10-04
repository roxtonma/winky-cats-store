'use client'

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { toast } from 'react-toastify'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  maxQuantity: number
}

type CartState = {
  items: CartItem[]
  totalItems: number
  totalAmount: number
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.id === action.payload.id)

      if (existingItem) {
        const newQuantity = Math.min(existingItem.quantity + 1, existingItem.maxQuantity)
        const updatedItems = state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: newQuantity }
            : item
        )
        return calculateTotals({ ...state, items: updatedItems })
      }

      const newItem = { ...action.payload, quantity: 1 }
      return calculateTotals({ ...state, items: [...state.items, newItem] })
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload)
      return calculateTotals({ ...state, items: updatedItems })
    }

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: id })
      }

      const updatedItems = state.items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
          : item
      )
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
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items))
  }, [state.items])

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    toast.success(`${item.name} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  const removeItem = (id: string) => {
    const item = state.items.find(i => i.id === id);
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    if (item) {
      toast.info(`${item.name} removed from cart`, {
        position: "bottom-right",
        autoClose: 2000,
      });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    const item = state.items.find(i => i.id === id);
    const oldQuantity = item?.quantity || 0;
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });

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
      clearCart
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