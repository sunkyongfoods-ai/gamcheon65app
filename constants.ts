

// 공통 상수
export const PURCHASE_COMMISSION_RATE = 0.033; // 매입수수료 3.3%

// 고등어 관련 상수
export const MACKEREL_KG_PER_ORIGINAL_BOX = 25.5;
export const MACKEREL_COSTS_AUCTION: Record<number, { onSite: number; warehouse: number }> = {
    10: { onSite: 2640, warehouse: 1611 },
    15: { onSite: 3040, warehouse: 2082 },
    20: { onSite: 3650, warehouse: 2754 },
};
export const MACKEREL_STORAGE_FEES_PER_DAY: Record<number, number> = {
    10: 7.7,
    15: 9.9,
    20: 11,
};

// 오징어 관련 상수
export const SQUID_COST_ON_SITE = 495 + 58 + 385; // 현장비용 (PAN 당)
export const SQUID_COST_WAREHOUSE = 484 + 240; // 창고비용 (PAN 당)
export const SQUID_STORAGE_FEE_PER_DAY = 11; // PAN당 일일 보관료