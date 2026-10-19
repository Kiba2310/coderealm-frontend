# Linux Commands Segédlet

Fájlok kezelése, keresése és navigáció a Linux parancssorból egyetlen oldalon.

## Fájlrendszer és Navigáció
Helyváltoztatás a könyvtárak között.

| Parancs | Leírás |
| --- | --- |
| `pwd` | Megmutatja az aktuális könyvtárad teljes útvonalát (Print Working Directory) |
| `ls` | Fájlok és mappák egyszerű listázása az adott helyen |
| `ls -la` | Részletes listázás, beleértve a rejtett (ponttal kezdődő) fájlokat is |
| `cd /var/www` | Ugrás egy specifikus könyvtárba (pl. `/var/www`) |
| `cd ..` | Vissza ugrás a szülő (egy szinttel feljebb lévő) könyvtárba |
| `cd ~` | Visszatérés a felhasználód saját (home) mappájába |

## Fájlok Kezelése
Létrehozás, másolás, mozgatás.

| Parancs | Leírás |
| --- | --- |
| `touch fajl.txt` | Egy tök üres fájl (fajl.txt) azonnali létrehozása |
| `mkdir uj_mappa` | Új mappa (directory) létrehozása a megadott néven |
| `rm fajl.txt` | Megadott fájl visszafordíthatatlan törlése |
| `rm -rf mappa/` | Egy teljes mappa és a benne lévő összes fájl/mappa erőltetett törlése (Veszélyes!) |
| `cp forras.txt cel.txt` | Fájl lemásolása. A `forras.txt` tartalmát a `cel.txt`-be másolja, akár új néven. |
| `mv regi.txt uj.txt` | Fájl vagy mappa áthelyezése. Gyakran használják név megváltoztatására is! |

## Szöveg Kezelése és Keresése (Grep)
Kimenetek olvasása és text manipuláció.

| Parancs | Leírás |
| --- | --- |
| `cat fajl.txt` | Egy fájl teljes tartalmának nyers kiíratása a terminálra |
| `less fajl.txt` | Hosszú fájlok olvasása, amit lépésenként fel/le nyilakkal görgethetsz (`q`-val kilépés) |
| `grep "hiba" fajl.txt` | Megkeresi és kilistázza azokat a sorokat a fájlban, melyek tartalmazzák a "hiba" szót. |
| `grep -r "szerver" /etc/` | Könyvtárakon belüli rekurzív (mély) keresés a megadott mappában |

## Jogosultságok
Fájlhozzáférés módosítása. (Olvasás = 4, Írás = 2, Futtatás = 1)

| Parancs | Leírás |
| --- | --- |
| `chmod 755 script.sh` | Jogosultság megadása (Tulajdonos mindent, a többiek csak olvasni és futtatni tudják) |
| `chmod +x script.sh` | Futtatási jog gyors hozzácsatolása egy programhoz (Exekutálható lesz) |
| `chown user:group fajl.txt` | A fájl tulajdonosának (és csoportjának) teljes megváltoztatása |

## Csomagkezelés (Debian/Ubuntu)

| Parancs | Leírás |
| --- | --- |
| `sudo apt update` | Elérhető csomagok frissítéseinek és verzióinak reszinkronizálása a szerverrel |
| `sudo apt install htop` | Egy új csomag / program végleges telepítése (itt a htop telepítése) |
