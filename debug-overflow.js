// Debug script to find elements causing horizontal overflow
// Run this in the browser console: copy the code and paste it in DevTools Console

console.log('🔍 Checking for horizontal overflow...');

const docWidth = document.documentElement.clientWidth;
console.log(`Viewport width: ${docWidth}px`);

const allElements = document.querySelectorAll('*');
const overflowing = [];

allElements.forEach((el) => {
  const rect = el.getBoundingClientRect();
  if (rect.right > docWidth || rect.left < 0) {
    const computedStyle = window.getComputedStyle(el);
    overflowing.push({
      element: el,
      tag: el.tagName,
      class: el.className,
      id: el.id,
      right: rect.right,
      left: rect.left,
      width: rect.width,
      overflow: Math.max(rect.right - docWidth, -rect.left),
      position: computedStyle.position,
      display: computedStyle.display,
    });
  }
});

if (overflowing.length === 0) {
  console.log('✅ No elements causing horizontal overflow detected!');
} else {
  console.log(`❌ Found ${overflowing.length} elements causing overflow:`);
  overflowing
    .sort((a, b) => b.overflow - a.overflow)
    .slice(0, 10)
    .forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.tag}.${item.class || 'no-class'}`);
      console.log(`   Width: ${item.width}px | Overflow: ${item.overflow}px`);
      console.log(`   Position: ${item.position} | Display: ${item.display}`);
      console.log(`   Element:`, item.element);
    });
}

// Check body scroll width
console.log(`\nBody scroll width: ${document.body.scrollWidth}px`);
console.log(`Document element scroll width: ${document.documentElement.scrollWidth}px`);
console.log(`Window inner width: ${window.innerWidth}px`);

if (document.body.scrollWidth > window.innerWidth) {
  console.log(`⚠️  Body is ${document.body.scrollWidth - window.innerWidth}px wider than viewport`);
}

