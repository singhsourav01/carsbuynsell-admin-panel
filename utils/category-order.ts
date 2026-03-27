type CategoryWithName = {
  cat_name?: string | null;
};

function normalizeCategoryName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getCategoryRank(name: string | null | undefined): number {
  if (!name) return Number.MAX_SAFE_INTEGER;

  const normalized = normalizeCategoryName(name);

  if (normalized === "usedcars") return 0;

  if (normalized === "tpermitvehicles" || normalized === "tpermitvehicle") return 1;

  if (normalized === "commercialvehicles" || normalized === "commercialvehicle") return 2;

  if (
    normalized === "twowheelers" ||
    normalized === "twowheeler" ||
    normalized === "2wheelers" ||
    normalized === "2wheeler"
  ) {
    return 3;
  }

  if (
    normalized === "loansusedvehicles" ||
    normalized === "loanusedvehicles" ||
    normalized === "loansusedvehicle" ||
    normalized === "loanusedvehicle"
  ) {
    return 4;
  }

  return Number.MAX_SAFE_INTEGER;
}

export function sortCategoriesByPreferredSequence<T extends CategoryWithName>(categories: T[]): T[] {
  return [...categories]
    .map((category, index) => ({
      category,
      index,
      rank: getCategoryRank(category.cat_name),
    }))
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.index - b.index;
    })
    .map((entry) => entry.category);
}
