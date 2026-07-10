import { usersModel } from "./users.models.js";
import { rolesModel } from "./roles.models.js";
import { customersModel } from "./customers.models.js";
import { StateModel } from "./state.models.js";
import { MunicipalityModel } from "./municipality.models.js";
import { destinationsModel } from "./destinations.models.js";
import { VehiclesModel } from "./vehicles.models.js";
import { packagesModel } from "./packages.models.js";
import { reservationsModel } from "./reservations.models.js";
import { PaymentHeaderModel } from "./payment_header.models.js";
import { PaymentDetailModel } from "./payment_detail.models.js";
import { PackagesDestinationsModel } from "./packages_destinations.models.js";
import { staffModel } from "./staff.models.js";
import { StaffPackageModel } from "./staff_package.models.js";
import { trashModel } from "./trash.models.js";

// Users - Roles
usersModel.belongsTo(rolesModel, { foreignKey: "id_role", as: "role" });
rolesModel.hasMany(usersModel, { foreignKey: "id_role", as: "users" });

// Municipalities - States
MunicipalityModel.belongsTo(StateModel, { foreignKey: "id_state" });
StateModel.hasMany(MunicipalityModel, { foreignKey: "id_state" });

// Destinations - Municipalities
destinationsModel.belongsTo(MunicipalityModel, { foreignKey: "id_municipality" });
MunicipalityModel.hasMany(destinationsModel, { foreignKey: "id_municipality" });

// Packages - Vehicles
packagesModel.belongsTo(VehiclesModel, { foreignKey: "id_vehicle" });
VehiclesModel.hasMany(packagesModel, { foreignKey: "id_vehicle" });

// Reservations - Packages / Customers
reservationsModel.belongsTo(packagesModel, { foreignKey: "id_package" });
packagesModel.hasMany(reservationsModel, { foreignKey: "id_package" });
reservationsModel.belongsTo(customersModel, { foreignKey: "id_customer" });
customersModel.hasMany(reservationsModel, { foreignKey: "id_customer" });

// Payment Headers - Reservations
PaymentHeaderModel.belongsTo(reservationsModel, { foreignKey: "id_reservation" });
reservationsModel.hasMany(PaymentHeaderModel, { foreignKey: "id_reservation" });

// Payment Details - Payment Headers
PaymentDetailModel.belongsTo(PaymentHeaderModel, { foreignKey: "id_payment_header" });
PaymentHeaderModel.hasMany(PaymentDetailModel, { foreignKey: "id_payment_header" });

// Packages Destinations
PackagesDestinationsModel.belongsTo(packagesModel, { foreignKey: "id_package" });
packagesModel.hasMany(PackagesDestinationsModel, { foreignKey: "id_package" });
PackagesDestinationsModel.belongsTo(destinationsModel, { foreignKey: "id_destination" });
destinationsModel.hasMany(PackagesDestinationsModel, { foreignKey: "id_destination" });

// Staff - Users
staffModel.belongsTo(usersModel, { foreignKey: "id_user" });
usersModel.hasOne(staffModel, { foreignKey: "id_user" });

// Staff Packages
StaffPackageModel.belongsTo(packagesModel, { foreignKey: "id_package" });
packagesModel.hasMany(StaffPackageModel, { foreignKey: "id_package" });
StaffPackageModel.belongsTo(staffModel, { foreignKey: "id_staff" });
staffModel.hasMany(StaffPackageModel, { foreignKey: "id_staff" });
