# Terminal Segédlet

Shell parancsok navigációhoz, fájlokhoz, pipe-okhoz és folyamatirányításhoz.

## Alapvető Navigáció és Fájlok

| Parancs | Leírás |
| --- | --- |
| `pwd` | Megmutatja az aktuális könyvtárat (Print Working Dir) |
| `ls -l` | Kilistázza a mappa teljes tartalmát jogokkal és méretekkel |
| `cd dir` | Belép a megadott (itt dir nevű) mappába |
| `touch file.txt` | Egy üres dokumentum fájl létrehozása azonnal. |
| `cat file.txt` | Egy fájl teljes String/Kód tartalmát bele hányja a Console felületébe |

## Csövezés (Pipes and Redirects)
Kimenetek továbbítása.

| Parancs | Leírás |
| --- | --- |
| `echo "X" > file`| Beírja X-et a fileba, DE mindent FELÜLÍR és letörli az eddigi File tartalmat! |
| `echo "Y" >> file`| Meglévő tartalom MELLÉ 1 Sor emeléssel be csatolja  hozzáfűzve! |
| `cat fajl.txt \| grep "Z"`| Átirányító cső(pipe: `\|`) amivel a parancs (CAT) KIMENTÉ a másik parancshoz vágja, mint futtatható adat |

## Rendszer és Folyamatok
Erőforrások és futó kódok megfigyelése.

| Parancs | Leírás |
| --- | --- |
| `top` /  `htop` | TaskManager Parancssorból felügyelve CPU, és MEMÓRIA terhelés alatt interaktívan |
| `ps aux` | A Hátteredben és háttér-programoknál az összes RAMBAN elakadt Task Kilistázása Pid alapján |
| `kill 1234` | Egy Pid (Például egy RAM beragadt) procesz erőszakos kilövése rendszer joggal! |
| `df -h` | Mennyi Szabad vagy foglalt SSD/HDD van a szerveren Particíók és lemezterület! |
| `free -m` | Szabad és lefogalt / Cashed Memory (Ram) leírása Megabájtban! |

## Hálózat (Networking)
Kapcsolat ellenőrzése és fájl letöltése.

| Parancs | Leírás |
| --- | --- |
| `ping google.com` | Elérhetőség tesztelése Packet küldéssel és Ms visszajelzési időkérés (Válaszol e a net egyeltalán?) |
| `curl https:API` | Http hívások elindítása Böngésző nékül! Hasznos API-k tesztelése PostMan elött! |
| `curl -O url.com/f.zip` | Gyos / Direkt letöltés (Downloadálás) terminállból egy Urlről! |
| `wget url` | Régebbi standard letöltő parancs. |

## Jogosultságok kezelése (Permissions)
Fájl láthatóság és szerkeszthetőség. (Read=4, Write=2, Execute=1)

| Parancs | Leírás |
| --- | --- |
| `chmod 777 fajl` | A Parancs (CHange MODe). Adminoknak, Usernek és Goupra mindneki írhatja olvashatja. (Veszélyes!) |
| `chmod +x run.sh` | Gyorskódos Hozzáférés + Execute jog, szóval Terminalban `./run.sh` ba már Futtathathó az alkalmazásod programként! |
