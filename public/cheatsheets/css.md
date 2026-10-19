# CSS Segédlet

Szelektorok, dobozmodell (box model), flexbox, grid és a gyakran elfelejtett tulajdonságok.

## Szelektorok (Selectors)
Hogyan válasszuk ki az elemeket.

| Szelektor | Példa | Leírás |
| --- | --- | --- |
| Univerzális | `* { }` | A DOM-ban lévő összes HTML elemet módosítja. |
| Tag (Típus) | `div { }` | Erősen felülírja az adott html tag tulajdonságait globálisan. (Pl. minden `p`) |
| Osztály (Class) | `.osztaly-nev { }` | Egy HTML `class="osztaly-nev"` részre köti rá stílusokat! Leggyakoribb! |
| ID | `#azonosito { }` | Legerősebb egyedi szelektor HMTL `id="azonosito"` részre. (Kerüld ha lehet) |
| Pszeudo osztály | `a:hover { }` | Interaktív vagy állapot-alapú választó (pl: Ha ráviszi az egeret) |
| Pszeudo elem | `p::first-line { }` | Az elem egy bizonyos tartalmát vagy virtuális formáját babrálja. |

## A Dobozmodell (Box Model)
Minden HTML elem egy téglalap alakú doboz.

| Tulajdonság | Leírás |
| --- | --- |
| `width / height` | Doboz konkrét szélessége és magassága. |
| `padding` | Belső margó. A tartalom és a doboz KERETE közti tér megnyújtása! |
| `border` | Vonal rajzolása direkten a Doboz Végéhez. Lezárja a Paddinget! |
| `margin` | Külső margó. Mennyire lökje el/tolja odébb magától a többieket? |
| `box-sizing: border-box;` | Szuper fontos: Biztosítja, hogy a Szélesség a padding-et is magába számolja be, különben kilóg az oldalról! |

## Színek és Hátterek
Kinézet és textúrák.

| Tulajdonság | Leírás |
| --- | --- |
| `color: #ff0000;` | Az elem tartalmi betűkaraktereinek a színe PIROSRA színezve HEX formátumban! |
| `background-color: blue;` | Doboz háttér kitöltése színnel (Névről felismerhető pld: blue) |
| `background-image: url("x");` | Egy internetes, vagy file elérési Képet varázsol rá Hátterkét! |
| `background-size: cover;` | Akkor is ha a kép nagy/kicsi mindenhogyan tölse ki a teret a levágás árán is! |

## Szöveg formázása (Typography)

| Tulajdonság | Leírás |
| --- | --- |
| `font-family: 'Arial';` | Betűtípus váltása. (Láthatod lefutás alatt az OS defaultokat ha nem tölti be) |
| `font-size: 16px;` | Szöveg olvasható mérete standard (Pixel, rem, em) |
| `font-weight: bold;` | Betűk vastagságának kitolása maximumra. Vagy szám is lehet( 200, 300..700 stb) |
| `text-align: center;` | Betűk iránya ha középre, jobb, vagy ballra toljuk el a margótól is akár. |
| `line-height: 1.5;` | Sor magasságának csúsztatása egymástól. |

## Flexbox (Rugalmas Elrendezés)
Egydimenziós (sor vagy oszlop) egyenletes elrendezés. (Mindig a Szülő (Container) elem kapja a `display: flex`-et!)

| Tulajdonság (Szülön) | Leírás |
| --- | --- |
| `display: flex;` | Flexbox kontextusának aktiválása, mindent azonnal balról-jobbra rendez. |
| `flex-direction: column;` | Alap sorrend (Row) megváltoztatása lefelé folyó folyamattá (Oszloppá) |
| `justify-content: center;` | Elemek középre húzása az **elsődleges tengelyen** (Vízszintes normálisan) |
| `align-items: center;` | Elemek középre igazítása a **másodlagos tengelyen** (Középre rántja függőlegesen) |
| `gap: 16px;` | Margin helyett tökéletes elválasztás pld a doboz elemeitől egymás közt mindenből. |

## CSS Grid
Kétdimenziós (sor ÉS oszlop egyszerre) hálózatok készítése.

| Tulajdonság | Leírás |
| --- | --- |
| `display: grid;` | Grid motor aktiválása (Szintén Szülő tagen kötelező hívni). |
| `grid-template-columns: repeat(3, 1fr);`| Dinamikus felépítése az asztalnak (Itt 3 db EGYENLŐ arányú Szeletként áll be). |
| `grid-column: 1 / 3;` | EGY ELEM (Nem Szülő, maga az elem) beállítására aszerint, hogy hol kezdődjon az oszlop beül és meder tartson az asztalon (Felvesz több oszlopot). |

## Pozícionálás (Positioning)
Elemek pontos elhelyezése a térben (A X,Y asztalon).

| Érték (`position:` ) | Leírás |
| --- | --- |
| `static` | Alapértelmezett. A dokumentum "flow" része. |
| `relative` | A saját, eredeti logikai helyéhez van Kötve, csak arrébb húzhatod a vizualitás miatt kicsit! |
| `absolute` | Elszakad az asztaltól! Bárhová húzhatod pontos pixel formában. Veszélyes. |
| `fixed` | Soha de soha nem mozdulnak az elemek, még Scroll / Lapozásnál is FIXEN rá vannak égve a képernyő monitor (Viewport) képére. |
| `sticky` | Beépült elem, amin görgetve a megadott Top (pixel) elérvén hirtelen ragad fel az oldal tetejére! |
