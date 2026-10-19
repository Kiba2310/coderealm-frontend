# Böngészőben futó MI-mentor (WebLLM & WebGPU)

A szakdolgozatom egyik központi eleme a leckék felületébe (`Lesson.tsx`) integrált intelligens segítségnyújtó modul, az **AIMentorPanel**. A modul célja, hogy a tanulók számára személyre szabott, lépcsőzetes segítséget nyújtson a programozási feladatok megoldása közben – anélkül, hogy a kész kódot készen átadná.

---

## 1. Miért kliensoldali (in-browser) az MI?

Hagyományos megközelítésnél minden tanulói kérés egy központi felhős API-hoz (pl. OpenAI) vagy saját dedikált inferenciaszerverhez futna be. Egy oktatóplatformnál ez több problémát is felvet:
- **Magas üzemeltetési és token-költségek:** Több tucat vagy száz párhuzamosan dolgozó diák esetén a tokenalapú számlázás drága, a dedikált GPU-s szerver bérlése pedig költséges.
- **Adatvédelem és biztonság:** A tanuló által beírt kód közvetlenül a saját böngészőjében marad, nem kerül továbbításra harmadik fél felé.
- **Skálázhatóság:** Mivel az inferenciát a kliens saját grafikus vezérlője (GPU) végzi WebGPU segítségével, a szerver terhelése 0 marad az MI lekérdezések során.

---

## 2. Architektúra és működés

A böngésző fő szála és a React felület nem akadhat meg a tokenek generálása közben, ezért az inferenciát egy külön háttérszálra (**Web Worker**) szerveztem ki.

```text
Lesson.tsx  ──►  AIMentorPanel  ──►  useAIMentor hook
                                            │
                                            ▼  (csak bekapcsoláskor)
                                    WebLLM Worker Proxy
                                            │
                                            ▼  (postMessage)
                                  Web Worker (WebGPU)
                                            │
                                            ▼
                                  Helyi LLM modell (Qwen)
```

### Főbb megvalósítási részletek:
- **Lusta betöltés (Lazy Loading):** Az oldal megnyitásakor nem indul el a modell letöltése. Csak akkor inicializálódik a WebLLM motor, amikor a diák rákattint az *„AI mentor bekapcsolása”* gombra.
- **Állapotkezelés:** A `useSyncExternalStore` React hookon keresztül kapcsolódik a felület az egységes `MentorService`-hez, garantálva a tiszta állapotkezelést és az újrarenderelések optimalizálását.
- **Kliensoldali cache:** A modell súlyait a böngésző Cache API-ja tárolja. Az első letöltés után az újbóli betöltések már másodpercek alatt megtörténnek a helyi gyorsítótárból.
- **Erőforrás-felszabadítás:** Leckeváltáskor az elavult kérés megszakad (`interruptGenerate`), a panel bezárásakor vagy kikapcsolásakor pedig a worker és a GPU-erőforrások felszabadulnak (`unload`).

---

## 3. Választható modellek és hardverigény

A WebGPU támogatása a modern böngészőkben (Chrome, Edge, Firefox) közvetlenül elérhető, és dedikált videokártya mellett korszerű integrált GPU-n (pl. Intel Iris Xe, AMD Radeon, Apple Silicon) is működik.

Két modellt konfiguráltam a `@mlc-ai/web-llm` beépített listájából:

| Mód | Alapértelmezett modell | Becsült VRAM igény (f16 / f32) | Jellemzők |
| :--- | :--- | :---: | :--- |
| **Normál mód** | `Qwen2.5-1.5B-Instruct` | ~1.6 GB / ~1.9 GB | Részletesebb, jobb magyar fogalmazási készség |
| **Kompakt mód** | `Qwen2.5-Coder-0.5B-Instruct` | ~0.9 GB / ~1.1 GB | Gyorsabb betöltés, gyengébb gépeken is elfér |

Ha a hardver támogatja a `shader-f16` funkciót, a rendszer automatikusan a kisebb és gyorsabb `q4f16_1` kvantált változatot tölti le; ennek hiányában a `q4f32_1` változatra vált.

Ha a felhasználó gépe nem rendelkezik WebGPU-val, vagy nincs elég szabad VRAM, a rendszer nem omlik össze, hanem automatikusan átvált a beépített, szabályalapú tippekre.

---

## 4. Pedagógiai szabályrendszer és prompt-védelem

A cél nem az, hogy a diák helyett megírjuk a kódot, hanem a rávezetés és a hibakeresés segítése.

### A 4 fokozatos segítségi szint:
1. **1. szint – Fogalmi irány:** Általános elvi útmutatás (pl. „Itt egy ciklusra lesz szükséged a lista bejárásához”).
2. **2. szint – Érintett terület:** Rámutat arra a kódrészletre vagy változóra, ahol a logika félrecsúszott.
3. **3. szint – Magyarázat és analóg példa:** Rövid magyarázat a hiba okáról és egy hasonló, de nem a konkrét feladathoz tartozó példakód.
4. **4. szint – Lépéses stratégia:** Lépésről lépésre végigvezeti a tanulót a megoldás menetén.

### Megoldás-elárulás elleni védelem:
- **Kontextus izoláció:** A promptba kizárólag a feladat nyilvános leírása, a diák jelenlegi kódja és az utolsó futtatási hibaüzenet kerül be. A rejtett tesztesetek és az elvárt kimenetek sosem jutnak el a modellhez.
- **Rendszerprompt szabályok:** Szigorú megkötések tiltják a teljes megoldás kiírását vagy függvénydefiníciók generálását.
- **Kimeneti heurisztikus szűrő:** Ha a modell válasza mégis teljes megoldáskódot tartalmazna, a szűrő letiltja a megjelenítést, és biztonságos helyi tippre vált vissza.

---

## 5. Tesztelés és minőségbiztosítás

A modulhoz 32 automatizált egységteszt készült, amelyek mock engine segítségével ellenőrzik a működést hálózati forgalom nélkül:

```sh
# Függőségek telepítése
npm install

# Egységtesztek futtatása (modell, prompt, szolgáltatás)
npm test

# Felületi komponens tesztek
npm run test:ui

# Típusellenőrzés és build
npm run typecheck
npm run build
```

### Kézi tesztelési ellenőrzőlista:
- [ ] Lecke megnyitása: induláskor nincs háttérbeli hálózati forgalom vagy modell-letöltés.
- [ ] Offline / helyi tippek: kikapcsolt MI mellett a 4 segítségi szint működik szabályalapú tippekkel.
- [ ] Bekapcsolás: megjelenik a magyar nyelvű betöltési folyamatjelző, majd a kész állapot.
- [ ] Válaszgenerálás: a válasz szakaszonként (streamelve) jelenik meg, közben a kódszerkesztő használható marad.
- [ ] Megszakítás: a „Megállítás” gombra a válasz azonnal leáll.
- [ ] Gyorsítótár: oldalfrissítés után a modell újraaktiválása a Cache API miatt azonnal lezajlik.
- [ ] Hibakezelés: hiányzó WebGPU vagy memóriahiány esetén egyértelmű hibaüzenet és kisebb modell javaslata jelenik meg.

---

## 6. Hivatkozások és források

- [WebLLM dokumentáció és API](https://webllm.mlc.ai/)
- [Qwen2.5 nyelvi modellek (Alibaba Cloud)](https://github.com/QwenLM/Qwen2.5)
- [WebGPU W3C specifikáció](https://www.w3.org/TR/webgpu/)
- [React useSyncExternalStore API](https://react.dev/reference/react/useSyncExternalStore)
