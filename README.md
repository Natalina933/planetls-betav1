This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Pricing Grid (Quick Rules)

1. Base first: `hourlyRate + travelFee + fixedFees`.
2. Global modifiers apply next: urgency, night, weekend, high season.
3. Service overrides can replace or adjust base/modifiers.
4. Context rules apply with explicit priority (`priority` ascending).
5. `replace` overrides value; `delta` adds/subtracts value.
6. Total is always clamped by `minimumInvoice`.
7. If `pricing_v2` is missing, fallback to legacy pricing.
8. During migration, keep writing both `pricing` (legacy) and `pricing_v2`.
9. Every calculation must be traceable (`appliedRules`, final modifiers, minimum used).
10. Detailed spec: `docs/pricing-grid-business-spec.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
