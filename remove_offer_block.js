const fs = require('fs');
const path = 'frontend/src/pages/Dashboard.tsx';
let text = fs.readFileSync(path, 'utf8');
const startMarker = '        {activeOffer ? (';
const endMarker = '        {/* Stats Cards - Mobile Responsive Grid */}';
const start = text.indexOf(startMarker);
if (start === -1) { throw new Error('start marker not found'); }
const end = text.indexOf(endMarker, start);
if (end === -1) { throw new Error('end marker not found'); }
text = text.slice(0, start) + text.slice(end);
fs.writeFileSync(path, text, 'utf8');
console.log('removed activeOffer block');
