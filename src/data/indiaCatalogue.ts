import type { FuelType, TransmissionType } from '../types';

export const bodyTypes = ['Hatchback','Sedan','SUV','Compact SUV','MPV','Electric vehicle','Premium'] as const;
export type BodyType = typeof bodyTypes[number];
export interface CatalogueVariant { name: string; fuel: FuelType; transmission: TransmissionType; indicativePrice: number; }
export interface CatalogueCar {
  id: string; manufacturer: string; model: string; body: BodyType; seats: number;
  image?: string; description: string; powertrain: string; features: string[];
  variants: CatalogueVariant[]; active: boolean;
}

// Indicative INR bands for demonstration. Trim, transmission and price combinations require dealer confirmation.
const rows: [string, string][] = [
  ['Maruti Suzuki','Swift|Hatchback|6.5|9.6|LXi,VXi,ZXi;Baleno|Hatchback|6.7|9.9|Sigma,Delta,Zeta,Alpha;Fronx|Compact SUV|7.5|13.1|Sigma,Delta,Zeta,Alpha;Brezza|Compact SUV|8.4|14.2|LXi,VXi,ZXi;Grand Vitara|SUV|11.4|20.7|Sigma,Delta,Zeta,Alpha;Dzire|Sedan|6.8|10.2|LXi,VXi,ZXi;Ertiga|MPV|8.8|13.4|LXi,VXi,ZXi;Jimny|SUV|12.7|15|Zeta,Alpha;Wagon R|Hatchback|5.6|7.4|LXi,VXi,ZXi;Alto K10|Hatchback|4.2|6.2|Std,LXi,VXi;Celerio|Hatchback|5.4|7.1|LXi,VXi,ZXi;Ignis|Hatchback|5.8|8.2|Sigma,Delta,Zeta,Alpha;XL6|MPV|11.7|14.8|Zeta,Alpha,Alpha Plus;Invicto|MPV|25.3|29.2|Zeta Plus,Alpha Plus'],
  ['Hyundai','Creta|SUV|11.1|20.5|E,EX,S,SX;Venue|Compact SUV|8.1|14|E,S,SX;Exter|Compact SUV|6.2|10.6|EX,S,SX; i20|Hatchback|7.3|11.5|Era,Magna,Sportz,Asta;Grand i10 Nios|Hatchback|5.9|8.7|Era,Magna,Sportz,Asta;Verna|Sedan|11.1|17.5|EX,S,SX;Alcazar|SUV|15|22|Executive,Prestige,Platinum,Signature;Tucson|Premium|29|36|Platinum,Signature;Aura|Sedan|6.5|9.1|E,S,SX;Ioniq 5|Electric vehicle|46|47|Long Range'],
  ['Tata Motors','Nexon|Compact SUV|8|15.6|Smart,Pure,Creative,Fearless;Punch|Compact SUV|6|10.2|Pure,Adventure,Accomplished,Creative;Harrier|SUV|15|26|Smart,Pure,Adventure,Fearless;Safari|SUV|15.5|27|Smart,Pure,Adventure,Accomplished;Curvv|SUV|10|19.5|Smart,Pure,Creative,Accomplished;Altroz|Hatchback|6.6|11.4|Smart,Pure,Creative,Accomplished;Tiago|Hatchback|5|8.2|XE,XM,XT,XZ;Tigor|Sedan|6|9.5|XE,XM,XZ;Punch EV|Electric vehicle|10|14.5|Smart,Adventure,Empowered;Nexon EV|Electric vehicle|12.5|17.3|Creative,Fearless,Empowered;Tiago EV|Electric vehicle|8|11.2|XE,XT,XZ Plus'],
  ['Mahindra','Scorpio N|SUV|14|25|Z2,Z4,Z6,Z8;Scorpio Classic|SUV|13.6|17.5|S,S11;XUV 3XO|Compact SUV|7.8|15.6|MX1,MX2,AX5,AX7;XUV700|SUV|14|26|MX,AX3,AX5,AX7;Thar|SUV|11.5|17.7|AX Optional,LX;Thar Roxx|SUV|13|23|MX1,MX3,AX5L,AX7L;Bolero|SUV|9.8|11|B4,B6,B6 Optional;Bolero Neo|SUV|9.9|12.5|N4,N8,N10;BE 6|Electric vehicle|19|27|Pack One,Pack Two,Pack Three;XEV 9e|Electric vehicle|22|31|Pack One,Pack Two,Pack Three'],
  ['Kia','Sonet|Compact SUV|8|15.8|HTE,HTK,HTX,GTX Plus;Seltos|SUV|11.2|20.7|HTE,HTK,HTX,GTX Plus;Carens|MPV|10.5|19|Premium,Prestige,Luxury;Carens Clavis|MPV|11.5|21.5|HTE,HTK,HTX,HTX Plus;Syros|Compact SUV|9|17.8|HTK,HTX,HTX Plus;EV6|Electric vehicle|61|66|GT Line,GT Line AWD;EV9|Electric vehicle|125|130|GT Line AWD'],
  ['Toyota','Innova Crysta|MPV|19.9|27|GX,VX,ZX;Innova Hycross|MPV|19|31|GX,VX,ZX;Fortuner|SUV|34|52|4x2,4x4,Legender;Hyryder|SUV|11.3|20|E,S,G,V;Glanza|Hatchback|6.8|10|E,S,G,V;Rumion|MPV|10.5|13.9|S,G,V;Camry|Premium|46|49|Hybrid;Hilux|Premium|30.5|38|Standard,High'],
  ['Honda','City|Sedan|12|16.6|SV,V,VX,ZX;Amaze|Sedan|8|11.5|V,VX,ZX;Elevate|SUV|11.6|16.9|SV,V,VX,ZX'],
  ['Volkswagen','Virtus|Sedan|11.6|19.5|Comfortline,Highline,Topline,GT;Taigun|SUV|11.7|20|Comfortline,Highline,Topline,GT'],
  ['Skoda','Slavia|Sedan|10.7|19|Classic,Signature,Prestige;Kushaq|SUV|11|19.5|Classic,Signature,Prestige;Kylaq|Compact SUV|7.9|14.5|Classic,Signature,Prestige;Kodiaq|Premium|44|49|Sportline,Selection L&K'],
  ['Renault','Kwid|Hatchback|4.7|6.5|RXE,RXL,RXT,Climber;Triber|MPV|6.2|9|RXE,RXL,RXT,RXZ;Kiger|Compact SUV|6.2|11.2|RXE,RXL,RXT,RXZ'],
  ['MG Motor','Astor|SUV|10|18|Sprint,Shine,Select,Savvy;Hector|SUV|14|23|Style,Shine,Smart,Sharp;Gloster|Premium|39|45|Sharp,Savvy;Comet EV|Electric vehicle|7|10|Executive,Excite,Exclusive;Windsor EV|Electric vehicle|14|19|Excite,Exclusive,Essence;ZS EV|Electric vehicle|19|26|Executive,Excite,Exclusive'],
  ['Nissan','Magnite|Compact SUV|6.2|11.9|Visia,Acenta,N-Connecta,Tekna;X-Trail|Premium|47|50|X-Trail'],
  ['Citroën','C3|Hatchback|6.3|10|Live,Feel,Shine;eC3|Electric vehicle|11.6|13.5|Live,Feel,Shine;Aircross|SUV|8.5|14.6|You,Plus,Max;Basalt|SUV|8.2|14|You,Plus,Max'],
  ['BYD','Atto 3|Electric vehicle|25|34|Dynamic,Premium,Superior;Seal|Electric vehicle|41|54|Dynamic,Premium,Performance;eMAX 7|Electric vehicle|27|30|Premium,Superior;Sealion 7|Electric vehicle|49|56|Premium,Performance'],
];

