import emailjs from '@emailjs/nodejs';

const getConfig = () => {
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('EmailJS no configurado: EMAILJS_PUBLIC_KEY o EMAILJS_PRIVATE_KEY faltan');
  }

  return { publicKey, privateKey };
};

const getServiceId = () => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  if (!serviceId) {
    throw new Error('EmailJS no configurado: EMAILJS_SERVICE_ID faltante');
  }
  return serviceId;
};

export const sendEmail = async ({ templateId, templateParams }) => {
  const serviceId = getServiceId();
  const config = getConfig();

  const response = await emailjs.send(
    serviceId,
    templateId,
    templateParams,
    config,
  );

  return response;
};

export const sendPasswordRecovery = async ({ to_email, nombre_usuario, password_temporal }) => {
  return sendEmail({
    templateId: process.env.EMAILJS_TEMPLATE_PASSWORD || 'template_qlsx4vk',
    templateParams: { to_email, nombre_usuario, password_temporal },
  });
};

export const sendGenericEmail = async ({ to_email, subject, html_content }) => {
  return sendEmail({
    templateId: process.env.EMAILJS_TEMPLATE_GENERIC,
    templateParams: { to_email, subject, html_content },
  });
};
