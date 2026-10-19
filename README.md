# CodeRealm – Frontend alkalmazás

Modern, böngészőben futó programozás-oktató felület React 19, TypeScript és Vite alapokon, integrált Monaco kódszerkesztővel, játékosítási funkciókkal és helyi, adatvédelmi szempontból zárt WebLLM MI-mentorral.

## 1. Főbb funkciók

- **Interaktív kódszerkesztő:** Monaco Editor integráció szintaxiskiemeléssel, automatikus kiegészítéssel és billentyűparancsokkal (Python, JavaScript, C# támogatással).
- **Tananyag- és leckekezelés:** Kurzusok, fejezetek és leckék áttekintése, beépített elméleti tananyagokkal és feladatkiírásokkal.
- **Kódfuttatás és tesztkiértékelés:** Közvetlen kommunikáció a backend sandbox szolgáltatásával, azonnali kimeneti és teszteredmény-visszajelzéssel.
- **Böngészőoldali MI-mentor:** Helyi, WebGPU-alapú WebLLM modell (Qwen2.5 család), amely dedikált Web Workerben fut, és fokozatos segítséget nyújt a feladatok megoldásához anélkül, hogy a diák kódja külső szerverekre kerülne.
- **Játékosítás és motiváció:**
  - Tapasztalati pontok (XP), szintlépések és dinamikus fejlődési sáv.
  - Globális és csoportos ranglista (Leaderboard).
  - Napi bejelentkezési naptár (Daily Calendar) és napi kódolási kihívások.
  - Megszerezhető jelvények (Achievements) és virtuális bolt (Storefront) profil-testreszabási elemekkel.
- **Csoport- és adminkezelés:** Felhasználói profilok, csoportok és kurzusok felügyelete az adminisztrátori irányítópulton.

## 2. Technológiai verem

- **Keretrendszer & Nyelv:** React 19, TypeScript, Vite
- **UI komponensek:** Material-UI (MUI v9), Emotion, MUI Icons
- **Kódszerkesztő:** `@monaco-editor/react`
- **Autentikáció:** `keycloak-js` (OAuth2 / OIDC integráció PKCE-vel)
- **Helyi MI-futtatás:** `@mlc-ai/web-llm` (WebGPU hardveres gyorsítással, külön Web Workerben)
- **Kódminőség & Eszközök:** Oxlint, TypeScript compiler (`tsc`)

## 3. Helyi indítás és parancsok

### Előfeltételek:
- Node.js (v20+ vagy v22+)
- npm (v10+)

### Telepítés és indítás:
```sh
# Függőségek telepítése
npm install

# Fejlesztői szerver indítása (alapértelmezetten: http://localhost:5173)
npm run dev
```

### Elérhető parancsok:
| Parancs | Funkció |
| --- | --- |
| `npm run dev` | Helyi fejlesztői szerver indítása gyors HMR támogatással |
| `npm run build` | Éles produkciós csomag építése a `dist/` könyvtárba |
| `npm run typecheck` | Szigorú TypeScript típusellenőrzés (`tsc --noEmit`) |
| `npm run lint` | Statikus kódanalízis és linter futtatása Oxlint segítségével |
| `npm test` | MI-mentor szabályok és szolgáltatás egységtesztjei |
| `npm run test:ui` | Mentorpanel felületi renderelési tesztjei |

## 4. Konfigurációs beállítások

A környezeti változók a gyökérkönyvtárban lévő `.env` vagy `.env.local` állományban adhatók meg a [`.env.example`](.env.example) alapján:

```dotenv
# Backend API elérése (alapértelmezett: http://localhost:8081)
VITE_API_URL=http://localhost:8081

# Keycloak autentikáció
VITE_KEYCLOAK_URL=https://keycloak.pollak.info
VITE_KEYCLOAK_REALM=coderealm
VITE_KEYCLOAK_CLIENT_ID=coderealm-frontend

# Opcionális MI-mentor modell-felülbírálás (WebLLM model_list alapján)
VITE_AI_MENTOR_MODEL=
VITE_AI_MENTOR_COMPACT_MODEL=
```

## 5. Kapcsolódó dokumentáció

- [CodeRealm Backend GitHub-repó](https://github.com/Kiba2310/coderealm-backend) – Rendszerarchitektúra és mikroszolgáltatások
- [MI-mentor: architektúra és modellválasztás](docs/ai-mentor.md) – A böngészőoldali WebLLM mentor részletes működése
