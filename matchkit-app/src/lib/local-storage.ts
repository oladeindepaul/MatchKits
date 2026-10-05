// Gives the app a `localStorage` on iOS and Android (backed by SQLite on the device),
// which Supabase uses to keep shoppers logged in. The web build uses the browser's own.
import 'expo-sqlite/localStorage/install';
