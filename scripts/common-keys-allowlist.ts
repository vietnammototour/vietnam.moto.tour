export type CommonKeyMapping = {
  from: {namespace: string; key: string};
  to: {key: string};
  /** Optional override when VI/EN values differ across sources, or to
   *  resolve a collision with an existing common.<key>. */
  value?: {vi: string; en: string};
};

export const COMMON_KEY_MAPPINGS: CommonKeyMapping[] = [];
