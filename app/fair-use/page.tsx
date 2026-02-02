import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Fair Use Policy - Bin 21',
  description: 'Fair use policy for Bin 21 pastebin service.',
}

export default function FairUsePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">Fair Use Policy</h1>
      <p className="mb-10 text-sm text-[var(--text-muted)]">
        Last updated: February 2, 2025
      </p>

      <div className="space-y-8 text-[var(--text-muted)] leading-relaxed">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Purpose</h2>
          <p>
            Bin 21 is a free, privacy-focused pastebin for sharing code snippets, text, and
            Markdown content. This policy outlines acceptable use to keep the service reliable
            and available for everyone.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Acceptable Use</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Sharing code snippets, configuration files, and logs for debugging or collaboration</li>
            <li>Sharing text notes, Markdown documents, and technical documentation</li>
            <li>Temporary sharing of content using expiry or burn-after-reading features</li>
            <li>Using client-side encryption for sensitive content</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Prohibited Content</h2>
          <p className="mb-3">The following content is not permitted on Bin 21:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Malware, viruses, or any form of malicious code intended to harm systems</li>
            <li>Personal information of others without their consent (doxxing)</li>
            <li>Content that facilitates illegal activities</li>
            <li>Spam, phishing links, or deceptive content</li>
            <li>Content that violates copyright or intellectual property rights</li>
            <li>Hate speech, threats, or content promoting violence</li>
            <li>Child sexual abuse material (CSAM) &mdash; reported immediately to authorities</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Rate Limits</h2>
          <p>
            To prevent abuse and ensure fair access, paste creation is rate-limited. Automated
            bulk creation of pastes or any activity that degrades service for other users may
            result in temporary or permanent restriction.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Content Size</h2>
          <p>
            Individual pastes are limited to 2 million characters. This limit exists to maintain
            performance and storage efficiency for all users.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Data Retention</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Pastes with an expiry are automatically deleted after the specified duration</li>
            <li>Burn-after-reading pastes are deleted immediately after being viewed once</li>
            <li>Pastes set to &ldquo;Never&rdquo; expire are stored indefinitely but may be removed if they violate this policy</li>
            <li>We reserve the right to remove any content at any time without notice</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Encryption Disclaimer</h2>
          <p>
            Client-side encryption is provided as a convenience feature. Encryption and
            decryption happen entirely in your browser &mdash; we never see your password or
            plaintext content. However, we make no guarantees about the strength or suitability
            of the encryption for any specific purpose. You are responsible for managing your
            own encryption passwords.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Privacy</h2>
          <p>
            We do not require accounts or collect personal information to use Bin 21. IP
            addresses are hashed and used solely for rate limiting &mdash; we do not store raw
            IP addresses. Anonymous analytics may be used to improve the service.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Enforcement</h2>
          <p>
            Violations of this policy may result in content removal and IP-based restrictions.
            Severe or repeated violations may lead to permanent access restriction. We reserve
            the right to cooperate with law enforcement when required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Contact</h2>
          <p>
            To report abuse or policy violations, open an issue on our{' '}
            <a
              href="https://github.com/t21dev/bin-21"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
