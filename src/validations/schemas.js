import { z } from "zod";

// ==================== VALIDACIONES GENÉRICAS ====================

// Validación de ID (entero positivo)
export const idSchema = z
  .number()
  .int("ID debe ser un número entero")
  .positive("ID debe ser positivo")
  .or(
    z.string().regex(/^\d+$/, "ID debe ser un número válido").transform(Number),
  );

// Validación de emails
export const emailSchema = z
  .string()
  .email("Email inválido")
  .toLowerCase()
  .trim();

// Validación de strings comunes
export const nameSchema = z
  .string()
  .min(2, "Nombre debe tener al menos 2 caracteres")
  .max(100, "Nombre no puede exceder 100 caracteres")
  .trim();

export const descriptionSchema = z
  .string()
  .min(5, "Descripción debe tener al menos 5 caracteres")
  .max(1000, "Descripción no puede exceder 1000 caracteres")
  .trim()
  .optional();

// Validación de teléfono (Colombia)
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s().-]{10,}$/, "Número de teléfono inválido")
  .optional();

// Validación de DNI (documento de identidad)
export const dniSchema = z
  .string()
  .regex(/^\d{6,12}$/, "DNI inválido - debe contener 6 a 12 dígitos")
  .trim();

// Validación de contraseña (mínimo seguro)
export const passwordSchema = z
  .string()
  .min(8, "Contraseña debe tener al menos 8 caracteres")
  .regex(/[A-Z]/, "Contraseña debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Contraseña debe contener al menos una minúscula")
  .regex(/[\d]/, "Contraseña debe contener al menos un dígito")
  .regex(
    /[!@#$%^&*]/,
    "Contraseña debe contener al menos un carácter especial (!@#$%^&*)",
  );

// Validación de precio/monto (decimal positivo)
export const priceSchema = z
  .number()
  .positive("Precio debe ser mayor a 0")
  .or(
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .transform(Number),
  );

// Validación de fechas
export const dateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), "Fecha inválida");

export const futureDateSchema = dateSchema.refine(
  (date) => new Date(date) > new Date(),
  "La fecha debe ser en el futuro",
);

// Validación de enums
export const userStateEnum = z.enum(["active", "inactive", "blocked"]);
export const staffTypeEnum = z.enum(["guide", "driver"]);
export const payMethodEnum = z.enum(["cash", "card", "digital"]);
export const payStateEnum = z.enum([
  "pending",
  "partial",
  "paid",
  "cancelled",
  "expired",
  "rejected",
]);

// ==================== VALIDACIONES ESPECÍFICAS DEL PROYECTO ====================

