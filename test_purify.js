const DOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

const window = new JSDOM("").window;
const purify = DOMPurify(window);

const input = '<img loading="lazy" decoding="async" src="/uploads/test.jpg" style="width: 100%;" />';
const sanitized = purify.sanitize(input, {
  ADD_TAGS: ["font", "mark"],
  ADD_ATTR: ["color", "size", "face", "style"]
});

console.log("Original: ", input);
console.log("Sanitized: ", sanitized);
