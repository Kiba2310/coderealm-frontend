# PHP Segédlet

PHP szintaxis, tömbök, sztringek, szuperglobális változók és azok a függvények, amiket mindig elfelejtesz.

## Alapok
Változók mindig `$` jellel kezdődnek.

| Kód | Leírás |
| --- | --- |
| `<?php ... ?>` | A PHP futtatható oldal egyedi kezdeti és záró tag-je HTML-be ágyazáshoz! |
| `$name = "Anna";` | Dinamikus Változó létrehozás. (A nyelv maga találja ki az típust) |
| `echo "Szia " . $name;` | Kiíratja as HTML View felületre (Response oldal) az Üzenetet a Változóval (`.` az összekapcsoló). |
| `// Megjegyzés` | Sorvégi kötelező PONTOSVESSZŐ (`;`) mellett a kommentálás dupla relációjellel mehet! |

## Tömbök (Arrays) és Iterációk
A PHP leguniverzálisabb adatstruktúrája.

| Kód | Leírás |
| --- | --- |
| `$szinek = ["Piros", ...];`| Egyszerű (Indexed) array formátum. |
| `$szinek[] = "Sárga";` | Elem hozzáadása (Push) befelé, az utolsó helyre! (Rövid formátum) |
| `echo $szinek[0];` | Lekérés Index-számmal. (Elérni a pirosat). |
| `$u = ["age" => 30];` | Asszociatív Tömb, itt KULCS és ÉRTÉK kötést látsz Dictionary-hez hasonlatos! |
| `foreach ($u as $k => $v)` | Lista bejárás iterációkban, melynél mindig Hozzáférsz a K(Kulcs) és V (Value) adathoz egyidőben. |
| `count($szinek);` | Elemek Száma függvény |
| `in_array("Piros", ...);` | Gyorsvizsgálat ami True / False-t Add ha már megvan. |

## Szuperglobális Változók (Superglobals)
Mindenhonnan elérhető rendszer és kérés adatok.

| Kód | Leírás |
| --- | --- |
| `$_GET['id']` | URL Pameréterben (Tiszta kód?id=5) küldött KÜLSŐ paraméter változók behúzása a PHP kódban! |
| `$_POST['user']` | Titkosított (Body-ba elrejtett), leginkább Formoktól (Input) beérkezett POST behívás! |
| `$_SESSION['user_id']` | Munkamenet tároló (Session), Pld bejelentkeztetés után a Szerveren Hozzárendelt Id a böngészőhöz! |
| `$_SERVER['REMOTE_ADDR']`| Teljes Rendszer API adatok (A Kliens IP címe vagy Böngészői információ pld!) |
| `$_COOKIE['login']` | Az adott domain alatt elmentett Cookie-kok tárcsázása. |

## Függvények és Osztályok

| Kód | Leírás |
| --- | --- |
| `function k($nev = "B") {}` | Egy Funkció amelyik leáll/vagy behív egy Folyamatot (Kötelező a `{}`). Alap paraméter `$nev`. |
| `class Auto { }` | Osztály deklarációja. |
| `public function __construct`| A beépített Konstruktor API fut le mindig új Példány megkreálásakor |
| `$kocsi = new Auto();` | Inicializálja és a RAMMemóriába ülteti a Class Példányát.  |

## Egyéb hasznos eljárások

| Kód | Leírás |
| --- | --- |
| `explode(",", "A,B");` | String (Például "A,B") darabolása Array-á a ( , ) alapján. |
| `$pdo = new PDO(...)` | Adatbázis csatlakozáshoz Biztonságos Hívás az SQL-hez! |
