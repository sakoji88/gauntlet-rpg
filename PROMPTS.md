# 🎨 PROMPTS.md — арт для Темнодушного Лета

Промпты для генерации всех картинок (Midjourney / DALL·E / SD).
Для каждого блока указано **куда класть файл** и **какое разрешение**.

Картинок может не быть — игра не падает, везде стоят аккуратные заглушки.
Добавляй по мере готовности.

---

## 0. ОБЩИЙ СТИЛЬ (вставляй в КАЖДЫЙ промпт)

Скопируй этот «хвост» в конец любого промпта ниже:

```
dark slavic fantasy, grimdark folklore, Dark Souls atmosphere meets a cursed
Russian village, muted earthy palette (charcoal black, dried blood red, dim
gold, bog brown), heavy fog, candlelight, oppressive ancient mood, painterly,
high detail, cinematic, no text, no watermark, no modern objects
```

Соотношения: фоны — `--ar 16:9`, портреты — `--ar 2:3`, иконки и рамки — `--ar 1:1`.

---

## 1. ФОНЫ СТРАНИЦ

📁 Класть в: `public/images/backgrounds/`
📐 Разрешение: **1920×1080** (или больше), формат **.jpg**
⚠️ Картинки видны приглушённо (~35% яркости) под тёмной вуалью — не делай их
светлыми, иначе текст поверх не прочитается.

| Файл | Промпт (+ общий стиль из п.0) |
|---|---|
| `landing.jpg` | `epic wide vista of a cursed fantasy realm, eight distant lands under a blood moon, ancient gates, mist rolling over black forests and crooked villages` |
| `select-class.jpg` | `Hall of Fate, six shadowy archetype silhouettes standing in a dim ritual chamber, six guttering candles, stone floor, cold dread` |
| `profile.jpg` | `a lone wanderer's cell, wooden table with a worn map, armor on a stand, a dying hearth, personal belongings, quiet and grim` |
| `inventory.jpg` | `an old chest and shelves cluttered with vials, scrolls, cursed trinkets and artifacts, burlap sacks, dim storeroom` |
| `quests.jpg` | `a quest-giver's table, parchment scrolls, quill and inkwell, dripping wax seals, candle, brooding` |
| `feed.jpg` | `a grim tavern hall with a notice board, a tapestry of a leaderboard, long shadows, hanging lanterns` |
| `duels.jpg` | `a blood-stained fighting arena, crossed swords planted in dirt, torches, foggy spectator stands` |
| `shop.jpg` | `a cramped merchant's shop, shelves of potions and scrolls, scattered coins, a balance scale, a sly hooded trader` |

Кодекс (`/codex`) и квесты используют `quests.jpg` — отдельный файл не нужен.

---

## 2. ФОНЫ РЕГИОНОВ

📁 Класть в: `public/images/regions/`
📐 **1920×1080**, формат **.jpg** (имена файлов уже заданы кодом)

| Файл | Регион | Промпт (+ общий стиль) |
|---|---|---|
| `chakhly-bor.jpg` | Чахлый Бор | `a sickly dead pine forest, twisted black trees, whispering roots, hermit's hovel, horror` |
| `terem.jpg` | Терем Костаная | `an opulent rotting boyar mansion, gold and grime, fat merchant's hall` |
| `khutor.jpg` | Хутор Душлендора | `a simple muddy peasant farmstead, crooked fences, hay, dim and naive` |
| `bazar.jpg` | Базар Романала | `a crowded dark bazaar, spice stalls, hanging wares, haggling shadows` |
| `tabor.jpg` | Табор Клопса | `a gypsy camp at night, painted wagons, a wheel of fortune, bonfire, trickery` |
| `pustyri.jpg` | Пустыри Галемиуса | `bleak wasteland ruins, a lone knight's banner, broken concrete and ash` |
| `kukhnya.jpg` | Гнилая Кухня | `a grotesque army kitchen, huge cauldrons, hanging meat, steam and grime` |
| `atelye.jpg` | Ателье Пенькова | `a humble medieval tailor's workshop, wooden workbench, rough sewing tools, bolts of dark cloth, lit candles, plain mannequins, modest and grim, no gothic glam, no neon` |
| `prison.jpg` | Тюрьма | `a cold stone dungeon cell, iron bars, straw, a silent guard's shadow` |

---

## 3. ПОРТРЕТЫ КЛАССОВ

📁 Класть в: `public/images/classes/`
📐 **832×1248** (`--ar 2:3`), формат **.png**

| Файл | Класс | Промпт (+ общий стиль) |
|---|---|---|
| `berserker.png` | Батя-Берсерк | `a brutal middle-aged berserker father, scars, rage, heavy axe, bare chest` |
| `loreman.png` | Ведьмак-Лороман | `a patient old lore-keeper witcher, robes, scrolls, knowing eyes` |
| `sufferer.png` | Отшельник-Страдалец | `a gaunt hermit who relishes suffering, sackcloth, hollow blissful stare` |
| `urka.png` | Урка-Ассасин | `a prison-tattooed shadow assassin, knife, hood, sneer` |
| `alchemist.png` | Знахарь-Алхимик | `a hunched village alchemist, vials and fumes, cunning grin` |
| `bard.png` | Скоморох-Бард | `a charismatic grotesque jester-bard, lute, bells, painted face` |

