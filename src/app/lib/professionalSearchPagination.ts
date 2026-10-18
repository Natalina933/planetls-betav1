export const PROFESSIONAL_PAGE_SIZE = 100;
export const PROFESSIONAL_MAX_PAGES = 20;

export function getProfessionalPageRange(pageIndex: number) {
  if (!Number.isInteger(pageIndex) || pageIndex < 0) {
    throw new RangeError("Index de page invalide");
  }

  const from = pageIndex * PROFESSIONAL_PAGE_SIZE;

  return {
    from,
    to: from + PROFESSIONAL_PAGE_SIZE - 1,
  };
}

export function hasReachedProfessionalPageLimit(
  pageCount: number,
  lastPageSize: number,
): boolean {
  return (
    pageCount >= PROFESSIONAL_MAX_PAGES &&
    lastPageSize === PROFESSIONAL_PAGE_SIZE
  );
}
