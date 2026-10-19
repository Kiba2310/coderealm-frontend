# HTML Segédlet

Minden szükséges HTML címke és attribútum, funkció szerint csoportosítva.

## Alapstruktúra (Boilerplate)
A weboldal kötelező felépítése.

| Címke / Kód | Leírás |
| --- | --- |
| `<!DOCTYPE html>` | Jelzi a böngészőnek, hogy ez egy HTML5 dokumentum. (Ez az 1. sor mindig) |
| `<html lang="hu">` | Az egész oldalt körülölő szülő tag, deklarálva a magyar nyelvet. |
| `<head> ... </head>` | Beállítások (meta), és egyéb külső linkek helye, ami láthatatlan a usernek. |
| `<meta charset="UTF-8">` | Megfelelő Unicode beállítás (pl. ékezetes betűk). Ezt a head-be toljuk be! |
| `<title>Oldalcím</title>` | A Böngésző fül tetején megjelenő név (Gyakori kereső elem). |
| `<body> ... </body>` | Amit a felhasználók fognak VIZUÁLISAN ténylegesen látni, ez a szekció. |

## Szöveg formázása
Címsorok, bekezdések és kiemelések.

| Címke | Leírás |
| --- | --- |
| `<h1>Főcím</h1>` | Legfontosabb (Szerkezetileg) címsor. Ökölszabály: Max 1 van az oldalon. |
| `<h2>Alcím</h2>` | Szinttel kisebb alcím. Van ezenkívül 3,4,5 és egészen H6 ig! |
| `<p>bekezdés</p>` | Szöveges blokk / Alap sima mondat (Paragraph). |
| `<strong>kiemelés</strong>` | Szemantikai szempontból nagyon **Fontos**, jellemzően félkövérrel renderelt |
| `<em>Dőlt betű</em>` | Mondanivaló hangsúlya (emphasis). Értelmezi az olvasás (dőlt style) |
| `<br>` | Soremelés (Sortörés). Üres sor hagyása formázás nélkül |
| `<hr>` | Egy vékony, tematikus vízszintes elválasztó vonal |

## Linkek és Képek (Links & Images)

| Címke / Attribútum | Leírás |
| --- | --- |
| `<a href="https://...">Link</a>` | Hivatkozás (Anchor) más weboldalakra, attribútumában tárolódik az url! |
| `target="_blank"` | Ha egy A Címke (Anchor) kapja ezt, ÚJ FÜLÖN (Tabon) fogja indítani a linket. |
| `<img src="kep.jpg" alt="...">` | Kép beágyazása, forrás path fájllal (SRC), és mi van ha nem indul be? (Alt) |

## Listák (Lists)
Rendezett és rendezetlen adatok.

| Címke | Leírás |
| --- | --- |
| `<ul>` | "Unordered List": Golyókkal / Pontokkal jelegtelen sorrendű felsorolás! |
| `<ol>` | "Ordered List": Sorszámozott felsorolás, a tételek elé számot (1,2) generál |
| `<li>Lista elem</li>` | Egy Listás tétel. Kizárólag (UL vagy OL) taget rakhatod bele! |

## Táblázatok (Tables)
Adatok rácsos elrendezése.

| Címke | Leírás |
| --- | --- |
| `<table>...</table>` | Alap táblázat szülő elem |
| `<tr>` | Table Row: Egy vizuális asztalsor az asztalban |
| `<th>Főcím</th>` | Table Hash/Header: Erős stílussal (vastag) Főoszlop név kiírására |
| `<td>Érték</td>` | Table Data (Cell): Bekezdés az adott oszlop / sor számához cellakét. |

## Űrlapok (Forms)
Adatbekérés a felhasználótól.

| Címke | Leírás |
| --- | --- |
| `<form action="/x" method="POST">` | Űrlap, ami adatot továbbít (Method POST / GET / PUT) az X végpont számára |
| `<label for="nev">Név:</label>` | Címke az Inputnak! Az Id "nev"-vel kötöd az imput Name azonosítóval. Jól click-esedik! |
| `<input type="text">` | Standard betű input kitöltő doboza (szöveg beírás). |
| `<input type="password">` | Betűk elrejtése - pld CSILLAGOKKAL biztonsági okból - amikor írja |
| `<button type="submit">Gomb</button>` | Forma elküldése, aktiváló Call (Indítja is azonnal az adatokat) |

## Szemantikus Elemek (HTML5)
Keresőoptimalizálást és akadálymentesítést segítő címkék.

| Címke | Leírás |
| --- | --- |
| `<header>` | Weboldal Felső blokkja (Fejléce) Logonak és Menünek |
| `<nav>` | Fő navigációs Hivatkozások csoportjának fenntartott Szabványosított Box (Lábléchez, Navbárhoz) |
| `<main>` | Egy oldalon 1x szerepelhet a fő tartalom ami lényegi része a DOM-nak. Semmi footer/header. |
| `<article>` | Külön álló tartalom, mely egymagában releváns (pl. Blog bejegyzés) |
| `<section>` | Logikailag összefüggő elemek csoportosítása (Egy Téma / Szegmens) |
| `<footer>` | Legalul futó szerzői jogokat és apró linkeket összefogó rész. |
