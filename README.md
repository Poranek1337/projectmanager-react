# Project Manager

Projekt **Project Manager** to nowoczesna, multiplatformowa aplikacja desktopowa zbudowana w oparciu o React, Vite oraz Electron, wspierająca zarządzanie projektami, zadaniami i zaproszeniami użytkowników.

## Spis treści
1. [Wymagania wstępne](#wymagania-wstępne)
2. [Instalacja](#instalacja)
3. [Tryb deweloperski](#tryb-deweloperski)
4. [Budowanie i uruchamianie produkcyjne](#budowanie-i-uruchamianie-produkcyjne)
5. [Konfiguracja Firebase](#konfiguracja-firebase)
6. [Struktura projektu](#struktura-projektu)
7. [Użyte technologie](#użyte-technologie)
8. [Licencja](#licencja)

## Wymagania wstępne
- Node.js (zalecane >= 18.x)
- npm lub Yarn
- Konto Firebase (dla integracji firestore i autoryzacji)

## Instalacja
1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/twoje-repo/projectmanager-react.git
   ```
2. Przejdź do katalogu projektu:
   ```bash
   cd projectmanager-react
   ```
3. Zainstaluj zależności:
   ```bash
   npm install
   # lub
   yarn install
   ```

## Tryb deweloperski
- Uruchom frontend (Vite):
  ```bash
  npm run dev
  ```
  Aplikacja będzie dostępna pod adresem `http://localhost:5173/manager`.

- Uruchom w Electron (hot reload + Electron):
  ```bash
  npm run electron:dev
  ```
  W oddzielnym oknie zobaczysz wersję desktopową.

## Budowanie i uruchamianie produkcyjne
1. Zbuduj frontend:
   ```bash
   npm run build
   ```
2. Uruchom podgląd wersji produkcyjnej w Electron:
   ```bash
   npm run electron:preview
   ```
3. Tworzenie paczek instalacyjnych:
   - Windows (NSIS + Portable):
     ```bash
     npm run build:win
     ```
   - macOS (dmg + zip):
     ```bash
     npm run build:mac
     ```
   - Linux (AppImage + deb):
     ```bash
     npm run build:linux
     ```
4. Gotowe instalatory/paczki znajdziesz w katalogu `release/`.

## Konfiguracja Firebase
W pliku `src/infrastructure/firebase/firebase.js` umieść swoje poświadczenia Firebase:
```js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "TWÓJ_API_KEY",
  authDomain: "TWÓJ_AUTH_DOMAIN",
  projectId: "TWÓJ_PROJECT_ID",
  storageBucket: "TWÓJ_STORAGE_BUCKET",
  messagingSenderId: "TWÓJ_SENDER_ID",
  appId: "TWÓJ_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

## Struktura projektu
```
projectmanager-react/
├─ public/             # Pliki statyczne
├─ src/                # Katalog źródłowy React
│  ├─ components/      # Komponenty UI i logiki
│  ├─ hooks/           # Własne hooki React
│  ├─ infrastructure/  # Konfiguracja Firebase, preload dla Electron
│  ├─ layouts/         # Layouty stron
│  ├─ pages/           # Strony (routing)
│  ├─ services/        # Logika dostępu do Firestore
│  ├─ storage/         # Lokalna pamięć (localStorage)
│  └─ utils/           # Pomocnicze funkcje
├─ main.js             # Wejście Electron (Main process)
├─ preload.cjs         # Preload script do bezpiecznej komunikacji
├─ package.json
└─ vite.config.js
```

## Użyte technologie
- React 18
- Vite
- Electron
- Firebase (Auth + Firestore)
- Tailwind CSS
- Electron Builder (do pakowania aplikacji)

## Licencja
Projekt jest dostępny publicznie i może być dowolnie modyfikowany.
