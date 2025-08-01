import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_THEME: 'SET_THEME',
  SET_JOB_LISTINGS: 'SET_JOB_LISTINGS',
  SET_SELECTED_JOB: 'SET_SELECTED_JOB',
  SET_RESUME_DATA: 'SET_RESUME_DATA',
  SET_ANALYSIS_DATA: 'SET_ANALYSIS_DATA',
  RESET_APP_STATE: 'RESET_APP_STATE',
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  theme: 'light',
  jobListings: [],
  selectedJob: null,
  resumeData: {
    file: null,
    fileType: null,
    fileUrl: null,
    resumeText: '',
  },
  analysisData: [],
  analysisMetadata: null,
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      };

    case ActionTypes.SET_JOB_LISTINGS:
      return {
        ...state,
        jobListings: action.payload,
      };

    case ActionTypes.SET_SELECTED_JOB:
      return {
        ...state,
        selectedJob: action.payload,
      };

    case ActionTypes.SET_RESUME_DATA:
      return {
        ...state,
        resumeData: {
          ...state.resumeData,
          ...action.payload,
        },
      };

    case ActionTypes.SET_ANALYSIS_DATA:
      return {
        ...state,
        analysisData: action.payload.analysis || [],
        analysisMetadata: action.payload.metadata || null,
      };

    case ActionTypes.RESET_APP_STATE:
      return {
        ...initialState,
        theme: state.theme, // Preserve theme
        user: state.user, // Preserve user
        isAuthenticated: state.isAuthenticated, // Preserve auth state
      };

    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('resume-analyzer-theme');
    if (savedTheme && savedTheme !== state.theme) {
      dispatch({ type: ActionTypes.SET_THEME, payload: savedTheme });
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('resume-analyzer-theme', state.theme);
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Action creators
  const actions = {
    setUser: (user) => dispatch({ type: ActionTypes.SET_USER, payload: user }),
    setLoading: (loading) => dispatch({ type: ActionTypes.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ActionTypes.SET_ERROR, payload: error }),
    clearError: () => dispatch({ type: ActionTypes.CLEAR_ERROR }),
    setTheme: (theme) => dispatch({ type: ActionTypes.SET_THEME, payload: theme }),
    setJobListings: (listings) => dispatch({ type: ActionTypes.SET_JOB_LISTINGS, payload: listings }),
    setSelectedJob: (job) => dispatch({ type: ActionTypes.SET_SELECTED_JOB, payload: job }),
    setResumeData: (data) => dispatch({ type: ActionTypes.SET_RESUME_DATA, payload: data }),
    setAnalysisData: (data) => dispatch({ type: ActionTypes.SET_ANALYSIS_DATA, payload: data }),
    resetAppState: () => dispatch({ type: ActionTypes.RESET_APP_STATE }),
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <AppContext.Provider value={value}>
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

export default AppContext;