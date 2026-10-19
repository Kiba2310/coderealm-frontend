# Python Segédlet

A leggyakrabban használt Python szintaxis, adattípusok és beépített függvények egyetlen oldalon.

## Alapok és Kiíratás
Változók, megjegyzések és kimenet megjelenítése a képernyőn.

| Kód | Leírás |
| --- | --- |
| `x = 10` | Változó létrehozása |
| `print("Hello")` | Szöveg kiírása a konzolra |
| `print("x =", x)` | Változók és szövegek együttes kiírása |
| `# Megjegyzés` | Egysoros megjegyzés (comment) |
| `name = input("Név: ")` | Adatbekérés a konzolról |
| `a, b = 1, 2` | Több változó inicializálása egyszerre |
| `type(x)` | Megadja, hogy egy változó milyen típusú |

## Adattípusok
Az alapvető beépített típusok és az átváltás közöttük.

| Típusnév / Kód | Példa és Leírás |
| --- | --- |
| `int` | `age = 25` (Egész számok) |
| `float` | `price = 9.99` (Lebegőpontos számok) |
| `str` | `name = "Ada"` (Szöveg / Karaktersorozat) |
| `bool` | `is_active = True` (Logikai érték: True vagy False) |
| Lista | `nums = [1, 2, 3]` (Változtatható sorrendű kollekció) |
| Tuple | `point = (4, 5)` (Megváltoztathatatlan sorrendű kollekció) |
| Szótár | `user = {"id": 1}` (Kulcs-érték párok) |
| Semmi | `value = None` |
| `int("7")` | Szöveg átalakítása egész számmá |
| `str(42)` | Szám átalakítása szöveggé |

## Karakterláncok (Strings) & f-stringek
Szövegek formázása és manipulálása.

| Kód | Leírás |
| --- | --- |
| `f"Hi {name}, {age} vagy"`| Behelyettesítés f-string (formázott szöveg) segítségével |
| `len(text)` | A szöveg hosszának (karaktereinek számának) lekérdezése |
| `text.upper()` | Csupa nagybetűsítés |
| `text.lower()` | Csupa kisbetűsítés |
| `text.strip()` | Felesleges szóközök (whitespace) eltávolítása a végekről |
| `text.replace("a", "b")` | Egyezések cserélése ("a" lecserélése "b"-re) |
| `text.split(",")` | A string darabolása megadott karakter elválasztónyomán. Listát kapunk. |
| `", ".join(items)` | Lista elemeinek összefűzése egy stringgé |
| `text[0:3]` | Szöveg részletének kiemelése (Slicing 0-tól 3. részig) |
| `"py" in text` | Igaz, ha a text tartalmazza a "py"-t |

## Listák
Rendezett, módosítható adatsorok.

| Kód | Leírás |
| --- | --- |
| `nums = [1, 2, 3]` | Új lista deklaráció |
| `nums[0]` | A lista legelső (nulladik) eleme |
| `nums[-1]` | A lista legutolsó eleme |
| `nums.append(4)` | Hozzáadja a 4-et a lista legvégére |
| `nums.insert(0, 9)` | Beszúrja a 9-et a legelső, kezdő helyre |
| `nums.remove(2)` | Végigmegy a listán és letörli az első értéket, ami megegyezik 2-vel |
| `nums.pop()` | Kiveszi és visszaadja a tömb leghátsó elemét |
| `nums[1:3]` | Felvágja a listát (résztömb készítés) |
| `nums.sort()` | Sorrendbe igazítja az elemeket ABC / Numerikus sorrend szerint |
| `len(nums)` | Értékek meghatározása a listában (Mennyi pld. van benne) |

## Szótárak (Dictionaries)
Kulcs-érték párok gyors kereséshez.

