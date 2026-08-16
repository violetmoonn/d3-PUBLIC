# 🤖 AI STUDIO AGENT DIRECTIVES: D3COMPOSURE STORE

## 🖼️ Prompt-Based Image Swapping & Product Editing

When the user asks to swap, change, add, or replace product images (or update product details) via natural language chat prompting, follow these exact deterministic steps:

### 1. Source of Truth
All product definitions, prices, stock counts, and image asset arrays live exclusively in **`EDIT_PRODUCT_DATA_HERE.ts`** at the workspace root.

### 2. Execution Protocol for Image Swaps
1. **Inspect Data**: Call `view_file` on `EDIT_PRODUCT_DATA_HERE.ts`.
2. **Locate Product**: Find the exact product object matching the user's requested `name` (case-insensitive).
3. **Update the `images` Array**:
   - Each item in `images` must adhere to `{ url: string, type: "image" | "video" }`.
   - **To Set a New Cover/Primary Image**: Place the new image object at index `0` of the `images` array.
   - **To Replace/Swap an Image**: Replace the target index or URL string with the new file path (e.g., `/assets/images/new_pic.jpg`, `/uploads/new_pic.jpg`, or an external `https://...` URL).
   - **If User Attached a File in Chat**: Reference the file uploaded to the project workspace (stored in `/public/assets/images/`, `src/assets/images/`, or `/uploads/`).
4. **Apply Edit**: Use `edit_file` on `EDIT_PRODUCT_DATA_HERE.ts` to perform a precise drop-in replacement.

---

## 💡 Guide for the Store Owner: How to Prompt

To swap or update images instantly via chat, simply attach your image (or specify a URL) and prompt the agent using any of these templates:

- **Swap Cover Image:** 
  > *"Swap the cover image of **[Product Name]** to this attached picture."*

- **Replace All Images:** 
  > *"Replace all images for **[Product Name]** with `/uploads/pic1.jpg` and `/uploads/pic2.jpg`."*

- **Reorder Images:** 
  > *"Make the second image of **[Product Name]** the primary cover image."*

- **Add Secondary Thumbnail:** 
  > *"Add this attached image as the second photo for **[Product Name]**."*
