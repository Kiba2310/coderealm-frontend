# TypeScript Segédlet

TypeScript típusok, interfészek, generikusok és segédtípusok gyors áttekintése.

## Alap Típusok (Basic Types)

| Kód | Leírás |
| --- | --- |
| `let isDone: boolean = false;` | Igaz/Hamis típusú értékek |
| `let decimal: number = 6;` | Szövegek helyett matematikai egész, vagy lebegő számok |
| `let color: string = "blue";` | Normál, betűvel tagolt mondatok és szavak |
| `let list: number[] = [1, 2];` | Tömb (Array), ami szigorúan csakis számokat tartalmazhat |
| `let tuple: [string, number];` | Pontos mintára és elemszámra korlátozott adathalmaz |

## Összetett Típusok és Interfészek

| Kód | Leírás |
| --- | --- |
| `type Point = { x: number; };` | Saját (Type) Típus leírása fix értékekhez |
| `interface User { id: number; }` | Object orientált osztály definíció az elemek kötelező létére! |
| `interface User { email?: string; }` | Kérdőjellel jelölt **opcionális** (lehet hiányzik) elem! |
| `interface Admin extends User` | Kibővíti az "Admin" interface-t a korábbi "User" adataival! |
| `type Status = "ok" \| "err";` | Union típus: A változó CSAKIS "ok" vagy "err" szöveg lehet. |

## Generikusok (Generics)
Újrahasználható komponensek építése bármilyen típus körül.

| Kód | Leírás |
| --- | --- |
| `function id<T>(arg: T): T { }` | Olyan függvény ami `T` típusú paramétert vár el, és azt is adja vissza. |
| `let str = id<string>("hi");` | Meghívás úgy, hogy kijelentjük: Most A Genereric (`T`) egy string. |
| `interface Box<Type> { }` | Típusokon és funkciókra átívelő típus-argumentum konténer. |

## Segéd Típusok (Utility Types)
A TypeScript beépített típus transzformációi.

| Típus Módosító | Leírás |
| --- | --- |
| `Partial<User>` | Egy létező Type / Interface minden paraméterét opcionálissá (?) állítja. |
| `Required<User>` | Egy létező Type / Interface minden paraméterét kötelező formára hozza (kiszedi a ?-t). |
| `Readonly<User>` | A módosított paramétereket csak kiolvasni lehet (Véglegesek, mint a Const). |
| `Pick<User, "id" \| "name">` | Kiszűr: Csak azok az adatok maradnak a Type-ban amiket kikötsz (itt id, name) |
| `Omit<User, "email">` | Eldobás: Egy létező Typeból eldobja amit nem kérsz és megadja a maradékot! |

## Kényszerítés (Type Assertions)
Ha te többet tudsz az adott értékről, mint a fordító.

| Kód | Leírás |
| --- | --- |
| `let val: any = "szöveg";` | Érték definíciója ami egy Any (Bármi) típuson van rögzítve |
| `(val as string).length;` | Explicit kijelölöd a TypeSriptnek, hogy az _valójában_ egy String.  |
