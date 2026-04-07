const fs = require('fs');

const rawText = fs.readFileSync('/tmp/items.txt', 'utf-8');
const lines = rawText.split('\n')
  .map(l => l.trim().replace(/^\f/, ''))
  .filter(l => l && l !== 'Produit' && l !== 'URL image' && l !== 'Nom image');

const items = [];
let i = 0;
while (i < lines.length) {
    let line = lines[i];
    let name = line;
    let url = '';
    
    let urlIdx = line.indexOf('https://');
    if (urlIdx > 0) {
        name = line.substring(0, urlIdx).trim();
        url = line.substring(urlIdx).trim();
    } else {
        name = line;
        i++;
        if (i >= lines.length) break;
        url = lines[i];
    }
    
    i++;
    if (i >= lines.length) break;
    let filename = lines[i];
    items.push({ name, url, filename });
    i++;
}

const existing = [
  { id: 'egg-mcmuffin', name: 'Egg McMuffin®', priceTTC: 4.50, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_202004_0046_EggMcMuffin_1564x1564-1:nutrition-calculator-tile' },
  { id: 'sausage-burrito', name: 'Sausage Burrito', priceTTC: 3.90, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_202411_0334_SausageBurrito_Alt_McValueRegistered_1564x1564:nutrition-calculator-tile' },
  { id: 'iced-coffee', name: 'McCafé® Iced Coffee', priceTTC: 3.20, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_201906_1212_MediumIcedCoffee_Glass_A1_1564x1564-1:nutrition-calculator-tile' },
  { id: 'big-mac', name: 'Big Mac®', priceTTC: 6.20, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_202302_0005-999_BigMac_1564x1564-1:nutrition-calculator-tile' },
  { id: 'mcnuggets-4', name: '4 Piece Chicken McNuggets®', priceTTC: 4.80, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_202502_0483_4McNuggets_Stacked_McValueRegistered_1564x1564:nutrition-calculator-tile' },
  { id: 'ranch-snack-wrap', name: 'Ranch Snack Wrap®', priceTTC: 3.50, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_202504_25254_RanchSnackWrap_1564x1564:nutrition-calculator-tile' },
  { id: 'quarter-pounder', name: 'Quarter Pounder®', priceTTC: 7.10, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_202201_0007-005_QuarterPounderwithCheese_1564x1564-1:nutrition-calculator-tile' },
  { id: 'mccrispy', name: 'McCrispy®', priceTTC: 5.90, img: 'https://s7d1.scene7.com/is/image/mcdonalds/DC_202012_0383_CrispyChickenSandwich_PotatoBun_1564x1564-1:nutrition-calculator-tile' }
];

const existingNames = new Set(existing.map(i => i.name));
const finalCatalog = [...existing];
const seenIds = new Set(existing.map(i => i.id));

for (let item of items) {
    if (!existingNames.has(item.name)) {
        let id = item.filename.replace('.jpg', '').replace('.jp', '');
        if (seenIds.has(id)) continue;
        
        // Final sanity check: if img doesn't start with https, it's garbled, skip it
        if (!item.url.startsWith('https://')) {
          console.warn('Skipping malformed URL for ' + item.name);
          continue;
        }

        finalCatalog.push({
            id: id,
            name: item.name,
            priceTTC: 5.00,
            img: item.url
        });
        existingNames.add(item.name);
        seenIds.add(id);
    }
}

const content = 'export const catalog = ' + JSON.stringify(finalCatalog, null, 2) + ';\n';
fs.writeFileSync('./constants/catalog.ts', content);
console.log('Final catalog size: ' + finalCatalog.length);
