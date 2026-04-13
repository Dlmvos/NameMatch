// NameMatch – explicit app entrypoint
// Replaces expo-router/entry — this is a classic Expo (React Navigation) app,
// NOT an Expo Router app. Do not change this to expo-router/entry.
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
