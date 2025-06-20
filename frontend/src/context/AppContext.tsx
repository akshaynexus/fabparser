import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Transaction, TransactionSummary } from '../App';
import { TimeFrame } from '../components/TimeframeFilter';

// State interface
interface AppState {
  data: TransactionSummary | null;
  loading: boolean;
  error: string | null;
  
  // Filters
  searchQuery: string;
  selectedCategories: string[];
  selectedTimeframe: TimeFrame | null;
  
  // UI State
  darkMode: boolean;
  sidebarOpen: boolean;
  currentTab: number;
  compactNumbers: boolean;
  
  // Derived data
  filteredTransactions: Transaction[];
}

// Action types
type AppAction =
  | { type: 'SET_DATA'; payload: TransactionSummary }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_CATEGORIES'; payload: string[] }
  | { type: 'SET_SELECTED_TIMEFRAME'; payload: TimeFrame | null }
  | { type: 'TOGGLE_DARK_MODE' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_CURRENT_TAB'; payload: number }
  | { type: 'TOGGLE_COMPACT_NUMBERS' }
  | { type: 'CLEAR_FILTERS' };

// Initial state
const initialState: AppState = {
  data: null,
  loading: false,
  error: null,
  searchQuery: '',
  selectedCategories: [],
  selectedTimeframe: null,
  darkMode: true, // Default to dark mode
  sidebarOpen: false,
  currentTab: 0,
  compactNumbers: true, // Default to compact (K) format
  filteredTransactions: [],
};

// Utility function to filter transactions
const getFilteredTransactions = (
  transactions: Transaction[],
  searchQuery: string,
  selectedCategories: string[],
  selectedTimeframe: TimeFrame | null
): Transaction[] => {
  let filtered = transactions;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(t =>
      t.description.toLowerCase().includes(query) ||
      t.merchant.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query) ||
      t.amount.toString().includes(query)
    );
  }

  if (selectedCategories.length > 0) {
    filtered = filtered.filter(t => selectedCategories.includes(t.category));
  }

  if (selectedTimeframe) {
    filtered = filtered.filter(t => {
      const transDate = new Date(t.date);
      return transDate >= selectedTimeframe.start && transDate <= selectedTimeframe.end;
    });
  }

  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_DATA': {
      const filteredTransactions = getFilteredTransactions(
        action.payload.transactions,
        state.searchQuery,
        state.selectedCategories,
        state.selectedTimeframe
      );
      return {
        ...state,
        data: action.payload,
        filteredTransactions,
        loading: false,
        error: null,
      };
    }
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_SEARCH_QUERY': {
      const filteredTransactions = state.data
        ? getFilteredTransactions(
            state.data.transactions,
            action.payload,
            state.selectedCategories,
            state.selectedTimeframe
          )
        : [];
      return {
        ...state,
        searchQuery: action.payload,
        filteredTransactions,
      };
    }
    
    case 'SET_SELECTED_CATEGORIES': {
      const filteredTransactions = state.data
        ? getFilteredTransactions(
            state.data.transactions,
            state.searchQuery,
            action.payload,
            state.selectedTimeframe
          )
        : [];
      return {
        ...state,
        selectedCategories: action.payload,
        filteredTransactions,
      };
    }
    
    case 'SET_SELECTED_TIMEFRAME': {
      const filteredTransactions = state.data
        ? getFilteredTransactions(
            state.data.transactions,
            state.searchQuery,
            state.selectedCategories,
            action.payload
          )
        : [];
      return {
        ...state,
        selectedTimeframe: action.payload,
        filteredTransactions,
      };
    }
    
    case 'TOGGLE_DARK_MODE':
      return { ...state, darkMode: !state.darkMode };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    
    case 'SET_CURRENT_TAB':
      return { ...state, currentTab: action.payload };
    
    case 'TOGGLE_COMPACT_NUMBERS':
      return { ...state, compactNumbers: !state.compactNumbers };
    
    case 'CLEAR_FILTERS': {
      const filteredTransactions = state.data ? state.data.transactions : [];
      return {
        ...state,
        searchQuery: '',
        selectedCategories: [],
        selectedTimeframe: null,
        filteredTransactions,
      };
    }
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Action creators
export const appActions = {
  setData: (data: TransactionSummary) => ({ type: 'SET_DATA' as const, payload: data }),
  setLoading: (loading: boolean) => ({ type: 'SET_LOADING' as const, payload: loading }),
  setError: (error: string | null) => ({ type: 'SET_ERROR' as const, payload: error }),
  setSearchQuery: (query: string) => ({ type: 'SET_SEARCH_QUERY' as const, payload: query }),
  setSelectedCategories: (categories: string[]) => ({ type: 'SET_SELECTED_CATEGORIES' as const, payload: categories }),
  setSelectedTimeframe: (timeframe: TimeFrame | null) => ({ type: 'SET_SELECTED_TIMEFRAME' as const, payload: timeframe }),
  toggleDarkMode: () => ({ type: 'TOGGLE_DARK_MODE' as const }),
  setSidebarOpen: (open: boolean) => ({ type: 'SET_SIDEBAR_OPEN' as const, payload: open }),
  setCurrentTab: (tab: number) => ({ type: 'SET_CURRENT_TAB' as const, payload: tab }),
  toggleCompactNumbers: () => ({ type: 'TOGGLE_COMPACT_NUMBERS' as const }),
  clearFilters: () => ({ type: 'CLEAR_FILTERS' as const }),
};