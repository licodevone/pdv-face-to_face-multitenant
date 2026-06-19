export const getStockStatus = ({
  stockQuantity,
  minimumStock,
}: {
  stockQuantity: number;
  minimumStock: number;
}): "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" => {
  if (stockQuantity <= 0) {
    return "OUT_OF_STOCK";
  }

  if (stockQuantity <= minimumStock) {
    return "LOW_STOCK";
  }

  return "AVAILABLE";
};
