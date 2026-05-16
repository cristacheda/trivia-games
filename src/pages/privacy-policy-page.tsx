import { Link } from 'react-router-dom'
import { ObfuscatedEmail } from '@/components/legal/obfuscated-email'
import {
  LegalPageShell,
  LegalSection,
} from '@/components/legal/legal-page-shell'
import { legalConfig, privacySections } from '@/config/legal'

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      description="How Atlas of Answers handles local storage, optional analytics, and any account-related processing when enabled."
      eyebrow="Privacy Policy"
      title="Privacy Policy"
      updatedLabel={`Effective ${legalConfig.contact.effectiveDate}`}
    >
      <div className="rounded-[24px] bg-white/70 p-4 text-sm text-muted-foreground">
        <p>
          This policy applies to {legalConfig.siteName}. For terms that govern
          use of the service, see the{' '}
          <Link className="font-semibold text-foreground underline underline-offset-4" to="/terms">
            Terms of Service
          </Link>
          .
        </p>
      </div>

      {privacySections.map((section) => (
        <LegalSection
          bullets={section.bullets}
          heading={section.heading}
          key={section.heading}
          paragraphs={section.paragraphs}
        />
      ))}

      <ObfuscatedEmail />
    </LegalPageShell>
  )
}
