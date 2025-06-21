import type { Locator, Page } from "@playwright/test";

export class ContactPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly messageInput: Locator;
  readonly gdprCheckbox: Locator;
  readonly honeypotInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessages: Locator;
  readonly successMessage: Locator;
  readonly toastContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel("Name");
    this.emailInput = page.getByLabel("Email");
    this.messageInput = page.getByLabel("Message");
    this.gdprCheckbox = page.getByRole("checkbox");
    this.honeypotInput = page.getByLabel("Leave this field empty");
    this.submitButton = page.getByRole("button", { name: /send message/i });
    this.errorMessages = page.locator("[role='alert']");
    this.successMessage = page.getByText("Thank You!");
    this.toastContainer = page.locator("[data-sonner-toaster]");
  }

  async goto() {
    await this.page.goto("/contact");
  }

  async fillForm(data: {
    name: string;
    email: string;
    message: string;
    acceptGdpr?: boolean;
    honeypot?: string;
  }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.messageInput.fill(data.message);

    if (data.acceptGdpr !== false) {
      await this.gdprCheckbox.check();
    }

    if (data.honeypot) {
      await this.honeypotInput.fill(data.honeypot);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  async getToastMessage() {
    const toast = this.page.locator("[data-sonner-toast]").first();
    await toast.waitFor({ state: "visible" });
    return {
      title: await toast.locator("[data-title]").textContent(),
      description: await toast.locator("[data-description]").textContent(),
    };
  }

  async waitForRateLimitHeaders() {
    // Wait for the API response and check headers
    const response = await this.page.waitForResponse(
      (resp) => resp.url().includes("/api/contact"),
      { timeout: 10000 },
    );

    return {
      limit: response.headers()["x-ratelimit-limit"],
      remaining: response.headers()["x-ratelimit-remaining"],
      reset: response.headers()["x-ratelimit-reset"],
    };
  }

  async isSubmitButtonEnabled() {
    return await this.submitButton.isEnabled();
  }

  async getCharacterCount() {
    const countText = await this.page.getByText(/\d+ \/ 1000/).textContent();
    return countText;
  }
}
