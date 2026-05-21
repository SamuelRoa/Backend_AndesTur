(async () => {
  const base = "http://localhost:3000/api";
  const fetch = globalThis.fetch;

  const testUser = {
    username: "prueba_ci_ai",
    email: `prueba_ci_ai_${Date.now()}@andestur.com`,
    password: "Password123!",
  };

  try {
    console.log("Registering user:", testUser.email);
    const regRes = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const regText = await regRes.text();
    console.log("Register status", regRes.status);
    console.log(regText);

    console.log("\nAttempting login with same credentials");
    const loginRes = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    const loginText = await loginRes.text();
    console.log("Login status", loginRes.status);
    console.log(loginText);
  } catch (err) {
    console.error("Test error:", err.message);
  }
})();
