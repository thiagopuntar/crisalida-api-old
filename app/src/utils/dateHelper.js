import { date } from "quasar";

export const dateBuilder = dateString => {
  if (!dateString) {
    return null;
  }

  const dtArr = dateString.split("/");
  const day = dtArr[0];
  const month = parseInt(dtArr[1]) - 1;
  const year = dtArr[2];

  return date.formatDate(new Date(year, month, day), "YYYY-MM-DD");
};

export const formatWeekDay = date => {
  const weekDays = {
    0: "dom",
    1: "seg",
    2: "ter",
    3: "qua",
    4: "qui",
    5: "sex",
    6: "sab"
  };

  return weekDays[date.getDay()];
};

const dt = new Date();
const dayOfWeek = dt.getDay();

const today = date.formatDate(dt, "DD/MM/YYYY");
console.log(today);
const yesterday = date.formatDate(
  date.subtractFromDate(dt, { days: 1 }),
  "DD/MM/YYYY"
);

const weekBegin = date.formatDate(
  date.subtractFromDate(dt, { days: dayOfWeek }),
  "DD/MM/YYYY"
);

const weekEnd = date.formatDate(
  date.addToDate(dt, { days: 6 - dayOfWeek }),
  "DD/MM/YYYY"
);

const monthBegin = date.formatDate(
  date.adjustDate(dt, { date: 1 }),
  "DD/MM/YYYY"
);

const getMonthEnd = () => {
  const nextMonth = date.addToDate(dt, { month: 1 });
  const firstDay = date.adjustDate(nextMonth, { date: 1 });

  return date.subtractFromDate(firstDay, { days: 1 });
};

const monthEnd = date.formatDate(getMonthEnd(), "DD/MM/YYYY");

const lastMonthBegin = date.formatDate(
  date.subtractFromDate(date.adjustDate(dt, { date: 1 }), { month: 1 }),
  "DD/MM/YYYY"
);

const lastMonthEnd = date.formatDate(
  date.subtractFromDate(getMonthEnd(), { month: 1 }),
  "DD/MM/YYYY"
);

export const dateOptions = [
  {
    value: "Hoje",
    initialDate: today,
    finalDate: today
  },
  { value: "Ontem", initialDate: yesterday, finalDate: yesterday },
  {
    value: "Semana atual",
    initialDate: weekBegin,
    finalDate: weekEnd
  },
  { value: "Mês atual", initialDate: monthBegin, finalDate: monthEnd },
  {
    value: "Mês passado",
    initialDate: lastMonthBegin,
    finalDate: lastMonthEnd
  },
  {
    value: "Personalizado",
    initialDate: "",
    finalDate: ""
  }
];
