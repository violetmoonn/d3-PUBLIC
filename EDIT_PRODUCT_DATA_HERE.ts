/**
 * ============================================================================
 * !!! EDIT_PRODUCT_DATA_HERE.ts !!!
 * ============================================================================
 * This file contains the DATA for your products (Names, Prices, Images).
 * Amateur coders: Edit the 'products' array below to change what you sell.
 * After editing, run 'npx tsx scripts/sync.ts' to update your store.
 * ============================================================================
 */

export const products = [
  {
    name: "D3 01",
    description: "A high-fidelity heavyweight hoodie artifact crafted for the D3COMPOSURE void. Features an experimental silhouette with technical precision.",
    price: 350,
    category: "ARTIFACT",
    is_visible: true,
    stripe_payment_link: "https://buy.stripe.com/00w4gB4II5Av2qQgsmfjG0a",
    stripe_buy_button_id: "",
    stripe_publishable_key: "pk_live_51T8ECtQ4FdRda8h8nfdJSUR7txP58VE5Gpt3eqzVkBY7yHIhagkM85zML8BMqfHkseITaVI72Dwm1RzOUJmYjPqQ00irFfM8FW",
    images: [
      { url: "https://cdn.uploadtourl.com/106e0203-9397-4329-8883-29b0ff2ab237_Screenshot_2026-08-08_at_8.37.58_PM.png", type: "image" },
      { url: "/assets/images/IMG_4800_1_3.png", type: "image" },
      { url: "/assets/images/IMG_3215_3_3.png", type: "image" },
      { url: "/assets/images/black_hoodie_tracksuit.jpg", type: "image" },
      { url: "/assets/images/d3_02_garment.jpg", type: "image" }
    ],
    stock: 999
  }
];
