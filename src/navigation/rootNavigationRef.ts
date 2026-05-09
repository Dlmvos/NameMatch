import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types';

/** Root ref for the authenticated stack (`AuthenticatedRootNavigator`). Dev-only Maestro routes use this. */
export const authenticatedRootNavigationRef = createNavigationContainerRef<RootStackParamList>();
