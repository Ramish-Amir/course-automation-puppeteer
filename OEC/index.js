import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

async function login() {
  const LOGIN_URL = "https://softskills.oec.gov.pk/login";
  const CNIC = process.env.R1;
  const PASSWORD = process.env.R2;

  if (!CNIC || !PASSWORD) {
    throw new Error("R1 and R2 environment variables must be set");
  }

  console.log("🚀 Launching browser...");
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log("🌐 Navigating to login page...");
  await page.goto(LOGIN_URL, { waitUntil: "networkidle0" });

  // Wait for React app to load - wait for the form to appear
  console.log("⏳ Waiting for form to load...");
  await page.waitForSelector("form", { timeout: 10000 });

  // Use attribute selector to find inputs with IDs containing colons
  console.log("👤 Filling CNIC field...");
  const cnicField = await page.waitForSelector('input[id=":r1:"]', {
    timeout: 10000,
  });
  await cnicField.type(CNIC);

  console.log("🔒 Filling password field...");
  const passwordField = await page.waitForSelector('input[id=":r2:"]', {
    timeout: 10000,
  });
  await passwordField.type(PASSWORD);

  console.log("🔘 Clicking login button...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0" }),
    page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll('button[type="submit"]')
      );
      const loginBtn = buttons.find(
        (btn) => btn.textContent.trim() === "Login"
      );
      if (loginBtn) {
        loginBtn.click();
      } else {
        throw new Error("Login button not found");
      }
    }),
  ]);

  console.log("✅ Login completed!");

  // Navigate to course page
  const COURSE_URL = "https://softskills.oec.gov.pk/portal/soft-skill";
  console.log("📚 Navigating to course page...");
  await page.goto(COURSE_URL, { waitUntil: "networkidle0" });

  // Start clicking Next buttons
  await clickNextButtons(page);

  // Keep browser open for now - you can close it later if needed
  // await browser.close();
}

async function clickNextButtons(page) {
  let pageNumber = 1;
  const MAX_PAGES = 1000; // Safety limit to prevent infinite loops

  while (pageNumber <= MAX_PAGES) {
    console.log(`\n📄 Page ${pageNumber}`);

    try {
      // Wait for Next or Mark as Completed button to appear and be enabled (wait up to 20 seconds)
      console.log(
        "⏳ Waiting for Next/Mark as Completed button to appear and be enabled..."
      );

      // Wait for button to be available and enabled
      const buttonInfo = await page.waitForFunction(
        () => {
          const container = document.querySelector(".css-ipz7ya");
          if (!container) return null;

          // Get all buttons in the container
          const buttons = Array.from(
            container.querySelectorAll('button[type="button"]')
          );

          if (buttons.length === 0) return null;

          // Find the Next or Mark as Completed button
          const nextButton = buttons.find((btn) => {
            if (btn.disabled) return false;

            const style = window.getComputedStyle(btn);
            if (style.display === "none" || style.visibility === "hidden")
              return false;

            const text = btn.textContent.trim();
            return text.includes("Next") || text.includes("Mark as Completed");
          });

          if (nextButton) {
            return {
              found: true,
              text: nextButton.textContent.trim(),
            };
          }

          // Fallback: check for button with right arrow icon
          const buttonWithRightArrow = buttons.find((btn) => {
            if (btn.disabled) return false;
            const style = window.getComputedStyle(btn);
            if (style.display === "none" || style.visibility === "hidden")
              return false;
            const svg = btn.querySelector("svg");
            if (svg) {
              const path = svg.querySelector('path[d*="M10 6"]'); // Right arrow path
              return path !== null;
            }
            return false;
          });

          if (buttonWithRightArrow) {
            return {
              found: true,
              text: buttonWithRightArrow.textContent.trim() || "Next",
            };
          }

          return null;
        },
        { timeout: 20000, polling: 500 }
      );

      // Get button text for logging
      const buttonData = await buttonInfo.jsonValue();
      const buttonText = buttonData?.text || "button";

      // Now find and click the correct button (Next or Mark as Completed, not Previous)
      const clickResult = await page.evaluate(() => {
        const container = document.querySelector(".css-ipz7ya");
        if (!container)
          return { clicked: false, reason: "Container not found" };

        // Get all buttons in the container
        const buttons = Array.from(
          container.querySelectorAll('button[type="button"]')
        );

        if (buttons.length === 0) {
          return { clicked: false, reason: "No buttons found" };
        }

        // Find the button that contains "Next" or "Mark as Completed"
        const nextButton = buttons.find((btn) => {
          if (btn.disabled) return false;
          const text = btn.textContent.trim();
          return text.includes("Next") || text.includes("Mark as Completed");
        });

        if (nextButton) {
          nextButton.click();
          return { clicked: true, buttonText: nextButton.textContent.trim() };
        }

        // Fallback: if no text match, look for button with right arrow icon (Next)
        // Previous button has left arrow, Next has right arrow
        const buttonWithRightArrow = buttons.find((btn) => {
          if (btn.disabled) return false;
          const svg = btn.querySelector("svg");
          if (svg) {
            const path = svg.querySelector('path[d*="M10 6"]'); // Right arrow path
            return path !== null;
          }
          return false;
        });

        if (buttonWithRightArrow) {
          buttonWithRightArrow.click();
          return {
            clicked: true,
            buttonText: buttonWithRightArrow.textContent.trim() || "Next",
          };
        }

        // Last resort: click the last button (usually Next is last)
        const lastButton = buttons[buttons.length - 1];
        if (lastButton && !lastButton.disabled) {
          lastButton.click();
          return {
            clicked: true,
            buttonText: lastButton.textContent.trim() || "Next",
          };
        }

        return { clicked: false, reason: "No clickable button found" };
      });

      if (!clickResult.clicked) {
        throw new Error(
          `Failed to click button: ${clickResult.reason || "Unknown error"}`
        );
      }

      const actualButtonText = clickResult.buttonText || buttonText;
      console.log(`✅ ${actualButtonText} button clicked`);

      // Wait for navigation or content change (with timeout)
      try {
        await page.waitForNavigation({
          waitUntil: "networkidle0",
          timeout: 5000,
        });
      } catch (navError) {
        // If no navigation, wait a bit for content to update (SPA)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log(
        `✅ Clicked ${actualButtonText} button on page ${pageNumber}`
      );

      // Wait 15 seconds before looking for next button
      console.log("⏳ Waiting 15 seconds before next click...");
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Wait a bit more to ensure page content has fully loaded
      await new Promise((resolve) => setTimeout(resolve, 2000));

      pageNumber++;
    } catch (error) {
      if (
        error.message.includes("waiting for function failed") ||
        error.message.includes("timeout")
      ) {
        console.log(
          "❌ Next/Mark as Completed button not found. Possibly reached the end of the course."
        );
        break;
      } else {
        console.error(`❌ Error on page ${pageNumber}:`, error.message);
        // Wait a bit and try again
        await new Promise((resolve) => setTimeout(resolve, 5000));
        pageNumber++;
      }
    }
  }

  console.log(`\n✅ Completed navigating through ${pageNumber - 1} pages`);
}

login().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