const dieselModels = new Set(['Harrier','Safari','Scorpio N','Scorpio Classic','Bolero','Bolero Neo','Innova Crysta','Hilux','Gloster']);
const sixSeats = new Set(['XL6']); const fourSeats = new Set(['Jimny','Thar','Comet EV']);
export const indiaCatalogue: CatalogueCar[] = rows.flatMap(([manufacturer, models]) => models.split(';').map(record => {
  const [model, category, low, high, trims] = record.split('|').map(value => value.trim());
  const body = category as BodyType;
  const fuel: FuelType = body === 'Electric vehicle' ? 'Electric'
    : ['Camry','Innova Hycross','Invicto'].includes(model) ? 'Hybrid' : dieselModels.has(model) ? 'Diesel' : 'Petrol';
  const seats = sixSeats.has(model) ? 6 : fourSeats.has(model) ? 4 : body === 'MPV' || ['Safari','Scorpio N','Alcazar','EV9','Kodiaq','Fortuner'].includes(model) ? 7 : 5;
  const variants = trims.split(',').map((name,index,array): CatalogueVariant => ({
    name, fuel, transmission: fuel === 'Electric' ? 'Single-Speed' : fuel === 'Hybrid' || body === 'Premium' || index === array.length - 1 ? 'Automatic' : 'Manual',
    indicativePrice: Math.round((Number(low) + (Number(high) - Number(low)) * index / Math.max(1,array.length - 1)) * 100) * 1000,
  }));
  return {
    id: `${manufacturer}-${model}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-'),
    manufacturer, model, body, seats, variants, active:true,
    description:`Explore the ${manufacturer} ${model}, a ${body.toLowerCase()} in the Indian-market reference catalogue. Confirm exact specifications with the dealer.`,
    powertrain:fuel === 'Electric' ? 'Battery-electric motor' : fuel === 'Hybrid' ? 'Petrol-electric hybrid' : `${fuel} engine`,
    features:[`${seats} seats`,`${variants.length} reference trims`],
  };
}));
