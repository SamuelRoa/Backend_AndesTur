import { jest } from "@jest/globals";

const emailjs = await import("@emailjs/nodejs");
const { sendGenericEmail } = await import("../services/emailjs.service.js");

describe("EmailJS service config", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
    emailjs.default.send = jest
      .fn()
      .mockResolvedValue({ status: 200, text: "OK" });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("uses the admin pre-reservation template alias when EMAILJS_TEMPLATE_GENERIC is not set", async () => {
    process.env.EMAILJS_PUBLIC_KEY = "public-test";
    process.env.EMAILJS_PRIVATE_KEY = "private-test";
    process.env.EMAILJS_SERVICE_ID = "service-test";
    delete process.env.EMAILJS_TEMPLATE_GENERIC;
    process.env.EMAILJS_TEMPLATE_ADMIN_PRERESERVA = "template-admin";

    await sendGenericEmail({
      to_email: "admin@example.com",
      subject: "Nueva pre-reserva",
      html_content: "<p>Hola</p>",
    });

    expect(emailjs.default.send).toHaveBeenCalledWith(
      "service-test",
      "template-admin",
      expect.objectContaining({
        to_email: "admin@example.com",
        subject: "Nueva pre-reserva",
        html_content: "<p>Hola</p>",
      }),
      expect.objectContaining({
        publicKey: "public-test",
        privateKey: "private-test",
      }),
    );
  });
});
