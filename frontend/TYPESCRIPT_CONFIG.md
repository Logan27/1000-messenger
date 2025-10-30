# Frontend TypeScript Configuration

## Overview
This document describes the TypeScript configuration for the frontend React application.

## Configuration File: tsconfig.json

### Language and Environment
- **target**: ES2020 - Modern JavaScript features suitable for current browsers
- **lib**: ES2020, DOM, DOM.Iterable - Standard library types for browser environment
- **jsx**: react-jsx - Modern JSX transform (no need to import React)
- **useDefineForClassFields**: true - Compliant with ES2022 class field semantics

### Modules
- **module**: ESNext - Use latest ES module syntax
- **moduleResolution**: bundler - Optimized for Vite bundler
- **resolveJsonModule**: true - Import JSON files as modules
- **allowImportingTsExtensions**: true - Allow .ts/.tsx imports (Vite handles them)
- **isolatedModules**: true - Required for Vite's fast refresh

### Emit
- **noEmit**: true - Vite handles the build, TypeScript only type-checks
- **sourceMap**: true - Generate source maps for debugging

### Type Checking
Comprehensive type checking with the following rules:
- **strict**: true - Enable all strict type checking options
- **noUnusedLocals**: true - Report unused local variables
- **noUnusedParameters**: true - Report unused function parameters
- **noFallthroughCasesInSwitch**: true - Prevent accidental fallthrough in switch statements
- **noImplicitReturns**: true - Ensure all code paths return a value
- **noImplicitThis**: true - Raise error on 'this' expressions with implied 'any' type
- **noImplicitOverride**: true - Require explicit 'override' keyword
- **noPropertyAccessFromIndexSignature**: false - Allow convenient property access
- **allowUnreachableCode**: false - Report unreachable code as error
- **exactOptionalPropertyTypes**: false - More lenient with optional props (better for React)

### Interop Constraints
- **esModuleInterop**: true - Better CommonJS/ES module interop
- **allowSyntheticDefaultImports**: true - Allow default imports from modules without default export
- **forceConsistentCasingInFileNames**: true - Prevent casing issues across platforms

### Completeness
- **skipLibCheck**: true - Skip type checking of declaration files for faster builds

### Path Mapping
- **baseUrl**: "." - Root for module resolution
- **paths**: { "@/*": ["./src/*"] } - Convenient imports using @ alias

### Vite Environment Types
- **types**: ["vite/client"] - Include Vite's environment types (import.meta.env, etc.)

## Vite Configuration Integration

The `vite.config.ts` is configured to support the path alias:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

This allows imports like:
```typescript
import { api } from '@/services/api.service';
import { useAuthStore } from '@/store/authStore';
```

## Key Features

1. **Strict Type Safety**: Comprehensive type checking catches errors early
2. **Vite Integration**: Optimized for Vite's build system and hot module replacement
3. **Path Aliases**: Clean imports using @ prefix
4. **Environment Types**: Full typing support for Vite's import.meta.env
5. **Modern JavaScript**: ES2020 target with all modern features
6. **React Optimization**: react-jsx transform for smaller bundle sizes

## Migration Notes

If upgrading from a previous configuration:
- The Vite client types now provide proper typing for `import.meta.env`
- Path aliases (@/*) are now fully configured in both TypeScript and Vite
- Stricter type checking may reveal previously hidden type errors
- The new configuration catches more potential bugs at compile time

## Development Workflow

### Type Checking
```bash
npm run type-check  # Run TypeScript compiler without emitting files
```

### Building
```bash
npm run build  # Type check + Vite build
```

### Development
```bash
npm run dev  # Start Vite dev server with HMR
```

## Troubleshooting

### "Cannot find module" errors
- Ensure the module exists in the correct location
- Check import paths match the file structure
- Verify path aliases are used correctly (@/...)

### Import.meta.env type errors
- The Vite client types are included in tsconfig.json
- Create a `vite-env.d.ts` file if you need custom environment variable types:
  ```typescript
  /// <reference types="vite/client" />
  
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_WS_URL: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  ```

### Strict type checking errors
- The configuration uses strict mode for better code quality
- Address type errors rather than disabling checks
- Use proper TypeScript types instead of `any`
