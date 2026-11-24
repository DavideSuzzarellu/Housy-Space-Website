# Translation batches: district and barrio prose

About 19,000 words of Spanish prose (the source) for the 10 districts and 73 barrios, to translate into `en`, `it` and `ca`. Nothing is translated yet: every `en/it/ca` file holds the Spanish copy with `"translated": false`, and the site shows Spanish (marked `lang="es"`, `noindex`) for it.

## Layout

```
src/content/market/text/{es,en,it,ca}/districts/{slug}.json   # 10 per locale
src/content/market/text/{es,en,it,ca}/barrios/{slug}.json     # 73 per locale
```

One file per locale and zone (332 files). Districts and barrios are in separate folders because two slugs exist in both (`les-corts`, `sant-andreu`). One file per slug was chosen over one file per batch: the loader (a `glob()` over small JSON files) costs the same, a batch file would be a 5,000-word merge conflict waiting to happen, and git history and review stay per zone. Figures live in `src/content/market/barcelona.json` and are never edited by translators.

## How to translate a file

1. Open `src/content/market/text/{locale}/{districts|barrios}/{slug}.json`. Keep `kind` and every key; keep the same number of items in `history`, `landmarks`, `text` and `places` (a test checks it).
2. Translate the values. Do not translate the names of districts and barrios (they come from `barcelona.json`), nor official Spanish or Catalan names of streets, squares and buildings.
3. If you quote a price (`3.456 €/m²`, `1.234 €/mes`), it must be exactly the figure of `barcelona.json`; write it in the number format of your locale or the Spanish one, keeping the unit `€/m²` and `€/mes` (or `€/month`, `€/mese`). A test checks it for every locale.
4. Set `"translated": true` only when the whole file is done. Until then the site keeps showing the Spanish source for that zone.
5. Run `bun run test:translations` to see the progress and `bun run test` to validate.

Style: same register as the Spanish (warm, direct), per AGENTS.md section 11.5. Machine translations are marked as pending client review (section 4).

## Progress and strict mode

- `bun run test:translations` prints, per locale, how many files are translated and the first pending slugs.
- `bun run test:translations:strict` (`STRICT_TRANSLATION=1`) fails while any file of any locale is pending. Run it in CI before launch (or set `STRICT_TRANSLATION=1` on the CI test step) so the pipeline fails until everything is translated.

## Batches

Four independent batches, by official order (the numbers of the map). Each translator takes one locale and one batch, so nobody edits the same file: 3 locales times 4 batches gives 12 work packages. Words are counted on the Spanish source.

| Batch                | Files per locale | Words |
| -------------------- | ---------------: | ----: |
| A: districts 1 to 10 |               10 |  3264 |
| B: barrios 1 to 25   |               25 |  5400 |
| C: barrios 26 to 49  |               24 |  4847 |
| D: barrios 50 to 73  |               24 |  5519 |
| **Total**            |               83 | 19030 |

### Batch A: districts 1 to 10 (3264 words)

| Order | Slug                  | Name                | Words |
| ----- | --------------------- | ------------------- | ----: |
| 1     | `ciutat-vella`        | Ciutat Vella        |   337 |
| 2     | `eixample`            | Eixample            |   365 |
| 3     | `sants-montjuic`      | Sants-Montjuïc      |   357 |
| 4     | `les-corts`           | Les Corts           |   296 |
| 5     | `sarria-sant-gervasi` | Sarrià-Sant Gervasi |   314 |
| 6     | `gracia`              | Gràcia              |   336 |
| 7     | `horta-guinardo`      | Horta-Guinardó      |   301 |
| 8     | `nou-barris`          | Nou Barris          |   322 |
| 9     | `sant-andreu`         | Sant Andreu         |   323 |
| 10    | `sant-marti`          | Sant Martí          |   313 |

### Batch B: barrios 1 to 25 (5400 words)

| Order | Slug                                   | Name                                  | Words |
| ----- | -------------------------------------- | ------------------------------------- | ----: |
| 1     | `el-raval`                             | El Raval                              |   164 |
| 2     | `el-barri-gotic`                       | El Barri Gòtic                        |   141 |
| 3     | `la-barceloneta`                       | La Barceloneta                        |   172 |
| 4     | `sant-pere-santa-caterina-i-la-ribera` | Sant Pere, Santa Caterina i la Ribera |   190 |
| 5     | `el-fort-pienc`                        | El Fort Pienc                         |   257 |
| 6     | `la-sagrada-familia`                   | La Sagrada Família                    |   227 |
| 7     | `la-dreta-de-leixample`                | La Dreta de l'Eixample                |   243 |
| 8     | `lantiga-esquerra-de-leixample`        | L'Antiga Esquerra de l'Eixample       |   233 |
| 9     | `la-nova-esquerra-de-leixample`        | La Nova Esquerra de l'Eixample        |   233 |
| 10    | `sant-antoni`                          | Sant Antoni                           |   172 |
| 11    | `el-poble-sec`                         | El Poble-sec                          |   165 |
| 12    | `la-marina-del-prat-vermell`           | La Marina del Prat Vermell            |   154 |
| 13    | `la-marina-de-port`                    | La Marina de Port                     |   292 |
| 14    | `la-font-de-la-guatlla`                | La Font de la Guatlla                 |   151 |
| 15    | `hostafrancs`                          | Hostafrancs                           |   305 |
| 16    | `la-bordeta`                           | La Bordeta                            |   341 |
| 17    | `sants-badal`                          | Sants-Badal                           |   287 |
| 18    | `sants`                                | Sants                                 |   399 |
| 19    | `les-corts`                            | Les Corts                             |   124 |
| 20    | `la-maternitat-i-sant-ramon`           | La Maternitat i Sant Ramon            |   138 |
| 21    | `pedralbes`                            | Pedralbes                             |   147 |
| 22    | `vallvidrera-el-tibidabo-i-les-planes` | Vallvidrera, el Tibidabo i les Planes |   174 |
| 23    | `sarria`                               | Sarrià                                |   171 |
| 24    | `les-tres-torres`                      | Les Tres Torres                       |   251 |
| 25    | `sant-gervasi-la-bonanova`             | Sant Gervasi-la Bonanova              |   269 |

