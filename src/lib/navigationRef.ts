import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

/**
 * Shared navigation ref so non-component code (e.g. the deep-link handler)
 * can drive navigation. Attached to the active NavigationContainer in
 * AppNavigator. Only one container is mounted at a time, so a single ref
 * is safe to reuse across the authenticated / unauthenticated trees.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
