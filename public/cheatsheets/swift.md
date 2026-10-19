# Swift Segédlet

Swift szintaxis, optionals, gyűjtemények, closure-ök és a struktúrák vs. osztályok különbségei.

## Változók és Állandók
Biztonságos típusok és let.

| Kód | Leírás |
| --- | --- |
| `var age = 30` | Változtatható (mutábilis) változó |
| `let name = "Apple"` | Állandó (konstans) érték – utólag nem módosítható |
| `var score: Int = 100` | Típus explicites megadása (Egész szám) |
| `var price: Double = 9.99` | Lebegőpontos szám típussal |
| `var isActive: Bool = true` | Logikai (Boolean) típus |

## Karakterláncok (Strings)
Szöveg interpoláció és manipuláció.

| Kód | Leírás |
| --- | --- |
| `let msg = "Szia, \(name)!"` | String interpoláció, változó értékének behelyettesítése |
| `msg.count` | A szöveg karakterhosszának (mennyiségének) lekérése |
| `msg.uppercased()` | Szöveg átalakítása csupa nagybetűssé |
| `msg.lowercased()` | Szöveg átalakítása csupa kisbetűssé |

## Optionals (Opcionális értékek)
A nil-biztonság szíve Swift-ben.

| Kód | Leírás |
| --- | --- |
| `var name: String? = nil` | A kérdőjel (?) mutatja, hogy vagy String, vagy pedig Semmi (nil). |
| `if let safeValue = val { }` | Széf-csöves if kicsomagolás, ha csak NEM nil, akkor megmutatja a safeValue alatt a kódot |
| `guard let v = x else { return }` | Guard kicsomagolás, megszakítja / kilövi a metódust egyből ha az érték nil! |
| `print(name ?? "Jancsi")` | "Nil coalescing" - Ha a name nil, a "Jancsi" az alapértelmezett választás |
| `val!.count` | Force Kicsomagolás (!), Erővel rálépsz, ha val egy Nil => A Kódod összeomlik! |

## Gyűjtemények (Collections)

| Kód | Leírás |
| --- | --- |
| `var fruits = ["Alma"]` | Tömb (Array) létrehozása lista alapon |
| `fruits.append("Kivi")` | Új Elem berakása a gyümölcsök (Array) legvégére. |
| `var stats = ["Hp": 100]` | Szótár (Dictionary)! "Hp"-t kikeresve kapod 100-at értékként |
| `stats["Gold"] = 99` | Egy Szótáros bejegyzés gyors up-date vagy beírása frissen! |

## Closure-ök
Névtelen függvények és funkcionális programozás.

| Kód | Leírás |
| --- | --- |
| `let block = { (n: Int) -> Int in return n }` | Closure kód lementése változóként! Használva is behívhatók! |
| `[1, 2].map { $0 * 2 }` | Tömbre hívott automatikus futtatás, ahol a paraméteket röviden $0 és $1 el szólítod! |

## Struct vs Class
Class referencia típus, Struct érték típus.

| Kulcsszó | Leírás |
| --- | --- |
| `struct Pont { var x: Int }` | Struktúra: ÉRTÉK TÍPUS! Ha készítesz 1 db point = pont2, A MEMÓRIÁBAN lemásolódik! |
| `class Auto { var b: String }` | Osztály: REFERENCIA! Autok közti egyezés egyenlő a mutató lemásolásával, csak a memóriahelyet tárolja. |
| `init() { }` | Belső Függvény a kezdeti értékek Betöltésére |
