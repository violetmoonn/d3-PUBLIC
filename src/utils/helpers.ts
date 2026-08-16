import { v4 as uuidv4 } from 'uuid';

export const generateUid = () => {
  return uuidv4();
};

export const safeToFixed = (val: any, decimals: number = 2) => {
  const n = parseFloat(val);
  return isNaN(n) ? '0.00' : n.toFixed(decimals);
};

export const formatPrice = (usdAmount: number, targetCurrency?: string) => {
  const currency = targetCurrency || (typeof window !== 'undefined' ? localStorage.getItem('d3_composure_currency') : 'USD') || 'USD';
  let converted = usdAmount;
  let symbol = '$';
  switch (currency) {
    case 'EUR':
      converted = usdAmount * 0.92;
      symbol = '€';
      break;
    case 'GBP':
      converted = usdAmount * 0.78;
      symbol = '£';
      break;
    case 'JPY':
      converted = usdAmount * 155;
      symbol = '¥';
      break;
    case 'KRW':
      converted = usdAmount * 1380;
      symbol = '₩';
      break;
    default:
      converted = usdAmount;
      symbol = '$';
  }
  
  if (currency === 'JPY' || currency === 'KRW') {
    return `${symbol}${Math.round(converted).toLocaleString()} ${currency}`;
  }
  return `${symbol}${converted.toFixed(2)} ${currency}`;
};

