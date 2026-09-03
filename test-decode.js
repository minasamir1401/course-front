const fs = require('fs');
const iconv = require('iconv-lite');

const text = "إنشاء موديول جديد صمم تجربة تقييم متكاملة لطلابك";

// Revert process:
// The text is currently UTF-8 containing Windows-1252 characters.
// We need to encode it back to Windows-1252 bytes, then decode those bytes as UTF-8.

const bytes = iconv.encode(text, 'win1252');
const original = iconv.decode(bytes, 'utf8');

console.log("Original text:");
console.log(original);
