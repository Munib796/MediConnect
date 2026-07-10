// HTML <input type="date"> gives/expects YYYY-MM-DD.
// The MediConnect backend expects/returns DD-MM-YYYY.
export function toBackendDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function maxBookingIso(daysAhead = 10) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}
