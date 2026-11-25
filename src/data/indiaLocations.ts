export const marketplaceCountry = 'India';
export const indiaLocations: Record<string,string[]> = {
  'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur','Anakapalle','Tirupati','Kakinada','Rajahmundry'],
  Telangana:['Hyderabad','Warangal','Karimnagar'], Karnataka:['Bengaluru','Mysuru','Mangaluru','Hubballi'], 'Tamil Nadu':['Chennai','Coimbatore','Madurai','Tiruchirappalli'],
  Kerala:['Kochi','Thiruvananthapuram'], Maharashtra:['Mumbai','Pune','Nagpur','Nashik'],
  Delhi:['New Delhi','Delhi'], Haryana:['Gurugram','Faridabad'], 'Uttar Pradesh':['Noida','Lucknow','Ghaziabad'],
  Gujarat:['Ahmedabad','Surat','Vadodara','Rajkot'], Rajasthan:['Jaipur','Jodhpur','Udaipur'], 'West Bengal':['Kolkata','Siliguri'],
  'Arunachal Pradesh':['Itanagar','Naharlagun'], Assam:['Guwahati','Dibrugarh'], Bihar:['Patna','Gaya'],
  Chhattisgarh:['Raipur','Bilaspur'], Goa:['Panaji','Margao'], 'Himachal Pradesh':['Shimla','Solan'],
  Jharkhand:['Ranchi','Jamshedpur'], 'Madhya Pradesh':['Bhopal','Indore','Gwalior'],
  Manipur:['Imphal'], Meghalaya:['Shillong'], Mizoram:['Aizawl'], Nagaland:['Dimapur','Kohima'],
  Odisha:['Bhubaneswar','Cuttack','Rourkela'], Punjab:['Ludhiana','Amritsar','Mohali'],
  Sikkim:['Gangtok'], Tripura:['Agartala'], Uttarakhand:['Dehradun','Haldwani'],
  'Andaman and Nicobar Islands':['Sri Vijaya Puram'], Chandigarh:['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu':['Silvassa','Daman','Diu'],
  'Jammu and Kashmir':['Jammu','Srinagar'], Ladakh:['Leh','Kargil'], Lakshadweep:['Kavaratti'], Puducherry:['Puducherry'],

};

export const demoLocations = [
  ['Visakhapatnam','Andhra Pradesh','530016','Dwaraka Nagar'],
  ['Hyderabad','Telangana','500081','Madhapur'],
  ['Bengaluru','Karnataka','560038','Indiranagar'],
  ['Chennai','Tamil Nadu','600040','Anna Nagar'],
  ['Mumbai','Maharashtra','400053','Andheri West'],
] as const;
