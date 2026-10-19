// 送料の計算（業務仕様 3.3 の5）

/** 送料（税込） */
export const SHIPPING_FEE = 550;
/** 税込でこの金額以上なら送料無料 */
export const FREE_SHIPPING_THRESHOLD = 5000;

/**
 * 送料を返す。taxIncluded は割引と消費税を反映した商品の金額（送料を含まない）
 * @param {number} taxIncluded
 * @returns {number}
 */
export function calcShippingFee(taxIncluded) {
  if (taxIncluded > FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return SHIPPING_FEE;
}
