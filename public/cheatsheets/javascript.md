# JavaScript Segédlet

Modern JavaScript szintaxis, tömb metódusok és aszinkron minták egy oldalon.

## Változók és Alapok
Adattárolás modern módokon.

| Kód | Leírás |
| --- | --- |
| `let x = 10;` | Új, a későbbiekben módosítható (átírható) változó. |
| `const y = 20;` | Konstans, nem megváltoztatható állandó változó. Szinte mindig ajánlott. |
| `console.log(x);` | Szöveg, érték vagy adatstruktúra megjelenítése a böngésző konzoljában. |
| `typeof x === "number"` | Ellenőrzi, hogy `x` változó számtípusként lett-e létrehozva. |

## Karakterláncok (Strings)
Formázás és feldolgozás.

| Kód | Leírás |
| --- | --- |
| ``const msg = `Szia, ${name}!`;`` | Szöveg interpoláció, avagy backtick ("``") alapú dinamikus behelyettesítés. |
| `str.length` | A megadott string karakterekből álló hossza hossza. |
| `str.toUpperCase()` | Kicseréli az összes karaktert Csupa Nagybetűre (Vagy fordítva: `toLowerCase()`) |
| `str.includes("valami")` | Bool érték azzal kapcsolatban miszerint szerepel-e a szöveg. |
| `str.split(",")` | Kiszúrja és levágja a megfelelő elemeket a beállított paraméternél. (PLD , vessző) |

## Tömbök (Arrays) és Metódusok
Azok a funkciók, amiket mindig Google-özöl.

| Kód | Leírás |
| --- | --- |
| `const arr = [1, 2, 3];` | Rögzített változó új tömb (Data Collection) elemmel formázva. |
| `arr.push(4);` | Tömb végéhöz egy új elem (Objektum vagy Integer) hozzáillesztése. |
| `arr.pop();` | Tömb végét megkeresi és kitörli onnan a benne lévő érétket. |
| `const d = arr.map(x => x * 2);`| Átmásolja a módosított szabályrendszer alapján a teljes tömböt. Itt minden értéket kétszeres szorzatként mentve el! |
| `const e = arr.filter(x => x > 2);` | Elutasít (kiszelektál) részeket az alapján mi nem felel meg! Itteni példakén: Mi az ami NÉGYNÉL kisebb? Mert akkor mehet ki. |
| `const r = arr.reduce((a, c) => a + c, 0);`| Egyetlen végeredményre hozza le az operátort. Pld: Szummáztatja (A-tól C-ig) |
| `const found = arr.find(x => x > 1);` | Csak az első elemet kapod vissza a listából, ha az teljesíti! Többi nem érdekli |

## Objektumok (Objects)
Kulcs-érték párok (Key - Value Pairs).

| Kód | Leírás |
| --- | --- |
| `const user = { name: "Bob" };`| JavaScript Object. Módosítható egybe foglalt és hivatkozott adatok (Kulcsszóhoz értékkén). |
| `user.name` | Hivatalos hozzáférés a (Objectben) regisztált name név értékéhez! |
| `Object.keys(user)` | Ad egy sima indexalatt hivatkozott Tömböt ahová csak az OSZTÁLY kulcsszavak jönneK(Name, ID) |
| `Object.values(user)`| A fenti tömb csak és ellentétes, értékek kiíratásával a végleges értékek lesznek benne. |
| `const { name } = user;` | Destructuring. Ha több ezer értéked van, így te ki nyerheted hogy egy var - Const hivatkozzon pld a "name"-re |

## Függvények (Functions)
Újrahasználható kódblokkok.

| Kód | Leírás |
| --- | --- |
| `function greet(name) { ... }` | Funkció! Hívható pld `greet("Teszt")`! A függvényen belül végre kell hajtatni valami utasítást. |
| `const add = (a, b) => a + b;` | "Arrow Func", rövidebb letisztul funkció használat! Automa `Return` funkciókat tud végeztetni! |

## Aszinkron kód (Async / Promises)
Adatlekérés és háttérben futó folyamatok API hívásokkal!

| Kód | Leírás |
| --- | --- |
| `fetch("api/adat").then(...)` | Eredeti (Classic JS Promise) kód alap API Hívások intézésére és .Then vagyis "Majd ez teszi rá" várás |
| `async function getData() { ... }` | ES6 Szabvánnyos Asynchronous várójáték API és hálózat tesztek esetén |
| `await fetch("api/adat");` | Várakozás a parancssornál. A JS program nem folytatódik mindaddig míg ez a sor (Adatlekérés) nem 100%. |
| `setTimeout(() => {}, 1000);` | Aszinkron JS háttér visszaszámlálás Timer-rel, ez jelenleget tekintve 1mp! |
