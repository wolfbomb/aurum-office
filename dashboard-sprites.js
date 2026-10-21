// Pixel-art portraits for the AURUM "Who's Doing What" section.
// Each agent is a 16x16 bust composed from layers (skin, hair, shirt, accessories) and rendered as inline
// SVG rects (no images, no external services). Pure functions, no DOM; tested in tests/dashboard.
const SPRITE_SKINS = { pale:'#f6d9c0', light:'#f1c7a1', tan:'#d9a066', brown:'#a8693f', dark:'#6f4328' };

// role id -> look. acc = list of [kind, color]. Colors are CSS hex.
const AGENT_LOOKS = {
  'foreman':             { skin:'tan',   hair:'#3b2a1a', style:'short',    shirt:'#2f6fdc', acc:[['hardhat','#f1c40f'],['headset','#2c3e50']] },
  'tech-lead':           { skin:'light', hair:'#6c3483', style:'bun',      shirt:'#8e44ad', acc:[['glasses','#2c3e50'],['badge','#f1c40f']] },
  'senior-engineer':     { skin:'pale',  hair:'#c8cdd2', style:'short',    shirt:'#16a085', beard:'#c8cdd2', acc:[['glasses','#2c3e50']] },
  'senior-engineer-2':   { skin:'dark',  hair:'#111111', style:'short',    shirt:'#34495e', beard:'#111111', acc:[['headphones','#e74c3c']] },
  'software-engineer-1': { skin:'light', hair:'#c0392b', style:'short',    shirt:'#2980b9', acc:[['cap','#27ae60']] },
  'software-engineer-2': { skin:'brown', hair:'#2c1810', style:'ponytail', shirt:'#e67e22', acc:[['headband','#e84393']] },
  'data-engineer':       { skin:'tan',   hair:'#1a1a1a', style:'long',     shirt:'#0984e3', acc:[['visor','#00cec9'],['badge','#ffffff']] },
  'test-engineer-1':     { skin:'light', hair:'#f39c12', style:'long',     shirt:'#27ae60', acc:[['glasses','#c0392b']] },
  'test-engineer-2':     { skin:'brown', hair:'#2d3436', style:'short',    shirt:'#6c5ce7', acc:[['headphones','#e17055']] },
  'qa-validator':        { skin:'pale',  hair:'#636e72', style:'short',    shirt:'#b2bec3', acc:[['glasses','#fdcb6e'],['badge','#00b894']] },
  'ops-monitor':         { skin:'tan',   hair:'#2d3436', style:'bald',     shirt:'#fdcb6e', beard:'#2d3436', acc:[['headset','#2d3436']] },
  'release-prep':        { skin:'dark',  hair:'#000000', style:'short',    shirt:'#d63031', acc:[['hardhat','#e17055'],['badge','#f1c40f']] },
  'owner':               { skin:'light', hair:'#3b2a1a', style:'short',    shirt:'#2d3436', acc:[['sunglasses','#111111'],['tie','#c0392b']] },
};

// AURUM roles -> looks (reuses the ForexML portrait set).
const _AURUM_LOOK = { 'lead':'foreman','quant':'tech-lead','dev-python':'senior-engineer','dev-python-jr':'software-engineer-1','dev-mql5':'senior-engineer-2',
  'integrator':'software-engineer-2','test-unit':'test-engineer-1','test-parity':'test-engineer-2','qa':'qa-validator',
  'safety':'data-engineer','ops':'ops-monitor','deployer':'release-prep','you':'owner' };
for (const k in _AURUM_LOOK) AGENT_LOOKS[k] = AGENT_LOOKS[_AURUM_LOOK[k]];
// AURUM's own portraits. fem:true adds lashes, lipstick and blush.
Object.assign(AGENT_LOOKS, {
  'quant':         { fem:true, skin:'light', hair:'#7b2d26', style:'long', shirt:'#8e44ad', acc:[['earrings','#f1c40f']] },
  'dev-python':    { fem:true, skin:'tan',   hair:'#1a1a1a', style:'long', shirt:'#16a085', acc:[['headband','#c0392b'],['earrings','#ecf0f1']] },
  'integrator':    { fem:true, skin:'brown', hair:'#2c1810', style:'long', shirt:'#e67e22', acc:[['headband','#e84393'],['earrings','#f1c40f']] },
  'test-unit':     { fem:true, skin:'light', hair:'#e67e22', style:'long', shirt:'#27ae60', acc:[['earrings','#00cec9']] },
  'qa':            { fem:true, skin:'pale',  hair:'#f1c40f', style:'bun',  shirt:'#b2bec3', acc:[['earrings','#e84393'],['badge','#00b894']] },
  'safety':        { skin:'tan', hair:'#1a1a1a', style:'short', shirt:'#0984e3', acc:[['visor','#00cec9'],['badge','#ffffff']] },
});

function _grid() { return Array.from({ length: 16 }, () => Array(16).fill(null)); }
function _px(g, x, y, c) { if (x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = c; }
function _rect(g, x0, y0, x1, y1, c) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) _px(g, x, y, c); }