| Kód | Leírás |
| --- | --- |
| `user = {"id": 1, "name": "Ada"}`| Új szótár deklaráció kulcsokkal és értékekkel |
| `user["name"]` | Egy konkrét kulcsra ("name") hivatkozva az érték (Ada) lekérése |
| `user.get("age", 0)` | Biztonságos értéklekérés: Ha nincs "age", kapok 0-t. |
| `user["age"] = 25` | Új kulcs / érték felvétele, vagy egy meglévő kulcs értékének módosítása |
| `del user["age"]` | A megadott kulcs eltávolítása a szótárból |
| `"name" in user` | Igaz/Hamis attól függően, hogy a megadott KULCS létezik-e a szótárban |
| `for k, v in user.items():`| Iterálás az összes elemen. K a kulcs (Key), V pedig a benne tárolt (Value) |
| `user.keys()` | Kinyeri egy listába az összes kulcsot |
| `user.values()` | Kinyeri egy listába az összes értéket |

## Vezérlési Szerkezetek (Control flow)
Feltételek és ciklusok.

| Kód | Leírás |
| --- | --- |
| `if x > 0:` | Ha X nagyobb 0-nál (Feltételkezdet) |
| `elif x == 0:` | Egyébként, ha X pont 0 |
| `else:` | Egyéb (Bármi más fennmaradó esetén) |
| `for item in items:` | Ciklus az adatokon (Végigmegy az `items` tömb minden elemén egyenként) |
| `for i in range(5):` | Szám ciklus (5 alkalommal lefut automatikus értékekkel: 0,1,2,3,4) |
| `while x < 10:` | Addig fut ismétlődően a loop, amíg a feltétel hamis nem lesz. |
| `for i, v in enumerate(items):`| Megadja egy cikluson belül nem csak az értéket (`v`), hanem a listán belüli sorszámát is (`i`) |
| `break` | A for / while ciklus azonnali leállítása és abbahagyása. |
| `continue` | A Ciklus a soron következő elemmel folytatódik, a lejjebb lévő kód lefutása az akkori ciklusban megáll. |
| `y = 1 if x else 0` | Ternary operatőr - Egy soros If-Else feltétel változó adásával |

## Függvények (Functions)
Újrahasználható kódblokkok definiálása.

| Kód | Leírás |
| --- | --- |
| `def greet(name):` | Egy új függvény definiálása `greet` néven egy paraméterrel. |
| `return name.upper()` | A Függvény leáll és a paraméterrel visszatér. A hívás helyén jelenik meg |
| `def greet(name="World"):`| Alapértelmezett érték megadása, ha lemaradna híváskor |
| `greet(name="Ada")` | Név szerinti argumentumok hívásakor. |
| `def f(*args, **kwargs):` | Definiálás tetszőleges számú sima, vagy név szerinti argumentumhoz. |
| `square = lambda x: x * x`| Névtelen kifejezés függvény: Bemenet `x`, Kiment pedig a kalkuláció. |

## Listakifejezések (List comprehensions)
Listák, halmazok és szótárak építése egyetlen kifejezéssel.

| Kód | Leírás |
| --- | --- |
| `[x * 2 for x in nums]` | Létrehoz egy új listát, de minden elem a kétszerese a réginek. |
| `[x for x in nums if x > 0]` | Kiszűri a 0 alatti elemeket és elmenti az újat gyorsan. |
| `{x % 3 for x in nums}` | Dinamikus (nem ismétlődő) Halmaz (Set) generálása |
| `{k: v * 2 for k, v in d.items()}` | Kulcs változatlan, de az összes érték szótárrá nő egyetlen sorban. |

## Gyakori beépített elemek
Gyakran használt függvények és modulok.

| Kód | Leírás |
| --- | --- |
| `len(x)` | Bármilyen vizsgált elem darabszámát adja vissza. |
| `range(start, stop, step)`| Egy szám sorozatot (lépés) épít az iterációhoz. |
| `sum(nums)`| Egy sorozat (Tömb) összes elemének pontos összegét számolja ki matematikailag. |
| `max(nums) / min(nums)` | A tömb / Sorozat legnagyobb vagy legkisebb értékeinek megállapítása pld Számok. |
| `sorted(items)` | Elvégzi a sorba rendezést, de nem felülírva, hanem új listaként menti vissza. |
| `zip(a, b)`| Összefűz kettő Listát és párhuzamosan pakolja egymásra sorokba |
| `import math`| A beépített matematika könyvtár csatlakoztatása (A script elején kell deklarálni). |
| `import random`| Beépített véletlenszám-generálás importálása. |
