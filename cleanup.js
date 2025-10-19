import fs from 'fs';

// Read the file
const content = fs.readFileSync('src/components/AppMenuBar.tsx', 'utf8');

// Find the positions
const exportPos = content.indexOf('// MenuVideoLegacy removed - see MenuVideo.tsx for implementation');
const advancedSectionPos = content.indexOf('function AdvancedSection({ children }: { children: ReactNode }) {\n  const [isOpen, setIsOpen] = useState(false);');

if (exportPos === -1 || advancedSectionPos === -1) {
  console.error('Could not find markers');
  process.exit(1);
}

// Extract parts
const beforeExport = content.substring(0, exportPos + '// MenuVideoLegacy removed - see MenuVideo.tsx for implementation'.length);
const afterAdvanced = content.substring(advancedSectionPos);

// Combine
const newContent = beforeExport + '\n\n' + afterAdvanced;

// Write back
fs.writeFileSync('src/components/AppMenuBar.tsx', newContent);

console.log('Cleaned up AppMenuBar.tsx - removed orphaned MenuVideoLegacy code');
