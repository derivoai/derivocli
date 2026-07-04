import { LegalLayout } from '../../components/legal/LegalLayout';

const EFFECTIVE_DATE = 'July 4, 2026';

export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" effectiveDate={EFFECTIVE_DATE}>
      <section>
        <p>
          These Terms of Service ("Terms") govern your access to and use of Derivo's command-line
          tool, web dashboard, and related services (collectively, the "Service"), operated by
          Derivo ("we," "us," or "our"). By creating an account or using the Service, you agree to
          be bound by these Terms. If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>1. Description of the Service</h2>
        <p>
          Derivo is a developer-experience platform consisting of a CLI (<code>derivo</code>) that
          analyzes, validates, and repairs local development environments, and a web dashboard that
          governs your account, devices, sessions, projects, and API keys. The CLI is the primary
          tool for performing work; the dashboard reflects and manages the state the CLI produces.
        </p>
      </section>

      <section>
        <h2>2. Accounts</h2>
        <p>
          You must provide accurate information when creating an account and keep your credentials
          confidential. You are responsible for all activity that occurs under your account,
          including actions taken by devices and API keys you have authorized. Notify us promptly if
          you suspect unauthorized access to your account.
        </p>
        <p>
          You must be at least 16 years old to use the Service. By using the Service, you represent
          that you meet this requirement.
        </p>
      </section>

      <section>
        <h2>3. Subscriptions, Trials, and Billing</h2>
        <p>
          Derivo offers a free Community plan and paid plans (including time-limited trials of
          premium features). Paid plans are billed in advance on a recurring basis unless cancelled.
          Prices and included limits (projects, devices, API keys, and other quotas) are shown in
          the dashboard and may change with notice.
        </p>
        <p>
          Trials automatically revert to the Community plan at expiration unless upgraded. Fees,
          once processed, are non-refundable except where required by law or expressly stated at the
          time of purchase. You are responsible for any taxes applicable to your subscription.
        </p>
      </section>

      <section>
        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service to violate any applicable law or third-party right.</li>
          <li>Attempt to bypass plan limits, authentication, or access controls.</li>
          <li>Reverse-engineer, decompile, or resell the Service without authorization.</li>
          <li>Use the Service to distribute malware or engage in abusive automated activity.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          <li>Share API keys or device credentials with unauthorized third parties.</li>
        </ul>
        <p>
          We reserve the right to suspend or terminate accounts that violate this section, with or
          without notice, depending on severity.
        </p>
      </section>

      <section>
        <h2>5. API Keys, Devices, and Security</h2>
        <p>
          API keys and trusted devices grant programmatic or CLI-level access to your account. You
          are solely responsible for safeguarding them. Revoking a device or key immediately removes
          its access; any CLI session relying on it will lose authentication and must re-register.
          We are not liable for damage resulting from credentials you fail to secure.
        </p>
      </section>

      <section>
        <h2>6. Intellectual Property</h2>
        <p>
          Derivo and its licensors retain all right, title, and interest in the Service, including
          the CLI, dashboard, and underlying software, excluding your own code, projects, and
          content. We grant you a limited, non-exclusive, non-transferable license to use the
          Service in accordance with these Terms.
        </p>
      </section>

      <section>
        <h2>7. Third-Party Services</h2>
        <p>
          The Service relies on third-party providers, including Firebase (authentication and data
          storage), Resend (email delivery), and a billing provider for payment processing. Your use
          of features involving these providers is also subject to their respective terms. We are
          not responsible for the availability or conduct of third-party services.
        </p>
      </section>

      <section>
        <h2>8. Disclaimers</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, express
          or implied, including warranties of merchantability, fitness for a particular purpose, or
          non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or
          that automated repairs will resolve every environment issue.
        </p>
      </section>

      <section>
        <h2>9. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Derivo shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss of profits, data, or
          goodwill, arising from your use of the Service, even if advised of the possibility of such
          damages. Our total liability for any claim arising out of these Terms is limited to the
          amount you paid us in the twelve months preceding the claim.
        </p>
      </section>

      <section>
        <h2>10. Termination</h2>
        <p>
          You may delete your account at any time from Settings → Danger Zone. We may suspend or
          terminate your access to the Service if you breach these Terms, engage in fraudulent
          activity, or if required by law. Upon termination, your right to use the Service ceases
          immediately, and we may delete your account data in accordance with our Privacy Policy.
        </p>
      </section>

      <section>
        <h2>11. Changes to These Terms</h2>
        <p>
          We may modify these Terms from time to time. Material changes will be reflected by
          updating the effective date above. Continued use of the Service after changes take effect
          constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by applicable law in the jurisdiction in which Derivo operates,
          without regard to conflict-of-law principles, unless otherwise required by local consumer
          protection law.
        </p>
      </section>

      <section>
        <h2>13. Contact Us</h2>
        <p>
          Questions about these Terms can be directed to{' '}
          <a href="mailto:legal@derivo.in">legal@derivo.in</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