export const getDriveFileId = (url: string) => {
  if (!url) return null;
  const driveRegex = /\/file\/d\/([^\/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) return match[1].split('?')[0];
  const idMatch = url.match(/[?&]id=([^&]+)/);
  return idMatch ? idMatch[1] : null;
};

export const convertGoogleDriveUrl = (url: string) => {
  if (!url) return '';
  const driveRegex = /\/file\/d\/([^\/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    const fileId = match[1].split('?')[0].split('/')[0];
    return `https://lh3.googleusercontent.com/u/0/d/${fileId}=w1000`;
  }
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/u/0/d/${idMatch[1]}=w1000`;
  }
  return url;
};

export const formatErrorMessage = (error: string): { message: string, suggestion: string } => {
  const err = error.toUpperCase();
  
  if (err.includes("UNAUTHORIZED ACCESS TO VOID PROTOCOLS")) {
    return {
      message: "You don't have permission to perform this action.",
      suggestion: "Try logging in again or check if your account has admin rights."
    };
  }

  if (err.includes("LOCAL_UPLOAD_DISABLED")) {
    return {
      message: "Direct file uploads are currently disabled.",
      suggestion: "Please use a Google Drive link to add your artifact's visual data."
    };
  }

  if (err.includes("INVALID_DISCOUNT_CODE")) {
    return {
      message: "That discount code doesn't seem to exist or is no longer active.",
      suggestion: "Double-check the spelling or try a different code."
    };
  }

  if (err.includes("INVALID_CREDENTIALS")) {
    return {
      message: "The access key you entered is incorrect.",
      suggestion: "Make sure you have the correct password for the void control center."
    };
  }

  if (err.includes("STRIPE_SYNC_FAILED") || err.includes("NO_STRIPE_PRODUCTS_FOUND")) {
    return {
      message: "We couldn't sync with your Stripe account.",
      suggestion: "Verify your Stripe API keys are correctly set in the environment variables."
    };
  }

  if (err.includes("DESCRIPTION_GENERATION_FAILED") || err.includes("IMAGE_GENERATION_FAILED")) {
    return {
      message: "The AI was unable to generate the requested content.",
      suggestion: "Check your Gemini API key and ensure the artifact has enough data to work with."
    };
  }

  if (err.includes("NO_FILES_FOUND_IN_FOLDER")) {
    return {
      message: "No usable files were found in that Google Drive folder.",
      suggestion: "Ensure the folder is set to 'Public' so the system can scan it."
    };
  }

  if (err.includes("LOGIN_REQUIRED")) {
    return {
      message: "You must be authenticated to perform this induction.",
      suggestion: "Please log in using the Google OAuth protocol first."
    };
  }

  if (err.includes("PRODUCT_SAVE_FAILED") || err.includes("PRODUCT_UPDATE_FAILED")) {
    return {
      message: "We couldn't save the artifact data to the repository.",
      suggestion: "Check your internet connection and ensure all required fields are filled out."
    };
  }

  // Generic fallback for other errors
  return {
    message: error.replace(/_/g, ' ').toLowerCase(),
    suggestion: "If the problem persists, please contact system support."
  };
};

/**
 * Generates an optimal mathematical fluid font size based on text length.
 * Uses a square root scaling law to scale down longer strings and clamp sizes safely.
 * Returns a high-precision CSS clamp() expression.
 */
export const getMathematicalFontSize = (text: string): string => {
  const cleanText = (text || '').replace(/_/g, ' ').trim();
  const L = cleanText.length || 1;

  // Desktop limits
  const D_raw = 480 / Math.sqrt(L);
  const D = Math.max(22, Math.min(96, D_raw)); // Max 96px, min 22px

  // Mobile limits
  const M_raw = 200 / Math.sqrt(L);
  const M = Math.max(14, Math.min(42, M_raw)); // Max 42px, min 14px

  // Calculate fluid scaling equation parameters between 320px and 1440px
  const slope = (D - M) / 1120;
  const intercept = M - (320 * slope);

  return `clamp(${M.toFixed(1)}px, ${(slope * 100).toFixed(4)}vw + ${intercept.toFixed(2)}px, ${D.toFixed(1)}px)`;
};

/**
 * Calculates optimal mathematical fluid letter tracking based on text length.
 * Longer text gets tighter letter-spacing mathematically to maximize density and balance whitespace.
 * Returns a high-precision CSS clamp() expression.
 */
export const getMathematicalLetterTracking = (text: string): string => {
  const cleanText = (text || '').replace(/_/g, ' ').trim();
  const L = cleanText.length || 1;

  // Sharp, dense, intellectual negative letter-spacing for premium editorial aesthetic.
  const D_raw = -0.6 - 0.2 * Math.log(L + 1);
  const D = Math.max(-3.2, Math.min(-0.6, D_raw)); // Clamp between -3.2px and -0.6px

  // Mobile is scaled appropriately
  const M = D * 1.05;

  // Calculate fluid scaling equation parameters between 320px and 1440px
  const slope = (D - M) / 1120;
  const intercept = M - (320 * slope);

  return `clamp(${M.toFixed(2)}px, ${(slope * 100).toFixed(4)}vw + ${intercept.toFixed(2)}px, ${D.toFixed(2)}px)`;
};

const TRANSLATIONS: Record<string, Record<string, string>> = {
  EN: {
    home: "Home",
    store: "Shop",
    playground: "Playground",
    artifacts: "Artifacts",
    tracking: "Track Order",
    logos: "Logos",
    ethos: "About",
    sustainability: "Sustainability",
    provenance: "Provenance",
    'size-chart': "Size Chart",
    affiliates: "Affiliates",
    gallery: "Gallery",
    preferences: "Preferences",
    checkout_bag: "Bag",
    close: "Back",
    menu: "Menu",
    add_to_bag: "+",
    out_of_stock: "Out of Stock",
    remove: "Remove",
    subtotal: "Subtotal",
    shipping: "Shipping",
    complimentary: "Complimentary",
    save_config: "Save Configuration",
    reconfiguring: "Reconfiguring Ledger...",
    tba: "TBA"
  },
  JA: {
    home: "ホーム",
    store: "ショップ",
    playground: "デザインラボ",
    artifacts: "アーティファクト",
    tracking: "注文追跡",
    logos: "ロゴ",
    ethos: "概要",
    sustainability: "サステナビリティ",
    provenance: "出所履歴",
    'size-chart': "サイズ表",
    affiliates: "アフィリエイト",
    gallery: "ギャラリー",
    preferences: "環境設定",
    checkout_bag: "ショッピングバッグ",
    close: "戻る",
    menu: "メニュー",
    add_to_bag: "+",
    out_of_stock: "売り切れ",
    remove: "削除",
    subtotal: "小計",
    shipping: "配送",
    complimentary: "無料提供",
    save_config: "設定を保存",
    reconfiguring: "システム再構成中...",
    tba: "近日公開"
  },
  KO: {
    home: "홈",
    store: "숍",
    playground: "디자인 스튜디오",
    artifacts: "아티팩트",
    tracking: "주문 추적",
    logos: "로고",
    ethos: "소개",
    sustainability: "지속가능성",
    provenance: "출처 정보",
    'size-chart': "사이즈 표",
    affiliates: "제휴 프로그램",
    gallery: "갤러리",
    preferences: "환경 설정",
    checkout_bag: "쇼핑백",
    close: "뒤로",
    menu: "메뉴",
    add_to_bag: "+",
    out_of_stock: "품절",
    remove: "제거",
    subtotal: "소계",
    shipping: "배송",
    complimentary: "무료 제공",
    save_config: "설정 저장",
    reconfiguring: "원장 재구성 중...",
    tba: "추후 공개"
  },
  DE: {
    home: "Home",
    store: "Shop",
    playground: "Design Studio",
    artifacts: "Artefakte",
    tracking: "Bestellung verfolgen",
    logos: "Logos",
    ethos: "Über uns",
    sustainability: "Nachhaltigkeit",
    provenance: "Provenienz",
    'size-chart': "Größentabelle",
    affiliates: "Partnerprogramm",
    gallery: "Galerie",
    preferences: "Einstellungen",
    checkout_bag: "Warenkorb",
    close: "Zurück",
    menu: "Menü",
    add_to_bag: "+",
    out_of_stock: "Ausverkauft",
    remove: "Entfernen",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    complimentary: "Kostenlos",
    save_config: "Konfiguration speichern",
    reconfiguring: "Rekonfiguration...",
    tba: "TBA"
  },
  FR: {
    home: "Accueil",
    store: "Boutique",
    playground: "Studio Design",
    artifacts: "Artefacts",
    tracking: "Suivi de commande",
    logos: "Logos",
    ethos: "À propos",
    sustainability: "Durabilité",
    provenance: "Provenance",
    'size-chart': "Guide des tailles",
    affiliates: "Affiliés",
    gallery: "Galerie",
    preferences: "Préférences",
    checkout_bag: "Panier",
    close: "Retour",
    menu: "Menu",
    add_to_bag: "+",
    out_of_stock: "Épuisé",
    remove: "Retirer",
    subtotal: "Sous-total",
    shipping: "Livraison",
    complimentary: "Offert",
    save_config: "Sauvegarder la configuration",
    reconfiguring: "Reconfiguration...",
    tba: "TBA"
  }
};

export const t = (key: string, lang?: string): string => {
  const currentLang = lang || (typeof window !== 'undefined' ? localStorage.getItem('d3_composure_language') : 'EN') || 'EN';
  const translations = TRANSLATIONS[currentLang] || TRANSLATIONS.EN;
  return translations[key] || TRANSLATIONS.EN[key] || key;
};