---

## 4. ПОРТРЕТЫ NPC (квестодатели)

📁 Класть в: `public/images/quest-givers/`
📐 **832×1248**, формат **.png**

| Файл | NPC | Промпт (+ общий стиль) |
|---|---|---|
| `chakhly-bor.png` | Чахлик Невмерующий | `a 200-year-old muttering forest hermit, mossy rags, mad eyes` |
| `terem.png` | Костанай Зажиточный | `a fat sweaty merchant magnate in rings, greedy, opulent` |
| `khutor.png` | Душлендор Тупиздень | `a simple kind dim-witted peasant farmer, straw hat` |
| `bazar.png` | Романал Жидовский | `a sly mannered haggling trader-herbalist, hooded, coin purse` |
| `tabor.png` | Мистер Клопс | `a loud emotional gypsy trickster conjurer, cards, gold tooth` |
| `pustyri.png` | Рыцарь Галемиус | `a serious noble wandering knight, worn armor, dignified` |
| `kukhnya.png` | Гнилостень Лоненков | `a screaming choleric army cook, ladle, obsessed with cooking` |
| `atelye.png` | Портной Пеньков | `a plain medieval male tailor, simple linen tunic and apron, leather belt, calloused hands, holding scissors and measuring cord, weary craftsman face with a moustache, modest workshop background, NOT gothic, NOT flamboyant, NOT modern, masculine and grounded` |

---

## 5. РАМКИ АВАТАРА — УНИВЕРСАЛЬНЫЙ ПРОМПТ ⭐

📁 Класть в: **`public/images/frames/`** (папку создал — см. `_PLACE_FRAMES_HERE.md`)
📐 **512×512**, формат **.png** с **прозрачным фоном**

**ВАЖНО — единый формат для всех рамок:**
- Квадрат 512×512, прозрачный фон (alpha).
- В центре — **круглое прозрачное «окно»** (туда ляжет аватар), диаметр ~70% ширины.
- Орнамент — только по кольцу вокруг окна. Центр строго прозрачный.

Универсальный промпт (меняй только `[МАТЕРИАЛ]` и `[ЦВЕТ]`):

```
ornate circular avatar frame, decorative ring border only, [МАТЕРИАЛ],
intricate dark slavic engravings, glowing [ЦВЕТ] accents, centered round
transparent hole, transparent background, PNG, symmetrical, game UI asset,
no face, no portrait inside, no text --ar 1:1
```

| Файл | Подставить |
|---|---|
| `bronze_frame.png` | `[МАТЕРИАЛ]` = `tarnished bronze metal`, `[ЦВЕТ]` = `warm bronze` |
| `gold_frame.png` | `[МАТЕРИАЛ]` = `ancient gold metal`, `[ЦВЕТ]` = `bright gold` |
| `frame_thorns.png` | `[МАТЕРИАЛ]` = `twisted dark thorned briar`, `[ЦВЕТ]` = `dim crimson` |

**Как работают рамки сейчас:** надеваешь рамку в инвентаре → она показывается
вокруг аватарки на профиле и публичной странице. Пока PNG нет — рисуется
CSS-обводка со свечением (тоже выглядит как рамка). Положишь PNG в `frames/` —
поверх появится настоящий арт. Имя файла = id предмета (см. таблицу выше).

Хочешь больше рамок — добавь записи в `lib/cosmetics.ts` (объект `FRAMES`) и
такой же предмет category COSMETIC в `lib/items.ts`.

---

## 6. ИКОНКИ ПРЕДМЕТОВ

📁 Класть в: `public/images/items/`
📐 **512×512**, формат **.png**, прозрачный фон. Имя файла = `iconKey` предмета.

Универсальный промпт (подставь предмет):

```
a single game item icon of [ПРЕДМЕТ], centered, dark slavic fantasy style,
painterly, rich detail, soft rim light, transparent background, PNG,
no text, no border --ar 1:1
```

`[ПРЕДМЕТ]` бери из названия/описания предмета — **полный список всех 76
предметов с описаниями открывается прямо в игре**: страница `/codex`, вкладка
«Предметы». `iconKey` каждого предмета смотри в `lib/items.ts`.

Не обязательно рисовать все 76 сразу — без иконки показывается ромб ✦.

---

## 7. ЛОГОТИП / ГЛАВНЫЙ АРТ

📁 Класть в: `public/images/world/` (или куда удобно)

```
logo emblem for "Темнодушное Лето" (Dark-Souled Summer), a cursed sun over a
black forest, ornate slavic frame, grimdark, embossed metal, no text --ar 1:1
```

Карта мира — файл `public/images/world/map.png` уже есть.

---

## Памятка по путям

| Что | Папка | Формат |
|---|---|---|
| Фоны страниц | `public/images/backgrounds/` | .jpg 1920×1080 |
| Фоны регионов | `public/images/regions/` | .jpg 1920×1080 |
| Классы | `public/images/classes/` | .png 2:3 |
| NPC | `public/images/quest-givers/` | .png 2:3 |
| Рамки | `public/images/frames/` | .png 512×512 прозрачные |
| Иконки предметов | `public/images/items/` | .png 512×512 прозрачные |
