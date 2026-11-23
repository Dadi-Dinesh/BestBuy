interface VehicleIdentity {
  brand: string;
  model: string;
  variant: string;
  vehicleModelId?: string;
  variantId?: string;
}

export function resolveVehicleIdentity(vehicle: VehicleIdentity, listings: VehicleIdentity[]) {
  const normalize = (label: string) => label.trim().replace(/\s+/g, ' ').toLowerCase();
  const model = [normalize(vehicle.brand), normalize(vehicle.model)];
  const variant = normalize(vehicle.variant);
  const sameModel = listings.filter(listing =>
    normalize(listing.brand) === model[0] && normalize(listing.model) === model[1]);
  return {
    vehicleModelId: vehicle.vehicleModelId || sameModel[0]?.vehicleModelId || JSON.stringify(model),
    variantId: vehicle.variantId || sameModel.find(listing => normalize(listing.variant) === variant)?.variantId ||
      JSON.stringify([...model, variant]),
  };
}
