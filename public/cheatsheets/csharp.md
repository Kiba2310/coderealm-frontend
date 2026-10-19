# C# Segédlet

C# szintaxis, típusok, LINQ, gyűjtemények és OOP kulcsszavak egyetlen oldalon.

## Változók és Típusok
Az alapvető C# típusok (Strongly Typed).

| Kód | Leírás |
| --- | --- |
| `int age = 30;` | Egy egész (integer) típusú változó létrehozása. |
| `double price = 10.99;` | Lebegőpontos szám tárolása, pl. árakhoz. |
| `bool isActive = true;` | Logikai (bool) típus (Csak `true` vagy `false`). |
| `string name = "John";` | Karakterlánc (szöveg) változó létrehozása. |
| `var text = "Hello";` | Típuskövetkeztetés. A C# kitalálja (String), hogy mi ez alapján a megadott érték alapján. |

## Gyűjtemények (Collections)
Adatok tárolása. A `System.Collections.Generic` az alap!

| Kód | Leírás |
| --- | --- |
| `int[] arr = {1, 2, 3};` | Fixáló tömb. Nem lehet belőle sem hozzáadni, sem elvenni. |
| `List<string> n = new List<string>();`| Dinamikus lista definició. Akárhány elemet pakolhatsz vagy vehetsz ki. |
| `n.Add("Charlie");` | Elem a végére rakása |
| `Dictionary<string, int> ages;`| Szótár, ami az adott (Pld. `Bob`) karakterhez párosít (25) életkort, kulcs és érték lapon. |

## Objektum Orientált Programozás (OOP)
Osztályok, interfészek, láthatóság.

| Kulécsszó / Kód | Leírás |
| --- | --- |
| `public class Animal {}` | Nyilvános Objektum Osztály definíciója bárki számára elérhetőként |
| `private string name;` | Belső Osztály attribútum, ezt senki más csak az OSZTÁLY belseje láthatja! |
| `public int Age { get; set; }` | Property (tulajdonság) deklaráció gyorsított Get-Set írási / Olvasási folyamatokkal |
| `public Animal() {}` | Konstruktor a neve mindig megegyezik az Osztállyal, lefutásokor kreálódik a pldány. |
| `public virtual void Speak()` | Engedélyezi, hogy az állat (Osztály) ebből származó ágai Ezt felülbírálhassák |
| `public class Dog : Animal`| Az ÖRÖKLÉS jelzése, a Dog osztály egy állat! |
| `public override void Speak()`| Cseréli a felül megengedett funcot egy úja, saját kódra kutyák számára |

## LINQ (Language Integrated Query)
Adatok hatékony szűrése és transzformációja. (A LINQ System)

| Kód | Leírás |
| --- | --- |
| `nums.Where(n => n > 2)` | Szelekció és Filterezése egy kollekciónak. Mi felel meg a kikötésnek? |
| `nums.Select(n => n * 2)`| Lista összes lemének duplázása és transzformációja új formába |
| `nums.ToList()` | A LINQ által kreált Query újra Formatoálása Listává. |
| `nums.FirstOrDefault()`| Biztonságos első Elem lekérés, Ha nincs benne Semmi, akkor Default (Null / 0) kapunk. |

## Aszinkron programozás (Async / Await)
Fennakadások nélküli várakozás.

| Kód | Leírás |
| --- | --- |
| `public async Task<string> Run()` | A Kulcsszó használatához az Aszinkron Függvény fejlécében ott kell lennei! |
| `await httpClient.Get()` | A hívásnál amíg várakozol A System tud más CSharp kódot folytatni (Tovább gördülni). |
