const ramp = Object.fromEntries([50,100,200,300,400,500,600,700,800,900,950].map(step =>
  [step, `rgb(var(--tone-${step}) / <alpha-value>)`]));
export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { white:'rgb(var(--surface) / <alpha-value>)', slate:ramp, brand:ramp },
    fontFamily: { sans:['Inter','system-ui','sans-serif'] },
    borderRadius: { xl:'0.55rem','2xl':'0.7rem','3xl':'0.9rem' },
  } },
};
