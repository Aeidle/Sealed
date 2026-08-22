# Next.js App Setup with pnpm, TypeScript, Shadcn & Tailwind

## 1. Create Next.js App with TypeScript

```bash

# Create new Next.js app with TypeScript template

pnpm create next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"


# Navigate to project directory

cd my-app

```
## 2. Install Dependencies

```bash
# Install additional dependencies for Shadcn

pnpm add class-variance-authority clsx tailwind-merge lucide-react

pnpm add -D @types/node
```

## 3. Initialize Shadcn UI

```bash
# Initialize shadcn-ui in your project

pnpm dlx shadcn@latest init
```

When prompted, configure:
- TypeScript: **Yes**
- Style: **Default**
- Base color: **Slate** (or your preference)
- CSS variables: **Yes**
## 4. Install Your First Shadcn Components

```bash
# Install commonly used components

pnpm dlx shadcn@latest add button

pnpm dlx shadcn@latest add input

pnpm dlx shadcn@latest add card

pnpm dlx shadcn@latest add dialog

# Install any library

pnpm add react-pdf pdfjs-dist

pnpm add <library>

```

## 5. Project Structure Verification

Your project should now have:

```
my-app/

├── src/

│ ├── app/

│ │ ├── globals.css

│ │ ├── layout.tsx

│ │ └── page.tsx

│ └── components/

│ └── ui/

├── components.json

├── tailwind.config.ts

├── tsconfig.json

└── package.json

```

## 6. Start Development Server

```bash
# Start the development server

pnpm dev

```

## 7. Example Usage (Optional Test)

Replace `src/app/page.tsx` with:

```typescript

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Welcome to Next.js + Shadcn</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => alert('Hello!')}>
            Click me
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

```


## Key Configuration Files Created:

### `components.json`

  

- Shadcn configuration

- Component installation paths

- Styling preferences

  

### `tailwind.config.ts`

  

- Tailwind CSS configuration

- Shadcn color variables

- Custom theme extensions

  

### `src/app/globals.css`

  

- Global styles

- Tailwind directives

- Shadcn CSS variables

  

## Next Steps:

  

1. Visit `http://localhost:3000` to see your app

2. Add more components: `pnpm dlx shadcn-ui@latest add [component-name]`

3. Browse available components: [Shadcn UI Components](https://ui.shadcn.com/docs/components)