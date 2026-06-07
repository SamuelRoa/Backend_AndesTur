import emailjs from "@emailjs/nodejs";

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
};

const getConfig = () => {
  const publicKey = readEnv("EMAILJS_PUBLIC_KEY", "EMAILJS_USER_ID");
  const privateKey = readEnv("EMAILJS_PRIVATE_KEY", "EMAILJS_SECRET_KEY");

  if (!publicKey || !privateKey) {
    throw new Error(
      "EmailJS no configurado: EMAILJS_PUBLIC_KEY/EMAILJS_PRIVATE_KEY faltan",
    );
  }

  return { publicKey, privateKey };
};

const getServiceId = () => {
  const serviceId = readEnv(
    "EMAILJS_SERVICE_ID",
    "EMAILJS_SERVICEID",
    "SERVICE_ID",
  );
  if (!serviceId) {
    throw new Error("EmailJS no configurado: EMAILJS_SERVICE_ID faltante");
  }
  return serviceId;
};

export const sendEmail = async ({ templateId, templateParams }) => {
  const serviceId = getServiceId();
  const config = getConfig();
  // Log which templateId will be used (fall back candidates shown if undefined)
  const envCandidates = {
    EMAILJS_TEMPLATE_GENERIC: process.env.EMAILJS_TEMPLATE_GENERIC || null,
    EMAILJS_TEMPLATE_ADMIN_PRERESERVA: process.env.EMAILJS_TEMPLATE_ADMIN_PRERESERVA || null,
    EMAILJS_TEMPLATE_PRERESERVA: process.env.EMAILJS_TEMPLATE_PRERESERVA || null,
  };
  console.info('EmailJS: sending with templateId:', templateId || '(none)', 'envCandidates:', envCandidates);

  const response = await emailjs.send(serviceId, templateId, templateParams, config);

  return response;
};

export const sendPasswordRecovery = async ({
  to_email,
  nombre_usuario,
  password_temporal,
}) => {
  return sendEmail({
    templateId:
      readEnv("EMAILJS_TEMPLATE_PASSWORD", "EMAILJS_TEMPLATE_RECOVERY") ||
      "template_qlsx4vk",
    templateParams: { to_email, nombre_usuario, password_temporal },
  });
};

export const sendGenericEmail = async ({ to_email, subject, html_content }) => {
  return sendEmail({
    templateId: readEnv(
      "EMAILJS_TEMPLATE_GENERIC",
      "EMAILJS_TEMPLATE_ADMIN_PRERESERVA",
      "EMAILJS_TEMPLATE_PRERESERVA",
    ),
    templateParams: { to_email, subject, html_content },
  });
};