// === USERS ===
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username debe tener al menos 3 caracteres")
    .max(50, "Username no puede exceder 50 caracteres")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username solo puede contener letras, números, guiones y guiones bajos",
    ),
  password: passwordSchema,
  email: emailSchema,
  state: userStateEnum.default("active"),
  id_role: idSchema.optional(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: passwordSchema.optional(),
  email: emailSchema.optional(),
  state: userStateEnum.optional(),
  id_role: idSchema.optional(),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: passwordSchema.optional(),
  email: emailSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

// === ROLES ===
export const createRoleSchema = z.object({
  type: z
    .string()
    .min(2, "Tipo de rol debe tener al menos 2 caracteres")
    .max(50, "Tipo de rol no puede exceder 50 caracteres"),
  description: descriptionSchema,
});

export const updateRoleSchema = createRoleSchema.partial();

// === CUSTOMERS ===
export const createCustomerSchema = z.object({
  dni: dniSchema,
  name: nameSchema,
  lastname: z
    .string()
    .max(100, "Apellido no puede exceder 100 caracteres")
    .optional(),
  phone_number: phoneSchema,
  email: emailSchema.optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// === STATES (Departamentos) ===
export const createStateSchema = z.object({
  name: z
    .string()
    .min(2, "Nombre del estado debe tener al menos 2 caracteres")
    .max(100, "Nombre del estado no puede exceder 100 caracteres"),
});

export const updateStateSchema = createStateSchema.partial();

// === MUNICIPALITIES ===
export const createMunicipalitySchema = z.object({
  name: nameSchema,
  id_state: idSchema,
  postal_code: z
    .number()
    .positive("Código postal debe ser positivo")
    .optional(),
});

export const updateMunicipalitySchema = createMunicipalitySchema.partial();

// === DESTINATIONS ===
export const createDestinationSchema = z.object({
  id_municipality: idSchema,
  name: z
    .string()
    .min(2, "Nombre del destino debe tener al menos 2 caracteres")
    .max(100, "Nombre del destino no puede exceder 100 caracteres")
    .optional(),
  description: z
    .string()
    .min(5, "Descripción debe tener al menos 5 caracteres"),
});

export const updateDestinationSchema = createDestinationSchema.partial();

// === VEHICLES ===
export const createVehicleSchema = z.object({
  plate: z
    .string()
    .regex(/^[A-Z]{1,3}\d{1,4}$/, "Placa inválida")
    .toUpperCase(),
  brand: z.string().max(50, "Marca no puede exceder 50 caracteres").optional(),
  model: z.string().max(50, "Modelo no puede exceder 50 caracteres").optional(),
  capacity: z
    .number()
    .int("Capacidad debe ser un número entero")
    .min(1, "Capacidad mínima es 1")
    .max(100, "Capacidad máxima es 100"),
  status: z
    .string()
    .max(50, "Estado no puede exceder 50 caracteres")
    .optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

// === PACKAGES ===
export const createPackageSchema = z
  .object({
    name: nameSchema,
    description: descriptionSchema,
    departure_date: futureDateSchema,
    return_date: futureDateSchema,
    price: priceSchema,
    id_vehicle: idSchema.optional(),
    available_places: z
      .number()
      .int("Lugares disponibles debe ser un número entero")
      .positive("Lugares disponibles debe ser positivo")
      .optional(),
  })
  .refine(
    (data) => new Date(data.return_date) > new Date(data.departure_date),
    {
      message: "Fecha de retorno debe ser posterior a fecha de salida",
      path: ["return_date"],
    },
  );

// updatePackageSchema sin refinement (no se puede usar .partial() con refinements)
export const updatePackageSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  departure_date: futureDateSchema.optional(),
  return_date: futureDateSchema.optional(),
  price: priceSchema.optional(),
  id_vehicle: idSchema.optional(),
  available_places: z
    .number()
    .int("Lugares disponibles debe ser un número entero")
    .positive("Lugares disponibles debe ser positivo")
    .optional(),
});

// === STAFF ===
export const createStaffSchema = z.object({
  name: nameSchema,
  last_name: nameSchema,
  dni: dniSchema,
  type: staffTypeEnum,
  id_user: idSchema.optional(),
});

export const updateStaffSchema = createStaffSchema.partial();

// === RESERVATIONS ===
export const createReservationSchema = z.object({
  id_package: idSchema,
  id_customer: idSchema,
  reservation_date: dateSchema.default(() => new Date().toISOString()),
  pay_state: payStateEnum.default("pending"),
});

export const updateReservationSchema = z.object({
  pay_state: payStateEnum.optional(),
});

export const rejectReservationSchema = z.object({
  reason: z
    .string()
    .min(1, "El motivo de rechazo es requerido")
    .max(500, "El motivo no puede exceder 500 caracteres"),
});

// === PAYMENT HEADERS ===
export const createPaymentHeaderSchema = z.object({
  id_reservation: idSchema,
  payment_date: dateSchema.default(() => new Date().toISOString()),
  total_amount: priceSchema,
});

export const updatePaymentHeaderSchema = z.object({
  total_amount: priceSchema.optional(),
});

// === PAYMENT DETAILS ===
export const createPaymentDetailSchema = z.object({
  id_payment_header: idSchema,
  pay_method: payMethodEnum,
  amount_paid: priceSchema,
  reference: z
    .string()
    .max(100, "Referencia no puede exceder 100 caracteres")
    .optional(),
  payment_date: dateSchema.optional(),
});

export const updatePaymentDetailSchema = createPaymentDetailSchema.partial();

// === PACKAGES DESTINATIONS ===
export const createPackageDestinationSchema = z.object({
  id_package: idSchema,
  id_destination: idSchema,
  order_visit: z
    .number()
    .int("Orden de visita debe ser un número entero")
    .positive("Orden de visita debe ser positivo"),
});

export const updatePackageDestinationSchema =
  createPackageDestinationSchema.partial();

// === STAFF PACKAGES ===
export const createStaffPackageSchema = z.object({
  id_package: idSchema,
  id_staff: idSchema,
});

export const updateStaffPackageSchema = createStaffPackageSchema.partial();

// === HEALTH ===
export const healthSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  environment: z.string(),
});

// === RESERVATION QUERY (Website - Public) ===
export const reservationQuerySchema = z.object({
  email: emailSchema,
  dni: dniSchema,
});

// === PRE-RESERVATIONS (Website) ===
export const preReservationSchema = z.object({
  dni: dniSchema,
  name: nameSchema,
  lastname: z
    .string()
    .max(100, "Apellido no puede exceder 100 caracteres")
    .optional(),
  phone_number: phoneSchema,
  email: emailSchema,
  id_package: idSchema,
});

