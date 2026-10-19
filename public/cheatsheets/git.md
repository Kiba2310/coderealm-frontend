# Git Segédlet

Az összes gyakori Git parancs, amit mindig elfelejtesz, a commitolástól a rebase-elésig, egyetlen oldalon.

## Beállítás (Config)
A Git környezet alapvető konfigurációja.

| Parancs | Leírás |
| --- | --- |
| `git config --global user.name "Neved"` | Felhasználónév globális beállítása |
| `git config --global user.email "email@pelda.com"` | E-mail cím globális beállítása |
| `git config --global --list` | Összes beállítás listázása |

## Inicializálás és Klónozás
Új tároló (repository) létrehozása vagy egy meglévő letöltése.

| Parancs | Leírás |
| --- | --- |
| `git init` | Új lokális verziókövetett könyvtár inicializálása |
| `git clone <url>` | Távoli tároló (repo) letöltése és összekötése |

## Változtatások követése (Staging & Commit)
A kód állapotának mentése.

| Parancs | Leírás |
| --- | --- |
| `git status` | Fájlok állapota (módosított, staged, untracked) |
| `git add .` | Minden módosítás felvétele a staging területre |
| `git add fajl.txt` | Csak egy adott fájl hozzáadása |
| `git commit -m "Uzenet"` | Állapotmentés egyedi üzenettel |
| `git commit -am "Uzenet"` | Add és commit végrehajtása egyetlen lépésben |

## Ágak (Branching)
Külön szálakon való fejlesztés (Feature branching).

| Parancs | Leírás |
| --- | --- |
| `git branch` | Helyi ágak listázása |
| `git branch [ag_neve]` | Új ág létrehozása |
| `git checkout [ag_neve]` | Átlépés egy létező ágra |
| `git checkout -b [uj_ag_neve]` | Létrehozás és átlépés egy lépésben |
| `git branch -d [ag_neve]` | Egy ág törlése (ha már össze van vonva) |

## Összevonás (Merging) & Rebase
A külön ágak egyesítése.

| Parancs | Leírás |
| --- | --- |
| `git merge [masik_ag]` | A "[masik_ag]" beolvasztása a jelenlegi ágba |
| `git rebase [alap_ag]` | A jelenlegi ág commitjainak újra-húzása az "[alap_ag]"-ra |
| `git rebase --continue` | Folytatás egy konfliktus feloldása után |

## Távoli műveletek (Remotes)
Feltöltés, szinkronizálás és letöltés.

| Parancs | Leírás |
| --- | --- |
| `git remote add origin <url>` | Távoli tároló (Remote) hozzákötése a helyi projekthez |
| `git remote -v` | Csatlakoztatott távoli tárolók listája |
| `git fetch` | Minden változás letöltése (Beolvasztás nélkül!) |
| `git pull origin main` | Változások letöltése és **beolvasztása** a main ágra |
| `git push origin main` | Helyi commitok **feltöltése** a távoli main ágra |

## Áttekintés és Ellenőrzés
Kódmódosítások visszakövetése.

| Parancs | Leírás |
| --- | --- |
| `git log` | Commitok történetének megjelenítése |
| `git log --oneline` | Történet megjelenítése rövidített listaként |
| `git diff` | Módosítások megtekintése fájlokban (unstaged) |
| `git diff --staged` | Módosítások megtekintése, mik már be vannak rakva (staged) |

## Változtatások visszavonása
Ha valamit elrontottál.

| Parancs | Leírás |
| --- | --- |
| `git checkout -- <fajl>` | Helyi (nem kommitolt) változtatás eldobása a fájlban |
| `git reset HEAD <fajl>` | Fájl kiszedése a staging területről (unstage) |
| `git reset --hard HEAD` | Visszatérés az utolsó kommitolt, biztonságos állapothoz |
| `git revert [hash]` | Egy meglévő commit visszavonása (egy új commit generálásával) |