// Returns a 16x16 array of hex colors / null for a role (unknown roles get a neutral look).
function buildSprite(role) {
  const look = AGENT_LOOKS[role] || { skin:'light', hair:'#555555', style:'short', shirt:'#7f8c8d', acc:[] };
  const skin = SPRITE_SKINS[look.skin] || SPRITE_SKINS.light;
  const g = _grid();
  // shoulders / shirt
  _rect(g, 2, 13, 13, 15, look.shirt);
  _rect(g, 3, 12, 12, 12, look.shirt);
  // neck + head
  _rect(g, 6, 11, 9, 12, skin);
  _rect(g, 4, 4, 11, 10, skin);
  _rect(g, 5, 3, 10, 3, skin);
  _rect(g, 5, 11, 10, 11, skin);
  _px(g, 3, 7, skin); _px(g, 12, 7, skin);   // ears
  // face
  _px(g, 6, 7, '#1b1b1b'); _px(g, 9, 7, '#1b1b1b');
  _px(g, 7, 9, '#7a3b2e'); _px(g, 8, 9, '#7a3b2e');
  if (look.fem) {
    _px(g, 5, 6, '#1b1b1b'); _px(g, 10, 6, '#1b1b1b');            // lashes
    _px(g, 7, 9, '#d6336c'); _px(g, 8, 9, '#d6336c');             // lipstick
    _px(g, 5, 8, '#f3a6b8'); _px(g, 10, 8, '#f3a6b8');            // blush
  }
  // beard (before hair so hair can overlap)
  if (look.beard) { _rect(g, 5, 10, 10, 11, look.beard); _px(g, 4, 9, look.beard); _px(g, 11, 9, look.beard); _px(g, 7, 9, '#7a3b2e'); _px(g, 8, 9, '#7a3b2e'); }
  // hair
  const h = look.hair;
  if (look.style !== 'bald') {
    _rect(g, 4, 2, 11, 3, h); _rect(g, 4, 4, 5, 4, h); _rect(g, 10, 4, 11, 4, h);
    if (look.style === 'long') { _rect(g, 3, 4, 3, 10, h); _rect(g, 12, 4, 12, 10, h); }
    if (look.style === 'bun') { _rect(g, 6, 0, 9, 1, h); }
    if (look.style === 'ponytail') { _rect(g, 12, 5, 13, 9, h); }
  } else { _rect(g, 5, 3, 10, 3, '#e9c9a6'); }
  // accessories
  for (const [kind, c] of look.acc) {
    switch (kind) {
      case 'hardhat': _rect(g, 4, 1, 11, 3, c); _rect(g, 2, 3, 13, 3, c); _px(g, 6, 1, '#ffffff'); break;
      case 'cap': _rect(g, 4, 1, 11, 3, c); _rect(g, 1, 4, 6, 4, c); break;
      case 'headband': _rect(g, 4, 4, 11, 4, c); break;
      case 'visor': _rect(g, 4, 5, 11, 5, c); break;
      case 'headset': _rect(g, 4, 2, 11, 2, c); _rect(g, 3, 3, 3, 8, c); _rect(g, 12, 3, 12, 8, c);
        _rect(g, 2, 6, 2, 8, '#566573'); _rect(g, 13, 6, 13, 8, '#566573'); _px(g, 3, 9, c); _px(g, 4, 10, c); _px(g, 5, 10, c); break;
      case 'headphones': _rect(g, 4, 2, 11, 2, c); _rect(g, 3, 3, 3, 8, c); _rect(g, 12, 3, 12, 8, c);
        _rect(g, 2, 6, 2, 8, '#2c3e50'); _rect(g, 13, 6, 13, 8, '#2c3e50'); break;
      case 'glasses': _rect(g, 5, 6, 7, 6, c); _rect(g, 5, 8, 7, 8, c); _px(g, 5, 7, c); _px(g, 7, 7, c);
        _rect(g, 8, 6, 10, 6, c); _rect(g, 8, 8, 10, 8, c); _px(g, 8, 7, c); _px(g, 10, 7, c); break;
      case 'sunglasses': _rect(g, 4, 6, 11, 7, c); break;
      case 'tie': _rect(g, 7, 12, 8, 15, c); _px(g, 6, 12, '#ecf0f1'); _px(g, 9, 12, '#ecf0f1'); break;
      case 'earrings': _px(g, 3, 9, c); _px(g, 12, 9, c); break;
      case 'badge': _px(g, 11, 13, c); _px(g, 11, 14, c); break;
    }
  }
  // soft outline-free shoulder shading
  _rect(g, 2, 15, 13, 15, 'rgba(0,0,0,0.18)');
  return g;
}

// SVG string (viewBox 16x16, crisp edges). Adjacent same-color pixels in a row are merged into one rect.
function renderSprite(role) {
  const g = buildSprite(role);
  let rects = '';
  for (let y = 0; y < 16; y++) {
    let x = 0;
    while (x < 16) {
      const c = g[y][x];
      if (!c) { x++; continue; }
      let x2 = x;
      while (x2 + 1 < 16 && g[y][x2 + 1] === c) x2++;
      rects += '<rect x="' + x + '" y="' + y + '" width="' + (x2 - x + 1) + '" height="1" fill="' + c + '"/>';
      x = x2 + 1;
    }
  }
  return '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + rects + '</svg>';
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = { AGENT_LOOKS, SPRITE_SKINS, buildSprite, renderSprite };