### Batch C: barrios 26 to 49 (4847 words)

| Order | Slug                                | Name                               | Words |
| ----- | ----------------------------------- | ---------------------------------- | ----: |
| 1     | `sant-gervasi-galvany`              | Sant Gervasi-Galvany               |   159 |
| 2     | `el-putxet-i-el-farro`              | El Putxet i el Farró               |   144 |
| 3     | `vallcarca-i-els-penitents`         | Vallcarca i els Penitents          |   156 |
| 4     | `el-coll`                           | El Coll                            |   157 |
| 5     | `la-salut`                          | La Salut                           |   174 |
| 6     | `la-vila-de-gracia`                 | La Vila de Gràcia                  |   237 |
| 7     | `el-camp-den-grassot-i-gracia-nova` | El Camp d'en Grassot i Gràcia Nova |   173 |
| 8     | `el-baix-guinardo`                  | El Baix Guinardó                   |   130 |
| 9     | `can-baro`                          | Can Baró                           |   289 |
| 10    | `el-guinardo`                       | El Guinardó                        |   141 |
| 11    | `la-font-den-fargues`               | La Font d'en Fargues               |   154 |
| 12    | `el-carmel`                         | El Carmel                          |   180 |
| 13    | `la-teixonera`                      | La Teixonera                       |   294 |
| 14    | `sant-genis-dels-agudells`          | Sant Genís dels Agudells           |   271 |
| 15    | `montbau`                           | Montbau                            |   154 |
| 16    | `la-vall-dhebron`                   | La Vall d'Hebron                   |   277 |
| 17    | `la-clota`                          | La Clota                           |   335 |
| 18    | `horta`                             | Horta                              |   149 |
| 19    | `vilapicina-i-la-torre-llobeta`     | Vilapicina i la Torre Llobeta      |   318 |
| 20    | `porta`                             | Porta                              |   181 |
| 21    | `el-turo-de-la-peira`               | El Turó de la Peira                |   160 |
| 22    | `can-peguera`                       | Can Peguera                        |   158 |
| 23    | `la-guineueta`                      | La Guineueta                       |   154 |
| 24    | `canyelles`                         | Canyelles                          |   302 |

### Batch D: barrios 50 to 73 (5519 words)

| Order | Slug                                           | Name                                         | Words |
| ----- | ---------------------------------------------- | -------------------------------------------- | ----: |
| 1     | `les-roquetes`                                 | Les Roquetes                                 |   165 |
| 2     | `verdun`                                       | Verdun                                       |   350 |
| 3     | `la-prosperitat`                               | La Prosperitat                               |   279 |
| 4     | `la-trinitat-nova`                             | La Trinitat Nova                             |   289 |
| 5     | `torre-baro`                                   | Torre Baró                                   |   150 |
| 6     | `ciutat-meridiana`                             | Ciutat Meridiana                             |   307 |
| 7     | `vallbona`                                     | Vallbona                                     |   273 |
| 8     | `la-trinitat-vella`                            | La Trinitat Vella                            |   356 |
| 9     | `baro-de-viver`                                | Baró de Viver                                |   382 |
| 10    | `el-bon-pastor`                                | El Bon Pastor                                |   156 |
| 11    | `sant-andreu`                                  | Sant Andreu                                  |   187 |
| 12    | `la-sagrera`                                   | La Sagrera                                   |   181 |
| 13    | `el-congres-i-els-indians`                     | El Congrés i els Indians                     |   372 |
| 14    | `navas`                                        | Navas                                        |   176 |
| 15    | `el-camp-de-larpa-del-clot`                    | El Camp de l'Arpa del Clot                   |   140 |
| 16    | `el-clot`                                      | El Clot                                      |   177 |
| 17    | `el-parc-i-la-llacuna-del-poblenou`            | El Parc i la Llacuna del Poblenou            |   146 |
| 18    | `la-vila-olimpica-del-poblenou`                | La Vila Olímpica del Poblenou                |   153 |
| 19    | `el-poblenou`                                  | El Poblenou                                  |   164 |
| 20    | `diagonal-mar-i-el-front-maritim-del-poblenou` | Diagonal Mar i el Front Marítim del Poblenou |   146 |
| 21    | `el-besos-i-el-maresme`                        | El Besòs i el Maresme                        |   165 |
| 22    | `provencals-del-poblenou`                      | Provençals del Poblenou                      |   281 |
| 23    | `sant-marti-de-provencals`                     | Sant Martí de Provençals                     |   362 |
| 24    | `la-verneda-i-la-pau`                          | La Verneda i la Pau                          |   162 |
