/**
 * LazyLoadWrapper Component
 * Wraps components with React Suspense for lazy loading
 *
 * Features:
 * - Automatic shimmer fallback during load
 * - Error boundary with retry
 * - Customizable loading states
 * - Works with React.lazy() components
 *
 * Usage:
 * ```tsx
 * const MyComponent = React.lazy(() => import('./MyComponent'));
 *
 * <LazyLoadWrapper fallback={<CardShimmer />}>
 *   <MyComponent />
 * </LazyLoadWrapper>
 * ```
 */

import React, {Suspense, Component, ErrorInfo, ReactNode} from 'react';
import {View, StyleSheet} from 'react-native';
import {ErrorFallback} from './ErrorFallback';
import {DashboardGridShimmer} from './Shimmer';

export interface LazyLoadWrapperProps {
  /**
   * The lazy-loaded component to render
   */
  children: ReactNode;

  /**
   * Fallback UI while loading
   * Defaults to DashboardGridShimmer
   */
  fallback?: ReactNode;

  /**
   * Custom error component
   */
  errorFallback?: ReactNode;

  /**
   * Callback fired when error occurs
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 * Catches errors in lazy-loaded components
 */
class ErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onRetry: () => void;
  },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    console.error('LazyLoadWrapper Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({hasError: false, error: undefined});
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          type="generic"
          variant="inline"
        />
      );
    }

    return this.props.children;
  }
}

/**
 * LazyLoadWrapper Component
 * Combines Suspense and ErrorBoundary for lazy loading
 */
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  onError,
}) => {
  const [retryKey, setRetryKey] = React.useState(0);

  const handleRetry = React.useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  const defaultFallback = fallback || (
    <View style={styles.fallbackContainer}>
      <DashboardGridShimmer />
    </View>
  );

  return (
    <ErrorBoundary
      key={retryKey}
      fallback={errorFallback}
      onError={onError}
      onRetry={handleRetry}>
      <Suspense fallback={defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Hook for manual retry logic
 */
export const useRetry = () => {
  const [retryCount, setRetryCount] = React.useState(0);

  const retry = React.useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return {retryCount, retry};
};

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
  },
});
