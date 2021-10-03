const holidays = require("./holidays");

module.exports = (dayjsObj) => {
  const searchLimit = 7;
  let currentDay = dayjsObj.clone();

  let loopIndex = 1;
  while (loopIndex < searchLimit) {
    if (isBusinessDay(currentDay)) break;

    currentDay = currentDay.add(1, "day");
    loopIndex += 1;
  }

  return currentDay;
};

function isBusinessDay(dayjsObj) {
  const workingWeekDays = [1, 2, 3, 4, 5];

  if (holidays.includes(dayjsObj.format("DD/MM/YYYY"))) return false;
  if (workingWeekDays.includes(dayjsObj.day())) return true;

  return false;
}
