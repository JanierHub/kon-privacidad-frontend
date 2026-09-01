import { PlaceholderScreen } from './PlaceholderScreen';

/**
 * Home tab main screen — "Inicio" in the UI.
 *
 * Renders the static layout for the first entregable through the shared
 * placeholder: a brand header ("konprivacidad") and a muted placeholder
 * area for the feed. No data fetching or feed logic yet.
 */
export function HomeScreen() {
  return <PlaceholderScreen headerTitle="konprivacidad" contentText="Contenido del feed" />;
}
