# 🛠️ D3COMPOSURE: AMATEUR CODER GUIDE

Welcome! To make it easy for you to customize your store without getting lost in the code, we've highlighted the most important files:

## 1. 📦 [EDIT_PRODUCT_DATA_HERE.ts](./EDIT_PRODUCT_DATA_HERE.ts)
**Location:** Root Directory
**Purpose:** Change WHAT you are selling.
- Edit the `products` array to change names, prices, and image URLs.
- **How to apply changes:** Run the command `npx tsx EDIT_PRODUCT_DATA_HERE.ts` in your terminal.

## 2. 🎨 [EDIT_PRODUCT_UI_HERE.tsx](./src/components/EDIT_PRODUCT_UI_HERE.tsx)
**Location:** `src/components/`
**Purpose:** Change HOW products look.
- Edit this file to change the design, colors, and layout of the product cards in your store.

## 3. 🏗️ [EDIT_STORE_LAYOUT_HERE.tsx](./src/components/EDIT_STORE_LAYOUT_HERE.tsx)
**Location:** `src/components/EDIT_STORE_LAYOUT_HERE.tsx`
**Purpose:** Change the overall store layout (Hero section, filters, grid).

## 4. 📺 [BILLBOARD.tsx](./src/components/BILLBOARD.tsx)
**Location:** `src/components/BILLBOARD.tsx`
**Purpose:** Change the slideshow display (supports video artifacts).

## 5. 🤖 AI STUDIO PROMPTING GUIDE (Instant Image Swaps)
Don't want to edit code manually? You can simply attach an image or upload a file in AI Studio chat and prompt the AI Agent:
- *"Swap the cover image of **[Product Name]** to this attached picture."*
- *"Replace all images for **[Product Name]** with `/uploads/photo.jpg`."*
- *"Make the second photo of **[Product Name]** the primary cover."*
*(The AI Agent has been programmed via `AGENTS.md` to automatically update `EDIT_PRODUCT_DATA_HERE.ts` whenever you prompt!)*

---
*Happy coding!*
