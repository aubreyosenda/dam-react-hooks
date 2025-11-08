@"
# DAM React Hooks

React hooks library for Digital Asset Management System.

## Installation

\`\`\`bash
npm install github:aubreyosenda/dam-react-hooks
\`\`\`

## Usage

\`\`\`javascript
import { DAMProvider, useFiles, useFileUpload } from 'dam-react-hooks';

function App() {
  return (
    <DAMProvider config={{
      apiUrl: 'http://localhost:5000',
      keyId: 'your-key-id',
      keySecret: 'your-key-secret'
    }}>
      <YourApp />
    </DAMProvider>
  );
}
\`\`\`

## Hooks

- \`useFiles()\` - List files
- \`useFileUpload()\` - Upload files with progress
- \`useFileOperations()\` - Delete, move files
- \`useFolders()\` - Manage folders
- \`useFileUrl()\` - Generate file URLs
- \`useDashboardStats()\` - Get statistics
"@ | Out-File -FilePath README.md -Encoding UTF8



cd D:\ecospace\DAM\sdks\react

# Only add essential files
git add src/
git add package.json
git add .babelrc
git add README.md
git add .gitignore
git commit -m "Initial commit"
git push -u origin main