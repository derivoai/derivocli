import { LegalLayout } from '../../components/legal/LegalLayout';

const EFFECTIVE_DATE = 'July 4, 2026';

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate={EFFECTIVE_DATE}>
      <section>
        <p>
          This Privacy Policy explains how Derivo ("Derivo," "we," "us," or "our") collects, uses,
          and shares information when you use our command-line tool, web dashboard, and related
          services (collectively, the "Service"). By using the Service, you agree to the collection
          and use of information as described in this policy.
        </p>
      </section>

      <section>
        <h2>1. Information We Collect</h2>

        <h3>1.1 Account Information</h3>
        <p>
          When you create a Derivo account, we collect your name, email address, and a hashed
          password (if you sign up with email and password), or basic profile information from
          Google or GitHub if you sign up using those providers. Authentication is handled by
          Firebase Authentication, a service operated by Google.
        </p>

        <h3>1.2 Device and Session Data</h3>
        <p>
          When you authenticate the Derivo CLI on a machine, we store a device identifier, hostname,
          operating system, CPU architecture, Node.js version, CLI version, and the approximate
          timestamp of first registration and last activity. This lets you see and revoke trusted
          devices from the dashboard.
        </p>

        <h3>1.3 Usage and Diagnostic Data</h3>
        <p>
          The CLI and dashboard report project metadata (framework, environment, sync status),
          command usage, and error diagnostics to help Derivo detect and resolve environment issues.
          We do not collect the contents of your source code or environment variables beyond what is
          strictly required to perform the requested repair action.
        </p>

        <h3>1.4 Billing Information</h3>
        <p>
          If you subscribe to a paid plan, payment processing is handled by our billing provider.
          Derivo does not directly store your full payment card number. We retain plan tier,
          subscription status, and billing history metadata necessary to manage your account.
        </p>

        <h3>1.5 Activity and Security Logs</h3>
        <p>
          We log authentication events (sign-in, sign-out, session refresh, device registration) and
          security-relevant events (failed refresh attempts, token revocation) to protect your
          account and to display your Activity timeline in the dashboard.
        </p>
      </section>

      <section>
        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To provide, operate, and maintain the Service, including CLI-to-dashboard sync.</li>
          <li>To authenticate you and secure your account, devices, and API keys.</li>
          <li>To diagnose and automatically resolve local environment issues you encounter.</li>
          <li>To process subscriptions, enforce plan limits, and manage billing.</li>
          <li>To send transactional email (verification, password reset, security alerts).</li>
          <li>To detect, investigate, and prevent fraudulent or abusive account activity.</li>
          <li>To improve the reliability and performance of the CLI and dashboard.</li>
        </ul>
      </section>

      <section>
        <h2>3. How We Share Your Information</h2>
        <p>We do not sell your personal information. We share data only in these cases:</p>
        <ul>
          <li>
            <strong>Service providers.</strong> Firebase (authentication and data storage), Resend
            (transactional email delivery), and our billing provider process data on our behalf
            under their own privacy and security commitments.
          </li>
          <li>
            <strong>Legal compliance.</strong> We may disclose information if required by law,
            subpoena, or to protect the rights, property, or safety of Derivo, our users, or the
            public.
          </li>
          <li>
            <strong>Business transfers.</strong> If Derivo is involved in a merger, acquisition, or
            asset sale, your information may be transferred as part of that transaction. We will
            notify you before your data becomes subject to a different privacy policy.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Data Retention</h2>
        <p>
          We retain account, device, and activity data for as long as your account is active. If you
          delete your account, we delete your profile, sessions, devices, and API keys. Some records
          (such as billing history) may be retained longer where required by law or for legitimate
          accounting purposes.
        </p>
      </section>

      <section>
        <h2>5. Your Rights and Choices</h2>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access, correct, or export the personal information we hold about you.</li>
          <li>Request deletion of your account and associated data via Settings → Danger Zone.</li>
          <li>Revoke a trusted device or API key at any time from the dashboard.</li>
          <li>
            Disconnect a linked Google or GitHub account, provided another sign-in method remains.
          </li>
          <li>Opt out of non-essential email communications.</li>
        </ul>
        <p>
          Account deletion is irreversible. Deleting your account permanently removes your profile,
          sessions, devices, and API keys, and immediately revokes CLI access tied to your account.
        </p>
      </section>

      <section>
        <h2>6. Data Security</h2>
        <p>
          We use industry-standard measures to protect your information, including encrypted
          transport (TLS), hashed credentials, scoped API keys, and device-level trust controls. No
          method of transmission or storage is 100% secure, and we cannot guarantee absolute
          security.
        </p>
      </section>

      <section>
        <h2>7. International Data Transfers</h2>
        <p>
          Derivo's infrastructure and service providers may process and store data in countries
          other than your own. We take steps to ensure any such transfer complies with applicable
          data protection law.
        </p>
      </section>

      <section>
        <h2>8. Children's Privacy</h2>
        <p>
          The Service is not directed to individuals under the age of 16. We do not knowingly
          collect personal information from children. If you believe a child has provided us with
          personal information, please contact us so we can remove it.
        </p>
      </section>

      <section>
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by
          updating the effective date above. Continued use of the Service after changes take effect
          constitutes acceptance of the revised policy.
        </p>
      </section>

      <section>
        <h2>10. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or how your data is handled, contact us at{' '}
          <a href="mailto:privacy@derivo.in">privacy@derivo.in</a>.
        </p>
      </section>
    </LegalLayout>
  );
}
