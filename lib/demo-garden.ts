export function demoBedForDate(date: Date) {
  const isGreenhouseSeason = date.getMonth() >= 4;
  return isGreenhouseSeason
    ? { name: "Теплица", type: "greenhouse" }
    : { name: "Рассада дома", type: "seedling_home" };
}
