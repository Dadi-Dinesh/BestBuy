const rupees = new Intl.NumberFormat('en-IN', { style:'currency',currency:'INR',maximumFractionDigits:0 });
export const formatINR = (value: number) => rupees.format(value);
export const istDate = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
